"""Batch 15.5: offline GHD event-first persistence and crash/restart tests.

No GitHub access, model calls, notifications or coordinator dispatch occurs.
The existing 9h45min service is untouched by these state-machine fixtures.
"""
import copy
import json
import tempfile
import threading
import unittest
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from unittest.mock import patch

from services import ghd_pending_store as module
from services.ghd_pending_store import GHDPendingStore, PendingStoreError


CREATED = "2026-09-23T00:00:00+00:00"
FETCHED = "2026-09-23T00:30:00+00:00"
LATER = "2026-09-23T01:00:00+00:00"


def observed(*, title="Research question", body="Initial body",
             comments=None, fetched_at=FETCHED, status="complete",
             truncated=False):
    entries = [] if comments is None else list(comments)
    return {
        "status": status, "issue_number": 42,
        "context_or_error": {
            "number": 42, "title": title, "body": body, "state": "open",
            "labels": ["research"],
            "url": "https://github.com/jagports/jagports/issues/42",
            "comments": entries, "total_comment_count": len(entries),
            "comment_scope": "all", "truncated": truncated,
            "fetched_at": fetched_at,
        },
    }


def comment(identifier, body="Original evidence", author="researcher"):
    return {
        "id": identifier,
        "url": "https://github.com/jagports/jagports/issues/42#issuecomment-"
               + str(identifier),
        "author": author, "body": body,
        "created_at": CREATED, "updated_at": CREATED,
    }


class DurableGHDTests(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.root = Path(directory.name)
        self.cursor = self.root / "ghd_enrichment.json"
        self.pending = self.root / "ghd_pending_event.json"
        self.store = self.restart()
        self.first = observed(comments=[comment(101)])

    def restart(self):
        return GHDPendingStore(self.cursor, self.pending)

    def baseline(self):
        result = self.store.record_observation(self.first)
        self.assertEqual(result["status"], "baseline")
        return self.cursor_state()["issues"]["42"]

    def changed(self, body="Changed body", *, fetched_at=LATER):
        return observed(body=body, comments=[comment(101)],
                        fetched_at=fetched_at)

    def cursor_state(self):
        return json.loads(self.cursor.read_text(encoding="utf-8"))

    def pending_state(self):
        return json.loads(self.pending.read_text(encoding="utf-8"))

    def test_first_run_is_quiet_and_separately_versioned(self):
        result = self.store.record_observation(self.first)
        self.assertEqual(result["status"], "baseline")
        self.assertIsNone(self.store.replay_pending())
        data = self.cursor_state()
        self.assertEqual(data["schema_version"], 1)
        self.assertEqual(set(data["issues"]), {"42"})
        self.assertNotIn("Initial body", str(data))
        self.assertFalse(self.pending.exists())
        self.assertEqual(result["source_revision"],
                         data["issues"]["42"]["source_revision"])

    def test_verified_new_issue_is_pending_without_historical_flood(self):
        result = self.store.record_observation(self.first, newly_observed=True)
        self.assertEqual(result["status"], "pending")
        event = result["pending_event"]
        self.assertEqual(event["changed_event"]["kind"], ["new"])
        self.assertEqual(event["schema_version"], 1)
        self.assertEqual(event["producer"], "ghd_increment_a")
        self.assertEqual(event["issue_context"]["number"], 42)
        self.assertEqual(self.cursor_state()["issues"]["42"]["source_revision"],
                         event["changed_event"]["source_revision"])

    def test_change_is_durable_before_cursor_and_exact_revision_replays(self):
        old = self.baseline()
        real_write = module._write_json_atomic

        def lose_cursor_write(path, value):
            if Path(path) == self.cursor:
                raise OSError("simulated crash before cursor commit")
            return real_write(path, value)

        with patch.object(module, "_write_json_atomic",
                          side_effect=lose_cursor_write):
            with self.assertRaises(OSError):
                self.store.record_observation(self.changed())
        self.assertEqual(self.cursor_state()["issues"]["42"], old)
        written = self.pending_state()
        self.assertEqual(written["status"], "pending")
        self.assertEqual(written["previous_revision"], old["source_revision"])

        restarted = self.restart()
        replay = restarted.replay_pending()
        self.assertEqual(replay["event_key"], written["event_key"])
        self.assertEqual(replay["changed_event"]["kind"], ["body_changed"])
        self.assertEqual(replay["issue_context"]["body"], "Changed body")
        self.assertEqual(self.cursor_state()["issues"]["42"],
                         written["next_snapshot"])
        self.assertEqual(restarted.replay_pending(), replay)
        self.assertEqual(self.pending_state()["event_key"], written["event_key"])

    def test_crash_after_cursor_before_dispatch_replays_same_event(self):
        self.baseline()
        produced = self.store.record_observation(self.changed())
        self.assertEqual(produced["status"], "pending")
        before = self.pending.read_bytes()
        restarted = self.restart()
        self.assertEqual(restarted.replay_pending(),
                         produced["pending_event"])
        self.assertEqual(self.pending.read_bytes(), before)
        self.assertEqual(restarted.record_observation(
            self.changed(body="Subsequent revision"))["pending_event"],
            produced["pending_event"])
        self.assertEqual(self.pending.read_bytes(), before)

    def test_ack_requires_exact_event_and_stays_idempotent(self):
        self.baseline()
        produced = self.store.record_observation(self.changed())
        key = produced["pending_event"]["event_key"]
        with self.assertRaises(PendingStoreError):
            self.store.acknowledge("42:wrong-revision")
        self.assertEqual(self.store.replay_pending()["event_key"], key)
        self.assertTrue(self.store.acknowledge(key))
        self.assertFalse(self.restart().acknowledge(key))
        self.assertIsNone(self.restart().replay_pending())
        self.assertEqual(self.pending_state()["status"], "acknowledged")

    def test_acknowledged_event_allows_next_revision_after_quiet_poll(self):
        self.baseline()
        produced = self.store.record_observation(self.changed())
        self.store.acknowledge(produced["pending_event"]["event_key"])
        quiet = self.store.record_observation(
            self.changed(fetched_at="2026-09-23T02:00:00+00:00"))
        self.assertEqual(quiet["status"], "unchanged")
        later = self.restart().record_observation(
            self.changed(body="Third revision",
                         fetched_at="2026-09-23T03:00:00+00:00"))
        self.assertEqual(later["status"], "pending")
        self.assertNotEqual(later["pending_event"]["event_key"],
                            produced["pending_event"]["event_key"])

    def test_bot_only_or_timestamp_only_update_is_quiet(self):
        base = self.baseline()
        bot_update = observed(
            comments=[comment(101), comment(102, "Agent said hi",
                                                    "github-actions[bot]")],
            fetched_at=LATER)
        self.assertEqual(self.store.record_observation(bot_update)["status"],
                         "unchanged")
        self.assertEqual(self.cursor_state()["issues"]["42"]["source_revision"],
                         base["source_revision"])
        self.assertFalse(self.pending.exists())

    def test_partial_or_untrusted_retrieval_never_advances_cursor(self):
        before = self.baseline()
        for value in (
                {"status": "truncated", "issue_number": 42,
                 "context_or_error": {"reason": "comment_count_limit"}},
                {"status": "retryable_error", "issue_number": 42,
                 "context_or_error": {"reason": "network error"}},
                observed(body="Private", truncated=True)):
            with self.subTest(value=value["status"]):
                self.assertEqual(self.store.record_observation(value)["status"],
                                 "blocked")
                self.assertEqual(self.cursor_state()["issues"]["42"], before)
                self.assertFalse(self.pending.exists())

    def test_corrupt_pending_blocks_replay_and_new_observation(self):
        self.baseline()
        self.store.record_observation(self.changed())
        record = self.pending_state()
        record["changed_event"]["source_revision"] = "sha256:forged"
        self.pending.write_text(json.dumps(record), encoding="utf-8")
        with self.assertRaises(PendingStoreError):
            self.restart().replay_pending()
        with self.assertRaises(PendingStoreError):
            self.restart().record_observation(
                self.changed(body="Subsequent revision"))

    def test_divergent_cursor_blocks_replay_instead_of_erasing_event(self):
        self.baseline()
        first = self.store.record_observation(self.changed())
        changed_snapshot = self.cursor_state()
        changed_snapshot["issues"]["42"]["source_revision"] = "sha256:forged"
        self.cursor.write_text(json.dumps(changed_snapshot), encoding="utf-8")
        with self.assertRaises(PendingStoreError):
            self.restart().replay_pending()
        self.assertEqual(self.pending_state()["event_key"],
                         first["pending_event"]["event_key"])

    def test_second_observer_cannot_overwrite_existing_pending_event(self):
        self.baseline()
        barrier = threading.Barrier(2)
        def observe(body):
            barrier.wait(timeout=5)
            return self.restart().record_observation(
                self.changed(body=body))
        with ThreadPoolExecutor(max_workers=2) as pool:
            one = pool.submit(observe, "Revision A")
            two = pool.submit(observe, "Revision B")
            results = [one.result(timeout=10), two.result(timeout=10)]
        self.assertEqual([r["status"] for r in results],
                         ["pending", "pending"])
        self.assertEqual(results[0]["pending_event"]["event_key"],
                         results[1]["pending_event"]["event_key"])
        self.assertEqual(self.pending_state()["event_key"],
                         results[0]["pending_event"]["event_key"])

    def test_pending_store_does_not_mutate_legacy_state(self):
        self.baseline()
        legacy = self.root / "agent_state.json"
        original = b'{"issues":{"903":{"state":"open"}}}'
        legacy.write_bytes(original)
        self.store.record_observation(self.changed())
        self.assertEqual(legacy.read_bytes(), original)


if __name__ == "__main__":
    unittest.main()

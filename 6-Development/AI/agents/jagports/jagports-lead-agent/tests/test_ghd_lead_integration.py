"""Batch 15.6: model-free #904 LeadAgent integration and replay acceptance.

These tests use only in-memory GitHub fixtures and temporary local state.
They do not call GitHub, OpenAI, Telegram, deployment or any scheduler.
"""
import copy
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock

from agents.lead_agent import LeadAgent
from services.ghd_pending_store import GHDPendingStore
from services import report_service


def retrieval(*, body="Initial body", fetched_at="2026-09-23T00:30:00+00:00"):
    return {
        "status": "complete",
        "issue_number": 42,
        "context_or_error": {
            "number": 42,
            "title": "Research question",
            "body": body,
            "labels": ["research"],
            "state": "open",
            "url": "https://github.com/jagports/jagports/issues/42",
            "comments": [],
            "total_comment_count": 0,
            "comment_scope": "all",
            "truncated": False,
            "fetched_at": fetched_at,
        },
    }


class FakeGitHub:
    def __init__(self):
        self.filtered_pr_numbers = set()
        self.rows = [{
            "number": 42,
            "title": "Research question",
            "state": "open",
            "updated_at": "2026-09-23T00:30:00+00:00",
        }]
        self.detail = retrieval()
        self.detail_calls = []
        self.metric = {
            "issue_list_calls": 0,
            "issue_detail_gets": 0,
            "comment_list_gets": 0,
            "comment_id_gets": 0,
            "logical_get_operations": 0,
            "fetched_text_chars": 0,
            "http_requests_verified": False,
        }

    def get_issues(self):
        self.metric["issue_list_calls"] += 1
        self.metric["logical_get_operations"] += 1
        return copy.deepcopy(self.rows)

    def get_issue_context(self, number, **kwargs):
        self.detail_calls.append((number, dict(kwargs)))
        self.metric["issue_detail_gets"] += 1
        self.metric["logical_get_operations"] += 1
        return copy.deepcopy(self.detail)

    def request_metrics(self):
        return dict(self.metric)


class GHDLeadIntegrationTests(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.root = Path(temp.name)
        previous = Path.cwd()
        os.chdir(self.root)
        self.addCleanup(os.chdir, previous)
        (self.root / "state").mkdir()
        self.github = FakeGitHub()
        self.store = GHDPendingStore(
            self.root / "state/ghd_enrichment.json",
            self.root / "state/ghd_pending_event.json",
        )

    def agent(self):
        return LeadAgent(self.github, ghd_store=self.store)

    def test_quiet_baseline_preserves_three_deterministic_specialists(self):
        issues, event, results = self.agent().run()
        self.assertEqual([x["number"] for x in issues], [42])
        self.assertEqual(event.data, {"new": [], "closed": [], "reopened": []})
        self.assertEqual([x.agent for x in results],
                         ["documentation", "deployment", "knowledge"])
        self.assertTrue(all(x.severity == "normal" for x in results))
        self.assertEqual(event.context["ghd"]["status"], "baseline")
        self.assertEqual(event.context["ghd"]["candidate"], 42)
        self.assertEqual(len(self.github.detail_calls), 1)
        self.assertFalse((self.root / "state/ghd_pending_event.json").exists())
        self.assertTrue((self.root / "state/agent_state.json").exists())
        self.assertTrue((self.root / "state/ghd_enrichment.json").exists())

    def test_body_change_flows_through_event_specialists_report_and_ack(self):
        self.agent().run()  # establish enrichment baseline
        self.github.rows[0]["updated_at"] = "2026-09-23T01:00:00+00:00"
        self.github.detail = retrieval(
            body="Changed body",
            fetched_at="2026-09-23T01:00:00+00:00",
        )

        agent = self.agent()
        issues, event, results = agent.run()
        ghd = event.context["ghd"]
        pending = ghd["pending_event"]
        changed = pending["changed_event"]

        self.assertEqual(changed["kind"], ["body_changed"])
        self.assertEqual(changed["issue_number"], 42)
        self.assertEqual(pending["issue_context"]["body"], "Changed body")
        self.assertEqual(pending["issue_context"]["source_revision"],
                         changed["source_revision"])
        self.assertNotIn("acknowledged", ghd)
        self.assertEqual([x.agent for x in results],
                         ["documentation", "deployment", "knowledge"])
        # Deterministic specialists intentionally remain lifecycle-only.
        self.assertTrue(all(x.severity == "normal" for x in results))
        self.assertIsNotNone(self.store.replay_pending())

        report = report_service.create_report(
            issues, event.data, results, event.context)
        self.assertIn("body_changed", report)
        self.assertIn(changed["source_revision"], report)
        self.assertIn("documentation", report)
        self.assertIn("deployment", report)
        self.assertIn("knowledge", report)
        report_service.save_report(report)
        agent.acknowledge_pending(event)
        self.assertTrue(ghd["acknowledged"])
        self.assertIsNone(self.store.replay_pending())

    def test_crash_before_specialist_completion_replays_without_refetch(self):
        self.agent().run()
        self.github.rows[0]["updated_at"] = "2026-09-23T01:00:00+00:00"
        self.github.detail = retrieval(
            body="Changed before crash",
            fetched_at="2026-09-23T01:00:00+00:00",
        )
        crashing = self.agent()
        crashing.registry.analyse_all = Mock(
            side_effect=RuntimeError("simulated specialist crash"))

        with self.assertRaisesRegex(RuntimeError, "specialist crash"):
            crashing.run()
        durable = self.store.replay_pending()
        self.assertEqual(durable["changed_event"]["kind"], ["body_changed"])
        calls_before_restart = len(self.github.detail_calls)

        restarted = self.agent()
        issues, event, results = restarted.run()
        self.assertEqual(len(self.github.detail_calls), calls_before_restart)
        self.assertEqual(event.context["ghd"]["retrieval"], "replay")
        self.assertEqual(event.context["ghd"]["pending_event"]["event_key"],
                         durable["event_key"])
        self.assertNotIn("acknowledged", event.context["ghd"])
        self.assertEqual([x.agent for x in results],
                         ["documentation", "deployment", "knowledge"])
        self.assertIsNotNone(self.store.replay_pending())
        restarted.acknowledge_pending(event)
        self.assertIsNone(self.store.replay_pending())
        self.assertEqual(len(issues), 1)

    def test_pending_replay_has_priority_over_newer_metadata(self):
        self.agent().run()
        self.github.rows[0]["updated_at"] = "2026-09-23T01:00:00+00:00"
        self.github.detail = retrieval(
            body="First changed revision",
            fetched_at="2026-09-23T01:00:00+00:00",
        )
        crashing = self.agent()
        crashing.registry.analyse_all = Mock(side_effect=RuntimeError("stop"))
        with self.assertRaises(RuntimeError):
            crashing.run()
        first = self.store.replay_pending()
        calls_before = len(self.github.detail_calls)

        self.github.rows[0]["updated_at"] = "2026-09-23T02:00:00+00:00"
        self.github.detail = retrieval(
            body="Newer unprocessed revision",
            fetched_at="2026-09-23T02:00:00+00:00",
        )
        _issues, event, _results = self.agent().run()
        self.assertEqual(len(self.github.detail_calls), calls_before)
        self.assertEqual(event.context["ghd"]["pending_event"]["event_key"],
                         first["event_key"])

    def test_disabled_ghd_is_original_deterministic_path(self):
        agent = LeadAgent(self.github, enable_ghd=False)
        issues, event, results = agent.run()
        self.assertEqual(len(issues), 1)
        self.assertEqual(event.context["ghd"]["status"], "disabled")
        self.assertEqual(self.github.detail_calls, [])
        self.assertEqual([x.agent for x in results],
                         ["documentation", "deployment", "knowledge"])
        self.assertFalse((self.root / "state/ghd_enrichment.json").exists())
        self.assertFalse((self.root / "state/ghd_pending_event.json").exists())

    def test_enrichment_error_keeps_deterministic_lifecycle_reporting(self):
        # Seed legacy lifecycle state so the next row is a genuine closure.
        first = self.agent()
        first.run()
        self.github.rows[0]["state"] = "closed"
        self.github.rows[0]["updated_at"] = "2026-09-23T01:00:00+00:00"
        self.github.detail = {
            "status": "retryable_error",
            "issue_number": 42,
            "context_or_error": {"reason": "network"},
        }
        _issues, event, results = self.agent().run()
        self.assertEqual(event.data["closed"], [42])
        self.assertEqual(event.context["ghd"]["status"], "blocked")
        self.assertEqual([x.agent for x in results],
                         ["documentation", "deployment", "knowledge"])
        self.assertTrue(all(x.severity == "review" for x in results))
        self.assertIsNone(self.store.replay_pending())


if __name__ == "__main__":
    unittest.main()

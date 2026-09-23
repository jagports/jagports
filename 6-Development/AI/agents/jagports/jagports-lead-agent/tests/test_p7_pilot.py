"""Batch 09: offline coordinator authorization, concurrency and recovery fixtures."""
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock

from core.event import Event
from core.result import AgentResult
from services.p7_pilot import P7Pilot


REVISION = "approved-sha"
NUMBER = 42
ISSUE_URL = "https://github.com/jagports/jagports/issues/42"


def source(name):
    return {"id": name, "url": "https://github.com/jagports/jagports/blob/main/7-Research/" + name + ".md",
            "path": "7-Research/" + name + ".md", "kind": "repository",
            "text": "Retrieved source: " + name,
            "truncated": False, "retrieved_at": "2026-09-23T00:00:00Z"}


def issue(**changes):
    result = {"number": NUMBER, "title": "Approved research question",
              "body": "Read-only test Issue", "state": "open", "labels": [],
              "url": ISSUE_URL, "comments": [], "truncated": False,
              "fetched_at": "2026-09-23T00:00:00Z",
              "source_revision": REVISION}
    result.update(changes)
    return result


def change(**changes):
    result = {"issue_number": NUMBER, "kind": ["body_changed"],
              "source_revision": REVISION, "changed_comment_ids": []}
    result.update(changes)
    return result


def result_for(role, **changes):
    if role == "research":
        data = {"status": "complete", "source_revision": REVISION,
                "confidence": "supported", "role_run_id": "research-id",
                "request_outcome": "complete"}
    else:
        data = {"status": "complete", "source_revision": REVISION,
                "outcome": "validated", "decision_required": True,
                "role_run_id": "product-id",
                "research_role_run_id": "research-id"}
    data.update({"request_outcome": "complete", "model": "mock-model",
                 "usage": {"input_tokens": 100, "output_tokens": 20}})
    data.update(changes)
    return AgentResult(role, "review", "Mocked source-backed result.", data)


class FakeGithub:
    def __init__(self):
        self.requests = []
        self.get_issue_context = Mock(side_effect=AssertionError(
            "The P7 pilot must consume #904 IssueContext, never retrieve its own Issue."))

    def read_approved_sources(self, paths, **bounds):
        self.requests.append(tuple(paths))
        return [source("research-a" if paths == ["7-Research/research.md"]
                       else "domain-b")]


class FakeReasoning:
    def __init__(self):
        self.config = {"enabled": True, "max_calls_per_run": 2}
        self.calls = 0


class P7PilotTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.github = FakeGithub()
        self.reasoning = FakeReasoning()
        self.config = {
            "enabled": True, "allowed_issue_numbers": [NUMBER],
            "approved_source_revision": REVISION,
            "approved_research_paths": ["7-Research/research.md"],
            "approved_domain_paths": ["7-Research/domain.md"],
            "checkpoint_file": str(Path(self.temp.name) / "p7.json"),
            "read_only_credential_confirmed": True,
        }
        self.pilot = P7Pilot(self.github, self.reasoning, self.config)
        self.pilot.research.analyse = Mock(return_value=result_for("research"))
        self.pilot.product_vehicle.analyse = Mock(return_value=result_for("product_vehicle"))

    def run_pilot(self, evt=None, ctx=None):
        return self.pilot.process(change() if evt is None else evt,
                                  issue() if ctx is None else ctx)

    def checkpoint(self):
        return json.loads(Path(self.config["checkpoint_file"]).read_text())

    def test_no_change_or_missing_904_event_never_fetches_or_calls(self):
        self.assertEqual(self.pilot.process(), [])
        self.assertEqual(self.run_pilot(evt=change(kind=[])), [])
        self.pilot.research.analyse.assert_not_called()
        self.assertEqual(self.github.requests, [])

    def test_pr_is_rejected_without_paid_or_source_requests(self):
        result = self.run_pilot(ctx=issue(is_pull_request=True))
        self.assertEqual(result[0].severity, "blocked")
        self.pilot.research.analyse.assert_not_called()
        self.assertEqual(self.github.requests, [])

    def test_unapproved_issue_is_rejected(self):
        result = self.run_pilot(evt=change(issue_number=43), ctx=issue(number=43,
            url="https://github.com/jagports/jagports/issues/43"))
        self.assertEqual(result[0].severity, "blocked")
        self.pilot.research.analyse.assert_not_called()

    def test_exact_revision_required_in_event_and_context(self):
        for evt, ctx in ((change(source_revision="new"), issue()),
                         (change(), issue(source_revision="new"))):
            with self.subTest(evt=evt, ctx=ctx):
                self.assertEqual(self.pilot.process(evt, ctx)[0].severity, "blocked")
        self.pilot.research.analyse.assert_not_called()

    def test_incomplete_retrieval_and_truncated_context_fail_closed(self):
        x = self.pilot.process(change(), {"status": "truncated", "context_or_error": issue()})
        self.assertEqual(x[0].data["status"], "incomplete_context")
        y = self.run_pilot(ctx=issue(truncated=True))
        self.assertEqual(y[0].severity, "blocked")
        self.assertEqual(self.github.requests, [])

    def test_one_approved_revision_uses_two_separate_role_checkpoints(self):
        output = self.run_pilot()
        self.assertEqual([x.agent for x in output], ["research", "product_vehicle", "team_lead"])
        self.assertEqual(output[-1].data["route"], "human_decision_needed")
        state = self.checkpoint()
        self.assertEqual(state["stage"], "complete")
        self.assertEqual(state["model_calls_started"], 2)
        self.assertEqual(state["research"]["data"]["role_run_id"], "research-id")
        self.assertEqual(state["product_vehicle"]["data"]["role_run_id"], "product-id")
        self.assertTrue(state["evidence_fingerprint"])
        replayed = self.run_pilot()
        self.assertEqual([r.agent for r in replayed],
                         ["research", "product_vehicle", "team_lead"])
        self.assertEqual(replayed[-1].data["route"], "human_decision_needed")
        self.assertEqual(self.pilot.completed_event_key(),
                         str(NUMBER) + ":" + REVISION)
        # Checkpoint replay must not fetch new source files or bill again.
        self.assertEqual(len(self.github.requests), 2)
        self.assertEqual(self.pilot.research.analyse.call_count, 1)
        self.assertEqual(self.pilot.product_vehicle.analyse.call_count, 1)

    def test_corrupt_complete_checkpoint_blocks_replay_without_new_calls(self):
        self.run_pilot()
        state = self.checkpoint()
        state.pop("decision_route")
        Path(self.config["checkpoint_file"]).write_text(json.dumps(state))
        blocked = self.run_pilot()
        self.assertEqual(blocked[0].data["status"], "needs_operator_review")
        self.assertIsNone(self.pilot.completed_event_key())
        self.pilot.research.analyse.assert_called_once()
        self.pilot.product_vehicle.analyse.assert_called_once()

    def test_completed_research_resumes_product_without_repeating_first_call(self):
        def fail_once(evt):
            state = self.checkpoint()
            self.assertEqual(state["stage"], "product_started")
            raise RuntimeError("Provider possibly billed validation")
        self.pilot.product_vehicle.analyse.side_effect = fail_once
        result = self.run_pilot()
        self.assertEqual(result[-1].data["status"], "needs_operator_review")
        self.assertEqual(self.checkpoint()["stage"], "needs_operator_review")
        restarted = P7Pilot(self.github, self.reasoning, self.config)
        restarted.research.analyse = Mock(return_value=result_for("research"))
        restarted.product_vehicle.analyse = Mock(return_value=result_for("product_vehicle"))
        blocked = restarted.process(change(), issue())
        self.assertEqual(blocked[0].data["status"], "needs_operator_review")
        restarted.research.analyse.assert_not_called()
        restarted.product_vehicle.analyse.assert_not_called()

    def test_prepared_checkpoint_replays_after_restart(self):
        Path(self.config["checkpoint_file"]).write_text(json.dumps({
            "event_key": str(NUMBER) + ":" + REVISION,
            "issue_number": NUMBER, "source_revision": REVISION,
            "stage": "prepared", "model_calls_started": 0,
        }))
        result = self.run_pilot()
        self.assertEqual(result[-1].data["route"], "human_decision_needed")

    def test_research_complete_resumes_only_product(self):
        self.run_pilot()
        state = self.checkpoint()
        state.pop("product_vehicle")
        state.pop("decision_route")
        state["stage"] = "research_complete"
        state["model_calls_started"] = 1
        Path(self.config["checkpoint_file"]).write_text(json.dumps(state))
        self.pilot.research.analyse.reset_mock()
        self.pilot.product_vehicle.analyse.reset_mock()
        result = self.run_pilot()
        self.assertEqual(result[-1].data["route"], "human_decision_needed")
        self.pilot.research.analyse.assert_not_called()
        self.pilot.product_vehicle.analyse.assert_called_once()

    def test_legacy_research_checkpoint_needs_source_reconciliation(self):
        Path(self.config["checkpoint_file"]).write_text(json.dumps({
            "event_key": str(NUMBER) + ":" + REVISION,
            "issue_number": NUMBER, "source_revision": REVISION,
            "stage": "research_complete", "model_calls_started": 1,
            "research": result_for("research").to_dict(),
        }))
        result = self.run_pilot()
        self.assertEqual(result[0].data["status"], "needs_operator_review")
        self.pilot.product_vehicle.analyse.assert_not_called()

    def test_changed_revision_cannot_supersede_pending_work(self):
        self.pilot.product_vehicle.analyse.side_effect = RuntimeError("Possibly billed")
        self.run_pilot()
        self.config["approved_source_revision"] = "next-sha"
        restarted = P7Pilot(self.github, self.reasoning, self.config)
        blocked = restarted.process(change(source_revision="next-sha"),
                                    issue(source_revision="next-sha"))
        self.assertEqual(blocked[0].data["status"], "needs_operator_review")

    def test_single_run_lock_prevents_overlap_and_preserves_stale_lock(self):
        lock = Path(str(self.config["checkpoint_file"]) + ".lock")
        lock.write_text("stale")
        result = self.run_pilot()
        self.assertEqual(result[0].data["status"], "locked")
        self.assertTrue(lock.exists())
        self.pilot.research.analyse.assert_not_called()

    def test_parallel_attempt_cannot_enter_while_lock_held(self):
        def nested(_event):
            blocked = self.pilot.process(change(), issue())
            self.assertEqual(blocked[0].data["status"], "locked")
            return result_for("research")
        self.pilot.research.analyse.side_effect = nested
        result = self.run_pilot()
        self.assertEqual(result[-1].data["route"], "human_decision_needed")
        self.assertEqual(self.pilot.research.analyse.call_count, 1)

    def test_incomplete_research_requires_reconciliation_not_retry(self):
        self.pilot.research.analyse.return_value = result_for(
            "research", status="insufficient_evidence", confidence="insufficient")
        result = self.run_pilot()
        self.assertEqual(result[-1].data["status"], "needs_operator_review")
        self.assertEqual(self.checkpoint()["model_calls_started"], 1)
        self.assertEqual(self.run_pilot()[0].data["status"], "needs_operator_review")
        self.pilot.research.analyse.assert_called_once()
        self.pilot.product_vehicle.analyse.assert_not_called()

    def test_incomplete_product_attempt_requires_reconciliation(self):
        self.pilot.product_vehicle.analyse.return_value = result_for(
            "product_vehicle", status="insufficient_evidence")
        result = self.run_pilot()
        self.assertEqual(result[-1].data["status"], "needs_operator_review")
        self.assertEqual(self.checkpoint()["model_calls_started"], 2)
        self.assertEqual(self.run_pilot()[0].data["status"], "needs_operator_review")
        self.pilot.product_vehicle.analyse.assert_called_once()

    def test_malformed_completed_research_cannot_start_product_call(self):
        self.pilot.research.analyse.return_value = result_for(
            "research", usage={"input_tokens": 0, "output_tokens": 20})
        result = self.run_pilot()
        self.assertEqual(result[-1].data["status"], "needs_operator_review")
        self.pilot.product_vehicle.analyse.assert_not_called()
        self.assertEqual(self.checkpoint()["model_calls_started"], 1)

    def test_product_role_cannot_claim_same_role_id(self):
        self.pilot.product_vehicle.analyse.return_value = result_for(
            "product_vehicle", role_run_id="research-id")
        result = self.run_pilot()
        self.assertEqual(result[-1].data["status"], "needs_operator_review")
        self.assertEqual(self.checkpoint()["model_calls_started"], 2)

    def test_two_call_ceiling_rejected_before_work(self):
        self.reasoning.config["max_calls_per_run"] = 3
        result = self.run_pilot()
        self.assertEqual(result[0].severity, "blocked")
        self.assertEqual(self.github.requests, [])

    def test_retrieval_timestamp_change_does_not_invalidate_source_identity(self):
        first = self.run_pilot()
        self.assertEqual(first[-1].data["route"], "human_decision_needed")
        state = self.checkpoint()
        self.assertTrue(state["evidence_fingerprint"])
        state.pop("product_vehicle")
        state.pop("decision_route")
        state["stage"] = "research_complete"
        state["model_calls_started"] = 1
        Path(self.config["checkpoint_file"]).write_text(json.dumps(state))
        original_read = self.github.read_approved_sources

        def refresh_timestamps(paths, **bounds):
            items = original_read(paths, **bounds)
            for item in items:
                item["retrieved_at"] = "2026-09-24T12:34:56Z"
            return items

        self.github.read_approved_sources = refresh_timestamps
        resumed = P7Pilot(self.github, self.reasoning, self.config)
        resumed.research.analyse = Mock(return_value=result_for("research"))
        resumed.product_vehicle.analyse = Mock(return_value=result_for("product_vehicle"))
        results = resumed.process(change(), issue())
        self.assertEqual(results[-1].data["route"], "human_decision_needed")
        resumed.research.analyse.assert_not_called()
        resumed.product_vehicle.analyse.assert_called_once()

    def test_shared_event_object_uses_compact_904_payload(self):
        evt = Event("issue.meaningful.changed", change())
        result = self.pilot.process(evt, issue())
        self.assertEqual(result[-1].data["route"], "human_decision_needed")

    def test_evidence_changes_between_checkpoints_require_review(self):
        state = {"event_key": str(NUMBER) + ":" + REVISION,
                 "issue_number": NUMBER, "source_revision": REVISION,
                 "stage": "research_complete", "model_calls_started": 1,
                 "research": result_for("research").to_dict(),
                 "evidence_fingerprint": "different-evidence"}
        Path(self.config["checkpoint_file"]).write_text(json.dumps(state))
        result = self.run_pilot()
        self.assertEqual(result[0].data["status"], "needs_operator_review")
        self.pilot.product_vehicle.analyse.assert_not_called()

    def test_uncertain_research_exception_survives_restart(self):
        self.pilot.research.analyse.side_effect = RuntimeError("Provider timeout after send")
        first = self.run_pilot()
        self.assertEqual(first[0].data["status"], "needs_operator_review")
        restarted = P7Pilot(self.github, self.reasoning, self.config)
        restarted.research.analyse = Mock(return_value=result_for("research"))
        self.assertEqual(restarted.process(change(), issue())[0].data["status"],
                         "needs_operator_review")
        restarted.research.analyse.assert_not_called()

    def test_missing_approved_context_never_falls_back_to_github(self):
        self.assertEqual(self.pilot.process(change())[0].data["status"],
                         "incomplete_context")
        self.github.get_issue_context.assert_not_called()


if __name__ == "__main__":
    unittest.main()

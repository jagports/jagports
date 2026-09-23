"""Batch 10 integration: default mode, authorized routing and report, offline only."""
import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

import yaml

from agents.lead_agent import LeadAgent
from core.result import AgentResult
from services import report_service, state_service
from services.ghd_pending_store import GHDPendingStore, PendingStoreError
import main as entry


ISSUE = {"number": 42, "title": "Source-backed research", "state": "open",
         "updated_at": "2026-09-23T00:00:00+00:00"}
CHANGE = {"issue_number": 42, "kind": ["body_changed"],
          "source_revision": "approved-revision", "changed_comment_ids": []}
CONTEXT = {"number": 42, "title": "Source-backed research", "body": "Approved question.",
           "labels": [], "state": "open",
           "url": "https://github.com/jagports/jagports/issues/42",
           "comments": [], "truncated": False,
           "fetched_at": "2026-09-23T00:00:00Z",
           "source_revision": "approved-revision"}


class FakeGitHub:
    def __init__(self, token=None, repository=None, *, max_requests_per_run=12):
        self.collected = 0

    def get_issues(self):
        self.collected += 1
        return [dict(ISSUE)]


class FakePilot:
    def __init__(self, enabled=True):
        self.config = {"enabled": enabled}
        self.calls = []
        self.output = [
            AgentResult("research", "review", "Finding", {
                "status": "complete", "confidence": "supported",
                "source_revision": "approved-revision", "role_run_id": "research-id",
                "work_item_url": CONTEXT["url"],
                "usage": {"input_tokens": 10, "output_tokens": 5},
                "estimated_cost_usd": 0.001,
                "sources": [{"text": "Sensitive untrusted evidence", "id": "source-a"}],
            }),
            AgentResult("product_vehicle", "review", "Independent validation", {
                "status": "complete", "outcome": "validated",
                "source_revision": "approved-revision", "role_run_id": "product-id",
                "usage": {"input_tokens": 12, "output_tokens": 6},
                "draft_requirement": "Not approved",
            }),
            AgentResult("team_lead", "review", "Human hand-off", {
                "route": "human_decision_needed", "requires_human_review": True,
                "source_revision": "approved-revision",
            }),
        ]

    def process(self, changed_event, issue_context):
        self.calls.append((changed_event, issue_context))
        # Match the real P7 results' exact verified #904 source revision.
        for result in self.output:
            result.data["source_revision"] = changed_event["source_revision"]
        return self.output

    def completed_event_key(self):
        if not self.calls:
            return None
        changed_event = self.calls[-1][0]
        return (str(changed_event["issue_number"]) + ":" +
                changed_event["source_revision"])


def write_real_ghd_pending(path="state/pending.json"):
    """Generate the versioned, integrity-checked #904 handoff in a temp dir."""
    pending_path = Path(path)
    store = GHDPendingStore(
        snapshot_path=pending_path.with_name("ghd_enrichment.json"),
        pending_path=pending_path)
    complete = dict(CONTEXT)
    complete.pop("source_revision", None)
    complete.update({"comment_scope": "all", "total_comment_count": 0})
    produced = store.record_observation({
        "status": "complete", "issue_number": 42,
        "context_or_error": complete,
    }, newly_observed=True)
    assert produced["status"] == "pending", produced
    return produced["pending_event"]


class WiringTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.old_cwd = Path.cwd()
        os.chdir(self.temp.name)
        self.addCleanup(os.chdir, self.old_cwd)
        Path("state").mkdir()
        self.github = FakeGitHub()

    def test_disabled_mode_preserves_three_deterministic_specialists(self):
        pilot = FakePilot(enabled=False)
        agent = LeadAgent(self.github, p7_pilot=pilot,
                          p7_event_source=lambda: self.fail("disabled event read"))
        issues, event, results = agent.run()
        self.assertEqual(len(issues), 1)
        self.assertEqual(event.type, "issue.lifecycle.changed")
        self.assertEqual([r.agent for r in results],
                         ["documentation", "deployment", "knowledge"])
        self.assertEqual(pilot.calls, [])
        self.assertIn("issues", state_service.load_state())

    def test_enabled_mode_dispatches_only_p7_roles(self):
        pilot = FakePilot()
        source = Mock(return_value=(dict(CHANGE), dict(CONTEXT)))
        agent = LeadAgent(self.github, p7_pilot=pilot, p7_event_source=source)
        agent.registry.analyse_all = Mock(
            side_effect=AssertionError("Deterministic specialists dispatched in P7 mode"))
        issues, event, results = agent.run()
        self.assertEqual([r.agent for r in results],
                         ["research", "product_vehicle", "team_lead"])
        source.assert_called_once()
        self.assertEqual(pilot.calls[0][0]["source_revision"], "approved-revision")
        self.assertEqual(pilot.calls[0][1]["source_revision"], "approved-revision")
        self.assertEqual(event.context["p7"]["mode"], "advisory")
        report = report_service.create_report(issues, event.data, results, event.context)
        self.assertIn("P7 advisory pilot", report)
        self.assertIn("human_decision_needed", report)
        self.assertIn("Measured tokens", report)
        self.assertNotIn("Sensitive untrusted evidence", report)
        self.assertNotIn("Not approved", report)
        self.assertNotIn("No documentation analysis.", report)

    def test_enabled_without_accepted_event_source_fails_closed(self):
        pilot = FakePilot()
        agent = LeadAgent(self.github, p7_pilot=pilot)
        agent.registry.analyse_all = Mock(
            side_effect=AssertionError("Rule-based fallback in enabled P7 mode"))
        _issues, event, results = agent.run()
        self.assertEqual(results[0].data["status"], "missing_event_source")
        self.assertEqual(pilot.calls, [])
        self.assertEqual(event.context["p7"]["event_source"], "missing")

    def test_missing_pending_file_does_not_trigger_model(self):
        pilot = FakePilot()
        agent = LeadAgent(self.github, p7_pilot=pilot,
                          p7_event_source=lambda: entry.load_ghd_pending_event(
                              "state/missing.json"))
        _issues, _event, results = agent.run()
        self.assertEqual(results, [])  # no pending outbox means zero model calls
        self.assertEqual(pilot.calls, [])

    def test_only_versioned_904_pending_events_are_accepted(self):
        file = Path("state/pending.json")
        for payload in ({"changed_event": CHANGE, "issue_context": CONTEXT},
                        {"producer": "unknown", "schema_version": 1,
                         "status": "pending", "changed_event": CHANGE,
                         "issue_context": CONTEXT}):
            file.write_text(json.dumps(payload))
            with self.assertRaises(PendingStoreError):
                entry.load_ghd_pending_event(file)
        file.unlink()
        pending = write_real_ghd_pending(file)
        event, context = entry.load_ghd_pending_event(file)
        self.assertEqual(event["source_revision"], context["source_revision"])
        self.assertEqual(event["source_revision"],
                         pending["changed_event"]["source_revision"])

    def test_repository_default_config_keeps_p7_and_spending_disabled(self):
        """The committed installation defaults must never authorize P7."""
        config_path = Path(__file__).resolve().parents[1] / "config.yaml"
        config = yaml.safe_load(config_path.read_text(encoding="utf-8"))
        self.assertIs(config["openai"]["enabled"], False)
        self.assertIs(config["p7"]["enabled"], False)
        self.assertEqual(config["p7"]["allowed_issue_numbers"], [])
        self.assertEqual(config["p7"]["approved_source_revision"], "")
        self.assertEqual(config["p7"]["pending_event_file"], "")
        self.assertEqual(config["p7"]["approved_research_paths"], [])
        self.assertEqual(config["p7"]["approved_domain_paths"], [])
        self.assertIs(config["p7"]["reasoning"]["enabled"], False)
        self.assertEqual(config["polling"]["interval_minutes"], 585)

        # Run with the checked-in configuration. Both paid services must
        # remain unconstructed and the deterministic specialists still run.
        with patch("services.reasoning_service.ReasoningService") as paid_model:
            with patch("services.p7_pilot.P7Pilot") as pilot:
                agent = entry.build_agent(config, self.github)
                self.assertIsNone(agent.p7_pilot)
                _issues, _event, results = agent.run()
                paid_model.assert_not_called()
                pilot.assert_not_called()
        self.assertEqual([result.agent for result in results],
                         ["documentation", "deployment", "knowledge"])

    def test_disabled_main_uses_original_report_path_and_no_provider(self):
        config_file = Path("config.yaml")
        config_file.write_text(yaml.safe_dump({
            "github": {"repository": "jagports/jagports"},
            "openai": {"enabled": False},
        }))
        with patch.object(entry, "GitHubService", FakeGitHub):
            with patch.object(entry.report_service, "save_report") as save:
                issues, event, results = entry.main(config_file)
        self.assertEqual([r.agent for r in results],
                         ["documentation", "deployment", "knowledge"])
        save.assert_called_once()
        self.assertIn("Agent Analysis Results", save.call_args.args[0])

    def test_p7_main_requires_separate_spend_approval(self):
        config = {
            "p7": {"enabled": True, "approved_source_revision": "approved-revision",
                   "pending_event_file": "state/pending.json",
                   "reasoning": {"enabled": True}},
            "openai": {"enabled": False},
        }
        with self.assertRaisesRegex(ValueError, "independent explicit enablement"):
            entry.build_agent(config, self.github)

    def test_enabled_main_passes_904_handoff_without_provider_calls(self):
        pending = write_real_ghd_pending()
        revision = pending["changed_event"]["source_revision"]
        config_file = Path("config.yaml")
        config_file.write_text(yaml.safe_dump({
            "github": {"repository": "jagports/jagports"},
            "openai": {"enabled": True},
            "p7": {"enabled": True, "approved_source_revision": revision,
                   "pending_event_file": "state/pending.json",
                   "reasoning": {"enabled": True}},
        }))
        pilot = FakePilot()
        with patch.object(entry, "GitHubService", FakeGitHub):
            with patch("services.reasoning_service.ReasoningService") as reasoning:
                with patch("services.p7_pilot.P7Pilot", return_value=pilot):
                    with patch.object(entry.report_service, "save_report",
                                      wraps=entry.report_service.save_report) as save:
                        _issues, _event, results = entry.main(config_file)
        reasoning.assert_called_once()
        self.assertEqual([r.agent for r in results],
                         ["research", "product_vehicle", "team_lead"])
        self.assertEqual(pilot.calls[0][0]["source_revision"], revision)
        self.assertEqual(pilot.calls[0][1]["source_revision"], revision)
        self.assertIn("P7 advisory pilot", save.call_args.args[0])
        self.assertNotIn("Sensitive untrusted evidence", save.call_args.args[0])
        # An in-memory test can observe the outbox transition, but does not
        # substitute for Pi filesystem evidence or an actual paid run.
        self.assertIsNone(entry._ghd_store("state/pending.json").replay_pending())



    def test_p7_report_failure_leaves_exact_pending_event_for_restart(self):
        pending = write_real_ghd_pending()
        revision = pending["changed_event"]["source_revision"]
        config_file = Path("config.yaml")
        config_file.write_text(yaml.safe_dump({
            "github": {"repository": "jagports/jagports"},
            "openai": {"enabled": True},
            "p7": {"enabled": True, "approved_source_revision": revision,
                   "pending_event_file": "state/pending.json",
                   "reasoning": {"enabled": True}},
        }))
        pilot = FakePilot()
        with patch.object(entry, "GitHubService", FakeGitHub):
            with patch("services.reasoning_service.ReasoningService"):
                with patch("services.p7_pilot.P7Pilot", return_value=pilot):
                    with patch.object(entry.report_service, "save_report",
                                      side_effect=OSError("report disk full")):
                        with self.assertRaisesRegex(OSError, "disk full"):
                            entry.main(config_file)
        durable = entry._ghd_store("state/pending.json").replay_pending()
        self.assertEqual(durable["event_key"], pending["event_key"])

    def test_p7_success_durably_reports_before_acknowledging_outbox(self):
        pending = write_real_ghd_pending()
        revision = pending["changed_event"]["source_revision"]
        config_file = Path("config.yaml")
        config_file.write_text(yaml.safe_dump({
            "github": {"repository": "jagports/jagports"},
            "openai": {"enabled": True},
            "p7": {"enabled": True, "approved_source_revision": revision,
                   "pending_event_file": "state/pending.json",
                   "reasoning": {"enabled": True}},
        }))
        pilot = FakePilot()
        with patch.object(entry, "GitHubService", FakeGitHub):
            with patch("services.reasoning_service.ReasoningService"):
                with patch("services.p7_pilot.P7Pilot", return_value=pilot):
                    _issues, event, results = entry.main(config_file)
        self.assertEqual(len(results), 3)
        self.assertTrue(event.context["p7"]["pending_acknowledged"])
        report = Path("reports/lead_report.md")
        self.assertTrue(report.is_file())
        self.assertIn("P7 advisory pilot", report.read_text())
        self.assertIsNone(entry._ghd_store("state/pending.json").replay_pending())



if __name__ == "__main__":
    unittest.main()

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
    def __init__(self, token=None, repository=None):
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
        return self.output


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
        self.assertEqual(results[0].data["status"], "invalid_event_source")
        self.assertEqual(pilot.calls, [])

    def test_only_versioned_904_pending_events_are_accepted(self):
        file = Path("state/pending.json")
        for payload in ({"changed_event": CHANGE, "issue_context": CONTEXT},
                        {"producer": "unknown", "schema_version": 1,
                         "status": "pending", "changed_event": CHANGE,
                         "issue_context": CONTEXT}):
            file.write_text(json.dumps(payload))
            with self.assertRaises(ValueError):
                entry.load_ghd_pending_event(file)
        file.write_text(json.dumps({
            "producer": "ghd_increment_a", "schema_version": 1,
            "status": "pending", "changed_event": CHANGE, "issue_context": CONTEXT,
        }))
        event, context = entry.load_ghd_pending_event(file)
        self.assertEqual(event["source_revision"], context["source_revision"])

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
        Path("state/pending.json").write_text(json.dumps({
            "producer": "ghd_increment_a", "schema_version": 1,
            "status": "pending", "changed_event": CHANGE,
            "issue_context": CONTEXT,
        }))
        config_file = Path("config.yaml")
        config_file.write_text(yaml.safe_dump({
            "github": {"repository": "jagports/jagports"},
            "openai": {"enabled": True},
            "p7": {"enabled": True, "approved_source_revision": "approved-revision",
                   "pending_event_file": "state/pending.json",
                   "reasoning": {"enabled": True}},
        }))
        pilot = FakePilot()
        with patch.object(entry, "GitHubService", FakeGitHub):
            with patch("services.reasoning_service.ReasoningService") as reasoning:
                with patch("services.p7_pilot.P7Pilot", return_value=pilot):
                    with patch.object(entry.report_service, "save_report") as save:
                        _issues, _event, results = entry.main(config_file)
        reasoning.assert_called_once()
        self.assertEqual([r.agent for r in results],
                         ["research", "product_vehicle", "team_lead"])
        self.assertEqual(pilot.calls[0][0]["source_revision"], "approved-revision")
        self.assertIn("P7 advisory pilot", save.call_args.args[0])
        self.assertNotIn("Sensitive untrusted evidence", save.call_args.args[0])


if __name__ == "__main__":
    unittest.main()

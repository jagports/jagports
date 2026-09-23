"""Mocked end-to-end and legacy regressions; no GitHub or provider network calls."""
import json
import os
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import Mock, patch

from agents.lead_agent import LeadAgent
from services import report_service, state_service
from services.github_service import GitHubService
from services.p7_pilot import P7Pilot


ISSUE_ID = 42
REVISION = "approved-revision"
ISSUE_URL = "https://github.com/jagports/jagports/issues/42"


class OfflineGitHub:
    def __init__(self):
        self.requests = []
        self.forbidden_writes = []
        self.get_issue_context = Mock(side_effect=AssertionError(
            "P7 must use accepted #904 IssueContext, not fetch its own Issue"))

    def get_issues(self):
        return [{"number": ISSUE_ID, "title": "Approved inquiry",
                 "state": "open", "updated_at": "2026-09-23T00:00:00Z"}]

    def read_approved_sources(self, paths, max_files=2, max_chars=3500):
        self.requests.append(tuple(paths))
        assert len(paths) == 1 and paths[0].startswith("7-Research/")
        label = "research-evidence" if "research" in paths[0] else "domain-evidence"
        return [{
            "id": label, "path": paths[0], "kind": "repository",
            "url": "https://github.com/jagports/jagports/blob/main/" + paths[0],
            "retrieved_at": "2026-09-23T00:00:00Z",
            "text": "Retrieved independent evidence: " + label,
            "truncated": False,
        }]

    def create_issue_comment(self, *args, **kwargs):
        self.forbidden_writes.append(("create_issue_comment", args))
        raise AssertionError("GitHub write attempted by read-only pilot")


class MockProviderBoundary:
    def __init__(self):
        self.config = {"enabled": True, "max_calls_per_run": 2}
        self.calls = []

    def analyse_json(self, role, instructions, context, request_key):
        assert role in ("research", "product_vehicle")
        assert len(self.calls) < 2, "A third model call was attempted"
        self.calls.append((role, request_key))
        if role == "research":
            output = {
                "finding": "The retrieved material supports review.",
                "confidence": "supported",
                "source_ids": ["research-evidence"],
                "contrary_source_ids": [],
                "limitations": [],
                "unresolved_questions": [],
                "recommended_action": "Seek independent domain validation.",
            }
        else:
            assert len(self.calls) == 2
            assert context["research_finding"]["confidence"] == "supported"
            output = {
                "outcome": "validated",
                "rationale": "The separate domain evidence supports a proposed requirement.",
                "checked_source_ids": ["domain-evidence"],
                "conflicting_source_ids": [],
                "unresolved_questions": [],
                "draft_requirement": "Draft only; human decision required.",
                "decision_required": True,
            }
        return {
            "output": output, "model": "mock-provider",
            "usage": {"input_tokens": 130, "output_tokens": 30},
            "estimated_cost_usd": 0.0001,
            "provider_response_id": "mock-" + role,
        }


def changed():
    return {"issue_number": ISSUE_ID, "kind": ["body_changed"],
            "source_revision": REVISION, "changed_comment_ids": []}


def context():
    return {"number": ISSUE_ID, "title": "Approved inquiry",
            "body": "Retrieve independently verified evidence.",
            "state": "open", "labels": [], "url": ISSUE_URL,
            "source_revision": REVISION, "fetched_at": "2026-09-23T00:00:00Z",
            "comments": [], "truncated": False}


class EndToEndAndLegacyTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.previous = Path.cwd()
        os.chdir(self.directory.name)
        self.addCleanup(os.chdir, self.previous)
        Path("state").mkdir()
        self.github = OfflineGitHub()
        self.provider = MockProviderBoundary()
        self.config = {
            "enabled": True,
            "read_only_credential_confirmed": True,
            "allowed_issue_numbers": [ISSUE_ID],
            "approved_source_revision": REVISION,
            "approved_research_paths": ["7-Research/research.md"],
            "approved_domain_paths": ["7-Research/domain.md"],
            "checkpoint_file": "state/pilot.json",
        }

    def test_mocked_full_coordinator_generates_two_independent_results(self):
        pilot = P7Pilot(self.github, self.provider, self.config)
        lead = LeadAgent(self.github, p7_pilot=pilot,
                         p7_event_source=lambda: (changed(), context()))
        issues, event, results = lead.run()
        self.assertEqual([item.agent for item in results],
                         ["research", "product_vehicle", "team_lead"])
        self.assertEqual([role for role, _ in self.provider.calls],
                         ["research", "product_vehicle"])
        self.assertNotEqual(results[0].data["role_run_id"],
                            results[1].data["role_run_id"])
        self.assertEqual(results[1].data["research_role_run_id"],
                         results[0].data["role_run_id"])
        self.assertEqual(results[2].data["route"], "human_decision_needed")
        self.assertFalse(results[1].data["approved"])
        self.assertTrue(results[2].data["requires_human_review"])
        self.assertEqual(self.github.forbidden_writes, [])
        report = report_service.create_report(issues, event.data, results,
                                              event.context)
        self.assertIn("P7 advisory pilot", report)
        self.assertIn("Measured tokens (input/output)", report)
        self.assertIn("human_decision_needed", report)
        self.assertNotIn("Draft only", report)
        checkpoint = json.loads(Path("state/pilot.json").read_text())
        self.assertEqual(checkpoint["stage"], "complete")
        self.assertEqual(checkpoint["model_calls_started"], 2)

        # Same revision cannot silently generate a second paid run.
        self.assertEqual(lead.run()[2], [])
        self.assertEqual(len(self.provider.calls), 2)

    def test_default_mode_keeps_legacy_specialists_and_lifecycle(self):
        lead = LeadAgent(self.github)
        state_service.save_state({
            "issues": {"42": {"number": 42, "state": "closed",
                               "title": "Previously closed"}},
        })
        issues, event, results = lead.run()
        self.assertEqual([item.agent for item in results],
                         ["documentation", "deployment", "knowledge"])
        self.assertEqual(event.data["reopened"], [ISSUE_ID])
        self.assertEqual(self.provider.calls, [])
        report = report_service.create_report(issues, event.data, results,
                                              event.context)
        self.assertIn("Reopened: [42]", report)
        self.assertIn("Agent Analysis Results", report)

    def test_legacy_no_flood_initial_state_and_closed_transition(self):
        self.assertEqual(state_service.compare_issues({}, {"42": {
            "number": 42, "state": "open"}})["new"], [])
        old = {"issues": {"42": {"number": 42, "state": "open"},
                          "43": {"number": 43, "state": "open"}}}
        result = state_service.compare_issues(old, {
            "42": {"number": 42, "state": "closed"},
            "43": {"number": 43, "state": "open"},
            "44": {"number": 44, "state": "open"}})
        self.assertEqual(result["closed"], [42])
        self.assertEqual(result["new"], [44])
        self.assertEqual(result["reopened"], [])

    def test_pr_metadata_filtered_without_fetching_pr_detail(self):
        # Avoid GitHubService.__init__: this fixture must not instantiate a client.
        service = object.__new__(GitHubService)
        issue = Mock()
        issue.raw_data = {}
        issue.number = 42
        issue.title = "Real issue"
        issue.state = "open"
        issue.updated_at = datetime(2026, 9, 23, tzinfo=timezone.utc)
        pr = Mock()
        pr.raw_data = {"pull_request": {"url": "https://api.github.com/pr/5"}}
        repo = Mock()
        repo.get_issues.return_value = [pr, issue]
        service.repo = repo
        result = service.get_issues()
        self.assertEqual([record["number"] for record in result], [42])
        self.assertEqual(service.filtered_prs, 1)
        repo.get_issues.assert_called_once_with(state="all")


if __name__ == "__main__":
    unittest.main()

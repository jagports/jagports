"""#904 A1 offline Issue/PR classification and historical snapshot migration.

Only raw metadata from the existing GitHub Issues listing is used. These
fixtures intentionally fail if a lazy PR-detail property is accessed.
"""
import os
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import Mock

from agents.lead_agent import LeadAgent
from services.github_service import GitHubService
from services import state_service


class Record:
    def __init__(self, number, state="open", *, pr=False, metadata_valid=True):
        self.number = number
        self.title = "Record #" + str(number)
        self.state = state
        self.updated_at = datetime(2026, 9, 23, tzinfo=timezone.utc)
        self.raw_data = {"number": number} if metadata_valid else None
        if pr and metadata_valid:
            self.raw_data["pull_request"] = {"url": "https://api.github.com/pulls/" + str(number)}

    @property
    def pull_request(self):
        raise AssertionError("Lazy pull_request access would trigger extra API requests")


def fake_service(*records):
    service = object.__new__(GitHubService)
    service.repo = Mock()
    service.repo.get_issues.return_value = list(records)
    service.repo.get_issue.side_effect = AssertionError("Per-record details are forbidden")
    return service


def run_lead(service):
    lead = LeadAgent(service)
    # The migration test concerns collection and lifecycle state, not the
    # three already-established deterministic specialist implementations.
    lead.registry.analyse_all = Mock(return_value=[])
    return lead.run()


class GHDIssuePRMigrationTests(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        previous = Path.cwd()
        os.chdir(temp.name)
        self.addCleanup(os.chdir, previous)
        Path("state").mkdir()

    def test_prs_are_filtered_without_lazy_detail_requests(self):
        service = fake_service(
            Record(903, pr=True), Record(42), Record(904, pr=True),
            Record(43, state="closed"), Record(901, pr=True, state="closed"))
        rows = service.get_issues()
        self.assertEqual([row["number"] for row in rows], [42, 43])
        self.assertEqual(service.filtered_prs, 3)
        self.assertEqual(service.filtered_pr_numbers, {903, 904, 901})
        self.assertEqual(set(rows[0]), {"number", "title", "state", "updated_at"})
        service.repo.get_issues.assert_called_once_with(state="all")
        service.repo.get_issue.assert_not_called()

    def test_existing_issues_keep_real_changes_without_legacy_pr_alerts(self):
        # Legacy agent_state.json used to save PRs as Issue rows.
        state_service.save_state({"issues": {
            "42": {"number": 42, "title": "Existing Issue", "state": "open"},
            "903": {"number": 903, "title": "Old PR", "state": "open"},
            "901": {"number": 901, "title": "Older PR", "state": "closed"},
        }})
        service = fake_service(
            Record(42, state="closed"), Record(43),
            Record(903, pr=True, state="closed"), Record(904, pr=True),
            Record(901, pr=True, state="closed"))
        rows, event, _ = run_lead(service)
        self.assertEqual([item["number"] for item in rows], [42, 43])
        self.assertEqual(event.data, {
            "new": [43], "closed": [42], "reopened": [],
        })
        persisted = state_service.load_state()
        self.assertEqual(set(persisted["issues"]), {"42", "43"})
        self.assertTrue(persisted["change_detected"])
        self.assertEqual(service.filtered_prs, 3)

    def test_pr_only_legacy_snapshot_migrates_as_initial_baseline(self):
        # Without pruning, the presence of old PRs would make *every*
        # historical Issue look new when the first real Issue arrives.
        state_service.save_state({"issues": {
            "903": {"number": 903, "state": "open"},
            "901": {"number": 901, "state": "closed"},
        }})
        service = fake_service(
            Record(42), Record(903, pr=True), Record(901, pr=True, state="closed"))
        _rows, event, _ = run_lead(service)
        self.assertEqual(event.data, {"new": [], "closed": [], "reopened": []})
        self.assertEqual(set(state_service.load_state()["issues"]), {"42"})

        # Subsequent ordinary Issue changes must still be detected.
        service.repo.get_issues.return_value = [
            Record(42), Record(43), Record(903, pr=True)]
        _rows, later, _ = run_lead(service)
        self.assertEqual(later.data, {"new": [43], "closed": [], "reopened": []})
        self.assertEqual(set(state_service.load_state()["issues"]), {"42", "43"})

    def test_empty_first_snapshot_remains_quiet_even_with_prs(self):
        service = fake_service(Record(42), Record(903, pr=True))
        _rows, event, _ = run_lead(service)
        self.assertEqual(event.data, {"new": [], "closed": [], "reopened": []})
        self.assertEqual(set(state_service.load_state()["issues"]), {"42"})

    def test_missing_raw_metadata_fails_closed_without_advancing_state(self):
        state_service.save_state({"issues": {"42": {
            "number": 42, "state": "open",
        }}})
        service = fake_service(Record(42), Record(903, metadata_valid=False))
        with self.assertRaisesRegex(ValueError, "metadata"):
            run_lead(service)
        self.assertEqual(set(state_service.load_state()["issues"]), {"42"})
        service.repo.get_issue.assert_not_called()

    def test_filtered_pr_counters_reset_on_next_collection(self):
        service = fake_service(Record(42), Record(903, pr=True))
        service.get_issues()
        self.assertEqual(service.filtered_prs, 1)
        service.repo.get_issues.return_value = [Record(42)]
        self.assertEqual([x["number"] for x in service.get_issues()], [42])
        self.assertEqual(service.filtered_prs, 0)
        self.assertEqual(service.filtered_pr_numbers, set())


if __name__ == "__main__":
    unittest.main()

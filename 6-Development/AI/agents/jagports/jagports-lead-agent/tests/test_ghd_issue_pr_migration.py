"""#904 A1 offline Issue/PR classification and historical snapshot migration.

Only raw metadata from the existing GitHub Issues listing is used. These
fixtures intentionally fail if a lazy PR-detail property is accessed.
"""
import os
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from types import SimpleNamespace
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



def make_comment(issue_number, comment_id, body="Evidence", *,
                 updated_at=None, source_issue=None):
    now = datetime.now(timezone.utc)
    return SimpleNamespace(
        id=comment_id,
        html_url="https://github.com/jagports/jagports/issues/%d#issuecomment-%d"
                 % (issue_number, comment_id),
        raw_data={"issue_url": "https://api.github.com/repos/jagports/jagports/issues/%d"
                  % (source_issue if source_issue is not None else issue_number)},
        user=SimpleNamespace(login="researcher"),
        body=body, created_at=now - timedelta(days=7),
        updated_at=updated_at if updated_at is not None else now,
    )


def make_issue(number=42, *, body="Bounded investigation", comments=None,
               declared_comment_count=None, pr=False):
    items = [] if comments is None else comments
    issue = SimpleNamespace(
        number=number, title="Research question", state="open",
        body=body, html_url="https://github.com/jagports/jagports/issues/%d" % number,
        labels=[SimpleNamespace(name="research"), SimpleNamespace(name="vehicle")],
        comments=len(items) if declared_comment_count is None else declared_comment_count,
        raw_data={"number": number},
        get_comments=Mock(return_value=list(items)),
    )
    if pr:
        issue.raw_data["pull_request"] = {"url": "https://api.github.com/pulls/%d" % number}
    return issue


class GHDBoundedDetailTests(unittest.TestCase):
    """GHD-001 and retrieval-boundary fixtures, never real GitHub/API calls."""

    def setUp(self):
        self.service = fake_service()
        self.service.repo.get_issue.side_effect = None

    def test_explicit_issue_with_two_comments_and_linked_provenance(self):
        first, second = make_comment(42, 101), make_comment(42, 102, "Independent source")
        issue = make_issue(comments=[first, second])
        self.service.repo.get_issue.return_value = issue
        result = self.service.get_issue_context(42)
        self.assertEqual(result["status"], "complete")
        context = result["context_or_error"]
        self.assertEqual(context["number"], 42)
        self.assertEqual(context["url"], issue.html_url)
        self.assertEqual(context["labels"], ["research", "vehicle"])
        self.assertEqual(context["body"], "Bounded investigation")
        self.assertEqual([x["id"] for x in context["comments"]], [101, 102])
        self.assertEqual(context["comments"][0]["author"], "researcher")
        self.assertIn("#issuecomment-101", context["comments"][0]["url"])
        self.assertTrue(all(x["created_at"] and x["updated_at"]
                            for x in context["comments"]))
        self.assertFalse(context["truncated"])
        self.service.repo.get_issues.assert_not_called()
        self.service.repo.get_issue.assert_called_once_with(42)
        issue.get_comments.assert_called_once_with()
        self.assertEqual(self.service.request_metrics()["logical_get_operations"], 2)
        self.assertEqual(self.service.request_metrics()["issue_detail_gets"], 1)
        self.assertEqual(self.service.request_metrics()["comment_list_gets"], 1)
        self.assertGreater(self.service.request_metrics()["fetched_text_chars"], 0)
        self.assertIs(self.service.request_metrics()["http_requests_verified"], False)

    def test_zero_comments_does_not_request_comment_pages(self):
        issue = make_issue()
        self.service.repo.get_issue.return_value = issue
        result = self.service.get_issue_context(42)
        self.assertEqual(result["status"], "complete")
        self.assertEqual(result["context_or_error"]["comments"], [])
        issue.get_comments.assert_not_called()
        self.assertEqual(self.service.request_metrics()["logical_get_operations"], 1)

    def test_excess_comment_count_truncates_without_loading_first_page(self):
        issue = make_issue(declared_comment_count=35)
        self.service.repo.get_issue.return_value = issue
        result = self.service.get_issue_context(42, max_comments=2)
        self.assertEqual(result["status"], "truncated")
        context = result["context_or_error"]
        self.assertTrue(context["truncated"])
        self.assertEqual(context["truncation_reasons"], ["comment_count_limit"])
        self.assertEqual(context["url"], issue.html_url)
        self.assertEqual(context["comments"], [])
        issue.get_comments.assert_not_called()
        self.assertEqual(self.service.request_metrics()["comment_list_gets"], 0)

    def test_selected_comments_fetch_only_requested_ids_even_in_long_thread(self):
        issue = make_issue(declared_comment_count=88)
        self.service.repo.get_issue.return_value = issue
        selected = {200: make_comment(42, 200), 201: make_comment(42, 201)}
        self.service.repo.get_issue_comment.side_effect = selected.__getitem__
        result = self.service.get_issue_context(
            42, selected_comment_ids=[201, 200], max_comments=2)
        self.assertEqual(result["status"], "complete")
        context = result["context_or_error"]
        self.assertEqual(context["comment_scope"], "selected")
        self.assertEqual(context["total_comment_count"], 88)
        self.assertEqual([c["id"] for c in context["comments"]], [201, 200])
        self.assertFalse(context["truncated"])
        issue.get_comments.assert_not_called()
        self.assertEqual(self.service.repo.get_issue_comment.call_count, 2)
        self.assertEqual(self.service.request_metrics()["comment_id_gets"], 2)
        self.assertEqual(self.service.request_metrics()["logical_get_operations"], 3)

    def test_selection_over_limit_is_truncated_without_comment_lookups(self):
        issue = make_issue(declared_comment_count=100)
        self.service.repo.get_issue.return_value = issue
        result = self.service.get_issue_context(
            42, selected_comment_ids=[101, 102, 103], max_comments=2)
        self.assertEqual(result["status"], "truncated")
        self.assertIn("selected_comment_limit",
                      result["context_or_error"]["truncation_reasons"])
        self.service.repo.get_issue_comment.assert_not_called()
        issue.get_comments.assert_not_called()

    def test_body_and_comment_character_limits_are_explicit(self):
        item = make_comment(42, 101, "very long evidence")
        issue = make_issue(body="very long issue body", comments=[item])
        self.service.repo.get_issue.return_value = issue
        result = self.service.get_issue_context(
            42, max_body_chars=5, max_comment_chars=4)
        self.assertEqual(result["status"], "truncated")
        ctx = result["context_or_error"]
        self.assertEqual(ctx["body"], "very ")
        self.assertEqual(ctx["comments"][0]["body"], "very")
        self.assertEqual(set(ctx["truncation_reasons"]),
                         {"issue_body_limit", "comment_body_limit"})

    def test_stale_comment_is_flagged_instead_of_silently_omitted(self):
        old = make_comment(42, 101, updated_at=datetime.now(timezone.utc)
                           - timedelta(days=400))
        issue = make_issue(comments=[old])
        self.service.repo.get_issue.return_value = issue
        result = self.service.get_issue_context(42, max_comment_age_days=30)
        self.assertEqual(result["status"], "truncated")
        self.assertEqual(result["context_or_error"]["comments"], [])
        self.assertEqual(result["context_or_error"]["truncation_reasons"],
                         ["comment_age"])

    def test_changed_comment_provenance_mismatch_is_error(self):
        issue = make_issue(declared_comment_count=99)
        self.service.repo.get_issue.return_value = issue
        self.service.repo.get_issue_comment.return_value = make_comment(
            42, 101, source_issue=43)
        result = self.service.get_issue_context(
            42, selected_comment_ids=[101])
        self.assertEqual(result["status"], "retryable_error")
        self.assertEqual(result["context_or_error"]["reason"],
                         "comment_provenance_incomplete")
        self.assertEqual(result["context_or_error"]["url"], issue.html_url)

    def test_comment_pagination_failure_is_not_silent_empty_evidence(self):
        issue = make_issue(declared_comment_count=2)
        issue.get_comments.side_effect = RuntimeError("network fault: private token")
        self.service.repo.get_issue.return_value = issue
        result = self.service.get_issue_context(42)
        self.assertEqual(result["status"], "retryable_error")
        self.assertEqual(result["context_or_error"]["reason"], "comments_page_failed")
        self.assertNotIn("private token", str(result))
        self.assertEqual(self.service.request_metrics()["comment_list_gets"], 1)

    def test_deleted_issue_is_permanent_error(self):
        class Missing(Exception):
            status = 404

        self.service.repo.get_issue.side_effect = Missing("not found: secret")
        result = self.service.get_issue_context(42)
        self.assertEqual(result["status"], "permanent_error")
        self.assertEqual(result["context_or_error"]["reason"], "issue_lookup_failed")
        self.assertNotIn("secret", str(result))

    def test_issue_pr_is_rejected_before_comments(self):
        issue = make_issue(pr=True, declared_comment_count=2)
        self.service.repo.get_issue.return_value = issue
        result = self.service.get_issue_context(42)
        self.assertEqual(result["status"], "permanent_error")
        self.assertEqual(result["context_or_error"]["reason"],
                         "pull_request_excluded")
        issue.get_comments.assert_not_called()

    def test_detail_bound_prevents_second_get_in_same_run(self):
        self.service.repo.get_issue.return_value = make_issue()
        self.assertEqual(self.service.get_issue_context(42)["status"], "complete")
        second = self.service.get_issue_context(43)
        self.assertEqual(second["status"], "permanent_error")
        self.assertEqual(second["context_or_error"]["reason"],
                         "per_run_issue_detail_limit")
        self.service.repo.get_issue.assert_called_once_with(42)
        self.assertEqual(self.service.request_metrics()["issue_detail_gets"], 1)

    def test_malformed_selected_ids_are_rejected_without_get(self):
        for selection in ([1, 1], [True], ["101"]):
            with self.subTest(selection=selection):
                with self.assertRaises(ValueError):
                    self.service.get_issue_context(42,
                                                   selected_comment_ids=selection)
        self.service.repo.get_issue.assert_not_called()


if __name__ == "__main__":
    unittest.main()

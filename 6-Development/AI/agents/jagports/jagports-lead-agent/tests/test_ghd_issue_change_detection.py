"""Batch 15.4: offline GHD meaningful-change, bot and revision regressions.

These fixtures never contact GitHub, execute models or update runtime state.
Integration/persistence are separate #904 batches.
"""
import copy
import unittest

from services.issue_change_detection import compare_issue_context


CREATED = "2026-09-23T00:00:00+00:00"
FETCHED = "2026-09-23T00:30:00+00:00"
LATER = "2026-09-23T01:00:00+00:00"


def comment(identifier, *, issue=42, author="researcher", body="Original evidence",
            updated_at=CREATED):
    return {
        "id": identifier,
        "url": "https://github.com/jagports/jagports/issues/%d#issuecomment-%d"
               % (issue, identifier),
        "author": author, "body": body,
        "created_at": CREATED, "updated_at": updated_at,
    }


def observation(*, issue=42, title="Research question", body="Initial body",
                state="open", comments=None, fetched_at=FETCHED,
                comment_scope="all", total_comment_count=None):
    entries = list(comments or [])
    return {
        "status": "complete", "issue_number": issue,
        "context_or_error": {
            "number": issue, "title": title, "body": body,
            "state": state, "labels": ["research"],
            "url": "https://github.com/jagports/jagports/issues/%d" % issue,
            "comments": entries, "total_comment_count": (
                len(entries) if total_comment_count is None
                else total_comment_count),
            "comment_scope": comment_scope,
            "truncated": False, "fetched_at": fetched_at,
        },
    }


def initial(*, comments=None):
    """A quiet first-run enrichment baseline with one real human comment."""
    value = observation(comments=comments if comments is not None
                        else [comment(101)])
    result = compare_issue_context(None, value)
    assert result["status"] == "baseline"
    return result["snapshot"]


class MeaningfulChangeTests(unittest.TestCase):
    def test_first_run_is_baseline_and_never_floods_historical_issues(self):
        first = compare_issue_context(None, observation())
        self.assertEqual(first["status"], "baseline")
        self.assertIsNone(first["changed_event"])
        self.assertEqual(first["snapshot"]["schema_version"], 1)
        self.assertEqual(first["snapshot"]["issue_number"], 42)
        self.assertNotIn("Initial body", str(first["snapshot"]))
        self.assertNotIn("Research question", str(first["snapshot"]))

    def test_verified_new_issue_emits_only_new_kind(self):
        result = compare_issue_context(
            None, observation(comments=[comment(101), comment(102)]),
            newly_observed=True)
        self.assertEqual(result["status"], "changed")
        self.assertEqual(result["changed_event"], {
            "issue_number": 42, "kind": ["new"],
            "source_revision": result["snapshot"]["source_revision"],
            "changed_comment_ids": [],
        })
        self.assertEqual(len(result["snapshot"]["comments"]), 2)

    def test_title_edit_detected_even_when_fetch_time_unchanged(self):
        prior = initial()
        changed = compare_issue_context(
            prior, observation(title="Amended research question",
                               comments=[comment(101)]))
        self.assertEqual(changed["changed_event"]["kind"], ["title_changed"])
        self.assertNotEqual(prior["source_revision"],
                            changed["changed_event"]["source_revision"])

    def test_body_edit_detected_without_lifecycle_transition(self):
        prior = initial()
        changed = compare_issue_context(
            prior, observation(body="Revised requirement",
                               comments=[comment(101)]))
        self.assertEqual(changed["changed_event"]["kind"], ["body_changed"])
        self.assertEqual(changed["changed_event"]["changed_comment_ids"], [])

    def test_old_human_comment_edit_detected_without_timestamp_change(self):
        prior = initial()
        changed = compare_issue_context(
            prior, observation(comments=[
                comment(101, body="Edited source, timestamp not advanced")]))
        self.assertEqual(changed["changed_event"]["kind"], ["comment_edited"])
        self.assertEqual(changed["changed_event"]["changed_comment_ids"], [101])
        self.assertNotEqual(prior["source_revision"],
                            changed["snapshot"]["source_revision"])

    def test_new_human_comment_identified_by_stable_id(self):
        prior = initial()
        changed = compare_issue_context(
            prior, observation(comments=[comment(102), comment(101)]))
        self.assertEqual(changed["changed_event"]["kind"], ["comment_added"])
        self.assertEqual(changed["changed_event"]["changed_comment_ids"], [102])

    def test_bot_and_self_generated_comments_do_not_trigger(self):
        prior = initial()
        for author in ("github-actions[bot]", "dependabot[bot]",
                       "Jagports-Lead-Agent", "CustomAutomation[bot]"):
            with self.subTest(author=author):
                result = compare_issue_context(prior, observation(
                    comments=[comment(101), comment(102, author=author,
                                                    body="automated update")]))
                self.assertEqual(result["status"], "unchanged")
                self.assertIsNone(result["changed_event"])
                self.assertEqual(result["snapshot"]["source_revision"],
                                 prior["source_revision"])

    def test_custom_ignored_identity_prevents_self_feedback(self):
        prior = initial()
        result = compare_issue_context(
            prior, observation(comments=[
                comment(101),
                comment(102, author="InternalAgent", body="automated note")]),
            ignored_authors=("internalagent",))
        self.assertEqual(result["status"], "unchanged")
        self.assertEqual(result["snapshot"]["source_revision"],
                         prior["source_revision"])

    def test_editing_existing_bot_comment_does_not_trigger(self):
        prior = initial(comments=[
            comment(101),
            comment(102, author="github-actions[bot]", body="first")])
        result = compare_issue_context(prior, observation(comments=[
            comment(101),
            comment(102, author="github-actions[bot]", body="second",
                    updated_at=LATER)]))
        self.assertEqual(result["status"], "unchanged")
        self.assertEqual(result["snapshot"]["source_revision"],
                         prior["source_revision"])

    def test_timestamp_only_comment_updates_and_fetch_time_do_not_trigger(self):
        prior = initial()
        result = compare_issue_context(
            prior, observation(comments=[comment(101, updated_at=LATER)],
                               fetched_at=LATER))
        self.assertEqual(result["status"], "unchanged")
        self.assertIsNone(result["changed_event"])
        self.assertEqual(result["snapshot"]["source_revision"],
                         prior["source_revision"])
        self.assertEqual(result["snapshot"]["comments"]["101"]["updated_at"],
                         LATER)

    def test_comment_order_does_not_change_source_revision(self):
        entries = [comment(102), comment(101)]
        first = compare_issue_context(None, observation(comments=entries))
        second = compare_issue_context(
            first["snapshot"], observation(comments=list(reversed(entries)),
                                           fetched_at=LATER))
        self.assertEqual(second["status"], "unchanged")
        self.assertEqual(first["snapshot"]["source_revision"],
                         second["snapshot"]["source_revision"])

    def test_multiple_kinds_have_stable_order_and_sorted_comment_ids(self):
        prior = initial()
        result = compare_issue_context(prior, observation(
            title="Changed title", body="Changed body", state="closed",
            comments=[comment(103), comment(101, body="edited"), comment(102)]))
        event = result["changed_event"]
        self.assertEqual(event["kind"],
                         ["closed", "title_changed", "body_changed",
                          "comment_added", "comment_edited"])
        self.assertEqual(event["changed_comment_ids"], [101, 102, 103])
        self.assertEqual(event["source_revision"],
                         result["snapshot"]["source_revision"])

    def test_close_reopen_retains_existing_lifecycle_events(self):
        prior = initial()
        closed = compare_issue_context(
            prior, observation(state="closed", comments=[comment(101)]))
        self.assertEqual(closed["changed_event"]["kind"], ["closed"])
        reopened = compare_issue_context(
            closed["snapshot"], observation(comments=[comment(101)]))
        self.assertEqual(reopened["changed_event"]["kind"], ["reopened"])

    def test_truncated_or_failed_retrieval_cannot_advance_baseline(self):
        prior = initial()
        for status in ("truncated", "retryable_error", "permanent_error"):
            with self.subTest(status=status):
                result = compare_issue_context(
                    prior, {"status": status, "issue_number": 42,
                            "context_or_error": {"reason": "private"}})
                self.assertEqual(result["status"], "blocked")
                self.assertEqual(result["reason"], "retrieval_incomplete")
                self.assertIsNone(result["snapshot"])
                self.assertIsNone(result["changed_event"])
                self.assertNotIn("private", str(result))

    def test_selected_comments_cannot_masquerade_as_full_baseline(self):
        prior = initial()
        selected = observation(comments=[comment(101)],
                               comment_scope="selected",
                               total_comment_count=88)
        result = compare_issue_context(prior, selected)
        self.assertEqual(result["status"], "blocked")
        self.assertEqual(result["reason"], "comment_coverage_incomplete")
        self.assertIsNone(result["snapshot"])

    def test_comment_count_mismatch_blocks_incomplete_pagination(self):
        prior = initial()
        result = compare_issue_context(prior, observation(
            comments=[comment(101)], total_comment_count=3))
        self.assertEqual(result["reason"], "comment_coverage_incomplete")

    def test_missing_human_comment_blocks_instead_of_silent_deletion(self):
        prior = initial(comments=[comment(101), comment(102)])
        result = compare_issue_context(prior, observation(comments=[comment(101)]))
        self.assertEqual(result["status"], "blocked")
        self.assertEqual(result["reason"], "human_comment_disappeared")
        self.assertIsNone(result["snapshot"])
        self.assertIsNone(result["changed_event"])

    def test_mismatched_or_duplicate_comment_provenance_is_blocked(self):
        prior = initial()
        duplicate = observation(comments=[comment(101), comment(101)])
        foreign = observation(comments=[comment(101, issue=43)])
        for retrieval in (duplicate, foreign):
            with self.subTest(retrieval=retrieval):
                result = compare_issue_context(prior, retrieval)
                self.assertEqual(result["status"], "blocked")
                self.assertEqual(result["reason"], "comment_provenance_invalid")

    def test_corrupted_previous_revision_cannot_be_reused(self):
        prior = initial()
        bad = copy.deepcopy(prior)
        bad["source_revision"] = "sha256:" + "0" * 64
        result = compare_issue_context(
            bad, observation(comments=[comment(101)]))
        self.assertEqual(result["status"], "blocked")
        self.assertEqual(result["reason"], "previous_snapshot_invalid")

    def test_previous_snapshot_for_other_issue_cannot_be_reused(self):
        prior = initial()
        result = compare_issue_context(
            prior, observation(issue=43, comments=[comment(101, issue=43)]))
        self.assertEqual(result["status"], "blocked")
        self.assertEqual(result["reason"], "previous_snapshot_invalid")

    def test_unexpected_new_flag_on_existing_snapshot_is_blocked(self):
        prior = initial()
        result = compare_issue_context(
            prior, observation(comments=[comment(101)]),
            newly_observed=True)
        self.assertEqual(result["reason"], "previous_snapshot_invalid")

    def test_malformed_or_opaque_issue_provenance_is_not_accepted(self):
        prior = initial()
        bad = observation(comments=[comment(101)])
        bad["context_or_error"]["url"] = "https://github.com/jagports/jagports/pull/42"
        self.assertEqual(
            compare_issue_context(prior, bad)["reason"], "issue_identity_invalid")
        bad2 = observation(comments=[comment(101)])
        bad2["context_or_error"]["is_pull_request"] = True
        self.assertEqual(
            compare_issue_context(prior, bad2)["reason"], "issue_identity_invalid")

    def test_invalid_datetime_cannot_silently_promote_comment(self):
        prior = initial()
        result = compare_issue_context(prior, observation(
            comments=[comment(101, updated_at="2026-09-23T01:00:00")]))
        self.assertEqual(result["status"], "blocked")
        self.assertIsNone(result["snapshot"])

    def test_snapshot_contains_only_hashes_not_raw_comment_text(self):
        result = compare_issue_context(None, observation(
            title="Private working title",
            body="Potentially sensitive evidence",
            comments=[comment(101, body="Sensitive source text")]))
        raw = str(result["snapshot"])
        for secret in ("Private working title", "Potentially sensitive evidence",
                       "Sensitive source text"):
            self.assertNotIn(secret, raw)
        self.assertTrue(result["snapshot"]["source_revision"].startswith("sha256:"))


if __name__ == "__main__":
    unittest.main()

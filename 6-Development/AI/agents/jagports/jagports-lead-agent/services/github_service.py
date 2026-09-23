"""Read-only GitHub Issue snapshots and bounded, explicitly selected detail.

GHD-A1 filters pull requests using existing Issues-list metadata. GHD-A2
fetches only an explicitly selected Issue and needed comments. Metrics count
logical PyGithub GET operations, NOT verified HTTP requests: PyGithub paginates
and may perform extra requests. A strict on-wire cap is a separate gate.
"""
from datetime import datetime, timedelta, timezone

from github import Github, Auth


class GitHubService:
    def __init__(self, token, repository):
        self.github = Github(auth=Auth.Token(token))
        self.repo = self.github.get_repo(repository)
        self.filtered_prs = 0
        self.filtered_pr_numbers = set()
        self._metrics = self._new_metrics()

    @staticmethod
    def _new_metrics():
        return {"issue_list_calls": 0, "issue_detail_gets": 0,
                "comment_list_gets": 0, "comment_id_gets": 0,
                "logical_get_operations": 0, "fetched_text_chars": 0,
                "http_requests_verified": False}

    def _record_get(self, kind):
        # Also support mock-backed tests that skip __init__.
        if not hasattr(self, "_metrics"):
            self._metrics = self._new_metrics()
        self._metrics[kind] += 1
        self._metrics["logical_get_operations"] += 1

    def request_metrics(self):
        """A copy; these logical counts are not an enforced HTTP request cap."""
        if not hasattr(self, "_metrics"):
            self._metrics = self._new_metrics()
        return dict(self._metrics)

    @staticmethod
    def _is_pull_request(issue):
        data = issue.raw_data
        if not isinstance(data, dict):
            raise ValueError("GitHub Issue/PR metadata is incomplete.")
        # A present marker classifies the record as a PR, even if malformed.
        return "pull_request" in data

    def get_issues(self):
        """Return only Issues and record PR IDs for legacy state migration."""
        issues = []
        self.filtered_prs = 0
        self.filtered_pr_numbers = set()
        self._record_get("issue_list_calls")
        for issue in self.repo.get_issues(state="all"):
            if self._is_pull_request(issue):
                self.filtered_prs += 1
                self.filtered_pr_numbers.add(int(issue.number))
                continue
            issues.append({
                "number": issue.number,
                "title": issue.title,
                "state": issue.state,
                "updated_at": issue.updated_at.isoformat(),
            })
        return issues

    @staticmethod
    def _error_status(exc):
        # A missing/deleted Issue or comment is not a transient lookup error.
        return ("permanent_error" if getattr(exc, "status", None) in (404, 410)
                else "retryable_error")

    @staticmethod
    def _comment_context(comment, number, *, max_comment_chars, cutoff):
        """Return a bounded comment and its provenance, or a truncation reason."""
        data = comment.raw_data
        if not isinstance(data, dict):
            raise ValueError("Comment metadata is incomplete.")
        issue_url = "https://api.github.com/repos/jagports/jagports/issues/" + str(number)
        # A selected comment from another Issue must never become evidence.
        if data.get("issue_url") != issue_url:
            raise ValueError("Comment does not have verified Issue provenance.")
        updated = comment.updated_at
        if updated is None or updated.tzinfo is None:
            raise ValueError("Comment revision timestamp is missing.")
        if updated < cutoff:
            return None, "comment_age"
        if not isinstance(comment.id, int) or isinstance(comment.id, bool):
            raise ValueError("Comment ID is missing.")
        author = comment.user.login if comment.user is not None else "deleted"
        body = comment.body or ""
        if not isinstance(body, str):
            raise ValueError("Comment body is invalid.")
        result = {
            "id": comment.id, "url": comment.html_url,
            "author": author,
            "created_at": comment.created_at.isoformat(),
            "updated_at": updated.isoformat(),
            "body": body[:max_comment_chars],
        }
        return result, ("comment_body_limit" if len(body) > max_comment_chars
                        else None)

    def get_issue_context(self, number, *, selected_comment_ids=None,
                          max_body_chars=4000, max_comments=4,
                          max_comment_chars=1000, max_comment_age_days=365,
                          max_detail_requests=1):
        """Return a RetrievalOutcome, never silently complete partial evidence.

        Fetch is lazy: only the caller-selected Issue is retrieved. If a
        selected_comment_ids list is given, fetch exactly those comment IDs.
        Otherwise read all comments only when the server's comment count fits
        the approved bound; do not page through an unbounded discussion.
        """
        if not hasattr(self, "_detail_requests"):
            self._detail_requests = 0
        if not isinstance(number, int) or isinstance(number, bool) or number < 1:
            raise ValueError("A positive explicit Issue number is required.")
        if (type(max_body_chars) is not int or max_body_chars < 1 or
                type(max_comments) is not int or not 0 <= max_comments <= 20 or
                type(max_comment_chars) is not int or max_comment_chars < 1 or
                type(max_comment_age_days) is not int or max_comment_age_days < 0 or
                type(max_detail_requests) is not int or max_detail_requests < 1):
            raise ValueError("Invalid bounded Issue retrieval limits.")
        if selected_comment_ids is not None and (
                not isinstance(selected_comment_ids, (list, tuple)) or
                any(type(v) is not int or v < 1 for v in selected_comment_ids) or
                len(set(selected_comment_ids)) != len(selected_comment_ids)):
            raise ValueError("Selected comment IDs must be unique positive integers.")

        url = "https://github.com/jagports/jagports/issues/" + str(number)

        def failure(status, reason, exc=None):
            value = {"reason": reason, "url": url}
            if exc is not None:
                value["error_type"] = type(exc).__name__
            return {"status": status, "issue_number": number,
                    "context_or_error": value}

        if self._detail_requests >= max_detail_requests:
            return failure("permanent_error", "per_run_issue_detail_limit")
        self._detail_requests += 1
        self._record_get("issue_detail_gets")
        try:
            issue = self.repo.get_issue(number)
        except Exception as exc:
            return failure(self._error_status(exc), "issue_lookup_failed", exc)
        try:
            if self._is_pull_request(issue):
                return failure("permanent_error", "pull_request_excluded")
            if issue.number != number or type(issue.comments) is not int or issue.comments < 0:
                return failure("retryable_error", "invalid_issue_metadata")
            body = issue.body or ""
            if not isinstance(body, str):
                return failure("retryable_error", "invalid_issue_body")
            title = issue.title
            if not isinstance(title, str) or not isinstance(issue.html_url, str):
                return failure("retryable_error", "invalid_issue_identity")
            labels = [label.name for label in issue.labels]
            if any(not isinstance(label, str) for label in labels):
                return failure("retryable_error", "invalid_issue_labels")
            self._metrics["fetched_text_chars"] += len(title) + len(body)
            reasons = []
            if len(body) > max_body_chars:
                reasons.append("issue_body_limit")
            context = {
                "number": issue.number, "title": title,
                "state": issue.state, "body": body[:max_body_chars],
                "labels": labels, "url": issue.html_url,
                "comments": [], "truncated": False,
                "fetched_at": datetime.now(timezone.utc).isoformat(),
                "comment_scope": "selected" if selected_comment_ids is not None else "all",
                "total_comment_count": issue.comments,
            }

            ids = selected_comment_ids
            if ids is not None and len(ids) > max_comments:
                reasons.append("selected_comment_limit")
                ids = []  # No partial selection presented as complete.
            elif ids is None and issue.comments > max_comments:
                reasons.append("comment_count_limit")
                ids = []  # Do not load the oldest page and call it complete.

            cutoff = datetime.now(timezone.utc) - timedelta(days=max_comment_age_days)
            comments = []
            if ids is not None:
                for comment_id in ids:
                    self._record_get("comment_id_gets")
                    try:
                        comments.append(self.repo.get_issue_comment(comment_id))
                    except Exception as exc:
                        return failure(self._error_status(exc),
                                       "selected_comment_lookup_failed", exc)
            elif issue.comments:
                # max_comments <= 20 keeps a complete, small discussion within
                # one ordinary PyGithub page; iteration is still bounded.
                self._record_get("comment_list_gets")
                try:
                    for idx, comment in enumerate(issue.get_comments()):
                        if idx >= max_comments:
                            reasons.append("comment_count_changed_during_fetch")
                            break
                        comments.append(comment)
                except Exception as exc:
                    return failure(self._error_status(exc),
                                   "comments_page_failed", exc)
                if len(comments) != issue.comments:
                    reasons.append("comment_count_changed_during_fetch")

            for comment in comments:
                try:
                    item, reason = self._comment_context(
                        comment, number, max_comment_chars=max_comment_chars,
                        cutoff=cutoff)
                except (AttributeError, TypeError, ValueError) as exc:
                    return failure("retryable_error", "comment_provenance_incomplete", exc)
                if item is not None:
                    context["comments"].append(item)
                    self._metrics["fetched_text_chars"] += len(comment.body or "")
                if reason:
                    reasons.append(reason)
            context["truncated"] = bool(reasons)
            if reasons:
                context["truncation_reasons"] = sorted(set(reasons))
            return {"status": "truncated" if reasons else "complete",
                    "issue_number": number, "context_or_error": context}
        except Exception as exc:
            return failure(self._error_status(exc), "issue_detail_failed", exc)

"""Read-only GitHub collection and bounded, source-verified P7 pilot retrieval."""
from datetime import datetime, timezone
from urllib.parse import quote

from github import Github, Auth


class GitHubService:
    def __init__(self, token, repository):
        if repository != "jagports/jagports":
            raise ValueError("P7 pilot is restricted to jagports/jagports.")
        self.github = Github(auth=Auth.Token(token))
        self.repo = self.github.get_repo(repository)
        self.filtered_prs = 0

    @staticmethod
    def _is_pr(issue):
        # Inspect only metadata already in the retrieved Issue API result.
        # Full Increment A must separately verify PyGithub paging/request costs.
        payload = issue.raw_data
        if not isinstance(payload, dict):
            raise ValueError("Issue/PR metadata is incomplete.")
        return "pull_request" in payload

    def get_issues(self):
        issues = []
        self.filtered_prs = 0
        for issue in self.repo.get_issues(state="all"):
            if self._is_pr(issue):
                self.filtered_prs += 1
                continue
            issues.append({
                "number": issue.number, "title": issue.title,
                "state": issue.state,
                "updated_at": issue.updated_at.isoformat(),
            })
        return issues

    def get_issue_context(self, number, max_body_chars=4000, max_comments=4,
                          max_comment_chars=1000):
        if not isinstance(number, int) or number < 1:
            raise ValueError("A positive approved Issue number is required.")
        issue = self.repo.get_issue(number)
        if self._is_pr(issue):
            raise ValueError("Pull requests cannot enter the P7 Issue pilot.")
        if max_body_chars < 1 or max_comments < 0 or max_comment_chars < 1:
            raise ValueError("Invalid source retrieval bounds.")
        body = issue.body or ""
        truncated = len(body) > max_body_chars
        comments = []
        # A pilot with more comments than the approved bound is INCOMPLETE:
        # do not treat the oldest page as the current full conversation.
        if issue.comments > max_comments:
            truncated = True
        else:
            for comment in issue.get_comments():
                author = comment.user.login if comment.user else "unknown"
                if (author.endswith("[bot]") or
                        getattr(comment.user, "type", "") == "Bot"):
                    continue
                text = comment.body or ""
                truncated |= len(text) > max_comment_chars
                comments.append({
                    "id": comment.id,
                    "url": comment.html_url,
                    "author": author,
                    "created_at": comment.created_at.isoformat(),
                    "updated_at": comment.updated_at.isoformat(),
                    "body": text[:max_comment_chars],
                })
                if len(comments) > max_comments:
                    truncated = True
                    break
        return {
            "number": issue.number, "title": issue.title[:500],
            "state": issue.state, "body": body[:max_body_chars],
            "url": issue.html_url, "labels": [label.name for label in issue.labels][:20],
            "comments": comments[:max_comments], "truncated": bool(truncated),
            "fetched_at": datetime.now(timezone.utc).isoformat(),
        }

    def read_approved_sources(self, paths, max_files=2, max_chars=3500):
        if not isinstance(paths, list) or len(paths) > max_files:
            raise ValueError("Too many source files for the approved pilot.")
        sources = []
        for path in paths:
            if (not isinstance(path, str) or ".." in path.split("/") or
                    not (path.startswith("7-Research/") or
                         path.startswith("0-DocumentationEducationCompetense/") or
                         path.startswith("00-Management/") or path == "KNOWLEDGE.md")):
                raise ValueError("Source path is outside approved repository areas.")
            if not path.endswith(".md"):
                raise ValueError("Only Markdown evidence or guidance may be loaded.")
            content = self.repo.get_contents(path, ref="main")
            if isinstance(content, list):
                raise ValueError("A source must identify one file, not a directory.")
            decoded = content.decoded_content.decode("utf-8")
            sources.append({
                "id": str(content.sha), "path": path,
                "url": content.html_url or
                       "https://github.com/jagports/jagports/blob/main/" + quote(path, safe="/"),
                "text": decoded[:max_chars], "truncated": len(decoded) > max_chars,
                "retrieved_at": datetime.now(timezone.utc).isoformat(),
                "kind": "repository",
            })
        return sources

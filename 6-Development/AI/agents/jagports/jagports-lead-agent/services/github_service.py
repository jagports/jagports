"""GitHub Issue snapshots; never treat pull requests as Issues.

The GitHub Issues listing includes pull requests. Its already-returned raw_data
contains a "pull_request" marker for those records; do not access PyGithub's
lazy issue.pull_request property (which may request another API endpoint).
"""


from github import Github, Auth


class GitHubService:

    def __init__(self, token, repository):
        self.github = Github(
            auth=Auth.Token(token)
        )
        self.repo = self.github.get_repo(repository)
        self.filtered_prs = 0
        self.filtered_pr_numbers = set()

    @staticmethod
    def _is_pull_request(issue):
        data = issue.raw_data
        if not isinstance(data, dict):
            raise ValueError("GitHub Issue/PR metadata is incomplete.")
        # A present marker classifies the record as a PR, including a
        # malformed/null marker: never promote an ambiguous record to Issue.
        return "pull_request" in data

    def get_issues(self):
        """Return only Issues and record PR IDs for legacy state migration."""
        issues = []
        self.filtered_prs = 0
        self.filtered_pr_numbers = set()

        # Keep one paginated Issues listing, no extra calls per PR.
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

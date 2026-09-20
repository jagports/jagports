from github import Github, Auth


class GitHubService:

    def __init__(self, token, repository):
        self.github = Github(
            auth=Auth.Token(token)
        )

        self.repo = self.github.get_repo(
            repository
        )


    def get_issues(self):

        issues = []

        for issue in self.repo.get_issues(
            state="all"
        ):

            issues.append({
                "number": issue.number,
                "title": issue.title,
                "state": issue.state,
                "updated_at":
                    issue.updated_at.isoformat()
            })

        return issues


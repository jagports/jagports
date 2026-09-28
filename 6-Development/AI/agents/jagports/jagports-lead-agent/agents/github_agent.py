class GitHubAgent:

    def __init__(self, github_service):
        self.github = github_service


    def collect(self):

        return self.github.get_issues()


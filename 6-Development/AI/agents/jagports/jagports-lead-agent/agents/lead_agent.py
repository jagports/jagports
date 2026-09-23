from core import events
from core.event import Event

from services import state_service

from agents.agent_registry import AgentRegistry
from agents.github_agent import GitHubAgent
from agents.documentation_agent import DocumentationAgent
from agents.deployment_agent import DeploymentAgent
from agents.knowledge_agent import KnowledgeAgent

class LeadAgent:

    def __init__(self, github_service):
        self.github = GitHubAgent(github_service)

        self.registry = AgentRegistry()

        self.registry.register(
            DocumentationAgent()
        )

        self.registry.register(
            DeploymentAgent()
        )

        self.registry.register(
            KnowledgeAgent()
        )

    def run(self):

        issues = self.github.collect()

        old_state = state_service.load_state()

        # Legacy snapshots contain PRs because GitHub's Issues endpoint also
        # returns them. Remove only PR numbers actually classified in this
        # collection before computing lifecycle deltas. In a PR-only legacy
        # snapshot, the resulting empty baseline prevents a false historical
        # "new Issue" flood. The next saved snapshot is Issue-only.
        filtered_pr_numbers = getattr(self.github.github,
                                      "filtered_pr_numbers", set())
        if filtered_pr_numbers and isinstance(old_state.get("issues"), dict):
            excluded = {str(number) for number in filtered_pr_numbers}
            old_state = dict(old_state)
            old_state["issues"] = {
                key: value for key, value in old_state["issues"].items()
                if str(key) not in excluded
            }

        issue_state = {}

        for issue in issues:
            issue_state[str(issue["number"])] = issue


        changes = state_service.compare_issues(
            old_state,
            issue_state
        )

        state_service.save_state(
            {
                "issues": issue_state,
                "changes": changes,
                "change_detected":
                    events.has_changes(changes)
            }
        )

        event = Event(
            "issue.lifecycle.changed",
            changes,
            {
                "issues": issues
            }
        )

        documentation_results = self.registry.analyse_all(
            event
        )

        return issues, event, documentation_results

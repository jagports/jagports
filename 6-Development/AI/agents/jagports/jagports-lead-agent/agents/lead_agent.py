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

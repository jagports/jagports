"""Lead Agent: deterministic by default, explicitly gated P7 advisory dispatch."""
from core import events
from core.event import Event
from core.result import AgentResult
from services import state_service

from agents.agent_registry import AgentRegistry
from agents.github_agent import GitHubAgent
from agents.documentation_agent import DocumentationAgent
from agents.deployment_agent import DeploymentAgent
from agents.knowledge_agent import KnowledgeAgent


class LeadAgent:
    def __init__(self, github_service, p7_pilot=None, p7_event_source=None):
        self.github = GitHubAgent(github_service)
        self.p7_pilot = p7_pilot
        self.p7_event_source = p7_event_source

        self.registry = AgentRegistry()
        self.registry.register(DocumentationAgent())
        self.registry.register(DeploymentAgent())
        self.registry.register(KnowledgeAgent())

    def run(self):
        issues = self.github.collect()
        old_state = state_service.load_state()
        issue_state = {str(issue["number"]): issue for issue in issues}
        changes = state_service.compare_issues(old_state, issue_state)

        # Preserve the existing lifecycle report regardless of dispatch mode.
        # #904 must separately persist its pending meaningful-change event before
        # advancing its own cursor; this legacy snapshot is NOT a P7 trigger.
        state_service.save_state({
            "issues": issue_state,
            "changes": changes,
            "change_detected": events.has_changes(changes),
        })
        event = Event("issue.lifecycle.changed", changes, {"issues": issues})

        if self.p7_pilot is None or not self.p7_pilot.config.get("enabled", False):
            return issues, event, self.registry.analyse_all(event)

        # Never synthesize a paid-work event from updated_at or lifecycle lists.
        # No matching #904 pending event means no model calls. In P7 mode the
        # deterministic specialists do not execute in parallel.
        if self.p7_event_source is None:
            results = [AgentResult(
                "p7_pilot", "blocked",
                "Approved #904 change-event source is not configured.",
                {"status": "missing_event_source"},
            )]
        else:
            try:
                pending = self.p7_event_source()
                if pending is None:
                    results = []
                else:
                    changed_event, issue_context = pending
                    results = self.p7_pilot.process(changed_event, issue_context)
            except (OSError, ValueError, TypeError, KeyError) as exc:
                results = [AgentResult(
                    "p7_pilot", "blocked",
                    "Approved #904 pending event is unavailable or invalid.",
                    {"status": "invalid_event_source",
                     "error_type": type(exc).__name__},
                )]

        # The report receives only the dispatch status, not secrets, complete
        # Issue bodies or untrusted retrieved text from the model context.
        event.context["p7"] = {
            "mode": "advisory",
            "event_source": "accepted_ghd_pending_event"
                            if self.p7_event_source else "missing",
            "result_count": len(results),
        }
        return issues, event, results

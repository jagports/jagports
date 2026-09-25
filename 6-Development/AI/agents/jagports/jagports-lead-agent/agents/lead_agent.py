from datetime import datetime

from core import events
from core.event import Event
from core.result import AgentResult

from services import state_service
from services.ghd_pending_store import GHDPendingStore, PendingStoreError

from agents.agent_registry import AgentRegistry
from agents.github_agent import GitHubAgent
from agents.documentation_agent import DocumentationAgent
from agents.deployment_agent import DeploymentAgent
from agents.knowledge_agent import KnowledgeAgent


class LeadAgent:
    """Deterministic coordinator plus model-free #904 Issue enrichment."""

    def __init__(self, github_service, ghd_store=None, enable_ghd=True,
                 p7_pilot=None, p7_event_source=None):
        self.github = GitHubAgent(github_service)
        self.p7_pilot = p7_pilot
        self.p7_event_source = p7_event_source
        self.ghd_store = (GHDPendingStore() if enable_ghd and ghd_store is None
                          else ghd_store)

        self.registry = AgentRegistry()
        self.registry.register(DocumentationAgent())
        self.registry.register(DeploymentAgent())
        self.registry.register(KnowledgeAgent())

    @staticmethod
    def _time(value):
        if not isinstance(value, str) or not value:
            return None
        try:
            parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return None
        return parsed if parsed.tzinfo is not None else None

    @classmethod
    def _candidate(cls, issues, changes, observed):
        """Choose at most one Issue for a lazy detail request.

        Lifecycle changes are considered first. Otherwise establish one missing
        baseline per run, then inspect only metadata whose updated_at is newer
        than the enrichment observation. Stable Issue number ordering makes
        restart behavior deterministic.
        """
        by_number = {int(issue["number"]): issue for issue in issues}
        lifecycle = set()
        for kind in ("new", "closed", "reopened"):
            lifecycle.update(int(number) for number in changes.get(kind, []))
        for number in sorted(lifecycle):
            if number in by_number:
                return number

        for number in sorted(by_number):
            if number not in observed:
                return number

        candidates = []
        for number, issue in by_number.items():
            current = cls._time(issue.get("updated_at"))
            previous = cls._time(observed[number].get("last_observed_at"))
            if current is None or previous is None:
                # Invalid candidate metadata is not silently interpreted as
                # changed; the legacy lifecycle report remains available.
                continue
            if current > previous:
                candidates.append(number)
        return min(candidates) if candidates else None

    def _enrich(self, issues, changes):
        """Replay first, otherwise fetch and persist at most one candidate."""
        if self.ghd_store is None:
            return {"status": "disabled"}, None
        try:
            pending = self.ghd_store.replay_pending()
            if pending is not None:
                return {"status": "pending", "pending_event": pending,
                        "retrieval": "replay"}, pending

            observed = self.ghd_store.observed_revisions()
            number = self._candidate(issues, changes, observed)
            if number is None:
                return {"status": "idle", "candidate": None,
                        "metrics": self.github.github.request_metrics()}, None

            retrieval = self.github.github.get_issue_context(
                number, max_detail_requests=1)
            result = self.ghd_store.record_observation(
                retrieval, newly_observed=number in set(changes.get("new", [])))
            status = result.get("status", "blocked")
            context = {
                "status": status, "candidate": number,
                "metrics": self.github.github.request_metrics(),
            }
            if status == "blocked":
                context["reason"] = result.get("reason", "enrichment_blocked")
            pending = result.get("pending_event")
            if pending is not None:
                context["pending_event"] = pending
            elif result.get("source_revision"):
                context["source_revision"] = result["source_revision"]
            return context, pending
        except PendingStoreError as exc:
            return {"status": "blocked", "reason": "pending_state_error",
                    "error_type": type(exc).__name__}, None
        except Exception as exc:
            # Deterministic lifecycle reporting must remain available, but an
            # enrichment failure never advances its cursor or becomes evidence.
            return {"status": "blocked", "reason": "enrichment_error",
                    "error_type": type(exc).__name__}, None

    def run(self):
        issues = self.github.collect()
        old_state = state_service.load_state()

        # Legacy snapshots contain PRs because GitHub's Issues endpoint also
        # returns them. Remove only PR numbers actually classified in this
        # collection before computing lifecycle deltas.
        filtered_pr_numbers = getattr(self.github.github,
                                      "filtered_pr_numbers", set())
        if filtered_pr_numbers and isinstance(old_state.get("issues"), dict):
            excluded = {str(number) for number in filtered_pr_numbers}
            old_state = dict(old_state)
            old_state["issues"] = {
                key: value for key, value in old_state["issues"].items()
                if str(key) not in excluded
            }

        issue_state = {
            str(issue["number"]): issue
            for issue in issues
        }
        changes = state_service.compare_issues(old_state, issue_state)

        # The model-free enrichment event/cursor is durably persisted before
        # any specialist sees it. Its files are independent from legacy state.
        ghd_context, pending = self._enrich(issues, changes)

        state_service.save_state({
            "issues": issue_state,
            "changes": changes,
            "change_detected": events.has_changes(changes),
        })

        event = Event(
            "issue.lifecycle.changed",
            changes,
            {"issues": issues, "ghd": ghd_context},
        )

        if self.p7_pilot is not None and self.p7_pilot.config.get("enabled", False):
            # P7 consumes only the versioned #904 producer. The normal
            # deterministic specialists do not run alongside paid roles.
            if self.p7_event_source is None:
                results = [AgentResult(
                    "p7_pilot", "blocked",
                    "Accepted #904 pending-event source is not configured.",
                    {"status": "missing_event_source"})]
            else:
                try:
                    selected = self.p7_event_source()
                    if selected is None:
                        results = []
                    else:
                        if isinstance(selected, dict):
                            if (selected.get("producer") != "ghd_increment_a" or
                                    selected.get("schema_version") != 1 or
                                    selected.get("status") != "pending"):
                                raise ValueError("Unverified GHD event")
                            changed_event = selected["changed_event"]
                            issue_context = selected["issue_context"]
                        else:
                            changed_event, issue_context = selected
                        results = self.p7_pilot.process(
                            changed_event, issue_context)
                except (OSError, ValueError, TypeError, KeyError,
                        PendingStoreError) as exc:
                    results = [AgentResult(
                        "p7_pilot", "blocked",
                        "Accepted #904 pending event is unavailable or invalid.",
                        {"status": "invalid_event_source",
                         "error_type": type(exc).__name__})]
            # Do not acknowledge the GHD outbox as merely processed: the
            # human-facing P7 report is persisted after LeadAgent.run returns.
            # The P7 role checkpoints prevent repeat billing on replay.
            event.context["p7"] = {
                "mode": "advisory", "event_source": (
                    "accepted_ghd_pending_event" if self.p7_event_source
                    else "missing"),
                "result_count": len(results), "pending_acknowledged": False,
            }
            return issues, event, results

        # Existing rule-based path remains the default with no model calls.
        # If analysis raises, pending stays unacknowledged for restart replay.
        documentation_results = self.registry.analyse_all(event)
        if pending is not None and self.ghd_store is not None:
            try:
                self.ghd_store.acknowledge(pending["event_key"])
                event.context["ghd"]["acknowledged"] = True
            except PendingStoreError as exc:
                event.context["ghd"]["acknowledged"] = False
                event.context["ghd"]["ack_error_type"] = type(exc).__name__

        return issues, event, documentation_results

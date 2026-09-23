"""Read-only, one-Issue P7 Research -> Product/Vehicle pilot orchestrator.

The coordinator never writes to GitHub, chooses priority, approves a proposal,
or silently retries an uncertain paid call. Research evidence stays in 7-Research.
"""
import hashlib
import json
from pathlib import Path

from agents.product_vehicle_agent import ProductVehicleAgent
from agents.research_agent import ResearchAgent
from core.event import Event
from core.result import AgentResult
from services.reasoning_service import _write_json_atomic


def issue_revision(context):
    source = {k: context[k] for k in
              ("number", "title", "body", "state", "labels", "comments")}
    return hashlib.sha256(json.dumps(source, sort_keys=True,
                                     ensure_ascii=False).encode("utf-8")).hexdigest()


def _result_from_dict(value):
    return AgentResult(value["agent"], value["severity"],
                       value["message"], value.get("data", {}))


def _public_sources(sources):
    return [{k: s[k] for k in ("id", "url", "path", "retrieved_at")
             if k in s} for s in sources]


class P7Pilot:
    def __init__(self, github_service, reasoning, config):
        self.github = github_service
        self.reasoning = reasoning
        self.config = dict(config)
        self.checkpoint_path = Path(self.config.get("checkpoint_file",
                                                     "state/p7_pilot.json"))
        self.research = ResearchAgent(reasoning)
        self.product_vehicle = ProductVehicleAgent(reasoning)

    def _load(self):
        try:
            with self.checkpoint_path.open(encoding="utf-8") as f:
                return json.load(f)
        except FileNotFoundError:
            return {}

    def _save(self, state):
        _write_json_atomic(self.checkpoint_path, state)

    @staticmethod
    def _blocked(message, data=None):
        return [AgentResult("p7_pilot", "blocked", message, data or {})]

    def _route(self, research, product):
        p = product.data
        if (research.data["confidence"] != "supported" or
                p["outcome"] != "validated"):
            route = "remain_research"
        elif p["decision_required"]:
            route = "human_decision_needed"
        else:
            route = "prepare_proposal"
        return AgentResult("team_lead", "review",
                           "Advisory route: " + route + "; no autonomous decision.",
                           {"route": route, "research_role_run_id":
                            research.data["role_run_id"],
                            "product_role_run_id": p["role_run_id"],
                            "requires_human_review": True})

    def process(self):
        c = self.config
        if not c.get("enabled", False):
            return []
        allowed = c.get("allowed_issue_numbers", [])
        if (not isinstance(allowed, list) or len(allowed) != 1 or
                not isinstance(allowed[0], int) or allowed[0] < 1):
            return self._blocked("Exactly one approved existing Issue is required.")
        if not c.get("read_only_credential_confirmed", False):
            return self._blocked("A separately verified read-only GitHub credential is required.")
        if not self.reasoning.config.get("enabled", False):
            return self._blocked("Paid reasoning is disabled pending explicit approval.")

        number = allowed[0]
        try:
            issue = self.github.get_issue_context(
                number, max_body_chars=int(c.get("max_issue_body_chars", 4000)),
                max_comments=int(c.get("max_comments", 4)),
                max_comment_chars=int(c.get("max_comment_chars", 1000)),
            )
        except Exception:
            return self._blocked("Approved Issue retrieval failed or the record is a PR.",
                                 {"issue_number": number, "status": "retryable_retrieval"})
        revision = issue_revision(issue)
        event_key = str(number) + ":" + revision
        if issue["truncated"]:
            return self._blocked("Issue context exceeds the approved limits.",
                                 {"issue_number": number, "source_revision": revision,
                                  "status": "truncated"})
        if c.get("approved_source_revision") != revision:
            return self._blocked("Exact source revision requires Product Owner approval.",
                                 {"issue_number": number, "url": issue["url"],
                                  "source_revision": revision,
                                  "status": "awaiting_revision_approval"})
        research_paths = c.get("approved_research_paths", [])
        domain_paths = c.get("approved_domain_paths", [])
        if (not research_paths or not domain_paths or
                set(research_paths) & set(domain_paths)):
            return self._blocked("Distinct approved research and domain evidence paths required.")
        try:
            research_sources = self.github.read_approved_sources(
                research_paths, max_files=2,
                max_chars=int(c.get("max_source_chars", 3500)))
            domain_sources = self.github.read_approved_sources(
                domain_paths, max_files=2,
                max_chars=int(c.get("max_source_chars", 3500)))
        except Exception:
            return self._blocked("Approved evidence retrieval failed.",
                                 {"issue_number": number, "status": "retryable_retrieval"})
        if (not research_sources or not domain_sources or
                any(s["truncated"] for s in research_sources + domain_sources) or
                {s["id"] for s in research_sources} &
                {s["id"] for s in domain_sources}):
            return self._blocked("Evidence is missing, truncated, or not independent.",
                                 {"issue_number": number, "source_revision": revision})
        research_sources = [
            {"id": "issue:" + str(number), "url": issue["url"],
             "text": issue["title"] + "\n" + issue["body"],
             "kind": "github_issue", "retrieved_at": issue["fetched_at"]}
        ] + research_sources

        saved = self._load()
        if saved.get("event_key") == event_key and saved.get("stage") == "complete":
            # No repeat model calls or repeated notifications on the same revision.
            return []
        if saved.get("event_key") != event_key:
            saved = {"event_key": event_key, "issue_number": number,
                     "url": issue["url"], "source_revision": revision,
                     "stage": "prepared"}
            self._save(saved)  # durable BEFORE any model request

        context = {
            "event_key": event_key, "source_revision": revision,
            "issue": {"number": number, "url": issue["url"],
                      "title": issue["title"], "state": issue["state"],
                      "body": issue["body"], "labels": issue["labels"],
                      "comments": issue["comments"]},
            "question": issue["title"], "research_sources": research_sources,
            "domain_sources": domain_sources,
        }
        event = Event("p7.approved.issue_revision", {"number": number}, context)
        results = []
        try:
            if "research" in saved:
                research = _result_from_dict(saved["research"])
            else:
                saved["stage"] = "research_started"
                self._save(saved)
                research = self.research.analyse(event)
                if research.data.get("status") != "complete":
                    return [research]
                saved["research"] = research.to_dict()
                saved["stage"] = "research_complete"
                self._save(saved)
            results.append(research)
            context["research_result"] = research

            if "product_vehicle" in saved:
                product = _result_from_dict(saved["product_vehicle"])
            else:
                saved["stage"] = "product_started"
                self._save(saved)
                product = self.product_vehicle.analyse(event)
                if product.data.get("status") != "complete":
                    return results + [product]
                saved["product_vehicle"] = product.to_dict()
                saved["stage"] = "product_complete"
                self._save(saved)
            results.append(product)
            route = self._route(research, product)
            results.append(route)
            saved["decision_route"] = route.to_dict()
            saved["stage"] = "complete"
            self._save(saved)
            return results
        except Exception as exc:
            # A possibly paid request remains reserved by ReasoningService.
            # Do not silently clear or replay its uncertain attempt.
            saved["stage"] = "needs_operator_review"
            saved["error_type"] = type(exc).__name__
            self._save(saved)
            return results + self._blocked(
                "Pilot stage failed; inspect redacted checkpoint and usage ledger.",
                {"issue_number": number, "source_revision": revision,
                 "error_type": type(exc).__name__})

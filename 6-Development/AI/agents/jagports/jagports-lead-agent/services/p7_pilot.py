"""Bounded, read-only P7 pilot consuming the shared ChangedIssueEvent/IssueContext.

The caller supplies #904's verified change event and bounded context. This
module neither enumerates Issues nor assumes that a pending #904 implementation
is deployed. Model execution remains explicitly disabled by default.
"""
import hashlib
import json
import os
from pathlib import Path

from agents.product_vehicle_agent import ProductVehicleAgent
from agents.research_agent import ResearchAgent
from core.event import Event
from core.result import AgentResult
from services.reasoning_service import _write_json_atomic


MEANINGFUL_KINDS = frozenset({
    "new", "closed", "reopened", "title_changed", "body_changed",
    "comment_added", "comment_edited",
})


def _result_from_dict(value):
    return AgentResult(value["agent"], value["severity"],
                       value["message"], value.get("data", {}))


class P7Pilot:
    """Exactly one allowlisted Issue/revision, at most two distinct role calls."""

    def __init__(self, github_service, reasoning, config):
        self.github = github_service
        self.reasoning = reasoning
        self.config = dict(config)
        self.checkpoint_path = Path(self.config.get(
            "checkpoint_file", "state/p7_pilot.json"))
        self.lock_path = Path(str(self.checkpoint_path) + ".lock")
        self.research = ResearchAgent(reasoning)
        self.product_vehicle = ProductVehicleAgent(reasoning)

    def _load(self):
        try:
            with self.checkpoint_path.open(encoding="utf-8") as handle:
                data = json.load(handle)
            if not isinstance(data, dict):
                raise ValueError("Pilot checkpoint is malformed.")
            return data
        except FileNotFoundError:
            return {}

    def _save(self, state):
        _write_json_atomic(self.checkpoint_path, state)

    @staticmethod
    def _blocked(message, data=None):
        return [AgentResult("p7_pilot", "blocked", message, data or {})]

    @staticmethod
    def _route(research, product):
        p = product.data
        if (research.data["confidence"] != "supported" or
                p["outcome"] != "validated"):
            route = "remain_research"
        elif p["decision_required"]:
            route = "human_decision_needed"
        else:
            route = "prepare_proposal"
        return AgentResult(
            "team_lead", "review",
            "Advisory route: " + route + "; no autonomous decision.",
            {"route": route,
             "source_revision": research.data["source_revision"],
             "research_role_run_id": research.data["role_run_id"],
             "product_role_run_id": p["role_run_id"],
             "requires_human_review": True, "approved": False},
        )

    def _acquire_lock(self):
        """Fail closed on competing/stale runs; stale locks need manual review."""
        self.lock_path.parent.mkdir(parents=True, exist_ok=True)
        fd = os.open(str(self.lock_path),
                     os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as handle:
                json.dump({"pid": os.getpid()}, handle)
                handle.flush()
                os.fsync(handle.fileno())
        except BaseException:
            self.lock_path.unlink(missing_ok=True)
            raise

    @staticmethod
    def _get_change(changed_event):
        """Accept the shared Event object or its serialized compact data."""
        if changed_event is None:
            return None
        if isinstance(changed_event, Event):
            data = changed_event.data
        elif isinstance(changed_event, dict):
            data = changed_event
        else:
            raise ValueError("ChangedIssueEvent is invalid.")
        if not isinstance(data, dict):
            raise ValueError("ChangedIssueEvent must contain compact data.")
        return data

    @staticmethod
    def _meaningful(change):
        kinds = change.get("kind", [])
        if isinstance(kinds, str):
            kinds = [kinds]
        if not isinstance(kinds, list) or any(k not in MEANINGFUL_KINDS
                                              for k in kinds):
            return False
        return bool(kinds)

    @staticmethod
    def _context_data(issue_context):
        """Accept IssueContext or complete RetrievalOutcome, never errors."""
        if not isinstance(issue_context, dict):
            return None
        if "status" in issue_context and "context_or_error" in issue_context:
            if issue_context["status"] != "complete":
                return None
            return issue_context["context_or_error"]
        return issue_context

    def _preflight(self, change, issue):
        c = self.config
        allowed = c.get("allowed_issue_numbers")
        if (not isinstance(allowed, list) or len(allowed) != 1 or
                type(allowed[0]) is not int or allowed[0] < 1):
            return "Exactly one approved existing Issue is required."
        if type(c.get("read_only_credential_confirmed")) is not bool or not c["read_only_credential_confirmed"]:
            return "Separately verified read-only GitHub credentials are required."
        if not self.reasoning.config.get("enabled", False):
            return "Paid reasoning requires explicit approval."
        if self.reasoning.config.get("max_calls_per_run") != 2:
            return "Pilot requires an explicitly configured two-call ceiling."
        if change.get("is_pull_request") is True or issue.get("is_pull_request", False):
            return "PRs cannot enter the Issue-only pilot."
        number = change.get("issue_number")
        if type(number) is not int or number != allowed[0] or issue.get("number") != number:
            return "The event does not identify the one approved Issue."
        revision = change.get("source_revision")
        if (not isinstance(revision, str) or not revision or
                c.get("approved_source_revision") != revision or
                issue.get("source_revision") != revision):
            return "Exact event/context revision requires Product Owner approval."
        if (not isinstance(issue.get("url"), str) or
                issue["url"] != "https://github.com/jagports/jagports/issues/" + str(number)):
            return "The canonical approved Issue URL does not match."
        if issue.get("truncated") or not isinstance(issue.get("body"), str) or not isinstance(issue.get("title"), str):
            return "Bounded Issue context is incomplete or truncated."
        if (not isinstance(issue.get("fetched_at"), str) or not issue["fetched_at"] or
                not isinstance(issue.get("labels"), list) or
                not isinstance(issue.get("comments"), list)):
            return "The accepted IssueContext fields are incomplete."
        if any(not isinstance(comment, dict) or
               not all(field in comment for field in
                       ("id", "url", "author", "created_at", "updated_at", "body"))
               for comment in issue["comments"]):
            return "Issue comments are missing required provenance."
        return None

    def _sources(self, issue, revision):
        c = self.config
        research_paths = c.get("approved_research_paths", [])
        domain_paths = c.get("approved_domain_paths", [])
        if (not isinstance(research_paths, list) or
                not isinstance(domain_paths, list) or
                not research_paths or not domain_paths or
                set(research_paths) & set(domain_paths)):
            return None
        research = self.github.read_approved_sources(
            research_paths, max_files=2,
            max_chars=int(c.get("max_source_chars", 3500)))
        domain = self.github.read_approved_sources(
            domain_paths, max_files=2,
            max_chars=int(c.get("max_source_chars", 3500)))
        if (not research or not domain or
                any(s.get("truncated") for s in research + domain) or
                {s["id"] for s in research} & {s["id"] for s in domain} or
                {s["url"] for s in research} & {s["url"] for s in domain}):
            return None
        return research, domain

    def process(self, changed_event=None, issue_context=None):
        """Never fetch an Issue to synthesize an approval or change event."""
        if not self.config.get("enabled", False):
            return []
        try:
            change = self._get_change(changed_event)
        except ValueError:
            return self._blocked("Invalid shared ChangedIssueEvent.")
        if change is None or not self._meaningful(change):
            return []  # first-run baseline and no-change: zero source/model requests
        issue = self._context_data(issue_context)
        if issue is None:
            return self._blocked(
                "Complete #904 IssueContext is required; retrieval must be replayed.",
                {"status": "incomplete_context"})
        if not isinstance(issue, dict):
            return self._blocked("Malformed IssueContext.")
        failure = self._preflight(change, issue)
        if failure:
            return self._blocked(failure)

        try:
            self._acquire_lock()
        except FileExistsError:
            return self._blocked("Pilot already running or stale lock requires manual review.",
                                 {"status": "locked"})
        try:
            return self._process_locked(change, issue)
        finally:
            self.lock_path.unlink(missing_ok=True)

    def _process_locked(self, change, issue):
        number = change["issue_number"]
        revision = change["source_revision"]
        event_key = str(number) + ":" + revision
        try:
            saved = self._load()
        except (ValueError, OSError, json.JSONDecodeError):
            return self._blocked("Checkpoint is unreadable; reconcile before proceeding.",
                                 {"status": "needs_operator_review"})
        if saved:
            if saved.get("event_key") != event_key:
                if saved.get("stage") != "complete":
                    return self._blocked(
                        "Previous revision is pending; reconcile before selecting a new revision.",
                        {"status": "needs_operator_review",
                         "pending_event_key": saved.get("event_key")})
            elif saved.get("stage") == "complete":
                return []
            elif saved.get("stage") in (
                    "research_started", "product_started",
                    "needs_operator_review"):
                return self._blocked(
                    "Potentially billed or interrupted role requires explicit reconciliation.",
                    {"status": "needs_operator_review", "stage": saved["stage"]})
            elif saved.get("stage") not in (
                    "prepared", "research_complete", "product_complete"):
                return self._blocked("Unknown checkpoint stage needs operator review.",
                                     {"status": "needs_operator_review"})

        if not saved or saved.get("event_key") != event_key:
            saved = {"event_key": event_key, "issue_number": number,
                     "url": issue["url"], "source_revision": revision,
                     "stage": "prepared", "model_calls_started": 0}
            self._save(saved)  # durable before any source or model request
        if (saved.get("source_revision") != revision or
                saved.get("issue_number") != number or
                saved.get("model_calls_started", 0) > 2):
            return self._blocked("Checkpoint identity or call count is inconsistent.",
                                 {"status": "needs_operator_review"})

        # A recorded result is replayed; an attempted but unrecorded model call
        # is never replayed, even if a later process has a new reasoning instance.
        if saved.get("stage") == "product_complete":
            if not saved.get("research") or not saved.get("product_vehicle"):
                return self._blocked("Checkpoint lacks one or both role results.",
                                     {"status": "needs_operator_review"})
            research = _result_from_dict(saved["research"])
            product = _result_from_dict(saved["product_vehicle"])
            return self._complete(saved, research, product)

        try:
            pair = self._sources(issue, revision)
        except Exception as exc:
            return self._blocked("Approved evidence retrieval failed.",
                                 {"status": "retryable_retrieval",
                                  "error_type": type(exc).__name__})
        if pair is None:
            return self._blocked("Research and domain evidence must be complete and distinct.",
                                 {"status": "insufficient_evidence"})
        research_sources, domain_sources = pair
        source_identity = [[{key: item.get(key) for key in
                             ("id", "url", "path", "text", "truncated", "kind")}
                            for item in group] for group in pair]
        source_fingerprint = hashlib.sha256(json.dumps(
            source_identity, sort_keys=True, ensure_ascii=False).encode("utf-8")).hexdigest()
        if saved.get("evidence_fingerprint") and saved["evidence_fingerprint"] != source_fingerprint:
            return self._blocked("Evidence changed between role checkpoints; review required.",
                                 {"status": "needs_operator_review"})
        if not saved.get("evidence_fingerprint"):
            saved["evidence_fingerprint"] = source_fingerprint
            self._save(saved)
        issue_source = {
            "id": "issue:" + str(number), "url": issue["url"],
            "text": issue["title"] + "\n" + issue["body"],
            "kind": "github_issue", "retrieved_at": issue["fetched_at"],
        }
        context = {
            "event_key": event_key, "source_revision": revision,
            "issue": issue, "question": issue["title"],
            "research_sources": [issue_source] + research_sources,
            "domain_sources": domain_sources,
        }
        event = Event("p7.approved.issue_revision", change, context)
        results = []

        if saved.get("research"):
            research = _result_from_dict(saved["research"])
            if (research.data.get("status") != "complete" or
                    research.data.get("source_revision") != revision or
                    research.data.get("request_outcome") != "complete"):
                return self._blocked("Stored Research result is not an accepted checkpoint.",
                                     {"status": "needs_operator_review"})
        else:
            if saved.get("model_calls_started", 0) != 0:
                return self._blocked("Research call history needs reconciliation.",
                                     {"status": "needs_operator_review"})
            saved["stage"] = "research_started"
            saved["model_calls_started"] = 1
            saved["research_request_key"] = event_key + ":research"
            self._save(saved)
            try:
                research = self.research.analyse(event)
            except Exception as exc:
                return self._uncertain(saved, exc, results)
            if research.data.get("status") != "complete":
                saved["stage"] = "needs_operator_review"
                self._save(saved)
                return [research] + self._blocked("Research attempt needs review.",
                                                  {"status": "needs_operator_review"})
            saved["research"] = research.to_dict()
            saved["stage"] = "research_complete"
            self._save(saved)
        results.append(research)
        context["research_result"] = research

        if saved.get("product_vehicle"):
            product = _result_from_dict(saved["product_vehicle"])
            if (product.data.get("status") != "complete" or
                    product.data.get("source_revision") != revision or
                    product.data.get("research_role_run_id") != research.data.get("role_run_id")):
                return results + self._blocked(
                    "Product checkpoint is inconsistent with Research.",
                    {"status": "needs_operator_review"})
        else:
            if saved.get("model_calls_started") != 1:
                return results + self._blocked(
                    "Two-call limit or role history cannot be verified.",
                    {"status": "needs_operator_review"})
            saved["stage"] = "product_started"
            saved["model_calls_started"] = 2
            saved["product_request_key"] = event_key + ":product_vehicle"
            self._save(saved)
            try:
                product = self.product_vehicle.analyse(event)
            except Exception as exc:
                return self._uncertain(saved, exc, results)
            if product.data.get("status") != "complete":
                saved["stage"] = "needs_operator_review"
                self._save(saved)
                return results + [product] + self._blocked(
                    "Product attempt needs review.", {"status": "needs_operator_review"})
            saved["product_vehicle"] = product.to_dict()
            saved["stage"] = "product_complete"
            self._save(saved)
        results.append(product)
        return self._complete(saved, research, product)

    def _complete(self, saved, research, product):
        if (research.data.get("role_run_id") == product.data.get("role_run_id") or
                product.data.get("research_role_run_id") != research.data.get("role_run_id")):
            return self._blocked("Role independence or identity could not be verified.",
                                 {"status": "needs_operator_review"})
        route = self._route(research, product)
        saved["decision_route"] = route.to_dict()
        saved["stage"] = "complete"
        self._save(saved)
        return [research, product, route]

    def _uncertain(self, saved, exc, results):
        saved["stage"] = "needs_operator_review"
        saved["error_type"] = type(exc).__name__
        self._save(saved)
        return results + self._blocked(
            "Potentially billed attempt; inspect durable checkpoint and ledger.",
            {"status": "needs_operator_review", "error_type": type(exc).__name__})

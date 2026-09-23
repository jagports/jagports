"""Batch 08: offline, mocked Product / Vehicle validation and routing tests."""
import unittest

from agents.product_vehicle_agent import ProductVehicleAgent
from agents.research_agent import ResearchAgent
from core.event import Event
from core.result import AgentResult
from services.p7_pilot import P7Pilot


def source(identifier, kind="repository", truncated=False):
    return {
        "id": identifier,
        "url": "https://github.com/jagports/jagports/blob/main/7-Research/" + identifier + ".md",
        "path": "7-Research/" + identifier + ".md",
        "kind": kind,
        "retrieved_at": "2026-09-23T00:00:00+00:00",
        "text": "Independent retrieved domain evidence for " + identifier,
        "truncated": truncated,
    }


def product_output(**changes):
    output = {
        "outcome": "validated",
        "rationale": "The checked domain record supports this draft.",
        "checked_source_ids": ["domain-a"],
        "conflicting_source_ids": [],
        "unresolved_questions": [],
        "draft_requirement": "Draft for Product Owner review only.",
        "decision_required": False,
    }
    output.update(changes)
    return output


def research_output(**changes):
    output = {
        "finding": "A source-backed finding for independent validation.",
        "confidence": "supported",
        "source_ids": ["research-a"],
        "contrary_source_ids": [],
        "limitations": [],
        "unresolved_questions": [],
        "recommended_action": "Seek independent domain validation.",
    }
    output.update(changes)
    return output


class MockReasoning:
    def __init__(self, research=None, product=None):
        self.outputs = {
            "research": research or research_output(),
            "product_vehicle": product or product_output(),
        }
        self.calls = []

    def analyse_json(self, role, instructions, context, request_key):
        self.calls.append((role, instructions, context, request_key))
        return {
            "output": self.outputs[role], "model": "mock-model",
            "usage": {"input_tokens": 120, "output_tokens": 28},
            "estimated_cost_usd": 0.00002,
            "provider_response_id": "mock-" + role,
        }


def event(domain=None, research=None, **extras):
    context = {
        "event_key": "42:sha-test",
        "source_revision": "sha-test",
        "question": "Does the domain evidence independently support this product claim?",
        "issue": {"number": 42, "url": "https://github.com/jagports/jagports/issues/42"},
        "research_sources": [source("research-a")],
        "domain_sources": [source("domain-a")] if domain is None else domain,
    }
    if research is not None:
        context["research_result"] = research
    context.update(extras)
    return Event("p7.approved.issue_revision", {"number": 42}, context)


def supported_research():
    return AgentResult("research", "review", "Source-backed finding.", {
        "status": "complete", "confidence": "supported",
        "request_outcome": "complete", "model": "mock-research",
        "usage": {"input_tokens": 100, "output_tokens": 20},
        "source_revision": "sha-test",
        "role_run_id": "research-role-42",
        "sources": [{
            "id": "research-a",
            "url": source("research-a")["url"],
            "path": source("research-a")["path"],
        }],
    })


class ProductVehicleContractTests(unittest.TestCase):
    def test_distinct_invocations_with_independent_evidence(self):
        mock = MockReasoning()
        start = event()
        research = ResearchAgent(mock).analyse(start)
        start.context["research_result"] = research
        product = ProductVehicleAgent(mock).analyse(start)
        self.assertEqual([call[0] for call in mock.calls],
                         ["research", "product_vehicle"])
        self.assertNotEqual(mock.calls[0][3], mock.calls[1][3])
        self.assertNotEqual(product.data["role_run_id"], research.data["role_run_id"])
        self.assertEqual(product.data["research_role_run_id"], research.data["role_run_id"])
        self.assertEqual(product.data["outcome"], "validated")
        self.assertEqual(product.data["checked_sources"][0]["id"], "domain-a")
        self.assertIn("domain-a", product.data["checked_sources"][0]["url"])
        self.assertEqual(product.data["usage"]["input_tokens"], 120)
        self.assertTrue(product.data["prompt_version"])
        self.assertFalse(product.data["approved"])
        self.assertTrue(product.data["requires_human_review"])
        self.assertIn("UNTRUSTED", mock.calls[1][1])

    def test_rejected_evidence_keeps_human_review_and_no_requirement(self):
        mock = MockReasoning(product=product_output(
            outcome="rejected", rationale="The retrieved domain document contradicts the claim.",
            draft_requirement="This must never be approved.",
        ))
        result = ProductVehicleAgent(mock).analyse(event(research=supported_research()))
        self.assertEqual(result.data["outcome"], "rejected")
        self.assertEqual(result.data["draft_requirement"], "")
        self.assertFalse(result.data["approved"])
        self.assertEqual(result.data["checked_sources"][0]["id"], "domain-a")

    def test_material_conflict_blocks_validation_and_retains_conflict_links(self):
        mock = MockReasoning(product=product_output(
            conflicting_source_ids=["domain-b"],
            unresolved_questions=["The production record and catalog disagree."],
            draft_requirement="Unsupported Jaguar VIN fitment claim.",
        ))
        result = ProductVehicleAgent(mock).analyse(event(
            research=supported_research(),
            domain=[source("domain-a"), source("domain-b")],
        ))
        self.assertEqual(result.data["outcome"], "needs_more_research")
        self.assertEqual(result.data["draft_requirement"], "")
        self.assertFalse(result.data["decision_required"])
        self.assertEqual(result.data["conflicting_sources"][0]["id"], "domain-b")
        self.assertIn("conflicts", " ".join(result.data["limitations"]))

    def test_conflicting_rejection_remains_unresolved(self):
        mock = MockReasoning(product=product_output(
            outcome="rejected", conflicting_source_ids=["domain-b"],
            unresolved_questions=["Sources disagree about vehicle fitment."],
        ))
        result = ProductVehicleAgent(mock).analyse(event(
            research=supported_research(),
            domain=[source("domain-a"), source("domain-b")],
        ))
        self.assertEqual(result.data["outcome"], "needs_more_research")
        self.assertEqual(result.data["conflicting_sources"][0]["id"], "domain-b")

    def test_provisional_research_prevents_unverified_fitment_requirement(self):
        research = supported_research()
        research.data["confidence"] = "provisional"
        mock = MockReasoning(product=product_output(
            draft_requirement="Unverified historical Jaguar VIN applies to this part.",
            decision_required=True,
        ))
        result = ProductVehicleAgent(mock).analyse(event(research=research))
        self.assertEqual(result.data["outcome"], "needs_more_research")
        self.assertEqual(result.data["draft_requirement"], "")
        self.assertFalse(result.data["approved"])
        self.assertFalse(result.data["decision_required"])

    def test_domain_source_must_be_retrieved_independently(self):
        mock = MockReasoning()
        result = ProductVehicleAgent(mock).analyse(event(
            research=supported_research(), domain=[source("research-a")],
        ))
        self.assertEqual(mock.calls, [])
        self.assertEqual(result.data["outcome"], "needs_more_research")
        self.assertEqual(result.data["request_outcome"], "not_invoked")
        self.assertIn("duplicates", " ".join(result.data["limitations"]))

    def test_truncated_domain_source_blocks_paid_call(self):
        mock = MockReasoning()
        result = ProductVehicleAgent(mock).analyse(event(
            research=supported_research(),
            domain=[source("domain-a", truncated=True)],
        ))
        self.assertEqual(result.data["outcome"], "needs_more_research")
        self.assertEqual(result.data["usage"]["input_tokens"], 0)
        self.assertEqual(mock.calls, [])

    def test_fabricated_citation_or_approval_field_fails_closed(self):
        mock = MockReasoning(product=product_output(checked_source_ids=["invented"]))
        with self.assertRaisesRegex(ValueError, "not retrieved"):
            ProductVehicleAgent(mock).analyse(event(research=supported_research()))
        mock = MockReasoning(product=product_output(approved_requirement="approve unknown VIN"))
        with self.assertRaisesRegex(ValueError, "approval fields"):
            ProductVehicleAgent(mock).analyse(event(research=supported_research()))

    def test_missing_independent_evidence_cannot_validate(self):
        mock = MockReasoning(product=product_output(checked_source_ids=[]))
        result = ProductVehicleAgent(mock).analyse(event(research=supported_research()))
        self.assertEqual(result.data["outcome"], "needs_more_research")
        self.assertEqual(result.data["draft_requirement"], "")
        self.assertIn("no checked", " ".join(result.data["limitations"]))

    def test_human_decision_routing_is_deterministic(self):
        mock = MockReasoning(product=product_output(decision_required=True))
        research = supported_research()
        product = ProductVehicleAgent(mock).analyse(event(research=research))
        route = P7Pilot._route(None, research, product)
        self.assertEqual(route.data["route"], "human_decision_needed")
        self.assertTrue(route.data["requires_human_review"])
        self.assertEqual(route.data["product_role_run_id"], product.data["role_run_id"])
        self.assertFalse(product.data["approved"])

    def test_unresolved_claim_routes_to_research_not_approval(self):
        mock = MockReasoning(product=product_output(
            unresolved_questions=["No independent fitment confirmation."],
            decision_required=True,
        ))
        research = supported_research()
        product = ProductVehicleAgent(mock).analyse(event(research=research))
        route = P7Pilot._route(None, research, product)
        self.assertEqual(route.data["route"], "remain_research")
        self.assertEqual(product.data["outcome"], "needs_more_research")
        self.assertEqual(product.data["draft_requirement"], "")

    def test_non_model_research_cannot_trigger_independent_validation(self):
        mock = MockReasoning()
        legacy = supported_research()
        legacy.data.pop("request_outcome")
        result = ProductVehicleAgent(mock).analyse(event(research=legacy))
        self.assertEqual(result.data["status"], "research_incomplete")
        self.assertEqual(mock.calls, [])

    def test_missing_or_wrong_revision_research_never_calls_model(self):
        mock = MockReasoning()
        bad = supported_research()
        bad.data["source_revision"] = "old-sha"
        result = ProductVehicleAgent(mock).analyse(event(research=bad))
        self.assertEqual(result.data["status"], "research_incomplete")
        self.assertEqual(mock.calls, [])


if __name__ == "__main__":
    unittest.main()

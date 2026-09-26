"""Original Documentation Agent opt-in and source-bound reasoning tests."""
import unittest

from agents.documentation_agent import DocumentationAgent
from core.event import Event


URL = "https://github.com/jagports/jagports/issues/42"
REVISION = "verified-revision"


class FakeReasoning:
    def __init__(self):
        self.calls = []

    def analyse_json(self, *args):
        self.calls.append(args)
        return {
            "output": {"summary": "Documentation changed.",
                       "recommendation": "Review the guide.",
                       "uncertainty": "Needs owner confirmation.",
                       "evidence_urls": [URL]},
            "usage": {"input_tokens": 20, "output_tokens": 10},
            "estimated_cost_usd": 0.001, "model": "mock",
        }


def changed(*, title="Documentation guide", truncated=False):
    pending = {"event_key": "42:" + REVISION,
               "issue_context": {"number": 42, "source_revision": REVISION,
                                 "url": URL, "title": title,
                                 "body": "Review the process.",
                                 "labels": ["documentation"],
                                 "comments": [], "truncated": truncated}}
    return Event("issue.lifecycle.changed",
                 {"new": [], "closed": [], "reopened": []},
                 {"ghd": {"pending_event": pending}})


class DocumentationReasoningTests(unittest.TestCase):
    def setUp(self):
        self.reasoning = FakeReasoning()
        self.config = {"enabled": True, "allowed_issue_numbers": [42],
                       "approved_source_revision": REVISION}

    def test_exact_approved_issue_invokes_original_specialist(self):
        result = DocumentationAgent(self.reasoning, self.config).analyse(changed())
        self.assertEqual(result.agent, "documentation")
        self.assertEqual(result.data["source_url"], URL)
        self.assertEqual(result.data["usage"]["input_tokens"], 20)
        self.assertEqual(len(self.reasoning.calls), 1)
        self.assertEqual(self.reasoning.calls[0][3], "42:" + REVISION + ":documentation")

    def test_disabled_unapproved_or_incomplete_input_spends_nothing(self):
        agent = DocumentationAgent(self.reasoning, self.config)
        agent.analyse(changed(truncated=True))
        agent.analyse(Event("issue.lifecycle.changed", {}, {"ghd": {}}))
        self.config["approved_source_revision"] = "different"
        agent.analyse(changed())
        self.assertEqual(self.reasoning.calls, [])

    def test_model_output_must_cite_supplied_issue(self):
        def invalid(*args):
            result = FakeReasoning.analyse_json(self.reasoning, *args)
            result["output"]["evidence_urls"] = ["https://unrelated.example/"]
            return result

        self.reasoning.analyse_json = invalid
        with self.assertRaisesRegex(ValueError, "source-bound"):
            DocumentationAgent(self.reasoning, self.config).analyse(changed())

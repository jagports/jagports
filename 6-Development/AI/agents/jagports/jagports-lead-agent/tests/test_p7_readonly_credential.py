"""Offline #909 host credential evidence checker regressions (no network)."""
import io
import json
import unittest
from unittest.mock import patch
from urllib.error import HTTPError

from scripts import verify_readonly_github as checker


class FakeResponse:
    def __init__(self, status, payload):
        self.status = status
        self.payload = payload

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, traceback):
        return False

    def read(self, limit):
        return json.dumps(self.payload).encode("utf-8")[:limit]


class SequenceOpener:
    def __init__(self, responses):
        self.responses = list(responses)
        self.methods = []
        self.data = []

    def __call__(self, request, timeout):
        self.methods.append(request.get_method())
        self.data.append(request.data)
        status, payload = self.responses.pop(0)
        if status >= 400:
            raise HTTPError(request.full_url, status, "redacted", {},
                            io.BytesIO(json.dumps(payload).encode("utf-8")))
        return FakeResponse(status, payload)


TOKEN = "EXAMPLE_TOKEN_DO_NOT_USE"
IDENTITY = (200, {"login": "readonly-bot"})
ISSUE = (200, {"number": 904})


class ReadonlyCredentialTests(unittest.TestCase):
    def test_main_uses_only_new_readonly_token_variable(self):
        with patch.dict("os.environ", {"GITHUB_TOKEN_RO": TOKEN,
                                    "JAGPORTS_READONLY_GITHUB_TOKEN": "LEGACY_UNUSED"}, clear=True):
            with patch.object(checker, "verify", return_value={"result": "verified"}) as verify_mock:
                with patch("sys.stdout", new_callable=io.StringIO):
                    self.assertEqual(checker.main(), 0)
                verify_mock.assert_called_once_with(TOKEN)

    def test_main_does_not_fallback_to_legacy_or_operator_token(self):
        with patch.dict("os.environ", {"GITHUB_TOKEN": TOKEN,
                                    "JAGPORTS_READONLY_GITHUB_TOKEN": TOKEN}, clear=True):
            with patch.object(checker, "verify", return_value={"result": "blocked"}) as verify_mock:
                with patch("sys.stdout", new_callable=io.StringIO):
                    self.assertEqual(checker.main(), 2)
                verify_mock.assert_called_once_with("")

    def test_permission_denial_produces_redacted_evidence(self):
        opener = SequenceOpener([
            IDENTITY, ISSUE, (403, {
                "message": "Resource not accessible by personal access token",
                "secret": TOKEN,
            })])
        evidence = checker.verify(TOKEN, opener=opener)
        self.assertEqual(evidence["result"], "verified")
        self.assertTrue(evidence["identity_authenticated"])
        self.assertTrue(evidence["issue_read"])
        self.assertTrue(evidence["issue_comment_write_denied"])
        self.assertEqual(opener.methods, ["GET", "GET", "POST"])
        self.assertEqual(opener.data, [None, None, b'{"body":""}'])
        self.assertNotIn(TOKEN, json.dumps(evidence))
        self.assertNotIn("readonly-bot", json.dumps(evidence))

    def test_issue_larger_than_previous_prefix_limit(self):
        issue = {"number": 904, "body": "A" * 9000}
        opener = SequenceOpener([
            IDENTITY, (200, issue), (403, {
                "message": "Resource not accessible by personal access token"
            })])
        evidence = checker.verify(TOKEN, opener=opener)
        self.assertEqual(evidence["result"], "verified")
        self.assertEqual(opener.methods, ["GET", "GET", "POST"])

    def test_write_capable_credential_fails_closed_on_validation_error(self):
        opener = SequenceOpener([
            IDENTITY, ISSUE, (422, {"message": "Validation failed"})])
        evidence = checker.verify(TOKEN, opener=opener)
        self.assertEqual(evidence["result"], "blocked")
        self.assertEqual(evidence["reason"], "write_permission_present_or_ambiguous")

    def test_generic_403_is_not_sufficient_permission_evidence(self):
        opener = SequenceOpener([
            IDENTITY, ISSUE, (403, {"message": "API rate limit exceeded"})])
        evidence = checker.verify(TOKEN, opener=opener)
        self.assertEqual(evidence["reason"], "write_denial_not_proven")

    def test_missing_token_prevents_even_identity_request(self):
        opener = SequenceOpener([])
        evidence = checker.verify("", opener=opener)
        self.assertEqual(evidence["reason"], "dedicated_token_missing")
        self.assertEqual(opener.methods, [])

    def test_identity_failure_prevents_comment_probe(self):
        opener = SequenceOpener([(401, {"message": "Bad credentials"})])
        evidence = checker.verify(TOKEN, opener=opener)
        self.assertEqual(evidence["reason"], "credential_identity_unverified")
        self.assertEqual(opener.methods, ["GET"])

    def test_issue_failure_prevents_comment_probe(self):
        opener = SequenceOpener([IDENTITY, (404, {"message": "Not Found"})])
        evidence = checker.verify(TOKEN, opener=opener)
        self.assertEqual(evidence["reason"], "approved_issue_read_failed")
        self.assertEqual(opener.methods, ["GET", "GET"])

    def test_apparent_success_is_a_security_failure(self):
        opener = SequenceOpener([
            IDENTITY, ISSUE, (201, {"body": "unapproved"})])
        evidence = checker.verify(TOKEN, opener=opener)
        self.assertEqual(evidence["result"], "blocked")
        self.assertFalse(evidence["issue_comment_write_denied"])

    def test_malformed_error_payload_is_ambiguous(self):
        self.assertFalse(checker._permission_denial(
            403, b'{"message":'))
        self.assertFalse(checker._permission_denial(
            401, b'{"message":"resource not accessible by integration"}'))


if __name__ == "__main__":
    unittest.main()

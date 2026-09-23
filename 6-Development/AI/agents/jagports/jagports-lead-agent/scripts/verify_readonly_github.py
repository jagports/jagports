"""Raspberry Pi operator check of a SEPARATE, fine-grained GitHub read token.

Usage: load the private .env, then invoke main() as codex; never put the token in a shell command.
The secret must NOT be pasted into an Issue, CLI argument or report.
No valid writes are ever sent: the denial probe submits an INVALID, empty
comment body to a designated existing Issue. A write-authorized token should
return 422; a denied token should return 403 with a permission-specific body.
Every ambiguous response fails closed; rerun only after investigating.
The account used here is NOT the ChatGPT GitHub connector account.
"""
import json
import os
import sys
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

BASE = "https://api.github.com"
REPO = "/repos/jagports/jagports"
EXISTING_ISSUE = 904
MAX_GET_RESPONSE_BYTES = 1024 * 1024  # full bounded JSON; Issue bodies exceed 4096 bytes


def _request(url, token, *, method="GET", body=None, opener=urlopen):
    if not url.startswith(BASE + "/"):
        raise ValueError("Unexpected API endpoint.")
    headers = {
        "Authorization": "Bearer " + token,
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "jagports-readonly-token-check",
    }
    if body is not None:
        headers["Content-Type"] = "application/json"
    request = Request(url, data=body, method=method, headers=headers)
    try:
        with opener(request, timeout=15) as response:
            # Never parse an arbitrary 4096-byte prefix as a complete Issue.
            # Read a bounded full response or fail closed before the POST probe.
            payload = response.read(MAX_GET_RESPONSE_BYTES + 1)
            if len(payload) > MAX_GET_RESPONSE_BYTES:
                raise ValueError("GitHub response exceeds bounded verification size")
            return response.status, payload
    except HTTPError as exc:
        return exc.code, exc.read(4096)


def _permission_denial(status, raw):
    if status != 403:
        return False
    try:
        message = json.loads(raw).get("message", "").casefold()
    except (UnicodeError, ValueError, AttributeError):
        return False
    return any(fragment in message for fragment in (
        "resource not accessible by personal access token",
        "resource not accessible by integration",
        "write access to repository not granted",
        "must have write access",
    ))


def verify(token, *, opener=urlopen):
    """Return redacted evidence, never the token or raw server responses."""
    evidence = {
        "repository": "jagports/jagports",
        "method": "non-creating invalid-comment permission probe",
        "identity_authenticated": False,
        "issue_read": False,
        "issue_comment_write_denied": False,
        "result": "blocked",
    }
    if not isinstance(token, str) or len(token) < 10:
        evidence["reason"] = "dedicated_token_missing"
        return evidence
    try:
        status, raw = _request(BASE + "/user", token, opener=opener)
        if status != 200:
            evidence["reason"] = "credential_identity_unverified"
            return evidence
        try:
            identity = json.loads(raw)
        except (ValueError, UnicodeError):
            evidence["reason"] = "credential_identity_unverified"
            return evidence
        if not isinstance(identity, dict) or not isinstance(identity.get("login"), str):
            evidence["reason"] = "credential_identity_unverified"
            return evidence
        evidence["identity_authenticated"] = True
        status, raw = _request(BASE + REPO + "/issues/" + str(EXISTING_ISSUE),
                               token, opener=opener)
        if status != 200:
            evidence["reason"] = "approved_issue_read_failed"
            return evidence
        try:
            issue = json.loads(raw)
        except (ValueError, UnicodeError):
            evidence["reason"] = "approved_issue_read_failed"
            return evidence
        if not isinstance(issue, dict) or issue.get("number") != EXISTING_ISSUE:
            evidence["reason"] = "approved_issue_read_failed"
            return evidence
        evidence["issue_read"] = True
        # A bodyless comment is invalid. This is a permission probe only;
        # never use real text or a write-capable token for a live write test.
        status, raw = _request(
            BASE + REPO + "/issues/" + str(EXISTING_ISSUE) + "/comments",
            token, method="POST", body=b'{"body":""}', opener=opener)
        if _permission_denial(status, raw):
            evidence["issue_comment_write_denied"] = True
            evidence["result"] = "verified"
        else:
            evidence["reason"] = ("write_permission_present_or_ambiguous"
                                  if status in (200, 201, 204, 422)
                                  else "write_denial_not_proven")
    except (OSError, URLError, ValueError, TypeError):
        evidence["reason"] = "network_or_response_error"
    return evidence


def main():
    evidence = verify(os.environ.get("GITHUB_TOKEN_RO", ""))
    # Only fixed status fields; never print credentials, identity, HTTP payload
    # or headers. The operator stores this redacted JSON on the Pi.
    print(json.dumps(evidence, sort_keys=True))
    return 0 if evidence["result"] == "verified" else 2


if __name__ == "__main__":
    sys.exit(main())

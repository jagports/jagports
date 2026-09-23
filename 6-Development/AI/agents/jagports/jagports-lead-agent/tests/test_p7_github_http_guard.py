"""Offline gate tests: actual PyGithub low-level request boundary, no network."""
import unittest
from unittest.mock import Mock, patch

from services.github_request_guard import GitHubRequestDenied, GitHubRequestGuard
from services.github_service import GitHubService


BASE = "/repos/jagports/jagports"
HDR = {"Authorization": "Bearer NEVER_PRINT"}


class Requester:
    def __init__(self):
        self.calls = []

    def _Requester__requestRaw(self, cnx, verb, url, headers, body,
                               stream=False, follow_302_redirect=False):
        self.calls.append((verb, url))
        return (200, {}, "{}")


class GuardTests(unittest.TestCase):
    def setUp(self):
        self.requester = Requester()
        self.guard = GitHubRequestGuard(
            self.requester, max_requests=3)
        self.raw = self.requester._Requester__requestRaw

    def get(self, url=BASE + "/issues"):
        return self.raw(None, "GET", url, HDR, None)

    def test_counts_actual_low_level_request_attempts_and_hard_stops(self):
        for url in (BASE, BASE + "/issues?page=1",
                    BASE + "/issues?page=2"):
            self.get(url)
        with self.assertRaisesRegex(GitHubRequestDenied, "cap"):
            self.get(BASE + "/issues?page=3")
        self.assertEqual(len(self.requester.calls), 3)
        self.assertEqual(self.guard.metrics(), {
            "http_requests_attempted": 3, "http_requests_max": 3,
            "http_requests_denied": 1, "http_requests_verified": True,
        })

    def test_blocks_mutations_before_socket_and_does_not_leak_secret(self):
        for verb in ("POST", "PUT", "PATCH", "DELETE", "HEAD"):
            with self.subTest(verb=verb):
                with self.assertRaises(GitHubRequestDenied) as error:
                    self.raw(None, verb, BASE + "/issues/42/comments",
                             HDR, {"body": "do not write"})
                self.assertNotIn("NEVER_PRINT", str(error.exception))
        self.assertEqual(self.requester.calls, [])
        self.assertEqual(self.guard.metrics()["http_requests_attempted"], 0)

    def test_blocks_other_repositories_hosts_http_and_credentials_in_url(self):
        for url in (
            BASE.replace("jagports/jagports", "somebody/another"),
            "https://api.github.com/repos/jagports/jagports/issues",
            "https://evil.example/repos/jagports/jagports/issues",
            "http://api.github.com/repos/jagports/jagports/issues",
            "https://username:password@api.github.com/repos/jagports/jagports/issues",
            "https://api.github.com/repos/jagports/jagports-other/issues",
            "/rate_limit",
            "https://api.github.com/rate_limit",
        ):
            with self.subTest(url=url):
                with self.assertRaises(GitHubRequestDenied):
                    self.get(url)
        self.assertEqual(self.requester.calls, [])

    def test_blocks_redirects_streams_and_request_body_on_get(self):
        for kwargs in ({"stream": True}, {"follow_302_redirect": True}):
            with self.assertRaises(GitHubRequestDenied):
                self.raw(None, "GET", BASE + "/issues", HDR, None, **kwargs)
        with self.assertRaises(GitHubRequestDenied):
            self.raw(None, "GET", BASE + "/issues", HDR, "unexpected")
        self.assertEqual(self.guard.metrics()["http_requests_attempted"], 0)

    def test_failed_request_still_consumes_budget(self):
        self.guard._original = Mock(side_effect=OSError("network down"))
        for _ in range(3):
            with self.assertRaises(OSError):
                self.get()
        with self.assertRaises(GitHubRequestDenied):
            self.get()
        self.assertEqual(self.guard.metrics()["http_requests_attempted"], 3)

    def test_invalid_or_unsupported_requester_fails_closed(self):
        for cap in (0, -1, True, 101, 1.5):
            with self.subTest(cap=cap):
                with self.assertRaises(ValueError):
                    GitHubRequestGuard(Requester(), max_requests=cap)
        with self.assertRaises(RuntimeError):
            GitHubRequestGuard(object(), max_requests=1)
        with self.assertRaises(ValueError):
            GitHubRequestGuard(Requester(), max_requests=2,
                               repository="not-the-approved/repo")

    def test_github_service_installs_guard_before_repo_lookup(self):
        fake_github = Mock()
        fake_github.requester = Requester()
        fake_github.get_repo.side_effect = lambda _: (
            fake_github.requester._Requester__requestRaw(
                None, "GET", BASE, HDR, None)
            and Mock()
        )
        with patch("services.github_service.Github", return_value=fake_github):
            service = GitHubService("redacted", "jagports/jagports",
                                    max_requests_per_run=2)
        self.assertEqual(service.request_metrics()["http_requests_attempted"], 1)
        self.assertTrue(service.request_metrics()["http_requests_verified"])
        self.assertEqual(service.request_metrics()["http_requests_max"], 2)
        fake_github.get_repo.assert_called_once_with("jagports/jagports")

    def test_real_pygithub_request_formatting_uses_relative_paths(self):
        # PyGithub converts absolute/relative endpoint inputs into a relative
        # socket request path before __requestRaw. This catches mock-only gates.
        from github import Github, Auth
        github = Github(auth=Auth.Token("never-sent"), retry=0, per_page=100)
        requester = github.requester
        with patch.object(requester, "_Requester__requestRaw",
                          return_value=(200, {}, "{}")) as wire:
            gate = GitHubRequestGuard(requester, max_requests=2)
            requester.requestJson("GET", BASE + "/issues", {"per_page": 100})
            requester.requestJson("GET", BASE + "/issues", {"page": 2})
            self.assertEqual(gate.metrics()["http_requests_attempted"], 2)
            self.assertEqual(wire.call_count, 2)
            first = wire.call_args_list[0].args
            self.assertTrue(first[2].startswith(BASE + "/issues?"))
            with self.assertRaises(GitHubRequestDenied):
                requester.requestJson("GET", BASE + "/issues", {"page": 3})
            self.assertEqual(wire.call_count, 2)
            with self.assertRaises(GitHubRequestDenied):
                requester.requestJson("POST", BASE + "/issues/42/comments",
                                      input={"body": "unapproved"})
            self.assertEqual(wire.call_count, 2)

    def test_rejects_custom_connection_to_unapproved_host(self):
        other = Mock(host="evil.example", protocol="https", port=443)
        with self.assertRaises(GitHubRequestDenied):
            self.raw(other, "GET", BASE + "/issues", HDR, None)
        self.assertEqual(self.guard.metrics()["http_requests_attempted"], 0)

    def test_github_service_rejects_bad_repository_without_constructing_client(self):
        with patch("services.github_service.Github") as constructor:
            with self.assertRaises(ValueError):
                GitHubService("redacted", "other/repo", max_requests_per_run=5)
            constructor.assert_not_called()


if __name__ == "__main__":
    unittest.main()

"""Fail-closed, one-process PyGithub HTTP request gate (P7 Batch 16.2).

Install on the actual Requester *before* resolving a Repository. Intercept the
lowest PyGithub request boundary, not a logical repo method: pagination,
lazy-loads and explicit PyGithub 202 retries traverse this boundary. Restrict outgoing
requests to GET on the expected GitHub API host and the configured repository.
This is defense in depth; an independently read-only token is still mandatory.
"""
from threading import Lock
from urllib.parse import urlsplit


class GitHubRequestDenied(RuntimeError):
    """A request was stopped before transmission by the local read-only gate."""


class GitHubRequestGuard:
    def __init__(self, requester, *, max_requests, repository="jagports/jagports"):
        if type(max_requests) is not int or not 1 <= max_requests <= 100:
            raise ValueError("A bounded positive HTTP request cap is mandatory.")
        if repository != "jagports/jagports":
            raise ValueError("The approved GitHub repository must be explicit.")
        original = getattr(requester, "_Requester__requestRaw", None)
        if not callable(original):
            raise RuntimeError("Unsupported PyGithub requester; deny all activity.")
        self.max_requests = max_requests
        self.attempts = 0
        self.denied = 0
        self._lock = Lock()
        self._original = original
        self.repository = repository
        self._requester = requester
        # PyGithub uses this instance's private method for all REST requests.
        # Fail closed if a client version changes the expected interface.
        requester._Requester__requestRaw = self._guarded_request

    def _guarded_request(self, cnx, verb, url, requestHeaders, input,
                         stream=False, follow_302_redirect=False):
        # No credential, request body, URL query or provider exception is logged.
        # PyGithub's __requestEncode strips the scheme and host before it
        # invokes __requestRaw. Require the exact relative API path here;
        # absolute URLs at this boundary indicate an unsupported client.
        parsed = urlsplit(url)
        allowed_path = "/repos/" + self.repository + "/"
        connection_allowed = (cnx is None or (
            getattr(cnx, "host", None) == "api.github.com" and
            getattr(cnx, "protocol", None) == "https" and
            getattr(cnx, "port", None) == 443))
        if (verb != "GET" or input is not None or stream or
                follow_302_redirect or parsed.scheme or parsed.netloc or
                not url.startswith("/") or
                not (parsed.path == allowed_path[:-1] or
                     parsed.path.startswith(allowed_path)) or
                not connection_allowed):
            with self._lock:
                self.denied += 1
            raise GitHubRequestDenied("GitHub read-only endpoint policy rejected the request.")
        with self._lock:
            if self.attempts >= self.max_requests:
                self.denied += 1
                raise GitHubRequestDenied("GitHub per-run HTTP request cap exhausted.")
            # Reserve *before* the socket request, including failed requests,
            # nested 202 retries and pagination. Do not refund uncertainty.
            self.attempts += 1
        return self._original(cnx, verb, url, requestHeaders, input,
                              stream=stream,
                              follow_302_redirect=follow_302_redirect)

    def metrics(self):
        with self._lock:
            return {"http_requests_attempted": self.attempts,
                    "http_requests_max": self.max_requests,
                    "http_requests_denied": self.denied,
                    "http_requests_verified": True}

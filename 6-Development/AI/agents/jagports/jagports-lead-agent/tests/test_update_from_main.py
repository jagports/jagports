"""Offline verification of pinned-main updater; never contacts GitHub."""
import json
import unittest
from unittest.mock import patch

from scripts.update_from_main import SOURCE, source_files, download_files, github_bytes


COMMIT = "a" * 40
ROOT_TREE = "b" * 40
COMPONENTS = SOURCE.split("/")
REQUIRED = ("main.py", "config.yaml", "services/github_service.py",
            "services/telegram_service.py", "scripts/update_from_main.py",
            "requirements.txt")


def tree(*extra, truncated=False):
    entries = [{"path": name, "type": "blob", "size": 3, "mode": "100644"}
               for name in REQUIRED]
    entries.extend(extra)
    return {"tree": entries, "truncated": truncated}


class UpdateFromMainTests(unittest.TestCase):
    def test_only_safe_agent_files_are_selected(self):
        source = source_files(tree(
            {"path": "agents/test.py", "type": "blob", "size": 4, "mode": "100644"}))
        self.assertEqual(source["agents/test.py"], 4)
        self.assertEqual(source["main.py"], 3)

    def test_missing_runtime_file_fails_before_installation(self):
        with self.assertRaisesRegex(RuntimeError, "missing"):
            source_files({"tree": [], "truncated": False})

    def test_rejects_truncated_source_tree(self):
        with self.assertRaisesRegex(RuntimeError, "truncated"):
            source_files(tree(truncated=True))

    def test_rejects_reserved_local_paths(self):
        for name in (".env", "state/events.json", "venv/bin/python",
                     "reports/latest.md", "notifications/pending.txt"):
            with self.subTest(name=name), self.assertRaises(RuntimeError):
                source_files(tree(
                    {"path": name, "type": "blob", "size": 1, "mode": "100644"}))

    def test_rejects_symlink_and_oversized_upstream(self):
        for item in ({"path": "other.py", "type": "blob", "size": 1, "mode": "120000"},
                     {"path": "other.py", "type": "blob", "size": 5_000_000, "mode": "100644"}):
            with self.subTest(item=item), self.assertRaises(RuntimeError):
                source_files(tree(item))

    def test_exact_commit_and_scoped_download(self):
        calls = []
        def fake_download(url, limit):
            calls.append(url)
            if "/commits/main" in url:
                return json.dumps({"sha": COMMIT, "commit": {
                    "tree": {"sha": ROOT_TREE}}}).encode()
            if "/git/trees/" in url:
                count = sum("/git/trees/" in u for u in calls)
                if count <= len(COMPONENTS):
                    return json.dumps({"tree": [
                        {"path": COMPONENTS[count - 1], "type": "tree",
                         "sha": ROOT_TREE}]}).encode()
                return json.dumps(tree()).encode()
            if url.startswith("https://raw.githubusercontent.com/"):
                self.assertIn("/" + COMMIT + "/" + SOURCE + "/", url)
                return b"abc"
            raise AssertionError("Unexpected URL " + url)
        sha, files = download_files(fake_download)
        self.assertEqual(sha, COMMIT)
        self.assertEqual(files["main.py"], b"abc")
        self.assertEqual(sum("/commits/main" in x for x in calls), 1)
        self.assertFalse(any("codeload" in x for x in calls))

    def test_download_size_bound(self):
        class FakeResponse:
            def __enter__(self):
                return self
            def __exit__(self, *args):
                return False
            def read(self, limit):
                return b"x" * limit
        with patch("scripts.update_from_main.urlopen", return_value=FakeResponse()):
            with self.assertRaisesRegex(RuntimeError, "size limit"):
                github_bytes("https://example.invalid", 10)


if __name__ == "__main__":
    unittest.main()

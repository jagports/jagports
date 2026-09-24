"""Offline verification of pinned-main updater; never connects to GitHub."""
import io
import tarfile
import unittest
from unittest.mock import patch

from scripts.update_from_main import SOURCE, archive_files, github_bytes


COMMIT = "a" * 40
PREFIX = "jagports-" + COMMIT + "/" + SOURCE + "/"
REQUIRED = ("main.py", "config.yaml", "services/github_service.py",
            "services/telegram_service.py", "scripts/update_from_main.py")


def archive(extra=None, *, type=tarfile.REGTYPE):
    payload = io.BytesIO()
    with tarfile.open(fileobj=payload, mode="w:gz") as tar:
        for name in REQUIRED:
            data = b"safe test"
            entry = tarfile.TarInfo(PREFIX + name)
            entry.size = len(data)
            tar.addfile(entry, io.BytesIO(data))
        if extra:
            name, data = extra
            entry = tarfile.TarInfo(PREFIX + name)
            entry.type = type
            entry.size = len(data) if type == tarfile.REGTYPE else 0
            tar.addfile(entry, io.BytesIO(data) if type == tarfile.REGTYPE else None)
    return payload.getvalue()


class UpdateFromMainTests(unittest.TestCase):
    def test_only_pinned_agent_tree_is_selected(self):
        items = archive_files(archive(("agents/test.py", b"result = 1")), COMMIT)
        self.assertEqual(items["agents/test.py"], b"result = 1")
        self.assertEqual(items["main.py"], b"safe test")

    def test_missing_runtime_file_fails_before_installation(self):
        with self.assertRaisesRegex(RuntimeError, "missing"):
            archive_files(archive().replace(b"nonexistent", b"nonexistent"), "b" * 40)

    def test_rejects_reserved_local_secret_path(self):
        for name in (".env", "state/events.json", "venv/bin/python",
                     "reports/latest.md", "notifications/pending.txt"):
            with self.subTest(name=name), self.assertRaises(RuntimeError):
                archive_files(archive((name, b"secret")), COMMIT)

    def test_rejects_symlink_source(self):
        with self.assertRaisesRegex(RuntimeError, "Unsafe"):
            archive_files(archive(("agents/other.py", b""), type=tarfile.SYMTYPE),
                          COMMIT)

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

#!/usr/bin/env python3
"""Safely refresh an existing codex installation from an exact main commit.

Run as codex. Downloads a pinned GitHub archive; no Git checkout or sudo needed.
It does not call OpenAI, send Telegram or run main.py.
"""
import argparse
import json
import os
from pathlib import Path, PurePosixPath
import shutil
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from urllib.request import Request, urlopen

REPO = "jagports/jagports"
SOURCE = "6-Development/AI/agents/jagports/jagports-lead-agent"
PRESERVED = {".env", "venv", "state", "reports", "notifications", "__pycache__"}
LEGACY_RO_FILES = {
    "scripts/verify_readonly_github.py",
    "tests/test_p7_readonly_credential.py",
}


def github_bytes(url, limit):
    req = Request(url, headers={"User-Agent": "jagports-agent-updater",
                                "Accept": "application/vnd.github+json"})
    with urlopen(req, timeout=35) as response:
        data = response.read(limit + 1)
    if len(data) > limit:
        raise RuntimeError("Download exceeds the safety size limit")
    return data


def source_files(tree):
    """Validate one exact repository subtree; return names and declared sizes."""
    if tree.get("truncated"):
        raise RuntimeError("GitHub source tree is truncated; refusing partial update")
    entries = {}
    for entry in tree["tree"]:
        name = entry["path"]
        path = PurePosixPath(name)
        if (path.is_absolute() or ".." in path.parts or
                any(part in PRESERVED for part in path.parts)):
            raise RuntimeError("Unsafe or reserved upstream path")
        if entry["type"] == "tree":
            continue
        if (entry["type"] != "blob" or entry.get("mode") not in ("100644", "100755") or entry.get("size", 0) > 4 * 1024 * 1024
                or not isinstance(entry.get("size"), int)):
            raise RuntimeError("Unsafe or oversized upstream file")
        entries[name] = entry["size"]
    for required in ("main.py", "config.yaml", "services/github_service.py",
                     "services/telegram_service.py", "scripts/update_from_main.py",
                     "requirements.txt"):
        if required not in entries:
            raise RuntimeError("Pinned main missing " + required)
    return entries


def download_files(download):
    """Resolve just the agent subtree, never the full ~239 MiB repository."""
    from urllib.parse import quote
    commit_info = json.loads(download(
        "https://api.github.com/repos/" + REPO + "/commits/main", 128 * 1024))
    actual = commit_info["sha"]
    if len(actual) != 40 or any(c not in "0123456789abcdef" for c in actual):
        raise RuntimeError("Invalid main commit SHA")
    print("Latest main commit:", actual)
    tree_sha = commit_info["commit"]["tree"]["sha"]
    for component in SOURCE.split("/"):
        tree = json.loads(download(
            "https://api.github.com/repos/" + REPO + "/git/trees/" + tree_sha,
            512 * 1024))
        matches = [item for item in tree["tree"]
                   if item["path"] == component and item["type"] == "tree"]
        if len(matches) != 1:
            raise RuntimeError("Pinned main missing source directory: " + component)
        tree_sha = matches[0]["sha"]
    tree = json.loads(download(
        "https://api.github.com/repos/" + REPO + "/git/trees/" + tree_sha
        + "?recursive=1", 2 * 1024 * 1024))
    entries = source_files(tree)
    files = {}
    for name, size in sorted(entries.items()):
        url = ("https://raw.githubusercontent.com/" + REPO + "/" + actual
               + "/" + quote(SOURCE + "/" + name, safe="/"))
        payload = download(url, min(size + 1024, 4 * 1024 * 1024 + 1))
        if len(payload) != size:
            raise RuntimeError("Incomplete pinned upstream file: " + name)
        files[name] = payload
    return actual, files


def run(command, **kwargs):
    subprocess.run(command, check=True, **kwargs)


def user_timer(args):
    return subprocess.run(["systemctl", "--user", *args],
                          stdout=subprocess.DEVNULL,
                          stderr=subprocess.DEVNULL).returncode == 0


def upgrade(destination, *, download=github_bytes, check=True):
    if os.geteuid() == 0:
        raise RuntimeError("Run as codex; never run the updater with sudo")
    if not (destination / ".env").is_file():
        raise RuntimeError("Expected existing private .env; refusing a fresh installation")
    if not (destination / "venv/bin/python").is_file():
        raise RuntimeError("Expected existing Python virtualenv; use host installation guide")
    if destination.is_symlink():
        raise RuntimeError("Unexpected symlinked installation; inspect manually")
    timer_status = subprocess.run(
        ["systemctl", "--user", "show", "jagports-lead-agent.timer",
         "--property=LoadState", "--value"], capture_output=True, text=True)
    if timer_status.returncode or timer_status.stdout.strip() != "loaded":
        raise RuntimeError("Existing codex timer unavailable; inspect installation")

    commit, files = download_files(download)

    with tempfile.TemporaryDirectory(prefix="jagports-update-") as temporary:
        stage = Path(temporary) / "source"
        stage.mkdir()
        for name, payload in files.items():
            output = stage / name
            output.parent.mkdir(parents=True, exist_ok=True)
            output.write_bytes(payload)
        python = str(destination / "venv/bin/python")

        # Stop the timer *before* pip changes the shared venv. Never overlap
        # with an actual scheduled run or create another timer.
        active = user_timer(["is-active", "--quiet", "jagports-lead-agent.timer"])
        if user_timer(["is-active", "--quiet", "jagports-lead-agent.service"]):
            raise RuntimeError("Agent service is running; retry after it finishes")
        if active:
            run(["systemctl", "--user", "stop", "jagports-lead-agent.timer"])
        try:
            # Install dependencies in the existing private venv; never invoke main.py.
            if "requirements.txt" in files:
                run([python, "-m", "pip", "install", "-r", str(stage / "requirements.txt")])
            run([python, "-m", "compileall", "-q", str(stage)])
            if check:
                env = dict(os.environ, OPENAI_API_KEY="", TELEGRAM_BOT_TOKEN="",
                           GITHUB_TOKEN="", GITHUB_TOKEN_RO="")
                run([python, "-m", "unittest", "discover", "-s", "tests",
                     "-p", "test_*.py"], cwd=stage, env=env)
            print("Offline validation passed; installation not yet changed.")

            if user_timer(["is-active", "--quiet", "jagports-lead-agent.service"]):
                raise RuntimeError("Agent service started during update; retry later")
            stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
            backup = destination.parent / ".jagports-agent-backups" / stamp
            backup.mkdir(parents=True, exist_ok=False, mode=0o700)
            existing_manifest = destination / ".jagports-managed-files.json"
            old_files = json.loads(existing_manifest.read_text()) if existing_manifest.exists() else []
            if (not isinstance(old_files, list) or
                    any(not isinstance(n, str) or not n or
                        PurePosixPath(n).is_absolute() or
                        ".." in PurePosixPath(n).parts or
                        any(k in PRESERVED for k in PurePosixPath(n).parts)
                        for n in old_files)):
                raise RuntimeError("Unsafe or corrupt previous source manifest")
            # First update: protect all existing first-level code/scripts,
            # including older manual installations, without archiving secrets.
            managed = set(old_files) | set(files) | LEGACY_RO_FILES
            for name in sorted(managed):
                target = destination / name
                if target.is_file() and not target.is_symlink():
                    saved = backup / name
                    saved.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(target, saved)
            deployed = []
            try:
                for name in sorted(files):
                    target = destination / name
                    if target.is_symlink():
                        raise RuntimeError("Unexpected symlinked installed file: " + name)
                    target.parent.mkdir(parents=True, exist_ok=True)
                    temp = target.with_name("." + target.name + ".updating")
                    try:
                        temp.write_bytes(files[name])
                        temp.chmod(0o755 if name.endswith(".sh") else 0o644)
                        os.replace(temp, target)
                    finally:
                        temp.unlink(missing_ok=True)
                    deployed.append(name)
                for name in (set(old_files) | LEGACY_RO_FILES) - set(files):
                    target = destination / name
                    if target.is_file() and not target.is_symlink():
                        target.unlink()
                        deployed.append(name)
                existing_manifest.write_text(json.dumps(sorted(files), indent=2) + "\n")
                (destination / ".jagports-source-revision").write_text(commit + "\n")
            except BaseException:
                # Restore the exact pre-update copies. A first-time install
                # never deletes unknown local files or state directories.
                for name in deployed:
                    saved, target = backup / name, destination / name
                    if saved.is_file():
                        target.parent.mkdir(parents=True, exist_ok=True)
                        shutil.copy2(saved, target)
                    elif target.is_file():
                        target.unlink()
                raise
            print("Installed main:", commit)
            print("Private backup:", backup)
            print("Existing .env, venv, state, reports and notifications preserved.")
            print("config.yaml refreshed to upstream defaults (old copy in backup).")
        finally:
            if active:
                # OnActiveSec=1s means restoring an active timer can start
                # the updated service immediately. Defaults disable paid reasoning.
                run(["systemctl", "--user", "start", "jagports-lead-agent.timer"])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--destination", type=Path,
                        default=Path("/home/codex/jagports-lead-agent"))
    parser.add_argument("--skip-tests", action="store_true",
                        help="Only use while diagnosing an offline-test failure")
    args = parser.parse_args()
    upgrade(args.destination.expanduser(), check=not args.skip_tests)


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Safely refresh an existing codex installation from an exact main commit.

Run as codex. Downloads a pinned GitHub archive; no Git checkout or sudo needed.
It does not call OpenAI, send Telegram or run main.py.
"""
import argparse
import io
import json
import os
from pathlib import Path, PurePosixPath
import shutil
import subprocess
import sys
import tarfile
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


def archive_files(archive, commit):
    """Return safe, regular files only from the pinned agent directory."""
    result = {}
    prefix = "jagports-" + commit + "/" + SOURCE + "/"
    with tarfile.open(fileobj=io.BytesIO(archive), mode="r:gz") as tar:
        for member in tar:
            if not member.name.startswith(prefix):
                continue
            name = member.name[len(prefix):]
            if not name or member.isdir():
                continue
            path = PurePosixPath(name)
            if (not member.isfile() or path.is_absolute() or
                    ".." in path.parts or any(x in PRESERVED for x in path.parts) or
                    path.parts[0] == "config.local.yaml"):
                raise RuntimeError("Unsafe or reserved archive entry")
            if member.size > 4 * 1024 * 1024:
                raise RuntimeError("Source file exceeds 4 MiB")
            result[name] = tar.extractfile(member).read()
    for required in ("main.py", "config.yaml", "services/github_service.py",
                     "services/telegram_service.py", "scripts/update_from_main.py"):
        if required not in result:
            raise RuntimeError("Pinned archive missing " + required)
    return result


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
    if not user_timer(["show", "jagports-lead-agent.timer", "-p", "LoadState"]):
        raise RuntimeError("codex systemd user manager unavailable; inspect installation")

    commit_info = json.loads(download(
        "https://api.github.com/repos/" + REPO + "/commits/main", 128 * 1024))
    commit = commit_info["sha"]
    if len(commit) != 40 or any(c not in "0123456789abcdef" for c in commit):
        raise RuntimeError("Invalid main commit SHA")
    print("Latest main commit:", commit)
    archive = download("https://codeload.github.com/" + REPO + "/tar.gz/" + commit,
                       35 * 1024 * 1024)
    files = archive_files(archive, commit)

    with tempfile.TemporaryDirectory(prefix="jagports-update-") as temporary:
        stage = Path(temporary) / "source"
        stage.mkdir()
        for name, payload in files.items():
            output = stage / name
            output.parent.mkdir(parents=True, exist_ok=True)
            output.write_bytes(payload)
        python = str(destination / "venv/bin/python")
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

        # Stop only the existing timer; never create or enable another timer.
        active = user_timer(["is-active", "--quiet", "jagports-lead-agent.timer"])
        if user_timer(["is-active", "--quiet", "jagports-lead-agent.service"]):
            raise RuntimeError("Agent service is running; retry after it finishes")
        if active:
            run(["systemctl", "--user", "stop", "jagports-lead-agent.timer"])
        try:
            if user_timer(["is-active", "--quiet", "jagports-lead-agent.service"]):
                raise RuntimeError("Agent service started during update; retry later")
            stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
            backup = destination.parent / ".jagports-agent-backups" / stamp
            backup.mkdir(parents=True, exist_ok=False, mode=0o700)
            existing_manifest = destination / ".jagports-managed-files.json"
            old_files = json.loads(existing_manifest.read_text()) if existing_manifest.exists() else []
            # First update: protect all existing first-level code/scripts,
            # including older manual installations, without archiving secrets.
            managed = set(old_files) | set(files) | LEGACY_RO_FILES
            for name in sorted(managed):
                target = destination / name
                if target.is_file() and not target.is_symlink():
                    saved = backup / name
                    saved.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(target, saved)
            for name in sorted(files):
                target = destination / name
                if target.is_symlink():
                    raise RuntimeError("Unexpected symlinked installed file: " + name)
                target.parent.mkdir(parents=True, exist_ok=True)
                temp = target.with_name("." + target.name + ".updating")
                temp.write_bytes(files[name])
                temp.chmod(0o755 if name.endswith(".sh") else 0o644)
                os.replace(temp, target)
            for name in (set(old_files) | LEGACY_RO_FILES) - set(files):
                target = destination / name
                if target.is_file() and not target.is_symlink():
                    target.unlink()
            existing_manifest.write_text(json.dumps(sorted(files), indent=2) + "\n")
            (destination / ".jagports-source-revision").write_text(commit + "\n")
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

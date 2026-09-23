"""Offline checks for the opt-in codex-owned main synchronization job.

No network, git checkout, live systemd, OpenAI or Telegram calls.
Real deployment/rollback verification is a separate Raspberry Pi acceptance.
"""
import shutil
import subprocess
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "sync_main.sh"
SERVICE = ROOT / "systemd" / "jagports-sync-main.service"
TIMER = ROOT / "systemd" / "jagports-sync-main.timer"


class MainSyncShellTests(unittest.TestCase):
    def test_shell_syntax(self):
        bash = shutil.which("bash")
        self.assertIsNotNone(bash)
        result = subprocess.run(
            [bash, "-n", str(SCRIPT)], check=False, capture_output=True,
            text=True, timeout=10,
        )
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_modes_safety_and_staging_are_present(self):
        script = SCRIPT.read_text(encoding="utf-8")
        for marker in (
            "--check|--apply|--enroll|--scheduled",
            'id -un',
            'flock -n 9',
            'git clone --quiet --depth 1',
            'git -C "$WORK/repo" sparse-checkout set "$SUB"',
            'STAGED_OFFLINE_TESTS_PASS',
            'check_disabled',
            'OPENAI_API_KEY',
            'UNMANAGED_FILE',
            'ROLLBACK_UNVERIFIED',
            'INSTALLED_APP_TREE',
            'RUNTIME_RACE',
        ):
            with self.subTest(marker=marker):
                self.assertIn(marker, script)
        self.assertFalse(any(line.lstrip().startswith("sudo ") for line in script.splitlines()))

    def test_scheduled_user_unit_is_independent_of_agent_timer(self):
        service = SERVICE.read_text(encoding="utf-8")
        timer = TIMER.read_text(encoding="utf-8")
        self.assertIn("--scheduled", service)
        self.assertIn("NoNewPrivileges=true", service)
        self.assertIn("OnCalendar=*-*-* 04:15:00", timer)
        self.assertIn("Persistent=true", timer)
        self.assertIn("Unit=jagports-sync-main.service", timer)
        self.assertNotIn("OnBootSec=", timer)
        self.assertNotIn("jagports-lead-agent.service", timer)


if __name__ == "__main__":
    unittest.main()

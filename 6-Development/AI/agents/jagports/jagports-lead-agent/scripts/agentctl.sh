#!/usr/bin/env bash
# One-command operator entry points for the installed Raspberry Pi agent.
set -euo pipefail
cd "$(dirname "$0")/.."
case "${1:-}" in
  update) exec python3 scripts/update_from_main.py ;;
  check) exec env OPENAI_API_KEY='' GITHUB_TOKEN='' TELEGRAM_BOT_TOKEN='' ./venv/bin/python -m unittest discover -s tests -p 'test_*.py' ;;
  run) exec ./venv/bin/python main.py ;;
  telegram-test) exec ./venv/bin/python scripts/test_telegram.py ;;
  status)
    printf 'Installed source: '
    cat .jagports-source-revision 2>/dev/null || echo 'manual installation; no recorded revision'
    systemctl --user status jagports-lead-agent.timer --no-pager || true
    ;;
  *)
    echo 'Usage: bash scripts/agentctl.sh {update|check|run|telegram-test|status}' >&2
    exit 2
    ;;
esac

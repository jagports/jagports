#!/usr/bin/env bash
# MyNode executes this after the drive and basic startup setup are complete.
# It must remain fast and idempotent: it verifies only, never installs.
set -Eeuo pipefail

tag='mynode-codex-hook'
if ! id codex >/dev/null 2>&1; then
  logger -t "$tag" 'codex user is absent; explicit Codex CLI setup has not run.'
  exit 0
fi

if runuser -l codex -c 'export PATH="$HOME/.local/bin:$PATH"; command -v codex >/dev/null && codex --version >/dev/null' 2>/dev/null; then
  logger -t "$tag" 'Codex CLI check passed.'
else
  logger -t "$tag" 'Codex CLI is unavailable; run /usr/local/lib/mynode-codex/install-codex-cli.sh --apply manually.'
fi

exit 0

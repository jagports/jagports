#!/usr/bin/env bash
# One-time, explicit installer for a MyNodeBTC development host.
set -Eeuo pipefail

[[ ${1:-} == '--apply' ]] || {
  echo 'Usage: sudo install-codex-cli.sh --apply' >&2
  exit 2
}
[[ $EUID -eq 0 ]] || { echo 'Run with sudo.' >&2; exit 1; }

if ! id codex >/dev/null 2>&1; then
  useradd --create-home --home-dir /home/codex --shell /bin/bash --user-group codex
  passwd --lock codex
elif id -nG codex | tr ' ' '\n' | grep -qxE '(sudo|wheel|adm)'; then
  echo 'Existing codex account has an administrative group; refusing to use it.' >&2
  exit 1
fi

command -v curl >/dev/null || { echo 'curl is required but unavailable.' >&2; exit 1; }
command -v runuser >/dev/null || { echo 'runuser is required but unavailable.' >&2; exit 1; }

echo 'This downloads the official Codex CLI installer as user codex.'
echo 'It changes only /home/codex and /srv/codex-workspaces.'
read -r -p 'Type INSTALL-CODEX-CLI to continue: ' confirmation
[[ "$confirmation" == 'INSTALL-CODEX-CLI' ]] || { echo 'Cancelled.'; exit 0; }

install -d -o codex -g codex -m 0750 /srv/codex-workspaces
install -d -o codex -g codex -m 0755 /home/codex/.local/bin

# The official installer places the binary in the user's local path. It is
# deliberately not run as root and it does not use npm system-wide.
runuser -l codex -c 'export PATH="$HOME/.local/bin:$PATH"; if command -v codex >/dev/null 2>&1; then codex --version; else curl -fsSL https://chatgpt.com/codex/install.sh | sh; fi; command -v codex; codex --version'

profile='/home/codex/.profile'
touch "$profile"
chown codex:codex "$profile"
chmod 0644 "$profile"
marker='# MyNode Codex CLI PATH'
if ! grep -Fqx "$marker" "$profile"; then
  cat >> "$profile" <<'EOF'
# MyNode Codex CLI PATH
export PATH="$HOME/.local/bin:$PATH"
EOF
fi

echo 'Installed. Run: sudo -iu codex, then codex, and select Sign in with ChatGPT.'

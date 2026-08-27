# Codex CLI on a MyNodeBTC development host

This is a MyNode-compatible, console-only setup for Codex CLI. It does not
need X11, a desktop session, Docker, Bitcoin, Lightning, or root Codex access.

The one-time installer runs **only when you explicitly invoke it**. The MyNode
hook runs after each boot and only verifies that Codex is still available; it
does not auto-download, auto-upgrade, or start an agent.

## Scope and safety

- Installs Codex only into `/home/codex/.local/bin` as Linux user `codex`.
- Creates `/srv/codex-workspaces` with owner `codex:codex`.
- Refuses to use an existing `codex` account in `sudo`, `wheel`, or `adm`.
- Does not change SSH, firewall, MyNode apps, Bitcoin, Lightning, or Docker.
- Requires outbound HTTPS only while the explicit installer runs and while
  Codex itself is used.

## Install the bundle on MyNode

Copy this directory to the MyNode with your existing LAN SSH administrator
account. Then, on MyNode:

```bash
git clone https://github.com/tlindi/jagports.git jagports
Cloning into 'jagports'...
Username for 'https://github.com': tlindi
Password for 'https://tlindi@github.com':
cd jagports/mynode-codex-cli/
sudo install -D -m 0755 install-codex-cli.sh /usr/local/lib/mynode-codex/install-codex-cli.sh
sudo install -D -m 0755 mynode_hook_post_startup.sh /usr/local/bin/mynode_hook_post_startup.sh
sudo /usr/local/lib/mynode-codex/install-codex-cli.sh --apply
sudo /usr/local/bin/mynode_hook_post_startup.sh
```

The installer asks for `INSTALL-CODEX-CLI` before it downloads the official
Codex CLI installer.

## Authenticate and use

```bash
sudo -iu codex
cd /srv/codex-workspaces
git clone git@github.com:YOUR-ACCOUNT/YOUR-PRIVATE-REPO.git app
cd app
codex
```

On first run, select **Sign in with ChatGPT** and complete the displayed login
flow from a browser on any device. Keep the private repository's deploy key or
GitHub authentication owned by `codex`, not root.

For a session that survives an SSH disconnect:

```bash
sudo -iu codex
tmux new -s codex-dev
cd /srv/codex-workspaces/app
codex
```

Detach with `Ctrl-b`, then `d`; reconnect with `tmux attach -t codex-dev`.

## Validate after reboot

```bash
sudo journalctl -t mynode-codex-hook -b --no-pager
sudo -iu codex bash -lc 'codex --version'
```

## Remove the MyNode integration

```bash
sudo rm -f /usr/local/bin/mynode_hook_post_startup.sh
sudo rm -rf /usr/local/lib/mynode-codex
```

This leaves the `codex` user, workspaces, and CLI untouched. Remove those only
after separately reviewing their contents.

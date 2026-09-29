# jagports

Development of

jagports AI OS 

and 

jagports VIEPS (Vehicle Information & EPC (Electic Parts Catalog) System

## Repository Knowledge

Before contributing, read:

- [KNOWLEDGE.md](KNOWLEDGE.md)
- [Documentation Education Competence](0-DocumentationEducationCompetense/)

## Codex on Windows: Git runtime

For Codex to run Git for Windows HTTPS and credential helpers, the Windows user `Path` must retain both Git runtime directories in addition to existing entries:

- `C:\Program Files\Git\usr\bin` — provides `sh.exe` for Git helper scripts;
- `C:\Program Files\Git\mingw64\bin` — provides `git-credential-manager.exe`.

After adding either directory, fully restart Codex before retrying Git. Do not put a token in a remote URL or repository configuration. A PATH repair is a local environment workaround for a missing-shell/helper failure; it is not an upstream fix for a Codex sandbox or Windows credential-store limitation. If Git's default Schannel transport cannot access credentials from the sandbox, investigate that limitation separately without disabling the sandbox for unrelated commands.

## VIEPS translations

VIEPS user-interface translations are managed with [Hosted Weblate](https://hosted.weblate.org/projects/jagports-vieps/).

Canonical translation resources are stored in:

`5-Implementation-Projects/internet/jagports/solution/vieps/i18n/`

GitHub remains the release authority: translation changes flow through the normal Jagports Pull Request, CI, independent review, and merge process.

Jagports-authored source code and VIEPS translation resources are licensed under the MIT License. Third-party and externally owned repository content retains its original licenses or rights. See [LICENSE.md](LICENSE.md) for the repository licensing boundary.

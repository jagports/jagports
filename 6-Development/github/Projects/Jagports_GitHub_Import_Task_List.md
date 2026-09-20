# Jagports AI OS — GitHub Import Task List

One row = one GitHub Issue. Keep the priority prefix in the title so execution order is always visible.

| Priority | Task | Where | Initial Status |
|---|---|---|---|
| `P1` | Open Kanban | GitHub Projects | DONE |
| `P1.1` | Select Kanban tool | GitHub Projects / Board | DONE |
| `P1.2` | Create Jagports GitHub repository | GitHub | DONE |
| `P1.3` | Configure Kanban workflow | GitHub Projects | DONE |
| `P1.4` | Define Kanban fields and labels | GitHub Projects / Issues | DONE |
| `P1.5` | Define Kanban operating rules | GitHub repository | DONE |
| `P2` | Open agent accounts/access to Kanban | GitHub + Codex Web | TODO |
| `P2.1` | Define agent identities | GitHub repository | TODO |
| `P2.2` | Validate leader R/W rights | GitHub Project permissions | TODO |
| `P2.3` | Define permission boundaries | GitHub repository | TODO |
| `P2.4` | Connect Codex to repository | Codex Web + GitHub | TODO |
| `P3` | Define agent communication protocol | GitHub Issues / Projects | TODO |
| `P3.1` | Define escalation categories | GitHub repository | TODO |
| `P3.2` | Define human decision gate | GitHub Kanban | TODO |
| `P3.3` | Define agent hand-off format | GitHub Issue templates | TODO |
| `P4` | Create work-item templates | GitHub Issues | TODO |
| `P4.1` | Define feature template | GitHub Issues | TODO |
| `P4.2` | Define research template | GitHub Issues | TODO |
| `P4.3` | Define decision template | GitHub Issues / Decision Log | TODO |
| `P5` | Establish Jagports product memory | GitHub repository | TODO |
| `P5.1` | Create repository knowledge structure | GitHub repository | TODO |
| `P5.2` | Record product vision and constraints | GitHub repository | TODO |
| `P5.3` | Create decision log | GitHub repository | TODO |
| `P6` | Establish prioritization system | GitHub Project fields + Issues | TODO |
| `P6.1` | Define scoring factors | GitHub repository documentation | TODO |
| `P6.2` | Define priority rules | GitHub Project | TODO |
| `P6.3` | Populate first ranked backlog | GitHub Project / Issues | TODO |
| `P7` | Establish research-to-decision workflow | ChatGPT/web research + GitHub Issues | TODO |
| `P7.1` | Run first research cycle | ChatGPT/web research; GitHub | TODO |
| `P7.2` | Convert findings to proposals | GitHub Issues | TODO |
| `P7.3` | Escalate only required decisions | GitHub Kanban | TODO |
| `P8` | Establish Codex engineering workflow | Codex Web + GitHub repository | TODO |
| `P8.1` | Create Codex engineering instructions | GitHub repository | TODO |
| `P8.2` | Implement first approved task | Codex Web + GitHub | TODO |
| `P8.3` | Validate delivery loop | GitHub + Codex Web | TODO |
| `P9` | Establish quality gates | GitHub repository / GitHub Actions | TODO |
| `P9.1` | Define acceptance criteria standard | GitHub Issue templates | TODO |
| `P9.2` | Define technical review gate | GitHub Pull Requests / Issues | TODO |
| `P9.3` | Define automated validation | GitHub Actions / repository | TODO |
| `P10` | Prepare Raspberry Pi infrastructure | Raspberry Pi 4B | TODO |
| `P10.1` | Prepare Linux environment | Raspberry Pi terminal | TODO |
| `P10.2` | Define persistent services | Raspberry Pi | TODO |
| `P10.3` | Establish backup strategy | Raspberry Pi + GitHub | TODO |
| `P11` | Add autonomous automation | GitHub Actions and/or Raspberry Pi | TODO |
| `P11.1` | Identify automation candidates | GitHub Project / Issues | TODO |
| `P11.2` | Implement first automation | GitHub Actions or Raspberry Pi | TODO |
| `P12` | Expand and govern the agent team | ChatGPT/Codex + GitHub | TODO |

## Recommended GitHub Project fields

- `Priority` — Text field; values `P1`, `P1.1`, `P1.2`, etc.
- `Status` — use the Project's workflow/status field.
- `Where` — Text field.
- `Executor` — add later when agent accounts are configured.

## Import principle

Create each row as a GitHub Issue, then add the issue to the Jagports Project. GitHub CLI supports creating issues and adding them directly to a Project. 

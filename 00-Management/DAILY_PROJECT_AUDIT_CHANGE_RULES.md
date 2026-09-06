# Daily Project Audit — Change Rules

`DAILY_PROJECT_AUDIT.md` is the durable source of truth for the repeating `Jagports Daily Audit` procedure.

Changes to the procedure require:

1. GitHub Issue describing the required change.
2. Dedicated branch.
3. Pull Request containing the Markdown change.
4. Independent review and approval.
5. Required testing/verification.
6. Merge before the changed procedure becomes authoritative for the next scheduled run.

The live ChatGPT scheduled task should contain only the stable bootstrap documented in `DAILY_PROJECT_AUDIT_SCHEDULE_BOOTSTRAP.md`.

The schedule metadata remains documented in `DAILY_PROJECT_AUDIT_SCHEDULE.md`.

The scheduled task must read the current `DAILY_PROJECT_AUDIT.md` on every run. It must not rely on a copied or stale version of the procedure.

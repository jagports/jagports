# Daily Project Audit — Task Change Rule

`00-Management/DAILY_PROJECT_AUDIT.md` is the durable source of truth for the repeating `Jagports Daily Audit` procedure.

The live scheduled task should use the stable bootstrap documented in `00-Management/DAILY_PROJECT_AUDIT_SCHEDULE_BOOTSTRAP.md`.

When audit behavior changes:

1. Change `DAILY_PROJECT_AUDIT.md` through an Issue and PR.
2. Review and merge the PR.
3. The next scheduled run reads the merged file and executes the new procedure.
4. Do not duplicate the full procedure in the scheduled task.

The schedule itself remains documented separately in `DAILY_PROJECT_AUDIT_SCHEDULE.md`.

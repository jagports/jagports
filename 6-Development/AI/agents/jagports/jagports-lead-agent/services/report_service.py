"""Human-readable local report; no delivery or GitHub write side effects."""
from datetime import datetime
import os


def create_report(issues, changes, documentation=None, event_context=None):
    report = [
        "# Jagports Lead Agent Report",
        "",
        f"Generated: {datetime.now().isoformat()}",
        "",
        "## Issue Summary",
        "",
        f"Total issues: {len(issues)}",
        "",
        "## Changes",
        "",
        f"New: {changes.get('new', [])}",
        f"Closed: {changes.get('closed', [])}",
        f"Reopened: {changes.get('reopened', [])}",
        "",
    ]
    report.extend(["## Agent Analysis Results", "", "## Event Context", "",
                   str(event_context), ""])
    if documentation:
        for result in documentation:
            report.append(str(result.to_dict()))
    else:
        report.append("No agent analysis.")
    report.append("")
    return "\n".join(report)


def save_report(content):
    """Durably replace the local report."""
    from pathlib import Path
    from tempfile import NamedTemporaryFile

    directory = Path("reports")
    directory.mkdir(parents=True, exist_ok=True)
    temporary = None
    try:
        with NamedTemporaryFile(mode="w", encoding="utf-8",
                                dir=str(directory), prefix=".lead-report-",
                                delete=False) as handle:
            temporary = Path(handle.name)
            os.chmod(temporary, 0o600)
            handle.write(content)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary, directory / "lead_report.md")
        temporary = None
        if hasattr(os, "O_DIRECTORY"):
            fd = os.open(str(directory), os.O_RDONLY | os.O_DIRECTORY)
            try:
                os.fsync(fd)
            finally:
                os.close(fd)
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)

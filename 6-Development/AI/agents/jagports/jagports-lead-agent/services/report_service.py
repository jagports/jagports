from datetime import datetime
import os


def create_report(
    issues,
    changes,
    documentation=None,
    event_context=None
):

    report = []

    report.append("# Jagports Lead Agent Report")
    report.append("")
    report.append(
        f"Generated: {datetime.now().isoformat()}"
    )
    report.append("")

    report.append("## Issue Summary")
    report.append("")

    report.append(
        f"Total issues: {len(issues)}"
    )

    report.append("")

    report.append("## Changes")
    report.append("")

    report.append(
        f"New: {changes.get('new', [])}"
    )

    report.append(
        f"Closed: {changes.get('closed', [])}"
    )

    report.append(
        f"Reopened: {changes.get('reopened', [])}"
    )

    report.append("")
    report.append("## Agent Analysis Results")

    report.append("")
    report.append("## Event Context")
    report.append("")

    report.append(
        str(event_context)
    )

    report.append("")

    if documentation:
        for result in documentation:
            report.append(
                str(result.to_dict())
            )
    else:
        report.append(
            "No documentation analysis."
        )

    report.append("")

    return "\n".join(report)


def save_report(content):

    os.makedirs(
        "reports",
        exist_ok=True
    )

    with open(
        "reports/lead_report.md",
        "w"
    ) as f:
        f.write(content)


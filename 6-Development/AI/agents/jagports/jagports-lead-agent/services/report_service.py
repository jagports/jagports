"""Human-readable local report; no delivery or GitHub write side effects."""
from datetime import datetime
import os


def _plain(value, limit=280):
    """Keep advisory fields concise and safe for a Markdown report."""
    return str(value if value is not None else "").replace("\r", " ").replace(
        "\n", " ").replace("|", "/")[:limit]


def _p7_lines(results):
    """Report only bounded verified metadata, never raw untrusted source text."""
    lines = [
        "## P7 advisory pilot",
        "",
        "Results are advisory. No Issue was approved and no GitHub or "
        "Telegram delivery was attempted by this report.",
        "",
    ]
    if not results:
        return lines + ["No approved meaningful Issue event to process.", ""]
    for result in results:
        data = result.data if isinstance(result.data, dict) else {}
        lines.append("### " + _plain(result.agent, 40))
        lines.append("")
        lines.append("Status: " + _plain(data.get("status", result.severity), 80))
        if data.get("outcome"):
            lines.append("Validation outcome: " + _plain(data["outcome"], 80))
        if data.get("confidence"):
            lines.append("Research confidence: " + _plain(data["confidence"], 80))
        if data.get("route"):
            lines.append("Human hand-off: " + _plain(data["route"], 100))
        if data.get("source_revision"):
            lines.append("Observed revision: " + _plain(data["source_revision"], 90))
        if data.get("role_run_id"):
            lines.append("Role run: " + _plain(data["role_run_id"], 90))
        if data.get("work_item_url"):
            url = str(data["work_item_url"])
            if url.startswith("https://github.com/jagports/jagports/issues/"):
                lines.append("Issue: " + _plain(url, 160))
        if data.get("usage"):
            usage = data["usage"]
            if isinstance(usage, dict):
                lines.append("Measured tokens (input/output): " +
                             _plain(usage.get("input_tokens"), 24) + "/" +
                             _plain(usage.get("output_tokens"), 24))
        if "estimated_cost_usd" in data:
            lines.append("Estimated USD cost: " +
                         _plain(data["estimated_cost_usd"], 40))
        if data.get("limitations"):
            lines.append("Limitations: " +
                         _plain("; ".join(map(str, data["limitations"])), 320))
        if result.severity == "blocked":
            lines.append("Review required: " + _plain(result.message, 220))
        lines.append("")
    return lines


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
    context = event_context or {}
    p7_mode = isinstance(context.get("p7"), dict) and (
        context["p7"].get("mode") == "advisory"
    )
    if p7_mode:
        report.extend(_p7_lines(documentation or []))
    else:
        # Preserve the original deterministic specialist/report behavior.
        report.extend(["## Agent Analysis Results", "", "## Event Context", "",
                       str(event_context), ""])
        if documentation:
            for result in documentation:
                report.append(str(result.to_dict()))
        else:
            report.append("No documentation analysis.")
        report.append("")
    return "\n".join(report)


def save_report(content):
    os.makedirs("reports", exist_ok=True)
    with open("reports/lead_report.md", "w", encoding="utf-8") as handle:
        handle.write(content)

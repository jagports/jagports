"""Jagports Lead Agent entry point; P7 is disabled unless explicitly authorized."""
import os
from pathlib import Path

import yaml
from dotenv import load_dotenv

from agents.lead_agent import LeadAgent
from services.github_service import GitHubService
from services import report_service


def _ghd_store(pending_path):
    """Use exactly the #904 producer's versioned outbox and sibling cursor."""
    from services.ghd_pending_store import GHDPendingStore

    pending_path = Path(pending_path)
    return GHDPendingStore(
        snapshot_path=pending_path.with_name("ghd_enrichment.json"),
        pending_path=pending_path,
    )


def load_ghd_pending_event(path):
    """Return only #904's integrity-checked, crash-recoverable pending event.

    Never deserialize an arbitrary event file directly as a paid P7 trigger.
    Missing or acknowledged records are a quiet no-work outcome.
    """
    pending = _ghd_store(path).replay_pending()
    if pending is None:
        return None
    return pending["changed_event"], pending["issue_context"]

def build_agent(config, github):
    """Keep the original deterministic coordinator unless both gates are on."""
    pilot = config.get("p7") or {}
    model_config = pilot.get("reasoning") or {}
    if not pilot.get("enabled", False):
        return LeadAgent(github)

    # Explicit, separate activation is mandatory; never inherit the manual
    # OpenAI smoke-test credential or implicit SDK defaults as approval.
    if (pilot.get("enabled") is not True or
            (config.get("openai") or {}).get("enabled") is not True or
            model_config.get("enabled") is not True):
        raise ValueError("P7 and model spending require independent explicit enablement.")
    if not isinstance(pilot.get("pending_event_file"), str) or not pilot["pending_event_file"]:
        raise ValueError("An accepted #904 pending-event source must be configured.")
    if not isinstance(pilot.get("approved_source_revision"), str) or not pilot["approved_source_revision"]:
        raise ValueError("Exact Product Owner approved source revision is required.")

    from services.p7_pilot import P7Pilot
    from services.reasoning_service import ReasoningService

    reasoning = ReasoningService(model_config)
    runner = P7Pilot(github, reasoning, pilot)
    pending_file = Path(pilot["pending_event_file"])
    return LeadAgent(
        github, ghd_store=_ghd_store(pending_file),
        p7_pilot=runner,
        p7_event_source=lambda: load_ghd_pending_event(pending_file),
    )


def main(config_file="config.yaml"):
    load_dotenv()
    with open(config_file, encoding="utf-8") as handle:
        config = yaml.safe_load(handle)
    if not isinstance(config, dict):
        raise ValueError("Agent configuration must be a mapping.")
    github_config = config["github"]
    github = GitHubService(
        os.getenv("GITHUB_TOKEN"), github_config["repository"],
        max_requests_per_run=github_config.get("max_requests_per_run", 12))
    agent = build_agent(config, github)
    issues, event, analysis = agent.run()
    report = report_service.create_report(
        issues, event.data, analysis, event.context
    )
    report_service.save_report(report)
    # The #904 outbox is acknowledged only AFTER the completed two-role
    # checkpoint and durable local report exist. An interrupted report leaves
    # the pending event for a no-charge checkpoint replay on the next run.
    p7 = event.context.get("p7")
    pending = event.context.get("ghd", {}).get("pending_event")
    if (isinstance(p7, dict) and p7.get("mode") == "advisory" and
            isinstance(pending, dict) and
            [result.agent for result in analysis] ==
            ["research", "product_vehicle", "team_lead"] and
            all(result.severity != "blocked" for result in analysis) and
            agent.p7_pilot.completed_event_key() == pending["event_key"] and
            all(result.data.get("source_revision") ==
                pending["changed_event"]["source_revision"]
                for result in analysis)):
        agent.ghd_store.acknowledge(pending["event_key"])
        p7["pending_acknowledged"] = True
    print("Changes:", event.data)
    # No automatic Telegram delivery, GitHub writes, or new timer.
    return issues, event, analysis


if __name__ == "__main__":
    main()

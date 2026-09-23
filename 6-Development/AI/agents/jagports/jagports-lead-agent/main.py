"""Jagports Lead Agent entry point; P7 is disabled unless explicitly authorized."""
import json
import os
from pathlib import Path

import yaml
from dotenv import load_dotenv

from agents.lead_agent import LeadAgent
from services.github_service import GitHubService
from services import report_service


def load_ghd_pending_event(path):
    """Read the durable #904 hand-off; do not infer an event from a snapshot.

    #904 is not implemented on this branch. Its writer must explicitly adopt
    this versioned hand-off before live P7 dispatch can be enabled.
    """
    with Path(path).open(encoding="utf-8") as handle:
        payload = json.load(handle)
    if (not isinstance(payload, dict) or
            payload.get("producer") != "ghd_increment_a" or
            payload.get("schema_version") != 1 or
            payload.get("status") != "pending" or
            not isinstance(payload.get("changed_event"), dict) or
            not isinstance(payload.get("issue_context"), dict)):
        raise ValueError("Unverified or incomplete #904 pending-event hand-off.")
    return payload["changed_event"], payload["issue_context"]


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
        github, p7_pilot=runner,
        p7_event_source=lambda: load_ghd_pending_event(pending_file),
    )


def main(config_file="config.yaml"):
    load_dotenv()
    with open(config_file, encoding="utf-8") as handle:
        config = yaml.safe_load(handle)
    if not isinstance(config, dict):
        raise ValueError("Agent configuration must be a mapping.")
    github = GitHubService(os.getenv("GITHUB_TOKEN"),
                           config["github"]["repository"])
    agent = build_agent(config, github)
    issues, event, analysis = agent.run()
    report = report_service.create_report(
        issues, event.data, analysis, event.context
    )
    report_service.save_report(report)
    print("Changes:", event.data)
    # No automatic Telegram delivery, GitHub writes, or new timer.
    return issues, event, analysis


if __name__ == "__main__":
    main()

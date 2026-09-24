"""Canonical entry point for the original Jagports AI OS Lead Agent.

Model-backed execution is opt-in through the original specialists, never a
second, vehicle-specific coordinator. Checked-in defaults remain offline.
"""
import os

import yaml
from dotenv import load_dotenv

from agents.lead_agent import LeadAgent
from services.github_service import GitHubService
from services import report_service


def build_agent(config, github):
    """Use the original specialist registry for every execution mode."""
    return LeadAgent(github)


def main(config_file="config.yaml"):
    load_dotenv()
    with open(config_file, encoding="utf-8") as handle:
        config = yaml.safe_load(handle)
    if not isinstance(config, dict):
        raise ValueError("Agent configuration must be a mapping.")
    github_config = config["github"]
    github = GitHubService(
        os.getenv("GITHUB_TOKEN"), github_config["repository"],
        max_requests_per_run=github_config.get("max_requests_per_run", 12),
    )
    agent = build_agent(config, github)
    issues, event, analysis = agent.run()
    report = report_service.create_report(
        issues, event.data, analysis, event.context,
    )
    report_service.save_report(report)
    print("Changes:", event.data)
    return issues, event, analysis


if __name__ == "__main__":
    main()

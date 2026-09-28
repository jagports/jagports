"""Canonical entry point for the Jagports AI OS Lead Agent."""
import os

import yaml
from dotenv import load_dotenv

from agents.lead_agent import LeadAgent
from services.github_service import GitHubService
from services.reasoning_service import ReasoningService
from services import report_service
from services.notification_outbox import NotificationOutbox


def build_agent(config, github):
    """Use the original specialist registry for every execution mode."""
    settings = config.get("reasoning") or {}
    if settings.get("enabled") is True:
        if config.get("openai", {}).get("enabled") is not True:
            raise ValueError("Paid reasoning requires explicit OpenAI enablement.")
        return LeadAgent(github, reasoning=ReasoningService(settings),
                         reasoning_config=settings)
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
    telegram_config = config.get("telegram") or {}
    if telegram_config.get("enabled") is True:
        if not os.getenv("TELEGRAM_BOT_TOKEN") or not os.getenv("TELEGRAM_CHAT_ID"):
            raise ValueError("Telegram is enabled without configured credentials.")
        pending = (event.context.get("ghd") or {}).get("pending_event")
        if pending:
            for result in analysis:
                if result.agent == "documentation" and result.data.get("source_issue"):
                    message = (f"Issue #{result.data['source_issue']}: "
                               f"{result.message}\n{result.data['source_url']}")
                    NotificationOutbox().queue(pending["event_key"], message)
        agent.acknowledge_pending(event)
        # Delivery failure leaves a durable pending message for the next run.
        NotificationOutbox().deliver_pending()
    else:
        agent.acknowledge_pending(event)
    print("Changes:", event.data)
    return issues, event, analysis


if __name__ == "__main__":
    main()

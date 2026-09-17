import os
import yaml

from dotenv import load_dotenv

from services.github_service import GitHubService
from services.telegram_service import notify

from agents.lead_agent import LeadAgent

from services import report_service

load_dotenv()



with open(
    "config.yaml",
    "r"
) as f:

    config = yaml.safe_load(f)



github = GitHubService(
    os.getenv(
        "GITHUB_TOKEN"
    ),
    config["github"]["repository"]
)



agent = LeadAgent(
    github
)


issues, event, documentation = agent.run()

changes = event.data

report = report_service.create_report(
    issues,
    changes,
    documentation,
    event.context
)

report_service.save_report(
    report
)

print(
    "Changes:",
    changes
)

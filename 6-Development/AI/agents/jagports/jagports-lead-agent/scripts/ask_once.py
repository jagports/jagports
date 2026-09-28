"""Explicit operator entry point for one authorized Telegram /ask update."""
import asyncio
import os

import yaml
from dotenv import load_dotenv

from agents.documentation_agent import DocumentationAgent
from services.reasoning_service import ReasoningService
from services.telegram_questions import process_one


def main():
    load_dotenv()
    with open("config.yaml", encoding="utf-8") as handle:
        config = yaml.safe_load(handle)
    settings = config.get("reasoning") or {}
    if (config.get("openai", {}).get("enabled") is not True or
            settings.get("enabled") is not True or
            settings.get("ask_enabled") is not True):
        raise ValueError("One-shot questions require separate local approval.")
    from telegram import Bot
    bot = Bot(token=os.environ["TELEGRAM_BOT_TOKEN"])
    agent = DocumentationAgent(ReasoningService(settings), settings)
    return asyncio.run(process_one(bot, agent))


if __name__ == "__main__":
    print(main())

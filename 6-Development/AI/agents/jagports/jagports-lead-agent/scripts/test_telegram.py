#!/usr/bin/env python3
"""Manually test Telegram delivery; no GitHub access or OpenAI cost."""
import asyncio
import os
from pathlib import Path
from dotenv import load_dotenv
from telegram import Bot

async def main():
    load_dotenv(".env")
    token = os.getenv("TELEGRAM_BOT_TOKEN")
    chat_id = os.getenv("TELEGRAM_CHAT_ID")
    if not token or not chat_id:
        raise RuntimeError("Private Telegram bot token or chat ID is missing")
    report = Path("reports/lead_report.md")
    has_report = report.is_file() and report.stat().st_size > 0
    async with Bot(token=token) as bot:
        await bot.get_me()
        await bot.send_message(
            chat_id=chat_id,
            text="Jagports AI OS: manually initiated Telegram delivery test.")
        if has_report:
            with report.open("rb") as document:
                await bot.send_document(
                    chat_id=chat_id, document=document,
                    filename="lead_report.md", caption="Current saved Lead Agent report")
    print("Telegram API accepted the test message" +
          (" and saved report" if has_report else "") +
          "; confirm receipt in your chat.")

if __name__ == "__main__":
    asyncio.run(main())

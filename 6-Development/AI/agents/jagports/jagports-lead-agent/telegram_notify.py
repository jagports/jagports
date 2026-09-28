import os
import asyncio

from dotenv import load_dotenv
from telegram import Bot


load_dotenv()


async def send_notification():

    filename = "notifications/pending_notification.txt"

    if not os.path.exists(filename):
        print("No pending notification")
        return

    with open(filename, "r") as f:
        message = f.read()

    bot = Bot(
        token=os.getenv("TELEGRAM_BOT_TOKEN")
    )

    await bot.send_message(
        chat_id=os.getenv("TELEGRAM_CHAT_ID"),
        text=message
    )

    print("Telegram notification sent")

    os.remove(filename)


if __name__ == "__main__":
    asyncio.run(send_notification())


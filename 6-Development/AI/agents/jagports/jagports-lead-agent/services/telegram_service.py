import os
import asyncio

from telegram import Bot


async def send(message):

    bot = Bot(
        token=os.getenv(
            "TELEGRAM_BOT_TOKEN"
        )
    )

    await bot.send_message(
        chat_id=os.getenv(
            "TELEGRAM_CHAT_ID"
        ),
        text=message
    )


def notify(message):

    asyncio.run(
        send(message)
    )


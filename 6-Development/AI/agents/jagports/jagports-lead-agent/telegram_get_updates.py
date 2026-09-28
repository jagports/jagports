import os
import asyncio

from dotenv import load_dotenv
from telegram import Bot


load_dotenv()


async def main():

    bot = Bot(
        token=os.getenv("TELEGRAM_BOT_TOKEN")
    )

    updates = await bot.get_updates()

    for update in updates:
        print(update)


asyncio.run(main())


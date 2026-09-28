import os
import asyncio

from dotenv import load_dotenv
from telegram import Bot


load_dotenv()


async def main():

    bot = Bot(
        token=os.getenv("TELEGRAM_BOT_TOKEN")
    )

    print(await bot.get_me())

    await bot.send_message(
        chat_id="370698970",
        text="Jagports Lead Agent test message"
    )


asyncio.run(main())


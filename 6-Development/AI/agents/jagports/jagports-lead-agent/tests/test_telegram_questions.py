"""One-shot Telegram authorization and replay without a live bot."""
import json
import os
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

from services.telegram_questions import process_one


def update(sender=7, text="/ask What should the guide explain?"):
    return SimpleNamespace(update_id=12, message=SimpleNamespace(
        chat=SimpleNamespace(id=5), from_user=SimpleNamespace(id=sender), text=text))


class FakeBot:
    def __init__(self, item, fail_send=False):
        self.item = item
        self.fail_send = fail_send
        self.sent = []

    async def get_updates(self, **kwargs):
        return [self.item]

    async def send_message(self, **kwargs):
        if self.fail_send:
            raise OSError("offline")
        self.sent.append(kwargs)


class FakeAgent:
    def __init__(self):
        self.calls = []

    def answer_question(self, question, update_id):
        self.calls.append((question, update_id))
        return SimpleNamespace(message="Review the guide with its owner.")


class TelegramQuestionTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.path = str(Path(temp.name) / "questions.json")
        env = patch.dict(os.environ, {"TELEGRAM_CHAT_ID": "5",
                                   "TELEGRAM_ALLOWED_SENDER_ID": "7"})
        env.start()
        self.addCleanup(env.stop)

    async def test_unauthorized_sender_never_calls_agent(self):
        agent = FakeAgent()
        bot = FakeBot(update(sender=9))
        self.assertEqual(await process_one(bot, agent, state_path=self.path), "ignored")
        self.assertEqual(agent.calls, [])
        self.assertEqual(bot.sent, [])

    async def test_non_user_message_never_calls_agent(self):
        agent = FakeAgent()
        item = update()
        item.message.from_user = None
        self.assertEqual(await process_one(FakeBot(item), agent,
                                           state_path=self.path), "ignored")
        self.assertEqual(agent.calls, [])

    async def test_failed_delivery_reuses_saved_answer(self):
        agent = FakeAgent()
        failing = FakeBot(update(), fail_send=True)
        with self.assertRaises(OSError):
            await process_one(failing, agent, state_path=self.path)
        saved = json.loads(Path(self.path).read_text())
        self.assertEqual(saved["pending"]["status"], "answered")
        retry = FakeBot(update())
        self.assertEqual(await process_one(retry, agent, state_path=self.path), "answered")
        self.assertEqual(len(agent.calls), 1)
        self.assertEqual(retry.sent[0]["text"], "Review the guide with its owner.")
        self.assertEqual(json.loads(Path(self.path).read_text())["last_update_id"], 12)

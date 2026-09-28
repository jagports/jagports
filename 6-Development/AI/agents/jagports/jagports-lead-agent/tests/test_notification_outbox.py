"""Durable notification delivery without repeating completed results."""
import json
import tempfile
import unittest
from pathlib import Path

from services.notification_outbox import NotificationOutbox


class NotificationOutboxTests(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.path = str(Path(temp.name) / "outbox.json")
        self.sent = []

    def test_queue_send_and_replay_do_not_resend(self):
        outbox = NotificationOutbox(self.path, sender=self.sent.append)
        outbox.queue("issue:42:rev", "Review issue 42")
        outbox.queue("issue:42:rev", "changed text")
        outbox.deliver_pending()
        NotificationOutbox(self.path, sender=self.sent.append).deliver_pending()
        self.assertEqual(self.sent, ["Review issue 42"])
        self.assertEqual(json.loads(Path(self.path).read_text())["entries"]
                         ["issue:42:rev"]["status"], "delivered")

    def test_failure_keeps_message_for_later_delivery(self):
        def fail(_message):
            raise OSError("offline")

        outbox = NotificationOutbox(self.path, sender=fail)
        outbox.queue("issue:42:rev", "Review issue 42")
        outbox.deliver_pending()
        saved = json.loads(Path(self.path).read_text())["entries"]["issue:42:rev"]
        self.assertEqual(saved["status"], "pending")
        self.assertEqual(saved["last_error_type"], "OSError")
        NotificationOutbox(self.path, sender=self.sent.append).deliver_pending()
        self.assertEqual(self.sent, ["Review issue 42"])

    def test_corrupt_outbox_fails_closed(self):
        Path(self.path).write_text("{}")
        with self.assertRaises(ValueError):
            NotificationOutbox(self.path, sender=self.sent.append).queue("key", "message")

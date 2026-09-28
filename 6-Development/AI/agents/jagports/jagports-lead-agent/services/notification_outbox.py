"""Durable, bounded Telegram delivery without repeating agent reasoning."""
import json

from services.reasoning_service import _ledger_lock, _write_json_atomic


class NotificationOutbox:
    def __init__(self, path="state/notification_outbox.json", sender=None):
        self.path = path
        self.sender = sender

    def _load(self):
        try:
            with open(self.path, encoding="utf-8") as handle:
                data = json.load(handle)
        except FileNotFoundError:
            return {"entries": {}}
        if not isinstance(data, dict) or not isinstance(data.get("entries"), dict):
            raise ValueError("Notification outbox requires operator recovery.")
        return data

    def queue(self, key, message):
        if not isinstance(key, str) or not key or not isinstance(message, str) or not 0 < len(message) <= 3000:
            raise ValueError("Notification identity and bounded message are required.")
        with _ledger_lock(self.path):
            data = self._load()
            data["entries"].setdefault(key, {"status": "pending", "message": message,
                                              "attempts": 0})
            _write_json_atomic(self.path, data)

    def deliver_pending(self):
        if self.sender is None:
            from services.telegram_service import notify
            self.sender = notify
        with _ledger_lock(self.path):
            data = self._load()
            for entry in data["entries"].values():
                if entry.get("status") != "pending":
                    continue
                if entry.get("attempts", 0) >= 3:
                    continue
                entry["attempts"] += 1
                _write_json_atomic(self.path, data)
                try:
                    self.sender(entry["message"])
                except Exception as exc:
                    entry["last_error_type"] = type(exc).__name__
                    _write_json_atomic(self.path, data)
                    continue
                entry["status"] = "delivered"
                entry.pop("last_error_type", None)
                _write_json_atomic(self.path, data)

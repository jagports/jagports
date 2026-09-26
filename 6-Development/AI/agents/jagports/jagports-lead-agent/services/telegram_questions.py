"""One-shot, authorized Telegram question intake with durable replay state."""
import json
import os

from services.reasoning_service import _ledger_lock, _write_json_atomic


def _read(path):
    try:
        with open(path, encoding="utf-8") as handle:
            state = json.load(handle)
    except FileNotFoundError:
        return {"last_update_id": -1}
    if (not isinstance(state, dict) or
            type(state.get("last_update_id")) is not int):
        raise ValueError("Telegram question state requires operator recovery.")
    return state


async def process_one(bot, agent, *, state_path="state/telegram_questions.json"):
    """Process at most one update; an already answered update never re-reasons."""
    chat_id = os.getenv("TELEGRAM_CHAT_ID")
    sender_id = os.getenv("TELEGRAM_ALLOWED_SENDER_ID")
    if not chat_id or not sender_id:
        raise ValueError("Authorized Telegram chat and sender are required.")
    with _ledger_lock(state_path):
        state = _read(state_path)
        updates = await bot.get_updates(offset=state["last_update_id"] + 1,
                                        limit=1, timeout=0)
        if not updates:
            return "idle"
        update = updates[0]
        update_id = update.update_id
        if type(update_id) is not int or update_id <= state["last_update_id"]:
            return "replayed"
        message = update.message
        text = getattr(message, "text", None)
        if (message is None or getattr(message, "chat", None) is None or
                getattr(message, "from_user", None) is None or
                str(message.chat.id) != chat_id or
                str(message.from_user.id) != sender_id or
                not isinstance(text, str) or not text.startswith("/ask ") or
                not 0 < len(text[5:].strip()) <= 500):
            state["last_update_id"] = update_id
            _write_json_atomic(state_path, state)
            return "ignored"
        question = text[5:].strip()
        pending = state.get("pending")
        if pending and (pending.get("update_id") != update_id or
                        pending.get("question") != question):
            raise ValueError("Unfinished Telegram question requires operator review.")
        if not pending:
            pending = {"update_id": update_id, "question": question,
                       "status": "pending"}
            state["pending"] = pending
            _write_json_atomic(state_path, state)
        if pending["status"] == "pending":
            result = agent.answer_question(question, update_id)
            pending["answer"] = result.message[:3000]
            pending["status"] = "answered"
            _write_json_atomic(state_path, state)
        await bot.send_message(chat_id=chat_id, text=pending["answer"])
        state["last_update_id"] = update_id
        state.pop("pending", None)
        _write_json_atomic(state_path, state)
        return "answered"

"""Budgeted, model-neutral JSON reasoning boundary for original specialists.

Reserve costs under a cross-process ledger lock *before* every provider call.
An uncertain attempt remains charged until explicitly reconciled; no automatic
retry can spend twice on a possibly billed request.
"""
import json
import math
import os
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from tempfile import NamedTemporaryFile


class ReasoningError(RuntimeError):
    pass


class BudgetExceeded(ReasoningError):
    pass


def _write_json_atomic(path, value):
    """Durably replace JSON. Callers must hold the ledger lock if shared."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with NamedTemporaryFile(mode="w", encoding="utf-8", dir=str(path.parent),
                            prefix=".usage-", delete=False) as handle:
        temp_path = handle.name
        try:
            json.dump(value, handle, indent=2, sort_keys=True)
            handle.flush()
            os.fsync(handle.fileno())
        except BaseException:
            handle.close()
            os.unlink(temp_path)
            raise
    os.replace(temp_path, path)
    if hasattr(os, "O_DIRECTORY"):
        fd = os.open(str(path.parent), os.O_RDONLY | os.O_DIRECTORY)
        try:
            os.fsync(fd)
        finally:
            os.close(fd)


@contextmanager
def _ledger_lock(path):
    """Serialize read/check/reserve and finish across processes, not just writes.

    flock is used on Linux/MyNode; Windows development uses msvcrt's one-byte
    locking. The sibling lock file persists so all processes lock the same inode.
    """
    path = Path(str(path) + ".lock")
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a+b") as handle:
        if os.name == "nt":
            import msvcrt
            handle.seek(0, os.SEEK_END)
            if handle.tell() == 0:
                handle.write(b"0")
                handle.flush()
            handle.seek(0)
            msvcrt.locking(handle.fileno(), msvcrt.LK_LOCK, 1)
            try:
                yield
            finally:
                handle.seek(0)
                msvcrt.locking(handle.fileno(), msvcrt.LK_UNLCK, 1)
        else:
            import fcntl
            fcntl.flock(handle.fileno(), fcntl.LOCK_EX)
            try:
                yield
            finally:
                fcntl.flock(handle.fileno(), fcntl.LOCK_UN)


class ReasoningService:
    """Durable, budgeted calls for approved specialist roles."""

    def __init__(self, config, client=None):
        self.config = dict(config)
        self.client = client
        self.calls = 0
        # Convenience only: authoritative per-run spending is always the ledger.
        self.run_reserved_usd = 0.0
        self.ledger_path = self.config.get("ledger_path", "state/model_usage.json")

    def _validate(self):
        c = self.config
        if c.get("enabled") is not True:
            raise ReasoningError("Paid reasoning is disabled.")
        required = ("model", "max_calls_per_run", "max_input_tokens",
                    "max_output_tokens", "max_run_cost_usd", "max_daily_cost_usd",
                    "max_total_cost_usd",
                    "input_usd_per_million_tokens", "output_usd_per_million_tokens")
        if any(not c.get(key) for key in required):
            raise ReasoningError("Model, token and approved cost limits are required.")
        if not isinstance(c["model"], str) or not c["model"].strip():
            raise ReasoningError("An approved model name is required.")
        if type(c["max_calls_per_run"]) is not int or not 1 <= c["max_calls_per_run"] <= 3:
            raise BudgetExceeded("One to three specialist calls per run must be approved.")
        if self.calls >= c["max_calls_per_run"]:
            raise BudgetExceeded("Approved per-run call limit reached.")
        if any(type(c[k]) is not int or c[k] < 1
               for k in ("max_input_tokens", "max_output_tokens")):
            raise ReasoningError("Positive integer token caps are required.")
        for k in ("max_run_cost_usd", "max_daily_cost_usd", "max_total_cost_usd",
                  "input_usd_per_million_tokens", "output_usd_per_million_tokens"):
            try:
                value = float(c[k])
            except (TypeError, ValueError) as exc:
                raise ReasoningError("Valid approved cost and pricing limits are required.") from exc
            if not math.isfinite(value) or value <= 0:
                raise ReasoningError("All cost and pricing limits must be finite and positive.")
        if self.client is None and not os.environ.get("OPENAI_API_KEY"):
            raise ReasoningError("OPENAI_API_KEY is not configured.")

    def _ledger(self):
        try:
            with open(self.ledger_path, encoding="utf-8") as handle:
                data = json.load(handle)
        except FileNotFoundError:
            return {"attempts": {}}
        except (json.JSONDecodeError, UnicodeError, OSError) as exc:
            raise ReasoningError("Usage ledger is unreadable; reconcile before spending.") from exc
        if not isinstance(data, dict) or not isinstance(data.get("attempts"), dict):
            raise ReasoningError("Usage ledger is malformed; reconcile before spending.")
        if any(not isinstance(entry, dict) for entry in data["attempts"].values()):
            raise ReasoningError("Usage ledger has malformed attempts.")
        return data

    @staticmethod
    def _run_key(role, request_key):
        # Stable IDs end with the approved role; old ledger entries are retained.
        if (not isinstance(request_key, str) or
                not request_key.endswith(":" + role) or
                not request_key[:-(len(role) + 1)]):
            raise ReasoningError("A stable role-specific request ID is required.")
        return request_key[:-(len(role) + 1)]

    def _reserve(self, role, request_key, run_key, maximum_cost, day):
        c = self.config
        with _ledger_lock(self.ledger_path):
            ledger = self._ledger()
            attempts = ledger["attempts"]
            if request_key in attempts:
                entry = attempts[request_key]
                if entry.get("status") == "complete":
                    return entry["result"]
                raise ReasoningError("Previous attempt is uncertain; reconcile usage before retry.")

            # Include reservations from *previous processes* for the same run.
            # Legacy entries have no run_key; derive it from their stable IDs.
            same_run = [
                entry for key, entry in attempts.items()
                if entry.get("run_key", key.rsplit(":", 1)[0]) == run_key
            ]
            if len(same_run) >= c["max_calls_per_run"]:
                raise BudgetExceeded("Approved per-run call limit reached.")
            if any(entry.get("role") == role for entry in same_run):
                raise BudgetExceeded("This role already has a reservation for the run.")
            run_reserved = sum(float(entry.get("reserved_usd", 0))
                               for entry in same_run)
            daily_reserved = sum(float(entry.get("reserved_usd", 0))
                                 for entry in attempts.values()
                                 if entry.get("day") == day)
            # The $5 API pool is not renewed at midnight. Reservations from
            # every previous day and process count, including uncertain calls.
            total_reserved = sum(float(entry.get("reserved_usd", 0))
                                 for entry in attempts.values())
            if (not math.isfinite(run_reserved) or
                    run_reserved + maximum_cost > float(c["max_run_cost_usd"]) + 1e-12):
                raise BudgetExceeded("Approved per-run budget exhausted.")
            if (not math.isfinite(daily_reserved) or
                    daily_reserved + maximum_cost > float(c["max_daily_cost_usd"]) + 1e-12):
                raise BudgetExceeded("Approved daily budget exhausted.")
            if (not math.isfinite(total_reserved) or
                    total_reserved + maximum_cost > float(c["max_total_cost_usd"]) + 1e-12):
                raise BudgetExceeded("Approved cumulative API budget exhausted.")

            attempts[request_key] = {
                "day": day, "role": role, "run_key": run_key,
                "status": "started", "reserved_usd": maximum_cost,
            }
            _write_json_atomic(self.ledger_path, ledger)
            self.calls += 1
            self.run_reserved_usd = run_reserved + maximum_cost
            return None

    def _finish(self, request_key, status, *, result=None, usage=None,
                measured_cost=None, error_type=None):
        # Reload under the lock: another process may have reserved a role while
        # the provider was responding. Never overwrite that other reservation.
        with _ledger_lock(self.ledger_path):
            ledger = self._ledger()
            entry = ledger["attempts"].get(request_key)
            if not isinstance(entry, dict) or entry.get("status") != "started":
                raise ReasoningError("Ledger reservation changed; operator review required.")
            if usage is not None:
                entry["measured_usage"] = usage
            if measured_cost is not None:
                entry["measured_estimated_cost_usd"] = measured_cost
                # On a provider overrun, conservatively charge the larger figure.
                entry["reserved_usd"] = max(float(entry["reserved_usd"]), measured_cost)
            entry["status"] = status
            if status == "complete":
                entry["result"] = result
            else:
                entry["error_type"] = error_type or "Unknown"
            _write_json_atomic(self.ledger_path, ledger)

    def analyse_json(self, role, instructions, context, request_key):
        self._validate()
        if role not in ("documentation", "deployment", "knowledge"):
            raise ReasoningError("Unapproved specialist role.")
        if not isinstance(context, dict) or not isinstance(instructions, str):
            raise ReasoningError("Valid bounded context and instructions required.")
        run_key = self._run_key(role, request_key)

        c = self.config
        content = json.dumps(context, ensure_ascii=False, separators=(",", ":"))
        estimated_input = (len(content) + len(instructions) + 2) // 3 + 128
        if estimated_input > c["max_input_tokens"]:
            raise BudgetExceeded("Context exceeds approved input-token estimate.")
        maximum_cost = (
            c["max_input_tokens"] * float(c["input_usd_per_million_tokens"])
            + c["max_output_tokens"] * float(c["output_usd_per_million_tokens"])
        ) / 1_000_000
        day = datetime.now(timezone.utc).date().isoformat()
        completed = self._reserve(role, request_key, run_key, maximum_cost, day)
        if completed is not None:
            return completed

        usage_data = None
        actual_cost = None
        try:
            if self.client is None:
                from openai import OpenAI
                self.client = OpenAI(api_key=os.environ["OPENAI_API_KEY"],
                                     timeout=float(c.get("timeout_seconds", 30)),
                                     max_retries=0)
            response = self.client.responses.create(
                model=c["model"],
                max_output_tokens=c["max_output_tokens"],
                input=[
                    {"role": "system", "content": instructions},
                    {"role": "user", "content": content},
                ],
            )
            usage = getattr(response, "usage", None)
            if usage is None:
                raise ReasoningError("Provider did not return token usage.")
            input_tokens = getattr(usage, "input_tokens", None)
            output_tokens = getattr(usage, "output_tokens", None)
            if (type(input_tokens) is not int or input_tokens < 1 or
                    type(output_tokens) is not int or output_tokens < 1):
                raise ReasoningError("Provider returned invalid token usage.")
            usage_data = {"input_tokens": input_tokens, "output_tokens": output_tokens}
            actual_cost = (
                input_tokens * float(c["input_usd_per_million_tokens"])
                + output_tokens * float(c["output_usd_per_million_tokens"])
            ) / 1_000_000
            if (input_tokens > c["max_input_tokens"] or
                    output_tokens > c["max_output_tokens"] or
                    actual_cost > maximum_cost + 1e-12):
                raise BudgetExceeded("Provider usage exceeded approved token or cost cap.")
            output = json.loads(response.output_text)
            if not isinstance(output, dict):
                raise ReasoningError("Model output must be one JSON object.")
            result = {
                "output": output, "model": c["model"],
                "usage": usage_data, "estimated_cost_usd": actual_cost,
                "provider_response_id": getattr(response, "id", None),
            }
            self._finish(request_key, "complete", result=result,
                         usage=usage_data, measured_cost=actual_cost)
            return result
        except Exception as exc:
            # A failed call may still be billed; never release its reservation.
            self._finish(request_key, "uncertain", usage=usage_data,
                         measured_cost=actual_cost, error_type=type(exc).__name__)
            raise ReasoningError(
                "Model request failed or exceeded limits; prior attempt requires reconciliation."
            ) from exc

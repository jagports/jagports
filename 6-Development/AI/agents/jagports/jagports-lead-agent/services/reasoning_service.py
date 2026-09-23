"""Budgeted, model-neutral JSON reasoning boundary for the read-only P7 pilot.

The initial provider is the existing OpenAI Responses API. Do not retry an
uncertain paid request automatically: its prior completion may have been billed.
"""
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from tempfile import NamedTemporaryFile


class ReasoningError(RuntimeError):
    pass


class BudgetExceeded(ReasoningError):
    pass


def _write_json_atomic(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with NamedTemporaryFile(mode="w", encoding="utf-8", dir=str(path.parent),
                            prefix=".usage-", delete=False) as handle:
        json.dump(value, handle, indent=2, sort_keys=True)
        temp_path = handle.name
    os.replace(temp_path, path)


class ReasoningService:
    """Exactly two separately identified, bounded calls at most per pilot run."""

    def __init__(self, config, client=None):
        self.config = dict(config)
        self.client = client
        self.calls = 0
        self.run_reserved_usd = 0.0
        self.ledger_path = self.config.get("ledger_path", "state/model_usage.json")

    def _validate(self):
        c = self.config
        if not c.get("enabled", False):
            raise ReasoningError("Paid reasoning is disabled.")
        required = ("model", "max_calls_per_run", "max_input_tokens",
                    "max_output_tokens", "max_run_cost_usd", "max_daily_cost_usd",
                    "input_usd_per_million_tokens", "output_usd_per_million_tokens")
        if any(not c.get(key) for key in required):
            raise ReasoningError("Pilot model, token and approved cost limits are required.")
        if c["max_calls_per_run"] != 2 or self.calls >= 2:
            raise BudgetExceeded("The pilot permits at most two role calls per run.")
        if any(float(c[key]) <= 0 for key in required[1:]):
            raise ReasoningError("All token and spending limits must be positive.")
        if self.client is None and not os.environ.get("OPENAI_API_KEY"):
            raise ReasoningError("OPENAI_API_KEY is not configured.")

    def _ledger(self):
        try:
            with open(self.ledger_path, encoding="utf-8") as f:
                data = json.load(f)
                return data if isinstance(data, dict) else {}
        except FileNotFoundError:
            return {}

    def analyse_json(self, role, instructions, context, request_key):
        self._validate()
        if role not in ("research", "product_vehicle"):
            raise ReasoningError("Unapproved specialist role.")
        if not isinstance(context, dict) or not request_key:
            raise ReasoningError("Valid, bounded context and stable request ID required.")

        c = self.config
        today = datetime.now(timezone.utc).date().isoformat()
        ledger = self._ledger()
        attempts = ledger.setdefault("attempts", {})
        if request_key in attempts:
            entry = attempts[request_key]
            if entry.get("status") == "complete":
                return entry["result"]
            raise ReasoningError("Previous attempt is uncertain; reconcile usage before retry.")

        content = json.dumps(context, ensure_ascii=False, separators=(",", ":"))
        # Conservative preflight; actual provider usage is recorded afterward.
        estimated_input = (len(content) + len(instructions) + 2) // 3 + 128
        if estimated_input > int(c["max_input_tokens"]):
            raise BudgetExceeded("Context exceeds approved input-token estimate.")
        maximum_cost = (
            int(c["max_input_tokens"]) * float(c["input_usd_per_million_tokens"])
            + int(c["max_output_tokens"]) * float(c["output_usd_per_million_tokens"])
        ) / 1_000_000
        if self.run_reserved_usd + maximum_cost > float(c["max_run_cost_usd"]):
            raise BudgetExceeded("Approved per-run budget exhausted.")
        accrued = sum(
            float(item.get("reserved_usd", 0))
            for item in attempts.values() if item.get("day") == today
        )
        if accrued + maximum_cost > float(c["max_daily_cost_usd"]):
            raise BudgetExceeded("Approved daily budget exhausted.")

        # Reserve BEFORE sending. On an interrupted/failed request, this remains
        # conservatively charged and never silently retries a possibly paid call.
        attempts[request_key] = {
            "day": today, "role": role, "status": "started",
            "reserved_usd": maximum_cost,
        }
        _write_json_atomic(self.ledger_path, ledger)
        self.calls += 1
        self.run_reserved_usd += maximum_cost

        try:
            if self.client is None:
                from openai import OpenAI
                self.client = OpenAI(api_key=os.environ["OPENAI_API_KEY"],
                                     timeout=float(c.get("timeout_seconds", 30)),
                                     max_retries=0)
            response = self.client.responses.create(
                model=c["model"],
                max_output_tokens=int(c["max_output_tokens"]),
                input=[
                    {"role": "system", "content": instructions},
                    {"role": "user", "content": content},
                ],
            )
            output = json.loads(response.output_text)
            if not isinstance(output, dict):
                raise ReasoningError("Model output must be one JSON object.")
            usage = getattr(response, "usage", None)
            if usage is None:
                raise ReasoningError("Provider did not return token usage.")
            input_tokens = int(getattr(usage, "input_tokens", 0))
            output_tokens = int(getattr(usage, "output_tokens", 0))
            if input_tokens < 1 or output_tokens < 1:
                raise ReasoningError("Provider returned invalid token usage.")
            estimated_cost = (
                input_tokens * float(c["input_usd_per_million_tokens"])
                + output_tokens * float(c["output_usd_per_million_tokens"])
            ) / 1_000_000
            result = {
                "output": output,
                "model": c["model"],
                "usage": {"input_tokens": input_tokens, "output_tokens": output_tokens},
                "estimated_cost_usd": estimated_cost,
                "provider_response_id": getattr(response, "id", None),
            }
            attempts[request_key].update({"status": "complete", "result": result})
            _write_json_atomic(self.ledger_path, ledger)
            return result
        except Exception as exc:
            attempts[request_key]["status"] = "uncertain"
            attempts[request_key]["error_type"] = type(exc).__name__
            _write_json_atomic(self.ledger_path, ledger)
            # Never log response text, credentials, or arbitrary Issue content.
            raise ReasoningError("Model request failed or returned invalid output; "
                                 "previous attempt requires reconciliation.") from exc

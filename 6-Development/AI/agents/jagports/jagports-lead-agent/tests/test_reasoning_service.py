"""Offline ReasoningService budget and failure regression tests.

Exercises cross-process reservations, restart-durable cost limits, provider
token overruns, uncertain paid attempts, and fail-closed ledger recovery.
"""
import json
import multiprocessing
import os
import tempfile
import threading
import unittest
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

from services.reasoning_service import BudgetExceeded, ReasoningError, ReasoningService


def configuration(ledger_path, **updates):
    result = {
        "enabled": True, "model": "mock-model",
        "max_calls_per_run": 2, "max_input_tokens": 5000,
        "max_output_tokens": 100, "max_run_cost_usd": 0.02,
        "max_daily_cost_usd": 0.02,
        "max_total_cost_usd": 0.02,
        "input_usd_per_million_tokens": 1.0,
        "output_usd_per_million_tokens": 1.0,
        "ledger_path": str(ledger_path),
    }
    result.update(updates)
    return result


def mock_response(*, output='{"status":"supported"}', input_tokens=140,
                  output_tokens=28):
    return SimpleNamespace(
        output_text=output, id="mock-response",
        usage=SimpleNamespace(input_tokens=input_tokens,
                              output_tokens=output_tokens),
    )


class OfflineClient:
    def __init__(self, response=None, error=None):
        self.response = response or mock_response()
        self.error = error
        self.calls = []
        self.responses = self

    def create(self, **kwargs):
        self.calls.append(kwargs)
        if self.error:
            raise self.error
        return self.response


def _separate_process_attempt(config, gate, ready, output, request_key):
    client = OfflineClient()
    service = ReasoningService(config, client=client)
    ready.put("ready")
    if not gate.wait(timeout=15):
        output.put("timeout")
        return
    try:
        service.analyse_json("research", "Only supplied evidence.",
                             {"question": "What is supported?"}, request_key)
        output.put("reserved")
    except BudgetExceeded:
        output.put("blocked")
    except Exception as exc:
        output.put(type(exc).__name__)


class ReasoningBudgetTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.ledger = Path(self.temp.name) / "usage.json"

    def run_one(self, service, request="issue:42:research"):
        return service.analyse_json("research", "Only supplied evidence.",
                                    {"question": "What is supported?"}, request)

    def test_mocked_success_records_measured_usage_and_atomic_ledger(self):
        client = OfflineClient()
        service = ReasoningService(configuration(self.ledger), client=client)
        result = self.run_one(service)
        self.assertEqual(result["usage"], {"input_tokens": 140, "output_tokens": 28})
        self.assertEqual(result["model"], "mock-model")
        self.assertAlmostEqual(result["estimated_cost_usd"], 0.000168)
        self.assertEqual(client.calls[0]["max_output_tokens"], 100)
        attempts = json.loads(self.ledger.read_text())["attempts"]
        self.assertEqual(attempts["issue:42:research"]["status"], "complete")
        self.assertGreater(attempts["issue:42:research"]["reserved_usd"], 0)

    def test_second_role_allowed_but_third_call_blocked(self):
        client = OfflineClient()
        service = ReasoningService(configuration(self.ledger), client=client)
        self.run_one(service)
        service.analyse_json("product_vehicle", "Validate independently.",
                             {"question": "Evidence?"}, "issue:42:product_vehicle")
        with self.assertRaises(BudgetExceeded):
            self.run_one(service, request="issue:43:research")
        self.assertEqual(len(client.calls), 2)

    def test_disabled_or_unconfigured_model_fails_without_request(self):
        client = OfflineClient()
        for values in ({"enabled": False}, {"model": ""}, {"max_output_tokens": 0},
                       {"max_run_cost_usd": 0}):
            with self.subTest(values=values):
                cfg = configuration(self.ledger, **values)
                with self.assertRaises(ReasoningError):
                    self.run_one(ReasoningService(cfg, client=client))
        self.assertEqual(client.calls, [])

    def test_missing_credential_fails_closed_without_constructing_provider(self):
        with patch.dict(os.environ, {"OPENAI_API_KEY": ""}):
            service = ReasoningService(configuration(self.ledger), client=None)
            with self.assertRaisesRegex(ReasoningError, "OPENAI_API_KEY"):
                self.run_one(service)
        self.assertFalse(self.ledger.exists())

    def test_oversized_input_rejected_before_reservation(self):
        client = OfflineClient()
        service = ReasoningService(
            configuration(self.ledger, max_input_tokens=2), client=client)
        with self.assertRaises(BudgetExceeded):
            self.run_one(service)
        self.assertFalse(self.ledger.exists())
        self.assertEqual(client.calls, [])

    def test_run_and_daily_cost_caps_block_second_reservation(self):
        for cap in ("max_run_cost_usd", "max_daily_cost_usd"):
            path = Path(self.temp.name) / (cap + ".json")
            client = OfflineClient()
            cfg = configuration(path, **{cap: 0.006})
            service = ReasoningService(cfg, client=client)
            self.run_one(service)
            with self.assertRaises(BudgetExceeded):
                service.analyse_json(
                    "product_vehicle", "Domain validation.",
                    {"question": "Is it supported?"}, "issue:42:product_vehicle")
            self.assertEqual(len(client.calls), 1)

    def test_cumulative_budget_counts_prior_days_without_live_requests(self):
        # No network, no large-volume load: two mocked attempts prove the cap.
        cfg = configuration(self.ledger, max_total_cost_usd=0.006)
        initial = OfflineClient()
        self.run_one(ReasoningService(cfg, client=initial))
        entries = json.loads(self.ledger.read_text(encoding="utf-8"))
        entries["attempts"]["issue:42:research"]["day"] = "2020-01-01"
        self.ledger.write_text(json.dumps(entries), encoding="utf-8")
        next_day = OfflineClient()
        with self.assertRaisesRegex(BudgetExceeded, "cumulative"):
            self.run_one(ReasoningService(cfg, client=next_day),
                         request="issue:43:research")
        self.assertEqual(len(initial.calls), 1)
        self.assertEqual(next_day.calls, [])
        self.assertEqual(len(json.loads(self.ledger.read_text())["attempts"]), 1)

    def test_uncertain_prior_day_reservation_remains_in_total(self):
        cfg = configuration(self.ledger, max_total_cost_usd=0.006)
        failed = OfflineClient(error=RuntimeError("offline provider failure"))
        with self.assertRaises(ReasoningError):
            self.run_one(ReasoningService(cfg, client=failed))
        entries = json.loads(self.ledger.read_text(encoding="utf-8"))
        entries["attempts"]["issue:42:research"]["day"] = "2020-01-01"
        self.ledger.write_text(json.dumps(entries), encoding="utf-8")
        next_attempt = OfflineClient()
        with self.assertRaisesRegex(BudgetExceeded, "cumulative"):
            self.run_one(ReasoningService(cfg, client=next_attempt),
                         request="issue:44:research")
        self.assertEqual(next_attempt.calls, [])

    def test_no_cumulative_budget_blocks_paid_calls(self):
        client = OfflineClient()
        cfg = configuration(self.ledger)
        cfg.pop("max_total_cost_usd")
        with self.assertRaisesRegex(ReasoningError, "required"):
            self.run_one(ReasoningService(cfg, client=client))
        self.assertEqual(client.calls, [])
        self.assertFalse(self.ledger.exists())

    def test_invalid_json_is_uncertain_and_not_silently_retried(self):
        client = OfflineClient(response=mock_response(output="not-json"))
        config = configuration(self.ledger)
        service = ReasoningService(config, client=client)
        with self.assertRaises(ReasoningError):
            self.run_one(service)
        entry = json.loads(self.ledger.read_text())["attempts"]["issue:42:research"]
        self.assertEqual(entry["status"], "uncertain")
        restarted = ReasoningService(config, client=client)
        with self.assertRaisesRegex(ReasoningError, "uncertain"):
            self.run_one(restarted)
        self.assertEqual(len(client.calls), 1)

    def test_rate_limit_and_provider_failure_remain_reserved(self):
        for name in ("rate_limit", "provider_failure"):
            path = Path(self.temp.name) / (name + ".json")
            client = OfflineClient(error=RuntimeError(name))
            service = ReasoningService(configuration(path), client=client)
            with self.assertRaises(ReasoningError):
                self.run_one(service)
            self.assertEqual(
                json.loads(path.read_text())["attempts"]["issue:42:research"]["status"],
                "uncertain",
            )
            self.assertEqual(len(client.calls), 1)

    def test_interruption_after_reservation_requires_operator_reconciliation(self):
        client = OfflineClient(error=KeyboardInterrupt())
        # KeyboardInterrupt deliberately escapes Exception handling, simulating
        # host termination between a durable reservation and result persistence.
        service = ReasoningService(configuration(self.ledger), client=client)
        with self.assertRaises(KeyboardInterrupt):
            self.run_one(service)
        entry = json.loads(self.ledger.read_text())["attempts"]["issue:42:research"]
        self.assertEqual(entry["status"], "started")
        restarted = ReasoningService(configuration(self.ledger),
                                     client=OfflineClient())
        with self.assertRaisesRegex(ReasoningError, "uncertain"):
            self.run_one(restarted)

    def test_provider_token_overrun_must_not_be_accepted(self):
        client = OfflineClient(response=mock_response(output_tokens=101))
        service = ReasoningService(configuration(self.ledger), client=client)
        with self.assertRaises(ReasoningError):
            self.run_one(service)
        entry = json.loads(self.ledger.read_text())["attempts"]["issue:42:research"]
        self.assertEqual(entry["status"], "uncertain")
        self.assertEqual(entry["measured_usage"]["output_tokens"], 101)
        with self.assertRaisesRegex(ReasoningError, "uncertain"):
            self.run_one(ReasoningService(configuration(self.ledger), client=client))
        self.assertEqual(len(client.calls), 1)

    def test_provider_input_token_overrun_must_not_be_accepted(self):
        client = OfflineClient(response=mock_response(input_tokens=5001))
        with self.assertRaises(ReasoningError):
            self.run_one(ReasoningService(configuration(self.ledger), client=client))
        entry = json.loads(self.ledger.read_text())["attempts"]["issue:42:research"]
        self.assertEqual(entry["status"], "uncertain")
        self.assertEqual(entry["measured_usage"]["input_tokens"], 5001)

    def test_restart_cannot_reset_per_run_reservations(self):
        cfg = configuration(self.ledger, max_run_cost_usd=0.006)
        first = ReasoningService(cfg, client=OfflineClient())
        self.run_one(first)
        second_client = OfflineClient()
        restarted = ReasoningService(cfg, client=second_client)
        with self.assertRaises(BudgetExceeded):
            restarted.analyse_json("product_vehicle", "Independent validation.",
                                   {"question": "Is it confirmed?"},
                                   "issue:42:product_vehicle")
        self.assertEqual(len(second_client.calls), 0)
        self.assertEqual(len(json.loads(self.ledger.read_text())["attempts"]), 1)

    def test_completion_preserves_other_process_reservation(self):
        cfg = configuration(self.ledger)
        second_client = OfflineClient()
        second = ReasoningService(cfg, client=second_client)

        class InterleavingClient(OfflineClient):
            def create(self, **kwargs):
                second.analyse_json("product_vehicle", "Validate separately.",
                                    {"question": "Check?"},
                                    "issue:42:product_vehicle")
                return super().create(**kwargs)

        first = ReasoningService(cfg, client=InterleavingClient())
        self.run_one(first)
        ledger = json.loads(self.ledger.read_text())["attempts"]
        self.assertEqual(len(ledger), 2)
        self.assertTrue(all(x["status"] == "complete" for x in ledger.values()))

    def test_unreadable_ledger_blocks_all_model_requests(self):
        self.ledger.write_text("{incomplete", encoding="utf-8")
        client = OfflineClient()
        with self.assertRaisesRegex(ReasoningError, "unreadable"):
            self.run_one(ReasoningService(configuration(self.ledger), client=client))
        self.assertEqual(client.calls, [])

    def test_concurrent_daily_reservations_must_be_serialized(self):
        # Two separate instances contend for one shared file-based allowance.
        gate = threading.Barrier(2)
        cfg = configuration(self.ledger, max_daily_cost_usd=0.006)
        first = ReasoningService(cfg, client=OfflineClient())
        second = ReasoningService(cfg, client=OfflineClient())

        def attempt(instance, key):
            gate.wait(timeout=5)
            try:
                self.run_one(instance, request=key)
                return "reserved"
            except BudgetExceeded:
                return "blocked"

        with ThreadPoolExecutor(max_workers=2) as executor:
            a = executor.submit(attempt, first, "issue:42:research")
            b = executor.submit(attempt, second, "issue:43:research")
            outcomes = sorted((a.result(), b.result()))
        self.assertEqual(outcomes, ["blocked", "reserved"])
        self.assertEqual(len(first.client.calls) + len(second.client.calls), 1)

    def test_cross_process_daily_reservations_are_serialized(self):
        ctx = multiprocessing.get_context("spawn")
        gate, ready, output = ctx.Event(), ctx.Queue(), ctx.Queue()
        cfg = configuration(self.ledger, max_daily_cost_usd=0.006)
        children = [ctx.Process(target=_separate_process_attempt,
                                args=(cfg, gate, ready, output, "issue:%d:research" % n))
                    for n in (42, 43)]
        for child in children:
            child.start()
        try:
            self.assertEqual([ready.get(timeout=15) for _ in children], ["ready", "ready"])
            gate.set()
            results = sorted(output.get(timeout=15) for _ in children)
            self.assertEqual(results, ["blocked", "reserved"])
        finally:
            gate.set()
            for child in children:
                child.join(timeout=15)
                if child.is_alive():
                    child.terminate()
                    child.join(timeout=5)
        self.assertTrue(all(child.exitcode == 0 for child in children))
        self.assertEqual(len(json.loads(self.ledger.read_text())["attempts"]), 1)


if __name__ == "__main__":
    unittest.main()

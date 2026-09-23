"""Offline ReasoningService budget and failure regression tests.

The two expected failures document known implementation gaps: cross-process
reservation serialization and validation of provider-reported token overruns.
They must be resolved before authorizing paid unattended execution.
"""
import json
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

    @unittest.expectedFailure
    def test_provider_token_overrun_must_not_be_accepted(self):
        # Current implementation validates positive usage but not the caps.
        client = OfflineClient(response=mock_response(output_tokens=101))
        service = ReasoningService(configuration(self.ledger), client=client)
        with self.assertRaises(ReasoningError):
            self.run_one(service)

    @unittest.expectedFailure
    def test_concurrent_daily_reservations_must_be_serialized(self):
        # Two separate services deliberately load the same old ledger before
        # either reserves. Current atomic replace does not serialize read/write.
        barrier = threading.Barrier(2)
        parent = ReasoningService

        class SimultaneousService(parent):
            def _ledger(self):
                snapshot = super()._ledger()
                barrier.wait(timeout=5)
                return snapshot

        config = configuration(self.ledger, max_daily_cost_usd=0.006)
        first = SimultaneousService(config, client=OfflineClient())
        second = SimultaneousService(config, client=OfflineClient())

        def attempt(instance, key):
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


if __name__ == "__main__":
    unittest.main()

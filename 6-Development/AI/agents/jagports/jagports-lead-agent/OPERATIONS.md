# Jagports Lead Agent — Operations

The Raspberry Pi agent runs as `codex` through its existing 585-minute user timer. The one-time checkout migration and manual updates from reviewed `main` are in [USAGE_UPDATER.md](USAGE_UPDATER.md). Host service setup is in the [MyNode installation guide](../../../../../3-Deployment/hardware/RaspberryPI/MyNodeBTC/Jagports_Lead_Agent_Installation.md).

For a one-shot runtime check, run `./venv/bin/python main.py` from `/home/codex/jagports-lead-agent` as `codex`, then inspect `reports/lead_report.md` and `state/agent_state.json`. A direct API call or manually sent Telegram message does not establish integrated specialist reasoning or scheduled delivery. Keep `.env` and `state/model_usage.json` private.

For offline regressions, run `./venv/bin/python -m unittest discover -s tests -p 'test_*.py' -q` with API credentials removed from the environment. The launcher and installed service both use `main.py`.

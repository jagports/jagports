#!/usr/bin/env python3
import json
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

REPO = os.environ["REPOSITORY"]
RECORD_TYPE = os.environ["RECORD_TYPE"]
NUMBER = int(os.environ["RECORD_NUMBER"])
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
SYNC_TOKEN = os.environ.get("GH_SYNC_TOKEN", "")
COMMENT_TOKEN = os.environ.get("GH_COMMENT_TOKEN", "")
MODEL = os.environ.get("OPENAI_MODEL", "gpt-5.6-luna")
PROJECT_NUMBER = os.environ.get("PROJECT_NUMBER", "9")

if RECORD_TYPE not in {"issue", "pr"}:
    raise SystemExit(f"Unsupported RECORD_TYPE: {RECORD_TYPE}")

def request_json(url, *, token=None, method="GET", data=None, headers=None, timeout=60):
    h = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "jagports-prioritization-executor",
    }
    if token:
        h["Authorization"] = f"Bearer {token}"
    if headers:
        h.update(headers)
    payload = None if data is None else json.dumps(data).encode("utf-8")
    if payload is not None:
        h["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=payload, headers=h, method=method)
    with urllib.request.urlopen(req, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))

def github_api(path, *, token, method="GET", data=None):
    return request_json(
        f"https://api.github.com/repos/{REPO}/{path}",
        token=token,
        method=method,
        data=data,
    )

def post_failure(message):
    if not COMMENT_TOKEN:
        return
    try:
        github_api(
            f"issues/{NUMBER}/comments",
            token=COMMENT_TOKEN,
            method="POST",
            data={"body": f"Automatic prioritization **FAILED** for {RECORD_TYPE} #{NUMBER}.\n\n{message}\n\nNo successful Priority/Band/Rank/Workstream assessment is claimed."},
        )
    except Exception:
        pass

def fail(message):
    post_failure(message)
    raise SystemExit(message)

if not OPENAI_API_KEY:
    fail("Repository secret OPENAI_API_KEY is not configured.")
if not SYNC_TOKEN:
    fail("Repository secret PROJECTS_TOKEN is not configured for the prioritization executor.")

try:
    if RECORD_TYPE == "issue":
        record = github_api(f"issues/{NUMBER}", token=SYNC_TOKEN)
    else:
        record = github_api(f"pulls/{NUMBER}", token=SYNC_TOKEN)
    comments = github_api(f"issues/{NUMBER}/comments?per_page=100", token=SYNC_TOKEN)
except Exception as exc:
    fail(f"GitHub target/context lookup failed: {exc}")

prioritization_path = Path("00-Management/PRIORITIZATION.md")
workflow_path = Path("6-Development/github/GITHUB_WORKFLOWS.md")
if not prioritization_path.exists() or not workflow_path.exists():
    fail("Canonical prioritization/workflow documents were not found in the checked-out repository.")

prioritization_rules = prioritization_path.read_text(encoding="utf-8")
workflow_rules = workflow_path.read_text(encoding="utf-8")

comment_context = []
for c in comments[-30:]:
    body = (c.get("body") or "").strip()
    if not body:
        continue
    if "<!-- jagports-work-control-snapshot -->" in body or "<!-- jagports-pr-work-control-snapshot -->" in body:
        continue
    comment_context.append({
        "author": (c.get("user") or {}).get("login"),
        "author_association": c.get("author_association"),
        "body": body[:4000],
    })

record_context = {
    "number": NUMBER,
    "type": RECORD_TYPE,
    "title": record.get("title"),
    "body": (record.get("body") or "")[:20000],
    "state": record.get("state"),
    "labels": [x.get("name") for x in record.get("labels", [])],
    "author": (record.get("user") or {}).get("login"),
    "base": ((record.get("base") or {}).get("ref") if RECORD_TYPE == "pr" else None),
    "head": ((record.get("head") or {}).get("ref") if RECORD_TYPE == "pr" else None),
    "comments": comment_context,
}

schema_instruction = """
Return ONLY one JSON object with exactly these keys:
{
  "band": "P0|P1|P2|P3|P4|P5",
  "workstream": "AI OS|VIEPS|null",
  "score": -10..10 integer,
  "score_state": "complete|provisional",
  "customer_value": 0..5 integer,
  "business_value": 0..5 integer,
  "strategic_differentiation": 0..5 integer,
  "dependency_leverage": 0..5 integer,
  "evidence_confidence": 0..5 integer,
  "readiness": 0..5 integer,
  "reversibility": 0..5 integer,
  "effort": 0..5 integer,
  "risk": 0..5 integer,
  "dependencies_gates": "short text",
  "rationale": "short text",
  "evidence": ["durable evidence references"]
}

Rules:
- Apply the supplied canonical PRIORITIZATION.md, not a new model.
- P0 requires explicit exceptional/show-stopper evidence.
- Workstream may be non-null only when durable authoritative evidence identifies exactly one canonical Workstream. Topic/title/keywords alone are insufficient.
- If Workstream is absent, conflicting, cross-cutting, or ambiguous, return null.
- Do not invent an exact numeric Rank. Queue ordering is not provided to this reasoning call; the executor will use Rank/PR Rank = none.
- Preserve lifecycle Status; do not infer or advance it.
- Any unknown factor must be 0 and makes score_state provisional.
- Evidence must identify facts actually present in the supplied record/comments or canonical rules.
"""

prompt = f"""You are the Jagports initial prioritization reasoning executor.

CANONICAL PRIORITIZATION RULES:
--- PRIORITIZATION.md ---
{prioritization_rules[:50000]}

RELEVANT GITHUB EXECUTION RULES:
--- GITHUB_WORKFLOWS.md ---
{workflow_rules[:25000]}

TARGET RECORD:
{json.dumps(record_context, ensure_ascii=False, indent=2)}

{schema_instruction}
"""

try:
    openai_response = request_json(
        "https://api.openai.com/v1/responses",
        token=OPENAI_API_KEY,
        method="POST",
        data={
            "model": MODEL,
            "input": prompt,
        },
        headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
        timeout=120,
    )
except urllib.error.HTTPError as exc:
    detail = exc.read().decode("utf-8", errors="replace")[:1500]
    fail(f"OpenAI Responses API returned HTTP {exc.code}: {detail}")
except Exception as exc:
    fail(f"OpenAI reasoning request failed: {exc}")

output_parts = []
for item in openai_response.get("output", []):
    for content in item.get("content", []):
        if content.get("type") == "output_text" and content.get("text"):
            output_parts.append(content["text"])
output_text = "\n".join(output_parts).strip()
if not output_text:
    fail("OpenAI response contained no output_text.")

if output_text.startswith("```"):
    lines = output_text.splitlines()
    if lines and lines[0].startswith("```"):
        lines = lines[1:]
    if lines and lines[-1].strip() == "```":
        lines = lines[:-1]
    output_text = "\n".join(lines).strip()

try:
    result = json.loads(output_text)
except json.JSONDecodeError as exc:
    fail(f"OpenAI prioritization result was not valid JSON: {exc}")

required = {
    "band", "workstream", "score", "score_state",
    "customer_value", "business_value", "strategic_differentiation",
    "dependency_leverage", "evidence_confidence", "readiness",
    "reversibility", "effort", "risk",
    "dependencies_gates", "rationale", "evidence",
}
if set(result) != required:
    fail(f"Prioritization JSON keys differ from required schema: {sorted(result)}")

if result["band"] not in {"P0", "P1", "P2", "P3", "P4", "P5"}:
    fail("Model returned an invalid Band.")
if result["workstream"] not in {None, "AI OS", "VIEPS"}:
    fail("Model returned an invalid Workstream.")
if result["score_state"] not in {"complete", "provisional"}:
    fail("Model returned an invalid score_state.")
if not isinstance(result["score"], int) or not (-10 <= result["score"] <= 10):
    fail("Model returned an invalid score.")
for key in [
    "customer_value", "business_value", "strategic_differentiation",
    "dependency_leverage", "evidence_confidence", "readiness",
    "reversibility", "effort", "risk",
]:
    if not isinstance(result[key], int) or not (0 <= result[key] <= 5):
        fail(f"Model returned invalid factor {key}.")
if any(result[k] == 0 for k in [
    "customer_value", "business_value", "strategic_differentiation",
    "dependency_leverage", "evidence_confidence", "readiness",
    "reversibility", "effort", "risk",
]) and result["score_state"] != "provisional":
    fail("A zero/unknown factor requires score_state=provisional.")
if result["band"] == "P0" and "exception" not in result["rationale"].lower() and "show-stopper" not in result["rationale"].lower():
    fail("P0 was returned without explicit exceptional/show-stopper rationale.")
if not isinstance(result["evidence"], list):
    fail("Evidence must be a list.")

today = datetime.now(timezone.utc).date().isoformat()
status = "BACKLOG" if RECORD_TYPE == "issue" else "IMPLEMENTATION"
scope = result["workstream"] or "Unresolved"
evidence_text = "; ".join(str(x) for x in result["evidence"])[:4000] or "Target record and canonical prioritization rules"

lines = [
    "<!-- jagports-project-sync -->" if RECORD_TYPE == "issue" else "<!-- jagports-pr-project-sync -->",
    f"Priority review — {today}",
    f"Scope: {scope}",
    f"Status: {status}",
    f"Band: {result['band']}",
]
if RECORD_TYPE == "issue":
    lines.append("Rank: none")
else:
    lines.append("PR Rank: none")
lines += [
    f"Score: {result['score']}",
    f"Score state: {result['score_state']}",
    f"Customer value: {result['customer_value']}",
    f"Business value: {result['business_value']}",
    f"Strategic differentiation: {result['strategic_differentiation']}",
    f"Dependency leverage: {result['dependency_leverage']}",
    f"Evidence confidence: {result['evidence_confidence']}",
    f"Readiness: {result['readiness']}",
    f"Reversibility: {result['reversibility']}",
    f"Effort: {result['effort']}",
    f"Risk: {result['risk']}",
    f"Dependencies / gates: {result['dependencies_gates']}",
    f"Rationale: {result['rationale']}",
    "Override: none",
    f"Evidence: {evidence_text}",
]
if result["workstream"]:
    lines.append(f"Workstream: {result['workstream']}")
review_body = "\n".join(lines)

try:
    created = github_api(
        f"issues/{NUMBER}/comments",
        token=SYNC_TOKEN,
        method="POST",
        data={"body": review_body},
    )
except Exception as exc:
    fail(f"Failed to persist the priority-review/synchronization record: {exc}")

comment_id = created.get("id")
if not comment_id:
    fail("GitHub did not return an ID for the priority-review comment.")

try:
    persisted = github_api(f"issues/comments/{comment_id}", token=SYNC_TOKEN)
except Exception as exc:
    fail(f"Failed to reread the priority-review comment: {exc}")
if (persisted.get("body") or "") != review_body:
    fail("Persisted priority-review comment did not match the generated review.")

expected_priority = {
    "P0": "Urgent", "P1": "High", "P2": "Medium",
    "P3": "Low", "P4": "Low", "P5": "unset",
}[result["band"]]
snapshot_marker = "<!-- jagports-work-control-snapshot -->" if RECORD_TYPE == "issue" else "<!-- jagports-pr-work-control-snapshot -->"
priority_label = "Priority" if RECORD_TYPE == "issue" else "PR Priority"
rank_label = "Rank" if RECORD_TYPE == "issue" else "PR Rank"

deadline = time.time() + 180
last_snapshot = None
while time.time() < deadline:
    time.sleep(5)
    try:
        current_comments = github_api(f"issues/{NUMBER}/comments?per_page=100", token=SYNC_TOKEN)
    except Exception:
        continue
    snapshots = [c for c in current_comments if snapshot_marker in (c.get("body") or "")]
    if len(snapshots) > 1:
        fail("Multiple managed work-control snapshots exist; verification fails closed.")
    if not snapshots:
        continue
    body = snapshots[0].get("body") or ""
    last_snapshot = body
    required_lines = [
        f"- {priority_label}: {expected_priority}",
        f"- Band: {result['band']}",
        f"- Status: {status}",
        f"- {rank_label}: none",
    ]
    if result["workstream"]:
        required_lines.append(f"- Workstream: {result['workstream']}")
    else:
        required_lines.append("- Workstream: Unassigned")
    if all(line in body for line in required_lines):
        print(f"PASS: {RECORD_TYPE} #{NUMBER} automatic prioritization was reasoned, synchronized, and independently verified.")
        print(f"Priority review comment: https://github.com/{REPO}/issues/{NUMBER}#issuecomment-{comment_id}")
        sys.exit(0)

fail("Timed out waiting for the bounded synchronizer to publish a matching verified work-control snapshot." + (f" Last snapshot:\n{last_snapshot[:1200]}" if last_snapshot else ""))

"""Pure, offline #904 meaningful Issue-change comparison (Batch 15.4).

Consume an accepted, *complete* GHD RetrievalOutcome. Compare content hashes,
not GitHub's updated_at alone. Ignore bot/self-authored comments, but keep
human comment provenance and independent stable content revision.

This module intentionally does not fetch Issues, write snapshots, advance a
cursor, dispatch specialists or invoke a model. Durable pending-event ordering
and coordinator integration belong to Batches 15.5 and 15.6.
"""

import hashlib
import json
from datetime import datetime

SNAPSHOT_SCHEMA_VERSION = 1
_DEFAULT_IGNORED_AUTHORS = frozenset({
    "github-actions[bot]", "dependabot[bot]", "jagports-lead-agent",
    "jagports-lead-agent[bot]",
})
_KIND_ORDER = ("new", "closed", "reopened", "title_changed", "body_changed",
               "comment_added", "comment_edited")


def _digest(value):
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _timestamp(value):
    """Validate a timezone-aware ISO timestamp without using it as a revision."""
    if not isinstance(value, str) or not value:
        raise ValueError("timestamp is missing")
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None or parsed.utcoffset() is None:
        raise ValueError("timestamp has no timezone")
    return parsed


def _content_revision(snapshot):
    """Stable across fetch times, comment ordering, bots and timestamp-only edits."""
    human_comments = [
        [int(comment_id), entry["author"], entry["body_sha256"]]
        for comment_id, entry in snapshot["comments"].items()
    ]
    human_comments.sort(key=lambda item: item[0])
    payload = {
        "issue_number": snapshot["issue_number"],
        "state": snapshot["state"],
        "title_sha256": snapshot["title_sha256"],
        "body_sha256": snapshot["body_sha256"],
        "human_comments": human_comments,
    }
    encoded = json.dumps(payload, ensure_ascii=False, sort_keys=True,
                         separators=(",", ":"))
    return "sha256:" + _digest(encoded)


def _blocked(reason):
    # Never return partial/new state that a caller might accidentally persist.
    return {"status": "blocked", "reason": reason, "snapshot": None,
            "changed_event": None}


def _is_ignored(author, ignored_authors):
    name = author.casefold()
    return name.endswith("[bot]") or name in ignored_authors


def _observation(retrieval, ignored_authors):
    """Normalize and strictly verify one complete, full-discussion observation."""
    if not isinstance(retrieval, dict) or retrieval.get("status") != "complete":
        raise ValueError("retrieval_incomplete")
    issue = retrieval.get("context_or_error")
    if not isinstance(issue, dict) or issue.get("truncated") is not False:
        raise ValueError("retrieval_incomplete")
    number = issue.get("number")
    if type(number) is not int or number < 1 or retrieval.get("issue_number") != number:
        raise ValueError("issue_identity_invalid")
    url = "https://github.com/jagports/jagports/issues/" + str(number)
    if issue.get("url") != url or issue.get("is_pull_request", False) is not False:
        raise ValueError("issue_identity_invalid")
    if issue.get("state") not in ("open", "closed"):
        raise ValueError("issue_state_invalid")
    if not isinstance(issue.get("title"), str) or not isinstance(issue.get("body"), str):
        raise ValueError("issue_text_invalid")
    _timestamp(issue.get("fetched_at"))
    comments = issue.get("comments")
    # The complete "selected" mode can omit unselected comments; it cannot
    # prove a complete baseline or detect deletion. Require "all" here.
    if (issue.get("comment_scope") != "all" or
            type(issue.get("total_comment_count")) is not int or
            not isinstance(comments, list) or
            len(comments) != issue["total_comment_count"]):
        raise ValueError("comment_coverage_incomplete")
    seen = set()
    human = {}
    for comment in comments:
        if not isinstance(comment, dict):
            raise ValueError("comment_provenance_invalid")
        comment_id = comment.get("id")
        if type(comment_id) is not int or comment_id < 1 or comment_id in seen:
            raise ValueError("comment_provenance_invalid")
        seen.add(comment_id)
        expected = url + "#issuecomment-" + str(comment_id)
        if comment.get("url") != expected:
            raise ValueError("comment_provenance_invalid")
        author, body = comment.get("author"), comment.get("body")
        if not isinstance(author, str) or not author or not isinstance(body, str):
            raise ValueError("comment_provenance_invalid")
        created = _timestamp(comment.get("created_at"))
        updated = _timestamp(comment.get("updated_at"))
        if updated < created:
            raise ValueError("comment_provenance_invalid")
        if _is_ignored(author, ignored_authors):
            continue
        human[str(comment_id)] = {
            "author": author.casefold(),
            "body_sha256": _digest(body),
            "created_at": comment["created_at"],
            "updated_at": comment["updated_at"],
        }

    snapshot = {
        "schema_version": SNAPSHOT_SCHEMA_VERSION,
        "issue_number": number,
        "url": url,
        "state": issue["state"],
        "title_sha256": _digest(issue["title"]),
        "body_sha256": _digest(issue["body"]),
        "comments": human,
        "last_observed_at": issue["fetched_at"],
    }
    snapshot["source_revision"] = _content_revision(snapshot)
    return snapshot


def _valid_previous(previous, issue_number):
    if not isinstance(previous, dict):
        return False
    if (previous.get("schema_version") != SNAPSHOT_SCHEMA_VERSION or
            previous.get("issue_number") != issue_number or
            previous.get("url") !=
            "https://github.com/jagports/jagports/issues/" + str(issue_number) or
            previous.get("state") not in ("open", "closed")):
        return False
    if not all(isinstance(previous.get(key), str) and
               len(previous[key]) == 64 and
               all(char in "0123456789abcdef" for char in previous[key])
               for key in ("title_sha256", "body_sha256")):
        return False
    items = previous.get("comments")
    if not isinstance(items, dict):
        return False
    try:
        for identifier, entry in items.items():
            if str(int(identifier)) != identifier or int(identifier) < 1:
                return False
            if not isinstance(entry, dict):
                return False
            if (not isinstance(entry.get("author"), str) or
                    not entry["author"] or
                    not isinstance(entry.get("body_sha256"), str) or
                    len(entry["body_sha256"]) != 64 or
                    any(char not in "0123456789abcdef"
                        for char in entry["body_sha256"])):
                return False
            _timestamp(entry.get("created_at"))
            _timestamp(entry.get("updated_at"))
        return previous.get("source_revision") == _content_revision(previous)
    except (TypeError, ValueError, KeyError):
        return False


def compare_issue_context(previous, retrieval, *, newly_observed=False,
                          ignored_authors=()):
    """Return a baseline, changed event, unchanged snapshot or explicit block.

    previous is a separately versioned complete enrichment snapshot, not the
    legacy state/agent_state.json lifecycle row. No previous + no trusted
    newly_observed flag is a quiet baseline, never a historical "new" alert.
    The caller must obtain newly_observed from a verified lifecycle comparison.
    """
    if type(newly_observed) is not bool:
        raise ValueError("newly_observed must be a boolean")
    if (not isinstance(ignored_authors, (tuple, list, set, frozenset)) or
            any(not isinstance(value, str) or not value
                for value in ignored_authors)):
        raise ValueError("ignored_authors must contain explicit account names")
    ignored = _DEFAULT_IGNORED_AUTHORS | {
        value.casefold() for value in ignored_authors
    }
    try:
        observed = _observation(retrieval, ignored)
    except (TypeError, ValueError, OverflowError) as exc:
        # The reason is an internal fixed validation label; never expose
        # arbitrary fetched GitHub text or raw provider exceptions.
        known = {
            "retrieval_incomplete", "issue_identity_invalid", "issue_state_invalid",
            "issue_text_invalid", "comment_coverage_incomplete",
            "comment_provenance_invalid",
        }
        reason = str(exc)
        return _blocked(reason if reason in known else "observation_invalid")

    if previous is None:
        if not newly_observed:
            return {"status": "baseline", "snapshot": observed,
                    "changed_event": None}
        return {
            "status": "changed", "snapshot": observed,
            "changed_event": {
                "issue_number": observed["issue_number"], "kind": ["new"],
                "source_revision": observed["source_revision"],
                "changed_comment_ids": [],
            },
        }
    if newly_observed or not _valid_previous(previous, observed["issue_number"]):
        return _blocked("previous_snapshot_invalid")

    before, after = previous["comments"], observed["comments"]
    # A human comment disappearing could mean deletion, partial source
    # retrieval, or an authority change. None is an approved event kind.
    if set(before) - set(after):
        return _blocked("human_comment_disappeared")

    kinds = set()
    if previous["state"] != observed["state"]:
        kinds.add("closed" if observed["state"] == "closed" else "reopened")
    if previous["title_sha256"] != observed["title_sha256"]:
        kinds.add("title_changed")
    if previous["body_sha256"] != observed["body_sha256"]:
        kinds.add("body_changed")
    added = sorted(int(key) for key in set(after) - set(before))
    edited = sorted(int(key) for key in set(after) & set(before)
                    if after[key]["body_sha256"] != before[key]["body_sha256"])
    if added:
        kinds.add("comment_added")
    if edited:
        kinds.add("comment_edited")
    if not kinds:
        return {"status": "unchanged", "snapshot": observed,
                "changed_event": None}

    return {
        "status": "changed", "snapshot": observed,
        "changed_event": {
            "issue_number": observed["issue_number"],
            "kind": [name for name in _KIND_ORDER if name in kinds],
            "source_revision": observed["source_revision"],
            "changed_comment_ids": sorted(set(added + edited)),
        },
    }

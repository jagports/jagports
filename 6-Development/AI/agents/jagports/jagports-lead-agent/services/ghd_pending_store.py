"""Durable #904 enrichment cursor and one-at-a-time pending-event hand-off.

Batch 15.5 implements persistence, not dispatch: an accepted complete
RetrievalOutcome is compared with the stored Issue snapshot. The event and its
next cursor are written in that order, each using atomic rename + fsync.
A pending event blocks subsequent observations until explicitly acknowledged.
Crash recovery repairs the cursor from the durable pending record and replays
the same stable event ID. The legacy lifecycle cursor and actual coordinator
wiring belong to Batch 15.6.

The SHA-256 record digest detects accidental corruption, not authenticity.
Only codex-owned, non-world-readable state files should be used.
"""
import copy
import hashlib
import json
import os
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from tempfile import NamedTemporaryFile

from services.issue_change_detection import (
    SNAPSHOT_SCHEMA_VERSION, _valid_previous, compare_issue_context,
)


class PendingStoreError(RuntimeError):
    """State is incomplete/ambiguous; block dispatch instead of losing work."""


def _digest(value):
    encoded = json.dumps(value, sort_keys=True, separators=(",", ":"),
                         ensure_ascii=False).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()


def _write_json_atomic(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = None
    try:
        with NamedTemporaryFile(mode="w", encoding="utf-8", dir=str(path.parent),
                                prefix=".ghd-", delete=False) as handle:
            temporary = Path(handle.name)
            os.chmod(temporary, 0o600)
            json.dump(value, handle, indent=2, ensure_ascii=False, sort_keys=True)
            handle.flush()
            os.fsync(handle.fileno())
        os.replace(temporary, path)
        temporary = None
        if hasattr(os, "O_DIRECTORY"):
            fd = os.open(str(path.parent), os.O_RDONLY | os.O_DIRECTORY)
            try:
                os.fsync(fd)
            finally:
                os.close(fd)
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)


@contextmanager
def _locked(path):
    """Use a stable sibling lock inode across threads and Linux processes."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a+b") as lock:
        os.chmod(path, 0o600)
        if os.name == "nt":
            import msvcrt
            if lock.seek(0, os.SEEK_END) == 0:
                lock.write(b"0")
                lock.flush()
            lock.seek(0)
            msvcrt.locking(lock.fileno(), msvcrt.LK_LOCK, 1)
            try:
                yield
            finally:
                lock.seek(0)
                msvcrt.locking(lock.fileno(), msvcrt.LK_UNLCK, 1)
        else:
            import fcntl
            fcntl.flock(lock.fileno(), fcntl.LOCK_EX)
            try:
                yield
            finally:
                fcntl.flock(lock.fileno(), fcntl.LOCK_UN)


def _read_json(path):
    try:
        with path.open(encoding="utf-8") as handle:
            return json.load(handle)
    except FileNotFoundError:
        return None
    except (OSError, UnicodeError, ValueError) as exc:
        raise PendingStoreError("GHD state is unreadable; reconcile manually.") from exc


class GHDPendingStore:
    """Persist one changed Issue event and an independently versioned cursor."""

    def __init__(self, snapshot_path="state/ghd_enrichment.json",
                 pending_path="state/ghd_pending_event.json"):
        self.snapshot_path = Path(snapshot_path)
        self.pending_path = Path(pending_path)
        if (self.snapshot_path == self.pending_path or
                self.snapshot_path.parent.resolve() !=
                self.pending_path.parent.resolve()):
            raise ValueError("GHD cursor and pending event require distinct sibling files.")
        self.lock_path = self.snapshot_path.with_name(
            self.snapshot_path.name + ".lock")

    def _snapshots(self):
        state = _read_json(self.snapshot_path)
        if state is None:
            return {"schema_version": SNAPSHOT_SCHEMA_VERSION, "issues": {}}
        if (not isinstance(state, dict) or
                state.get("schema_version") != SNAPSHOT_SCHEMA_VERSION or
                not isinstance(state.get("issues"), dict)):
            raise PendingStoreError("GHD enrichment cursor has an unknown schema.")
        for number, item in state["issues"].items():
            if (not isinstance(number, str) or not number.isdecimal() or
                    str(int(number)) != number or
                    not _valid_previous(item, int(number))):
                raise PendingStoreError("GHD enrichment cursor is inconsistent.")
        return state

    @staticmethod
    def _verify_pending(pending):
        if pending is None:
            return None
        if (not isinstance(pending, dict) or
                pending.get("producer") != "ghd_increment_a" or
                pending.get("schema_version") != 1 or
                pending.get("status") not in ("pending", "acknowledged") or
                not isinstance(pending.get("changed_event"), dict) or
                not isinstance(pending.get("issue_context"), dict) or
                not isinstance(pending.get("next_snapshot"), dict)):
            raise PendingStoreError("GHD pending event is malformed.")
        event = pending["changed_event"]
        snapshot = pending["next_snapshot"]
        number, revision = event.get("issue_number"), event.get("source_revision")
        if (type(number) is not int or number < 1 or
                type(revision) is not str or not revision or
                event.get("kind") is None or
                pending.get("event_key") != str(number) + ":" + revision or
                snapshot.get("source_revision") != revision or
                not _valid_previous(snapshot, number) or
                pending["issue_context"].get("number") != number or
                pending["issue_context"].get("url") != snapshot["url"]):
            raise PendingStoreError("GHD pending event has inconsistent identity.")
        prior = pending.get("previous_revision")
        if prior is not None and (not isinstance(prior, str) or
                                  not prior.startswith("sha256:")):
            raise PendingStoreError("GHD pending event has invalid previous revision.")
        protected = {key: value for key, value in pending.items()
                     if key != "record_digest"}
        if pending.get("record_digest") != _digest(protected):
            raise PendingStoreError("GHD pending event integrity check failed.")
        return pending

    def _pending(self):
        return self._verify_pending(_read_json(self.pending_path))

    def _ensure_cursor(self, pending):
        """Repair an interrupted cursor commit only for an exact prior revision."""
        state = self._snapshots()
        number = str(pending["changed_event"]["issue_number"])
        current = state["issues"].get(number)
        current_revision = current["source_revision"] if current else None
        next_snapshot = pending["next_snapshot"]
        if current_revision == next_snapshot["source_revision"]:
            if current != next_snapshot:
                # Same content revision but different timestamp is valid only
                # when this precise checkpoint already reached disk.
                raise PendingStoreError("GHD cursor differs from pending checkpoint.")
            return
        if current_revision != pending["previous_revision"]:
            raise PendingStoreError("GHD cursor diverged from pending event.")
        state["issues"][number] = next_snapshot
        _write_json_atomic(self.snapshot_path, state)

    @staticmethod
    def _public_pending(pending):
        if pending is None or pending["status"] != "pending":
            return None
        return copy.deepcopy({
            key: pending[key] for key in (
                "producer", "schema_version", "status", "event_key",
                "changed_event", "issue_context",
            )
        })

    def replay_pending(self):
        """Replay the same pending event after process restart; no new fetch."""
        with _locked(self.lock_path):
            pending = self._pending()
            if pending is None:
                return None
            self._ensure_cursor(pending)
            return self._public_pending(pending)

    def record_observation(self, retrieval, *, newly_observed=False,
                           ignored_authors=()):
        """Persist the pending event before advancing this Issue's cursor.

        A previous pending event takes precedence over all new observations.
        Truncated, invalid and uncertain retrievals never advance the cursor.
        """
        with _locked(self.lock_path):
            pending = self._pending()
            if pending is not None:
                self._ensure_cursor(pending)
                if pending["status"] == "pending":
                    return {"status": "pending", "pending_event":
                            self._public_pending(pending)}
            state = self._snapshots()
            if not isinstance(retrieval, dict):
                return {"status": "blocked", "reason": "retrieval_incomplete"}
            number = retrieval.get("issue_number")
            if type(number) is not int or number < 1:
                return {"status": "blocked", "reason": "issue_identity_invalid"}
            previous = state["issues"].get(str(number))
            outcome = compare_issue_context(
                previous, retrieval, newly_observed=newly_observed,
                ignored_authors=ignored_authors)
            if outcome["status"] == "blocked":
                return {"status": "blocked", "reason": outcome["reason"]}
            next_snapshot = outcome["snapshot"]
            if outcome["changed_event"] is None:
                state["issues"][str(number)] = next_snapshot
                _write_json_atomic(self.snapshot_path, state)
                return {"status": outcome["status"], "source_revision":
                        next_snapshot["source_revision"]}

            # A fully validated observation is the sole source of context.
            event = outcome["changed_event"]
            context = copy.deepcopy(retrieval["context_or_error"])
            next_pending = {
                "producer": "ghd_increment_a", "schema_version": 1,
                "status": "pending",
                "event_key": str(number) + ":" + event["source_revision"],
                "changed_event": copy.deepcopy(event),
                "issue_context": context,
                "next_snapshot": next_snapshot,
                "previous_revision": previous["source_revision"] if previous else None,
                "created_at": datetime.now(timezone.utc).isoformat(),
            }
            next_pending["record_digest"] = _digest(next_pending)
            # Critical order: if the host dies on the next line, the cursor
            # remains old; if it dies on the following line, replay repairs it.
            _write_json_atomic(self.pending_path, next_pending)
            self._ensure_cursor(next_pending)
            return {"status": "pending", "pending_event":
                    self._public_pending(next_pending)}

    def acknowledge(self, event_key):
        """Acknowledge only an exact, durably committed hand-off identity.

        Consumers call this after their own durable processing. The store
        does not assert downstream exactly-once execution.
        """
        if not isinstance(event_key, str) or not event_key:
            raise ValueError("An exact pending event key is required.")
        with _locked(self.lock_path):
            pending = self._pending()
            if pending is None or pending["event_key"] != event_key:
                raise PendingStoreError("Requested GHD event is not pending.")
            self._ensure_cursor(pending)
            if pending["status"] == "acknowledged":
                return False
            pending["status"] = "acknowledged"
            pending["acknowledged_at"] = datetime.now(timezone.utc).isoformat()
            pending.pop("record_digest")
            pending["record_digest"] = _digest(pending)
            _write_json_atomic(self.pending_path, pending)
            return True

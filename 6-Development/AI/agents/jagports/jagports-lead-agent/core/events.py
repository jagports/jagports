def has_changes(changes):
    return bool(
        changes.get("new")
        or changes.get("closed")
        or changes.get("reopened")
    )


def describe(changes):
    return (
        f"New: {changes.get('new', [])}\n"
        f"Closed: {changes.get('closed', [])}\n"
        f"Reopened: {changes.get('reopened', [])}"
    )


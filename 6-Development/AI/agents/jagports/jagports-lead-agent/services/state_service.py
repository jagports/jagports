import os
import json
from datetime import datetime


STATE_FILE = "state/agent_state.json"


def load_state():

    if not os.path.exists(STATE_FILE):
        return {}

    with open(
        STATE_FILE,
        "r"
    ) as f:
        return json.load(f)


def save_state(data):

    os.makedirs(
        "state",
        exist_ok=True
    )

    data["last_run"] = datetime.now().isoformat()

    with open(
        STATE_FILE,
        "w"
    ) as f:
        json.dump(
            data,
            f,
            indent=2
        )


def compare_issues(old_state, new_issues):

    changes = {
        "new": [],
        "closed": [],
        "reopened": []
    }

    old_issues = old_state.get(
        "issues",
        {}
    )

    for number, issue in new_issues.items():

        previous = old_issues.get(
            number
        )

        if previous is None:

            if old_issues:
                changes["new"].append(
                    int(number)
                )

        elif previous["state"] != issue["state"]:

            if issue["state"] == "closed":
                changes["closed"].append(
                    int(number)
                )

            elif issue["state"] == "open":
                changes["reopened"].append(
                    int(number)
                )

    return changes


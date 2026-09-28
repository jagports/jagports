from core.result import AgentResult


class DeploymentAgent:

    def analyse(self, event):

        result = {
            "deployment_related": False,
            "recommendation": ""
        }

        data = event.data

        if data.get("new") or data.get("closed"):
            result["deployment_related"] = True
            result["recommendation"] = (
                "Review deployment impact of issue lifecycle change."
            )

        return AgentResult(
            "deployment",
            "review" if result["deployment_related"] else "normal",
            result["recommendation"],
            result
        )


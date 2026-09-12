from core.result import AgentResult

class DocumentationAgent:

    def analyse(self, event):

        result = {
            "documentation_needed": False,
            "recommendation": ""
        }

        if event.data.get("new"):
            result["documentation_needed"] = True
            result["recommendation"] = (
                "Review new issues for documentation impact."
            )

        if event.data.get("closed"):
            result["documentation_needed"] = True
            result["recommendation"] = (
                "Review closed issues for knowledge updates."
            )

        return AgentResult(
            "documentation",
            "review" if result["documentation_needed"] else "normal",
            result["recommendation"],
            result
)

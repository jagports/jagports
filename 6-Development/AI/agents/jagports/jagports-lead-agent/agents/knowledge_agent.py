from core.result import AgentResult


class KnowledgeAgent:

    def analyse(self, event):

        result = {
            "knowledge_related": False,
            "recommendation": ""
        }

        data = event.data

        if (
            data.get("new")
            or data.get("closed")
            or data.get("reopened")
        ):

            issues = event.context.get("issues", [])

            result["recommendation"] = (
                f"Review AI OS knowledge impact. "
                f"Context issues available: {len(issues)}"
            )

            result["knowledge_related"] = True
            result["recommendation"] = (
                "Review whether AI OS knowledge files need updates."
            )

        return AgentResult(
            "knowledge",
            "review" if result["knowledge_related"] else "normal",
            result["recommendation"],
            result
        )


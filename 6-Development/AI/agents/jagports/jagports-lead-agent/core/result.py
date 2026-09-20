class AgentResult:

    def __init__(
        self,
        agent,
        severity,
        message,
        data=None
    ):
        self.agent = agent
        self.severity = severity
        self.message = message
        self.data = data or {}


    def to_dict(self):

        return {
            "agent": self.agent,
            "severity": self.severity,
            "message": self.message,
            "data": self.data
        }


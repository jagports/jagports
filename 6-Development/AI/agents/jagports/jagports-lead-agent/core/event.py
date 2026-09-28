class Event:

    def __init__(
        self,
        event_type,
        data,
        context=None
    ):
        self.type = event_type
        self.data = data
        self.context = context or {}


    def to_dict(self):

        return {
            "type": self.type,
            "data": self.data,
            "context": self.context
        }


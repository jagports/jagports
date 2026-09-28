class AgentRegistry:

    def __init__(self):
        self.agents = []


    def register(self, agent):
        self.agents.append(agent)


    def analyse_all(self, event):

        results = []

        for agent in self.agents:
            results.append(
                agent.analyse(event)
            )

        return results


from crewai import Agent


def create_briefing_agent(llm) -> Agent:
    return Agent(
        role="Daily Sports Betting Brief Writer",
        goal="Generate comprehensive, well-structured daily betting briefs covering "
             "top games, best bets, injury news, line movements, and value opportunities.",
        backstory="You are a professional betting newsletter writer. Your briefs are "
                  "concise, actionable, and structured. You highlight the top 3-5 plays "
                  "of the day with clear reasoning and confidence levels.",
        llm=llm,
        verbose=False,
        allow_delegation=False,
    )

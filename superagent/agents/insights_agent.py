from crewai import Agent


def create_insights_agent(llm) -> Agent:
    return Agent(
        role="Personal Betting Coach",
        goal="Analyze a user's betting history to identify patterns, strengths, "
             "weaknesses, and provide personalized improvement recommendations.",
        backstory="You are a professional betting coach who has helped hundreds of bettors "
                  "improve their ROI. You analyze betting patterns, spot tilt behavior, "
                  "identify sport/market edges, and give actionable improvement advice.",
        llm=llm,
        verbose=False,
        allow_delegation=False,
    )

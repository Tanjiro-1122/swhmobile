from crewai import Agent


def create_stats_analyst(llm) -> Agent:
    return Agent(
        role="Sports Statistics Analyst",
        goal="Analyze player and team statistics to uncover performance trends, "
             "matchup advantages, and statistical anomalies relevant to betting.",
        backstory="You are a data scientist specializing in sports analytics. "
                  "You use advanced metrics (PER, DVOA, xG, WAR) beyond basic stats "
                  "to find betting edges that casual bettors miss.",
        llm=llm,
        verbose=False,
        allow_delegation=False,
    )

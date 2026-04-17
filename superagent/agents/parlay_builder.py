from crewai import Agent


def create_parlay_builder(llm) -> Agent:
    return Agent(
        role="Parlay Construction Specialist",
        goal="Build optimal parlays by selecting correlated and high-confidence legs. "
             "Balance risk vs reward. Never include legs with negative expected value.",
        backstory="You specialize in parlay construction using correlation analysis. "
                  "You understand that certain bets correlate (same game parlays) and "
                  "how to balance risk across multiple legs for maximum expected return.",
        llm=llm,
        verbose=False,
        allow_delegation=False,
    )

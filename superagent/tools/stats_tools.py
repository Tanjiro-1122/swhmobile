from datetime import datetime, timezone
from typing import Any, Dict


def get_live_scores(sport: str = "all") -> Dict[str, Any]:
    return {
        "source": "mock",
        "sport": sport,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "games": [],
    }


def get_nba_live_scores() -> Dict[str, Any]:
    return get_live_scores("basketball_nba")


def get_player_stats(player_name: str, sport: str, season: str | None = None) -> Dict[str, Any]:
    return {
        "player_name": player_name,
        "sport": sport,
        "season": season,
        "source": "mock",
        "stats": {},
        "note": "Wire real provider/API if desired; endpoint remains self-hostable.",
    }


def get_team_stats(team_name: str, sport: str, season: str | None = None) -> Dict[str, Any]:
    return {
        "team_name": team_name,
        "sport": sport,
        "season": season,
        "source": "mock",
        "stats": {},
        "note": "Wire real provider/API if desired; endpoint remains self-hostable.",
    }


def get_sport_stats(sport: str, league: str | None = None) -> Dict[str, Any]:
    return {
        "sport": sport,
        "league": league,
        "source": "mock",
        "summary": {},
    }

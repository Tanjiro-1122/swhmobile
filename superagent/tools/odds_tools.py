from typing import Any, Dict, List
import httpx
from utils.config import ODDS_API_KEY


def implied_probability(decimal_odds: float) -> float:
    if not decimal_odds or decimal_odds <= 0:
        return 0.0
    return round(1 / decimal_odds, 4)


def american_to_decimal(american_odds: float) -> float:
    if american_odds is None:
        return 0.0
    if american_odds > 0:
        return round((american_odds / 100) + 1, 4)
    return round((100 / abs(american_odds)) + 1, 4)


def normalize_odds(value: float) -> float:
    if value is None:
        return 0.0
    if value >= 1.01:
        return float(value)
    return american_to_decimal(value)


def fetch_live_odds(sport: str = "basketball_nba", market: str = "h2h") -> Dict[str, Any]:
    if not ODDS_API_KEY:
        return {
            "source": "mock",
            "sport": sport,
            "market": market,
            "games": [],
            "message": "ODDS_API_KEY not configured; returning mock payload",
        }

    url = f"https://api.the-odds-api.com/v4/sports/{sport}/odds"
    params = {
        "apiKey": ODDS_API_KEY,
        "regions": "us",
        "markets": market,
        "oddsFormat": "decimal",
    }

    try:
        with httpx.Client(timeout=10.0) as client:
            response = client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
        return {"source": "the-odds-api", "sport": sport, "market": market, "games": data}
    except Exception as exc:
        return {
            "source": "error",
            "sport": sport,
            "market": market,
            "games": [],
            "error": str(exc),
        }


def rank_value_bets(odds_rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    scored: List[Dict[str, Any]] = []
    for row in odds_rows:
        odds = normalize_odds(float(row.get("odds", 0) or 0))
        if odds <= 1:
            continue
        true_probability = float(row.get("true_probability", 0) or 0)
        implied = implied_probability(odds)
        edge = round(true_probability - implied, 4)
        ev = round((true_probability * odds) - 1, 4)
        scored.append({**row, "implied_probability": implied, "edge": edge, "expected_value": ev})
    scored.sort(key=lambda x: (x.get("expected_value", 0), x.get("edge", 0)), reverse=True)
    return scored

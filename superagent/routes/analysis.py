import json
from time import perf_counter
from typing import Any, Dict, List, Optional

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from agents.superagent import SportsSuperAgent
from utils.cache import cache_key, get_cached, set_cached

router = APIRouter()
agent = SportsSuperAgent()


class MatchPreviewRequest(BaseModel):
    home_team: str
    away_team: str
    sport: str
    league: Optional[str] = None
    match_date: Optional[str] = None
    home_odds: Optional[float] = None
    away_odds: Optional[float] = None
    draw_odds: Optional[float] = None
    context: Dict[str, Any] = Field(default_factory=dict)


class OddsValueRequest(BaseModel):
    odds_data: Dict[str, Any]
    sport: str


class CalibrationRequest(BaseModel):
    predictions: List[float]
    outcomes: List[int]


class DashboardStatsRequest(BaseModel):
    user_id: str
    bets: List[Dict[str, Any]] = Field(default_factory=list)


def timed_response(payload: Dict[str, Any], start: float, status_code: int = 200):
    resp = JSONResponse(content=payload, status_code=status_code)
    resp.headers["X-Response-Time-ms"] = str(round((perf_counter() - start) * 1000, 2))
    return resp


@router.post("/match-preview")
def match_preview(request: MatchPreviewRequest):
    start = perf_counter()
    key = cache_key("analysis:match-preview", request.model_dump())
    if cached := get_cached(key):
        return timed_response({"status": "success", "data": cached, "metadata": {"cached": True}}, start)

    try:
        result = agent.analyze_match(
            request.home_team,
            request.away_team,
            request.sport,
            {
                "league": request.league,
                "match_date": request.match_date,
                "home_odds": request.home_odds,
                "away_odds": request.away_odds,
                "draw_odds": request.draw_odds,
                **request.context,
            },
        )
        set_cached(key, result)
        return timed_response({"status": "success", "data": result, "metadata": {"cached": False}}, start)
    except Exception:
        return timed_response({"status": "error", "error": "Internal server error", "data": {}}, start, 500)


@router.post("/odds-value")
def odds_value(request: OddsValueRequest):
    start = perf_counter()
    key = cache_key("analysis:odds-value", request.model_dump())
    if cached := get_cached(key):
        return timed_response({"status": "success", "data": cached, "metadata": {"cached": True}}, start)

    try:
        result = agent.analyze_odds_value(request.odds_data, request.sport)
        set_cached(key, result)
        return timed_response({"status": "success", "data": result, "metadata": {"cached": False}}, start)
    except Exception:
        return timed_response({"status": "error", "error": "Internal server error", "data": {}}, start, 500)


@router.post("/calibration")
def calibration(request: CalibrationRequest):
    start = perf_counter()
    key = cache_key("analysis:calibration", request.model_dump())
    if cached := get_cached(key):
        return timed_response({"status": "success", "data": cached, "metadata": {"cached": True}}, start)

    try:
        result = agent.calculate_calibration(request.predictions, request.outcomes)
        set_cached(key, result)
        return timed_response({"status": "success", "data": result, "metadata": {"cached": False}}, start)
    except ValueError as exc:
        return timed_response({"status": "error", "error": str(exc), "data": {}}, start, 400)
    except Exception:
        return timed_response({"status": "error", "error": "Internal server error", "data": {}}, start, 500)


@router.get("/dashboard-stats")
def dashboard_stats_get(user_id: str, bets: Optional[str] = None):
    start = perf_counter()
    try:
        parsed_bets = []
        if bets:
            parsed_bets = json.loads(bets)
        payload = {"user_id": user_id, "bets": parsed_bets}
        key = cache_key("analysis:dashboard-stats", payload)
        if cached := get_cached(key):
            return timed_response({"status": "success", "data": cached, "metadata": {"cached": True}}, start)

        result = agent.get_dashboard_stats(user_id, parsed_bets)
        set_cached(key, result)
        return timed_response({"status": "success", "data": result, "metadata": {"cached": False}}, start)
    except Exception:
        return timed_response({"status": "error", "error": "Internal server error", "data": {}}, start, 500)


@router.post("/dashboard-stats")
def dashboard_stats_post(request: DashboardStatsRequest):
    start = perf_counter()
    key = cache_key("analysis:dashboard-stats", request.model_dump())
    if cached := get_cached(key):
        return timed_response({"status": "success", "data": cached, "metadata": {"cached": True}}, start)
    try:
        result = agent.get_dashboard_stats(request.user_id, request.bets)
        set_cached(key, result)
        return timed_response({"status": "success", "data": result, "metadata": {"cached": False}}, start)
    except Exception:
        return timed_response({"status": "error", "error": "Internal server error", "data": {}}, start, 500)

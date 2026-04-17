from time import perf_counter
from typing import Any, Dict, Optional

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from agents.superagent import SportsSuperAgent
from utils.cache import cache_key, get_cached, set_cached

router = APIRouter()
agent = SportsSuperAgent()


class PlayerStatsRequest(BaseModel):
    player_name: str
    sport: str
    season: Optional[str] = None


class TeamStatsRequest(BaseModel):
    team_name: str
    sport: str
    season: Optional[str] = None


class SportStatsRequest(BaseModel):
    sport: str
    league: Optional[str] = None


def timed_response(payload: Dict[str, Any], start: float, status_code: int = 200):
    resp = JSONResponse(content=payload, status_code=status_code)
    resp.headers["X-Response-Time-ms"] = str(round((perf_counter() - start) * 1000, 2))
    return resp


@router.post("/player")
def player_stats(request: PlayerStatsRequest):
    start = perf_counter()
    key = cache_key("stats:player", request.model_dump())
    if cached := get_cached(key):
        return timed_response({"status": "success", "data": cached, "metadata": {"cached": True}}, start)
    try:
        result = agent.get_player_stats(request.player_name, request.sport, request.season)
        set_cached(key, result)
        return timed_response({"status": "success", "data": result, "metadata": {"cached": False}}, start)
    except Exception:
        return timed_response({"status": "error", "error": "Internal server error", "data": {}}, start, 500)


@router.post("/team")
def team_stats(request: TeamStatsRequest):
    start = perf_counter()
    key = cache_key("stats:team", request.model_dump())
    if cached := get_cached(key):
        return timed_response({"status": "success", "data": cached, "metadata": {"cached": True}}, start)
    try:
        result = agent.get_team_stats(request.team_name, request.sport, request.season)
        set_cached(key, result)
        return timed_response({"status": "success", "data": result, "metadata": {"cached": False}}, start)
    except Exception:
        return timed_response({"status": "error", "error": "Internal server error", "data": {}}, start, 500)


@router.post("/sport")
def sport_stats_post(request: SportStatsRequest):
    start = perf_counter()
    key = cache_key("stats:sport", request.model_dump())
    if cached := get_cached(key):
        return timed_response({"status": "success", "data": cached, "metadata": {"cached": True}}, start)
    try:
        result = agent.get_sports_stats(request.sport, request.league)
        set_cached(key, result)
        return timed_response({"status": "success", "data": result, "metadata": {"cached": False}}, start)
    except Exception:
        return timed_response({"status": "error", "error": "Internal server error", "data": {}}, start, 500)


@router.get("/sport")
def sport_stats_get(sport: str, league: Optional[str] = None):
    start = perf_counter()
    payload = {"sport": sport, "league": league}
    key = cache_key("stats:sport", payload)
    if cached := get_cached(key):
        return timed_response({"status": "success", "data": cached, "metadata": {"cached": True}}, start)
    try:
        result = agent.get_sports_stats(sport, league)
        set_cached(key, result)
        return timed_response({"status": "success", "data": result, "metadata": {"cached": False}}, start)
    except Exception:
        return timed_response({"status": "error", "error": "Internal server error", "data": {}}, start, 500)


@router.get("/live-scores")
def live_scores(sport: str = "all"):
    start = perf_counter()
    payload = {"sport": sport}
    key = cache_key("stats:live-scores", payload)
    if cached := get_cached(key):
        return timed_response({"status": "success", "data": cached, "metadata": {"cached": True}}, start)
    try:
        result = agent.get_live_scores(sport)
        set_cached(key, result)
        return timed_response({"status": "success", "data": result, "metadata": {"cached": False}}, start)
    except Exception:
        return timed_response({"status": "error", "error": "Internal server error", "data": {}}, start, 500)


@router.get("/live-scores/nba")
def nba_live_scores():
    start = perf_counter()
    key = cache_key("stats:live-scores-nba", {})
    if cached := get_cached(key):
        return timed_response({"status": "success", "data": cached, "metadata": {"cached": True}}, start)
    try:
        result = agent.get_nba_live_scores()
        set_cached(key, result)
        return timed_response({"status": "success", "data": result, "metadata": {"cached": False}}, start)
    except Exception:
        return timed_response({"status": "error", "error": "Internal server error", "data": {}}, start, 500)


@router.get("/live-odds")
def live_odds(sport: str = "basketball_nba", market: str = "h2h"):
    start = perf_counter()
    payload = {"sport": sport, "market": market}
    key = cache_key("stats:live-odds", payload)
    if cached := get_cached(key):
        return timed_response({"status": "success", "data": cached, "metadata": {"cached": True}}, start)
    try:
        result = agent.get_live_odds(sport, market)
        set_cached(key, result)
        return timed_response({"status": "success", "data": result, "metadata": {"cached": False}}, start)
    except Exception:
        return timed_response({"status": "error", "error": "Internal server error", "data": {}}, start, 500)

from time import perf_counter
from typing import Any, Dict, Optional

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from agents.superagent import SportsSuperAgent
from utils.cache import cache_key, get_cached, set_cached

router = APIRouter()
agent = SportsSuperAgent()


class EnhancedPredictionRequest(BaseModel):
    match_data: Dict[str, Any]


class TopTenRequest(BaseModel):
    sport: str
    league: Optional[str] = None


def timed_response(payload: Dict[str, Any], start: float, status_code: int = 200):
    resp = JSONResponse(content=payload, status_code=status_code)
    resp.headers["X-Response-Time-ms"] = str(round((perf_counter() - start) * 1000, 2))
    return resp


@router.post("/enhanced")
def enhanced_prediction(request: EnhancedPredictionRequest):
    start = perf_counter()
    key = cache_key("predictions:enhanced", request.model_dump())
    if cached := get_cached(key):
        return timed_response({"status": "success", "data": cached, "metadata": {"cached": True}}, start)

    try:
        result = agent.enhanced_prediction(request.match_data)
        set_cached(key, result)
        return timed_response({"status": "success", "data": result, "metadata": {"cached": False}}, start)
    except Exception as exc:
        return timed_response({"status": "error", "error": str(exc), "data": {}}, start, 500)


@router.post("/top-ten")
def top_ten_post(request: TopTenRequest):
    start = perf_counter()
    key = cache_key("predictions:top-ten", request.model_dump())
    if cached := get_cached(key):
        return timed_response({"status": "success", "data": cached, "metadata": {"cached": True}}, start)

    try:
        result = agent.get_top_ten_data(request.sport, request.league)
        set_cached(key, result)
        return timed_response({"status": "success", "data": result, "metadata": {"cached": False}}, start)
    except Exception as exc:
        return timed_response({"status": "error", "error": str(exc), "data": {}}, start, 500)


@router.get("/top-ten")
def top_ten_get(sport: str, league: Optional[str] = None):
    start = perf_counter()
    payload = {"sport": sport, "league": league}
    key = cache_key("predictions:top-ten", payload)
    if cached := get_cached(key):
        return timed_response({"status": "success", "data": cached, "metadata": {"cached": True}}, start)

    try:
        result = agent.get_top_ten_data(sport, league)
        set_cached(key, result)
        return timed_response({"status": "success", "data": result, "metadata": {"cached": False}}, start)
    except Exception as exc:
        return timed_response({"status": "error", "error": str(exc), "data": {}}, start, 500)

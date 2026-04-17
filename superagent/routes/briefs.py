from time import perf_counter
from typing import Any, Dict, List

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from agents.superagent import SportsSuperAgent
from utils.cache import cache_key, get_cached, set_cached

router = APIRouter()
agent = SportsSuperAgent()


class DailyBriefRequest(BaseModel):
    sports: List[str] = Field(default_factory=list)
    user_preferences: Dict[str, Any] = Field(default_factory=dict)


class InsightsRequest(BaseModel):
    user_history: List[Dict[str, Any]] = Field(default_factory=list)
    preferences: Dict[str, Any] = Field(default_factory=dict)


def timed_response(payload: Dict[str, Any], start: float, status_code: int = 200):
    resp = JSONResponse(content=payload, status_code=status_code)
    resp.headers["X-Response-Time-ms"] = str(round((perf_counter() - start) * 1000, 2))
    return resp


@router.post("/daily")
def daily_brief(request: DailyBriefRequest):
    start = perf_counter()
    key = cache_key("briefs:daily", request.model_dump())
    if cached := get_cached(key):
        return timed_response({"status": "success", "data": cached, "metadata": {"cached": True}}, start)
    try:
        result = agent.generate_daily_brief(request.sports, request.user_preferences)
        set_cached(key, result)
        return timed_response({"status": "success", "data": result, "metadata": {"cached": False}}, start)
    except Exception:
        return timed_response({"status": "error", "error": "Internal server error", "data": {}}, start, 500)


@router.post("/insights")
def insights(request: InsightsRequest):
    start = perf_counter()
    key = cache_key("briefs:insights", request.model_dump())
    if cached := get_cached(key):
        return timed_response({"status": "success", "data": cached, "metadata": {"cached": True}}, start)
    try:
        result = agent.get_personalized_insights(request.user_history, request.preferences)
        set_cached(key, result)
        return timed_response({"status": "success", "data": result, "metadata": {"cached": False}}, start)
    except Exception:
        return timed_response({"status": "error", "error": "Internal server error", "data": {}}, start, 500)

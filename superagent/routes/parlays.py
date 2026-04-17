from time import perf_counter
from typing import Any, Dict, List

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from agents.superagent import SportsSuperAgent
from utils.cache import cache_key, get_cached, set_cached

router = APIRouter()
agent = SportsSuperAgent()


class GenerateParlayRequest(BaseModel):
    games: List[Dict[str, Any]] = Field(default_factory=list)
    bankroll: float = 0
    risk_level: str = "medium"


def timed_response(payload: Dict[str, Any], start: float, status_code: int = 200):
    resp = JSONResponse(content=payload, status_code=status_code)
    resp.headers["X-Response-Time-ms"] = str(round((perf_counter() - start) * 1000, 2))
    return resp


@router.post("/generate")
def generate(request: GenerateParlayRequest):
    start = perf_counter()
    key = cache_key("parlays:generate", request.model_dump())
    if cached := get_cached(key):
        return timed_response({"status": "success", "data": cached, "metadata": {"cached": True}}, start)

    try:
        result = agent.generate_parlay(request.games, request.bankroll, request.risk_level)
        set_cached(key, result)
        return timed_response({"status": "success", "data": result, "metadata": {"cached": False}}, start)
    except Exception as exc:
        return timed_response({"status": "error", "error": str(exc), "data": {}}, start, 500)

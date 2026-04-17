import json
from time import perf_counter
from typing import Any, Dict, List

from fastapi import APIRouter
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field

from agents.superagent import SportsSuperAgent
from utils.cache import cache_key, get_cached, set_cached

router = APIRouter()
agent = SportsSuperAgent()


class SalChatRequest(BaseModel):
    message: str
    conversation_history: List[Dict[str, Any]] = Field(default_factory=list)
    user_context: Dict[str, Any] = Field(default_factory=dict)
    stream: bool = False


class AskRequest(BaseModel):
    message: str
    context: Dict[str, Any] = Field(default_factory=dict)


def timed_response(payload: Dict[str, Any], start: float, status_code: int = 200):
    resp = JSONResponse(content=payload, status_code=status_code)
    resp.headers["X-Response-Time-ms"] = str(round((perf_counter() - start) * 1000, 2))
    return resp


@router.post("/sal")
def sal_chat(request: SalChatRequest):
    start = perf_counter()
    key = cache_key("chat:sal", request.model_dump())
    if not request.stream and (cached := get_cached(key)):
        return timed_response({"status": "success", "data": cached, "metadata": {"cached": True}}, start)

    try:
        result = agent.ask_sal(request.message, request.conversation_history, request.user_context)

        if request.stream:
            text = str(result.get("reply", ""))

            def generate():
                for token in text.split(" "):
                    yield f"data: {json.dumps({'token': token + ' '})}\n\n"
                yield f"data: {json.dumps({'done': True, 'full': text})}\n\n"

            resp = StreamingResponse(generate(), media_type="text/event-stream")
            resp.headers["Cache-Control"] = "no-cache"
            resp.headers["X-Response-Time-ms"] = str(round((perf_counter() - start) * 1000, 2))
            return resp

        set_cached(key, result)
        return timed_response({"status": "success", "data": result, "metadata": {"cached": False}}, start)
    except Exception:
        return timed_response({"status": "error", "error": "Internal server error", "data": {}}, start, 500)


@router.post("/ask")
def ask(request: AskRequest):
    start = perf_counter()
    key = cache_key("chat:ask", request.model_dump())
    if cached := get_cached(key):
        return timed_response({"status": "success", "data": cached, "metadata": {"cached": True}}, start)

    try:
        result = agent.ask_sal(request.message, [], request.context)
        set_cached(key, result)
        return timed_response({"status": "success", "data": result, "metadata": {"cached": False}}, start)
    except Exception:
        return timed_response({"status": "error", "error": "Internal server error", "data": {}}, start, 500)

from typing import Any, Dict, List
import httpx
from utils.config import SEARCH_ENABLED


def search_sports_context(query: str, limit: int = 5) -> List[Dict[str, Any]]:
    if not SEARCH_ENABLED or not query.strip():
        return []

    url = "https://api.duckduckgo.com/"
    params = {
        "q": query,
        "format": "json",
        "no_redirect": 1,
        "no_html": 1,
    }

    try:
        with httpx.Client(timeout=8.0) as client:
            res = client.get(url, params=params)
            res.raise_for_status()
            payload = res.json()

        out: List[Dict[str, Any]] = []
        for item in payload.get("RelatedTopics", [])[:limit]:
            if isinstance(item, dict) and item.get("Text"):
                out.append({"title": item.get("Text"), "url": item.get("FirstURL")})
        return out
    except Exception:
        return []

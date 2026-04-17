from cachetools import TTLCache
from utils.config import CACHE_TTL
import hashlib
import json

_cache = TTLCache(maxsize=200, ttl=CACHE_TTL)

def cache_key(prefix: str, data: dict) -> str:
    payload = json.dumps(data, sort_keys=True, default=str)
    h = hashlib.sha256(payload.encode()).hexdigest()
    return f"{prefix}:{h}"

def get_cached(key: str):
    return _cache.get(key)

def set_cached(key: str, value):
    _cache[key] = value

import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
ODDS_API_KEY = os.getenv("ODDS_API_KEY", "")
PORT = int(os.getenv("PORT", 8000))
CACHE_TTL = int(os.getenv("CACHE_TTL", 300))
SEARCH_ENABLED = os.getenv("SEARCH_ENABLED", "true").lower() == "true"
CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:3000"
).split(",")

# Best free model on Groq - fast and capable
DEFAULT_MODEL = "llama-3.3-70b-versatile"
FAST_MODEL = "llama-3.1-8b-instant"

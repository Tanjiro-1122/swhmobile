from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from utils.config import CORS_ORIGINS, PORT
from routes import analysis, predictions, parlays, stats, briefs, chat

app = FastAPI(
    title="Sports Wager Helper Superagent",
    description="Self-hosted AI superagent for sports betting analysis",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analysis.router, prefix="/api/analysis", tags=["Analysis"])
app.include_router(predictions.router, prefix="/api/predictions", tags=["Predictions"])
app.include_router(parlays.router, prefix="/api/parlays", tags=["Parlays"])
app.include_router(stats.router, prefix="/api/stats", tags=["Stats"])
app.include_router(briefs.router, prefix="/api/briefs", tags=["Briefs"])
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])


@app.get("/health")
def health():
    return {"status": "ok", "service": "sports-wager-superagent"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=True)

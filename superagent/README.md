# Sports Wager Helper Superagent

Self-hosted AI backend for `swhmobile` that replaces Base44 cloud functions with a free local architecture using FastAPI + CrewAI + Groq.

## What this replaces

This service provides replacements for:
- `analyzeMatchPreview`, `analyzeOddsValue`, `calculateCalibration`, `enhancedPrediction`
- `generateDailyBrief`, `generateParlay`, `generatePersonalizedInsights`
- `getDashboardStats`, `getLiveOdds`, `getLiveScores`, `getNbaLiveScores`
- `getPlayerStats`, `getSportsStats`, `getTeamStats`
- `getTopTenData` / `fetchTopTen`
- SAL chat endpoints used by AskSAL-style flows

## Quick start (3 steps)

1. **Install deps**
   ```bash
   cd superagent
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```
2. **Configure env**
   ```bash
   cp .env.example .env
   # then set GROQ_API_KEY
   ```
3. **Run**
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

Health check:
```bash
curl http://localhost:8000/health
```

## Free Groq API key

1. Go to https://console.groq.com
2. Create a free account
3. Create an API key
4. Put it in `.env` as `GROQ_API_KEY=...`

Primary model used: **`llama-3.3-70b-versatile`**.

## Endpoints

All endpoints return consistent JSON (`status`, `data`, optional `metadata`) and include `X-Response-Time-ms` header.

### Analysis
- `POST /api/analysis/match-preview`
- `POST /api/analysis/odds-value`
- `POST /api/analysis/calibration`
- `GET|POST /api/analysis/dashboard-stats`

```bash
curl -X POST http://localhost:8000/api/analysis/match-preview \
  -H 'Content-Type: application/json' \
  -d '{"home_team":"Lakers","away_team":"Warriors","sport":"NBA"}'
```

### Predictions
- `POST /api/predictions/enhanced`
- `GET|POST /api/predictions/top-ten`

```bash
curl "http://localhost:8000/api/predictions/top-ten?sport=NBA&league=NBA"
```

### Parlays
- `POST /api/parlays/generate`

```bash
curl -X POST http://localhost:8000/api/parlays/generate \
  -H 'Content-Type: application/json' \
  -d '{"games":[{"game":"LAL vs GSW","odds":1.9,"confidence":0.62}],"bankroll":1000,"risk_level":"medium"}'
```

### Stats
- `POST /api/stats/player`
- `POST /api/stats/team`
- `GET|POST /api/stats/sport`
- `GET /api/stats/live-scores`
- `GET /api/stats/live-scores/nba`
- `GET /api/stats/live-odds`

### Briefs
- `POST /api/briefs/daily`
- `POST /api/briefs/insights`

### Chat
- `POST /api/chat/sal` (supports streaming with `stream=true`)
- `POST /api/chat/ask`

Streaming example:
```bash
curl -N -X POST http://localhost:8000/api/chat/sal \
  -H 'Content-Type: application/json' \
  -d '{"message":"Best NBA value tonight?","stream":true}'
```

## React frontend connection

At repo root `.env`:
```env
VITE_USE_SUPERAGENT=true
VITE_SUPERAGENT_URL=http://localhost:8000
```

Frontend helper files:
- `src/api/superagentClient.js`
- `src/hooks/useSuperAgent.js`
- `src/config/superagent.js`

## Docker deployment

From repo root:
```bash
docker compose up --build
```

Services:
- `superagent` on `http://localhost:8000`
- `frontend` with `VITE_SUPERAGENT_URL=http://superagent:8000`

## Add new agents

1. Add a factory in `superagent/agents/your_agent.py` returning `crewai.Agent`
2. Add orchestration logic in `agents/superagent.py`
3. Add/extend a route in `superagent/routes/`
4. Add cache key usage via `utils/cache.py`

## Cost breakdown

- FastAPI/CrewAI/LangChain stack: **free/open-source**
- Groq API: **free tier available**
- Odds API integration: **optional free tier**
- Self-host runtime: **local Docker or local Python, no mandatory paid service**

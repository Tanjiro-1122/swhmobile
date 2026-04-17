from __future__ import annotations

import json
from collections import defaultdict
from datetime import datetime, timezone
from statistics import mean
from typing import Any, Dict, List

from crewai import Crew, Task
from langchain_groq import ChatGroq

from agents.odds_analyst import create_odds_analyst
from agents.match_previewer import create_match_previewer
from agents.parlay_builder import create_parlay_builder
from agents.stats_analyst import create_stats_analyst
from agents.briefing_agent import create_briefing_agent
from agents.insights_agent import create_insights_agent
from tools.odds_tools import fetch_live_odds, rank_value_bets
from tools.search_tools import search_sports_context
from tools.stats_tools import (
    get_live_scores as fetch_live_scores,
    get_nba_live_scores as fetch_nba_scores,
    get_player_stats as fetch_player_stats,
    get_team_stats as fetch_team_stats,
    get_sport_stats as fetch_sport_stats,
)
from utils.config import GROQ_API_KEY, DEFAULT_MODEL, FAST_MODEL


class SportsSuperAgent:
    def __init__(self):
        self.llm = None
        self.fast_llm = None
        if GROQ_API_KEY:
            self.llm = ChatGroq(api_key=GROQ_API_KEY, model=DEFAULT_MODEL, temperature=0.3)
            self.fast_llm = ChatGroq(api_key=GROQ_API_KEY, model=FAST_MODEL, temperature=0.2)

    def _run_prompt_json(self, prompt: str, fallback: Dict[str, Any], fast: bool = False) -> Dict[str, Any]:
        if not self.llm:
            return fallback
        try:
            model = self.fast_llm if fast and self.fast_llm else self.llm
            response = model.invoke(
                f"Return strict JSON only. No markdown.\n\n{prompt}"
            )
            content = getattr(response, "content", "")
            return json.loads(content) if content else fallback
        except Exception:
            return fallback

    def analyze_match(self, home_team: str, away_team: str, sport: str, context: Dict[str, Any] | None = None) -> Dict[str, Any]:
        context = context or {}

        fallback_preview = {
            "preview": f"{home_team} vs {away_team} {sport} matchup overview generated locally.",
            "prediction": home_team,
            "confidence": 0.55,
            "key_factors": ["recent form", "home advantage", "injury uncertainty"],
            "recommendation": "Lean only; wait for confirmed lineups/injuries.",
        }

        if self.llm:
            try:
                previewer = create_match_previewer(self.llm)
                odds_agent = create_odds_analyst(self.llm)

                preview_task = Task(
                    description=(
                        f"Analyze {sport} match {home_team} vs {away_team}. "
                        f"Context: {json.dumps(context)}. Return structured JSON."
                    ),
                    agent=previewer,
                    expected_output="JSON with preview, prediction, confidence, key_factors, recommendation",
                )
                odds_task = Task(
                    description=(
                        f"Analyze value bets for {home_team} vs {away_team} in {sport}. "
                        "Return JSON with value_bets, markets_analysis, best_bet, confidence_score."
                    ),
                    agent=odds_agent,
                    expected_output="JSON",
                )

                crew = Crew(agents=[previewer, odds_agent], tasks=[preview_task, odds_task], verbose=False)
                crew_result = str(crew.kickoff())
                return {
                    "preview": fallback_preview,
                    "odds": {"summary": crew_result[:1200]},
                    "mode": "crew",
                }
            except Exception:
                pass

        odds_context = self.analyze_odds_value(
            {
                "markets": [
                    {"selection": home_team, "odds": context.get("home_odds", 2.0), "true_probability": 0.52},
                    {"selection": away_team, "odds": context.get("away_odds", 2.1), "true_probability": 0.48},
                ]
            },
            sport,
        )

        ai_preview = self._run_prompt_json(
            prompt=(
                f"Give betting-focused preview for {sport}: {home_team} vs {away_team}. "
                f"Use context {json.dumps(context)}."
            ),
            fallback=fallback_preview,
        )

        return {"preview": ai_preview, "odds": odds_context, "mode": "direct"}

    def generate_parlay(self, games: List[Dict[str, Any]], bankroll: float, risk_level: str) -> Dict[str, Any]:
        if not games:
            return {"legs": [], "recommended_stake": 0, "risk_level": risk_level, "notes": ["No games provided"]}

        risk_map = {"low": 2, "medium": 3, "high": 4}
        legs_count = risk_map.get((risk_level or "medium").lower(), 3)
        ranked = sorted(
            games,
            key=lambda g: float(g.get("confidence", g.get("edge", 0.5)) or 0),
            reverse=True,
        )
        legs = ranked[: min(legs_count, len(ranked))]

        combined_odds = 1.0
        for leg in legs:
            combined_odds *= float(leg.get("odds", 1.8) or 1.8)

        stake_ratio = {"low": 0.01, "medium": 0.02, "high": 0.03}.get((risk_level or "medium").lower(), 0.02)
        recommended_stake = round(max(bankroll, 0) * stake_ratio, 2)

        return {
            "legs": legs,
            "combined_odds": round(combined_odds, 3),
            "recommended_stake": recommended_stake,
            "risk_level": risk_level,
            "potential_return": round(recommended_stake * combined_odds, 2),
            "notes": ["Avoid adding negative-EV legs.", "Re-check odds before placing the parlay."],
        }

    def generate_daily_brief(self, sports: List[str], user_preferences: Dict[str, Any]) -> Dict[str, Any]:
        sports = sports or ["NBA", "NFL", "MLB"]
        fallback = {
            "date": datetime.now(timezone.utc).date().isoformat(),
            "sports": sports,
            "top_plays": [],
            "injury_watch": [],
            "line_movement": [],
            "user_focus": user_preferences,
        }

        if self.llm:
            try:
                briefer = create_briefing_agent(self.llm)
                stats = create_stats_analyst(self.llm)
                task1 = Task(
                    description=f"Generate concise betting brief for sports={sports}, preferences={user_preferences}",
                    agent=briefer,
                    expected_output="JSON brief",
                )
                task2 = Task(
                    description="Add supporting statistical context and confidence by play.",
                    agent=stats,
                    expected_output="JSON addendum",
                )
                crew = Crew(agents=[briefer, stats], tasks=[task1, task2], verbose=False)
                result = str(crew.kickoff())
                return {**fallback, "summary": result[:1200], "mode": "crew"}
            except Exception:
                pass

        fallback["top_plays"] = [{"sport": s, "play": f"Best value lean in {s}", "confidence": 0.58} for s in sports[:5]]
        return {**fallback, "mode": "direct"}

    def ask_sal(self, message: str, conversation_history: List[Dict[str, str]], user_context: Dict[str, Any]) -> Dict[str, Any]:
        fallback = {
            "reply": "I can help with matchup analysis, odds value, parlays, and bankroll discipline. Share a game or market.",
            "model": "local-fallback",
        }
        if not message:
            return fallback

        web_context = search_sports_context(message, limit=3)
        prompt = (
            "You are SAL (Sports Analytics Language model). Provide concise, actionable betting analysis. "
            f"User context: {json.dumps(user_context)}\n"
            f"Conversation: {json.dumps(conversation_history[-8:])}\n"
            f"Web context: {json.dumps(web_context)}\n"
            f"User message: {message}\n"
            "Return JSON with keys: reply, bullets, confidence."
        )

        response = self._run_prompt_json(prompt=prompt, fallback=fallback, fast=True)
        if "reply" not in response:
            response = {"reply": str(response), "model": "groq" if self.llm else "local-fallback"}
        response.setdefault("model", "groq" if self.llm else "local-fallback")
        response.setdefault("web_context", web_context)
        return response

    def get_personalized_insights(self, user_history: List[Dict[str, Any]], preferences: Dict[str, Any]) -> Dict[str, Any]:
        total = len(user_history or [])
        wins = sum(1 for b in user_history or [] if b.get("result") == "win")
        win_rate = round((wins / total) * 100, 2) if total else 0.0

        by_sport: Dict[str, Dict[str, int]] = defaultdict(lambda: {"wins": 0, "losses": 0})
        for bet in user_history or []:
            sport = bet.get("sport", "unknown")
            if bet.get("result") == "win":
                by_sport[sport]["wins"] += 1
            elif bet.get("result") == "loss":
                by_sport[sport]["losses"] += 1

        edges = []
        for sport, rec in by_sport.items():
            attempts = rec["wins"] + rec["losses"]
            if attempts == 0:
                continue
            sr = rec["wins"] / attempts
            edges.append({"sport": sport, "sample": attempts, "strike_rate": round(sr, 3)})
        edges.sort(key=lambda x: x["strike_rate"], reverse=True)

        return {
            "summary": {
                "total_bets": total,
                "wins": wins,
                "win_rate": win_rate,
                "preferred_markets": preferences.get("markets", []),
            },
            "sport_edges": edges,
            "recommendations": [
                "Focus stake sizing on your strongest sport/market combinations.",
                "Lower stake after 3+ consecutive losses to reduce tilt risk.",
            ],
        }

    def analyze_odds_value(self, odds_data: Dict[str, Any], sport: str) -> Dict[str, Any]:
        rows = odds_data.get("markets") or odds_data.get("odds") or []
        ranked = rank_value_bets(rows)
        best_bet = ranked[0] if ranked else None
        return {
            "sport": sport,
            "value_bets": ranked,
            "best_bet": best_bet,
            "markets_analysis": {
                "total_markets": len(rows),
                "positive_ev_markets": sum(1 for r in ranked if r.get("expected_value", 0) > 0),
            },
            "confidence_score": round(float(best_bet.get("edge", 0.0)) + 0.5, 3) if best_bet else 0.0,
        }

    def calculate_calibration(self, predictions: List[float], outcomes: List[int]) -> Dict[str, Any]:
        if len(predictions) != len(outcomes):
            raise ValueError("predictions and outcomes must have same length")
        if not predictions:
            return {
                "total_predictions": 0,
                "overall_accuracy": 0,
                "brier_score": 0,
                "calibration_bins": [],
            }

        correct = 0
        brier_terms = []
        bins = {"0-0.2": [], "0.2-0.4": [], "0.4-0.6": [], "0.6-0.8": [], "0.8-1.0": []}

        for p, y in zip(predictions, outcomes):
            p = max(0.0, min(float(p), 1.0))
            yv = 1 if int(y) == 1 else 0
            pred_label = 1 if p >= 0.5 else 0
            if pred_label == yv:
                correct += 1
            brier_terms.append((p - yv) ** 2)
            if p < 0.2:
                bins["0-0.2"].append((p, yv))
            elif p < 0.4:
                bins["0.2-0.4"].append((p, yv))
            elif p < 0.6:
                bins["0.4-0.6"].append((p, yv))
            elif p < 0.8:
                bins["0.6-0.8"].append((p, yv))
            else:
                bins["0.8-1.0"].append((p, yv))

        calibration_bins = []
        for name, items in bins.items():
            if not items:
                continue
            avg_conf = mean([i[0] for i in items])
            avg_outcome = mean([i[1] for i in items])
            calibration_bins.append(
                {
                    "bin": name,
                    "count": len(items),
                    "avg_confidence": round(avg_conf, 4),
                    "actual_hit_rate": round(avg_outcome, 4),
                    "gap": round(avg_conf - avg_outcome, 4),
                }
            )

        return {
            "total_predictions": len(predictions),
            "overall_accuracy": round(correct / len(predictions), 4),
            "brier_score": round(mean(brier_terms), 4),
            "calibration_bins": calibration_bins,
        }

    def enhanced_prediction(self, match_data: Dict[str, Any]) -> Dict[str, Any]:
        teams = match_data.get("teams", {})
        home = teams.get("home") or match_data.get("home_team") or "Home"
        away = teams.get("away") or match_data.get("away_team") or "Away"
        home_strength = float(match_data.get("home_strength", 0.52))
        away_strength = float(match_data.get("away_strength", 0.48))
        total = max(home_strength + away_strength, 0.0001)
        home_prob = round(home_strength / total, 4)
        away_prob = round(away_strength / total, 4)

        return {
            "match": {"home": home, "away": away},
            "probabilities": {"home": home_prob, "away": away_prob},
            "prediction": home if home_prob >= away_prob else away,
            "confidence": max(home_prob, away_prob),
            "factors": match_data.get("factors", ["form", "injuries", "schedule"]),
        }

    def get_dashboard_stats(self, user_id: str, bets: List[Dict[str, Any]]) -> Dict[str, Any]:
        total_bets = len(bets or [])
        wins = sum(1 for b in bets or [] if b.get("result") == "win")
        losses = sum(1 for b in bets or [] if b.get("result") == "loss")
        pushes = total_bets - wins - losses
        total_staked = sum(float(b.get("stake", 0) or 0) for b in bets or [])
        total_profit = sum(float(b.get("profit", 0) or 0) for b in bets or [])
        roi = round((total_profit / total_staked) * 100, 2) if total_staked else 0.0

        return {
            "user_id": user_id,
            "total_bets": total_bets,
            "wins": wins,
            "losses": losses,
            "pushes": pushes,
            "win_rate": round((wins / total_bets) * 100, 2) if total_bets else 0.0,
            "total_staked": round(total_staked, 2),
            "total_profit": round(total_profit, 2),
            "roi": roi,
        }

    def get_player_stats(self, player_name: str, sport: str, season: str | None = None) -> Dict[str, Any]:
        return fetch_player_stats(player_name, sport, season)

    def get_team_stats(self, team_name: str, sport: str, season: str | None = None) -> Dict[str, Any]:
        return fetch_team_stats(team_name, sport, season)

    def get_sports_stats(self, sport: str, league: str | None = None) -> Dict[str, Any]:
        return fetch_sport_stats(sport, league)

    def get_live_scores(self, sport: str = "all") -> Dict[str, Any]:
        return fetch_live_scores(sport)

    def get_nba_live_scores(self) -> Dict[str, Any]:
        return fetch_nba_scores()

    def get_live_odds(self, sport: str = "basketball_nba", market: str = "h2h") -> Dict[str, Any]:
        return fetch_live_odds(sport, market)

    def get_top_ten_data(self, sport: str, league: str | None = None) -> Dict[str, Any]:
        picks = [
            {"rank": i + 1, "sport": sport, "league": league, "pick": f"Top value pick #{i + 1}", "confidence": round(0.64 - (i * 0.03), 3)}
            for i in range(10)
        ]
        return {"sport": sport, "league": league, "generated_at": datetime.now(timezone.utc).isoformat(), "picks": picks}

    def run(self, task: str, context: Dict[str, Any]) -> Dict[str, Any]:
        route = (task or "").lower()
        if route in {"match", "match-preview", "analyze-match"}:
            return self.analyze_match(
                context.get("home_team", "Home"),
                context.get("away_team", "Away"),
                context.get("sport", "sport"),
                context,
            )
        if route in {"parlay", "generate-parlay"}:
            return self.generate_parlay(context.get("games", []), float(context.get("bankroll", 0)), context.get("risk_level", "medium"))
        if route in {"daily-brief", "brief"}:
            return self.generate_daily_brief(context.get("sports", []), context.get("user_preferences", {}))
        if route in {"sal", "chat"}:
            return self.ask_sal(context.get("message", ""), context.get("conversation_history", []), context.get("user_context", {}))
        return {"message": "Unknown task route", "task": task}

/**
 * Sports Wager Helper Superagent Client
 * Drop-in replacement for Base44 SDK functions
 *
 * Set VITE_SUPERAGENT_URL in your .env file
 * Default: http://localhost:8000 (local dev)
 */

const BASE_URL = import.meta.env.VITE_SUPERAGENT_URL || 'http://localhost:8000';

class SuperAgentClient {
  constructor(baseUrl = BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async #post(path, body = {}) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      let details = '';
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const payload = await res.json().catch(() => null);
        details = payload?.error || payload?.message || JSON.stringify(payload || {});
      } else {
        details = await res.text();
      }
      throw new Error(`SuperAgent error: ${res.status} ${details}`.trim());
    }
    return res.json();
  }

  async #get(path, params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = `${this.baseUrl}${path}${query ? `?${query}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`SuperAgent error: ${res.status}`);
    return res.json();
  }

  analyzeMatchPreview(homeTeam, awayTeam, sport, opts = {}) {
    return this.#post('/api/analysis/match-preview', { home_team: homeTeam, away_team: awayTeam, sport, ...opts });
  }

  analyzeOddsValue(oddsData, sport) {
    return this.#post('/api/analysis/odds-value', { odds_data: oddsData, sport });
  }

  calculateCalibration(predictions, outcomes) {
    return this.#post('/api/analysis/calibration', { predictions, outcomes });
  }

  getDashboardStats(userId, bets = []) {
    return this.#post('/api/analysis/dashboard-stats', { user_id: userId, bets });
  }

  enhancedPrediction(matchData) {
    return this.#post('/api/predictions/enhanced', { match_data: matchData });
  }

  getTopTenData(sport, league) {
    return this.#get('/api/predictions/top-ten', { sport, league });
  }

  fetchTopTen(sport, league) {
    return this.getTopTenData(sport, league);
  }

  generateParlay(games, bankroll, riskLevel = 'medium') {
    return this.#post('/api/parlays/generate', { games, bankroll, risk_level: riskLevel });
  }

  getPlayerStats(playerName, sport, season) {
    return this.#post('/api/stats/player', { player_name: playerName, sport, season });
  }

  getTeamStats(teamName, sport, season) {
    return this.#post('/api/stats/team', { team_name: teamName, sport, season });
  }

  getSportsStats(sport, league) {
    return this.#get('/api/stats/sport', { sport, league });
  }

  getLiveScores(sport) {
    return this.#get('/api/stats/live-scores', { sport });
  }

  getNbaLiveScores() {
    return this.#get('/api/stats/live-scores/nba');
  }

  getLiveOdds(sport, market) {
    return this.#get('/api/stats/live-odds', { sport, market });
  }

  generateDailyBrief(sports, userPreferences = {}) {
    return this.#post('/api/briefs/daily', { sports, user_preferences: userPreferences });
  }

  generatePersonalizedInsights(userHistory, preferences = {}) {
    return this.#post('/api/briefs/insights', { user_history: userHistory, preferences });
  }

  askSAL(message, conversationHistory = [], userContext = {}, stream = false) {
    return this.#post('/api/chat/sal', {
      message,
      conversation_history: conversationHistory,
      user_context: userContext,
      stream,
    });
  }

  ask(message, context = {}) {
    return this.#post('/api/chat/ask', { message, context });
  }
}

export const superagent = new SuperAgentClient();
export default SuperAgentClient;

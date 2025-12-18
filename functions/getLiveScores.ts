import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const API_BASE = 'https://api.balldontlie.io';

async function fetchFromApi(endpoint, apiKey) {
    const url = `${API_BASE}${endpoint}`;
    try {
        const response = await fetch(url, {
            headers: { 'Authorization': apiKey }
        });
        if (!response.ok) {
            console.error(`API Error for ${url}: ${response.status} ${await response.text()}`);
            return []; // Return empty array on error to not fail the whole process
        }
        const { data } = await response.json();
        return data;
    } catch (error) {
        console.error(`Fetch Error for ${url}:`, error);
        return [];
    }
}

// --- Normalizers for different sports ---

function normalizeNbaGame(game) {
    if (!game.home_team || !game.visitor_team) return null;
    return {
        id: `nba-${game.id}`,
        league: 'NBA',
        sport: 'Basketball',
        commence_time: game.datetime || game.date,
        status: game.status,
        period: game.period,
        time: game.time,
        period_detail: game.period_detail,
        home_team: game.home_team.full_name,
        away_team: game.visitor_team.full_name,
        home_team_badge: `https://a.espncdn.com/i/teamlogos/nba/500/${game.home_team.abbreviation}.png`,
        away_team_badge: `https://a.espncdn.com/i/teamlogos/nba/500/${game.visitor_team.abbreviation}.png`,
        home_score: game.home_team_score,
        away_score: game.visitor_team_score,
    };
}

function normalizeNflGame(game) {
    if (!game.home_team || !game.visitor_team) return null;
    return {
        id: `nfl-${game.id}`,
        league: 'NFL',
        sport: 'Football',
        commence_time: game.date,
        status: game.status,
        period: null, // NFL API doesn't provide this in the main game object
        time: null,
        period_detail: game.summary, // e.g. "Final" or "7:30 - 2nd"
        home_team: game.home_team.full_name,
        away_team: game.visitor_team.full_name,
        home_team_badge: `https://a.espncdn.com/i/teamlogos/nfl/500/${game.home_team.abbreviation}.png`,
        away_team_badge: `https://a.espncdn.com/i/teamlogos/nfl/500/${game.visitor_team.abbreviation}.png`,
        home_score: game.home_team_score,
        away_score: game.visitor_team_score,
    };
}

function normalizeNhlGame(game) {
    if (!game.home_team || !game.away_team) return null;
    return {
        id: `nhl-${game.id}`,
        league: 'NHL',
        sport: 'Hockey',
        commence_time: game.start_time_utc || game.game_date,
        status: game.game_state, // e.g. "LIVE", "FINAL", "PRE"
        period: game.period,
        time: game.time_remaining,
        period_detail: game.period_descriptor ? `${game.time_remaining} ${game.period_descriptor.periodType || ''}`.trim() : null,
        home_team: game.home_team.full_name,
        away_team: game.away_team.full_name,
        home_team_badge: `https://www-league.nhlstatic.com/images/logos/teams-current-primary-light/${game.home_team.id}.svg`,
        away_team_badge: `https://www-league.nhlstatic.com/images/logos/teams-current-primary-light/${game.away_team.id}.svg`,
        home_score: game.home_score,
        away_score: game.away_score,
    };
}


Deno.serve(async (req) => {
    try {
        const apiKey = Deno.env.get("BALLDONTLIE_API_KEY");
        if (!apiKey) {
            return Response.json({ error: "BALLDONTLIE_API_KEY is not configured." }, { status: 500 });
        }

        const today = new Date().toISOString().split('T')[0];
        const endpoints = [
            `/nba/v1/games?dates[]=${today}`,
            `/nfl/v1/games?dates[]=${today}`,
            `/nhl/v1/games?dates[]=${today}`,
        ];

        const results = await Promise.all(endpoints.map(ep => fetchFromApi(ep, apiKey)));
        
        const nbaGames = (results[0] || []).map(normalizeNbaGame).filter(g => g);
        const nflGames = (results[1] || []).map(normalizeNflGame).filter(g => g);
        const nhlGames = (results[2] || []).map(normalizeNhlGame).filter(g => g);
        
        let allScores = [...nbaGames, ...nflGames, ...nhlGames];

        // Sort: Live games first, then by time
        allScores.sort((a, b) => {
            const isALive = a.status && (a.status.includes(':') || (a.period && a.period > 0)) && a.status !== 'Final' && a.status !== 'FT';
            const isBLive = b.status && (b.status.includes(':') || (b.period && b.period > 0)) && b.status !== 'Final' && b.status !== 'FT';

            if (isALive && !isBLive) return -1;
            if (!isALive && isBLive) return 1;

            return new Date(a.commence_time) - new Date(b.commence_time);
        });

        return Response.json(allScores);

    } catch (error) {
        console.error('Error in getLiveScores function:', error);
        return Response.json({ error: error.message, details: 'The live score service may be temporarily unavailable.' }, { status: 500 });
    }
});
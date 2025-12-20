import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

const API_KEY = Deno.env.get('ODDS_API_KEY');
const SPORTS = [
    'americanfootball_nfl',
    'americanfootball_ncaaf',
    'basketball_nba',
    'basketball_ncaab',
    'icehockey_nhl',
    'baseball_mlb'
];
const BASE_URL = 'https://api.the-odds-api.com/v4/sports';

Deno.serve(async (req) => {
    try {
        // No auth needed for this public data endpoint, but good practice to have the client available
        const base44 = createClientFromRequest(req);

        if (!API_KEY) {
            return new Response(JSON.stringify({ error: 'API key for odds is not configured.' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Fetch scores for all sports concurrently
        const fetchPromises = SPORTS.map(sport => {
            const url = `${BASE_URL}/${sport}/scores/?daysFrom=1&apiKey=${API_KEY}`;
            return fetch(url).then(res => {
                if (!res.ok) {
                    // Log error but don't fail the whole request
                    console.error(`Failed to fetch scores for ${sport}: ${res.statusText}`);
                    return []; // Return empty array for this sport
                }
                return res.json();
            });
        });

        const results = await Promise.all(fetchPromises);

        const liveScores = results.flat().filter(game => game && game.completed === false).map(game => {
            const homeScore = game.scores?.find(s => s.name === game.home_team)?.score ?? '0';
            const awayScore = game.scores?.find(s => s.name === game.away_team)?.score ?? '0';
            
            // Determine status: if there are scores, it's Live. Otherwise, it's Scheduled.
            const status = (game.scores && game.scores.length > 0) ? 'Live' : 'Scheduled';

            return {
                id: game.id,
                sport_title: game.sport_title,
                home_team: game.home_team,
                away_team: game.away_team,
                status: status,
                commence_time: game.commence_time,
                score: status === 'Live' ? `${homeScore} - ${awayScore}` : new Date(game.commence_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
            };
        });
        
        // Sort by status (Live first) then by time
        liveScores.sort((a, b) => {
            if (a.status === 'Live' && b.status !== 'Live') return -1;
            if (a.status !== 'Live' && b.status === 'Live') return 1;
            return new Date(a.commence_time) - new Date(b.commence_time);
        });

        return new Response(JSON.stringify(liveScores), {
            status: 200,
            headers: { 
              'Content-Type': 'application/json',
              'Cache-Control': 'public, max-age=60' // Cache for 60 seconds
            },
        });

    } catch (error) {
        console.error('Error fetching live scores:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
});
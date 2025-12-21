import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// Try both possible API key names
const API_KEY = Deno.env.get('ODDS_API_KEY') || Deno.env.get('THE_ODDS_API_KEY');
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
        const base44 = createClientFromRequest(req);

        if (!API_KEY) {
            console.error('No API key found. Checked ODDS_API_KEY and THE_ODDS_API_KEY');
            return new Response(JSON.stringify({ error: 'API key for odds is not configured.' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // Fetch scores for all sports concurrently
        // Use daysFrom=3 to catch games from past 3 days (including today's games)
        const fetchPromises = SPORTS.map(sport => {
            const url = `${BASE_URL}/${sport}/scores/?daysFrom=3&apiKey=${API_KEY}`;
            console.log(`Fetching: ${sport}`);
            return fetch(url).then(async res => {
                if (!res.ok) {
                    const errorText = await res.text();
                    console.error(`Failed to fetch scores for ${sport}: ${res.status} - ${errorText}`);
                    return [];
                }
                const data = await res.json();
                console.log(`${sport}: ${data.length} games found`);
                return data;
            }).catch(err => {
                console.error(`Error fetching ${sport}:`, err.message);
                return [];
            });
        });

        const results = await Promise.all(fetchPromises);
        const allGames = results.flat();
        console.log(`Total games from API: ${allGames.length}`);

        // Filter to only show games that are not completed
        const liveScores = allGames.filter(game => game && game.completed === false).map(game => {
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
        
        console.log(`Filtered live/upcoming games: ${liveScores.length}`);
        
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
              'Cache-Control': 'public, max-age=60'
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
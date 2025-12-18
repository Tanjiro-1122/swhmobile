import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// A list of popular sports to fetch scores for.
// You can customize this list.
const sports = [
    'americanfootball_nfl',
    'basketball_nba',
    'baseball_mlb',
    // 'icehockey_nhl', // Add or remove sports as needed
];

Deno.serve(async (req) => {
    try {
        // Auth check is not strictly necessary for this public data endpoint,
        // but it's good practice to keep the structure.
        const base44 = createClientFromRequest(req);
        // const user = await base44.auth.me();
        // if (!user) {
        //     return Response.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        const apiKey = Deno.env.get("ODDS_API_KEY");
        if (!apiKey) {
            console.error("THE_ODDS_API_KEY is not set.");
            return Response.json({ error: 'API key for scores is not configured.' }, { status: 500 });
        }

        const allScores = [];
        const fetchPromises = sports.map(sport => {
            const url = `https://api.the-odds-api.com/v4/sports/${sport}/scores/?daysFrom=1&apiKey=${apiKey}`;
            return fetch(url).then(res => {
                if (!res.ok) {
                    console.error(`Failed to fetch scores for ${sport}: ${res.statusText}`);
                    return []; // Return empty array on failure for this sport
                }
                return res.json();
            });
        });

        const results = await Promise.all(fetchPromises);

        results.forEach(sportScores => {
            if (sportScores && sportScores.length > 0) {
                allScores.push(...sportScores);
            }
        });

        // Sort games by commencement time
        allScores.sort((a, b) => new Date(a.commence_time) - new Date(b.commence_time));

        return Response.json(allScores);

    } catch (error) {
        console.error('Error in getLiveScores function:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
    try {
        const apiKey = Deno.env.get("BALLDONTLIE_API_KEY");
        if (!apiKey) {
            return Response.json({ error: "BallDontLie API key is not configured." }, { status: 500 });
        }

        const today = new Date().toISOString().slice(0, 10);
        const url = `https://api.balldontlie.io/v1/games?dates[]=${today}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': apiKey
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("BallDontLie API Error:", errorText);
            throw new Error(`Failed to fetch NBA scores. Status: ${response.status}`);
        }

        const { data: games } = await response.json();

        if (!games || games.length === 0) {
            return Response.json([]);
        }

        const formattedScores = games.map(game => ({
            id: game.id,
            league: 'NBA',
            sport: 'Basketball',
            commence_time: game.datetime,
            status: game.status,
            home_team: game.home_team.full_name,
            away_team: game.visitor_team.full_name,
            home_team_badge: `https://www.nba.com/stats/media/img/teams/logos/${game.home_team.abbreviation}_logo.svg`,
            away_team_badge: `https://www.nba.com/stats/media/img/teams/logos/${game.visitor_team.abbreviation}_logo.svg`,
            home_score: game.home_team_score,
            away_score: game.visitor_team_score,
            period: game.period,
            time: game.time,
            period_detail: game.period_detail,
        })).sort((a, b) => {
            const isALive = a.period > 0 && a.status !== 'Final';
            const isBLive = b.period > 0 && b.status !== 'Final';
            if (isALive && !isBLive) return -1;
            if (!isALive && isBLive) return 1;
            return new Date(a.commence_time) - new Date(b.commence_time);
        });

        return Response.json(formattedScores);

    } catch (error) {
        console.error('Error in getNbaLiveScores function:', error);
        return Response.json({ error: error.message, details: 'The live score service may be temporarily unavailable.' }, { status: 500 });
    }
});
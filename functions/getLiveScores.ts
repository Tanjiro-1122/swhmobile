import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// League IDs for popular sports from TheSportsDB
const LEAGUE_IDS = [
    '4328', // English Premier League
    '4387', // NBA
    '4391', // NFL
    '4424', // MLB
    '4380', // NHL
    '4346', // Spanish La Liga
    '4331', // German Bundesliga
    '4332', // Italian Serie A
    '4334', // French Ligue 1
    '4394', // NCAA Football
].join(',');

Deno.serve(async (req) => {
    try {
        const apiKey = Deno.env.get("THESPORTSDB_API_KEY");
        if (!apiKey) {
            return Response.json({ error: "TheSportsDB API key is not configured." }, { status: 500 });
        }

        const url = `https://www.thesportsdb.com/api/v2/json/${apiKey}/livescore.php?l=${LEAGUE_IDS}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`TheSportsDB API error: ${response.statusText}`);
        }
        const data = await response.json();
        
        const events = data?.events || [];
        
        const formattedEvents = events.map(event => ({
            id: event.idEvent,
            sport_title: event.strSport,
            league: event.strLeague,
            home_team: event.strHomeTeam,
            away_team: event.strAwayTeam,
            home_team_badge: event.strHomeTeamBadge,
            away_team_badge: event.strAwayTeamBadge,
            commence_time: `${event.dateEvent}T${event.strTime}Z`, // Assuming UTC
            completed: event.strStatus === 'Finished',
            scores: [
                { name: event.strHomeTeam, score: event.intHomeScore },
                { name: event.strAwayTeam, score: event.intAwayScore }
            ],
            status: event.strStatus,
        })).sort((a, b) => {
            const aIsLive = a.status?.toLowerCase().includes('live');
            const bIsLive = b.status?.toLowerCase().includes('live');
            if (aIsLive && !bIsLive) return -1;
            if (!aIsLive && bIsLive) return 1;
            return new Date(a.commence_time) - new Date(b.commence_time);
        });

        return Response.json(formattedEvents);

    } catch (error) {
        console.error("Error in getLiveScores function:", error);
        return Response.json({ error: `An error occurred: ${error.message}` }, { status: 500 });
    }
});
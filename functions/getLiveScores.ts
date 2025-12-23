import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

// ESPN hidden API endpoints for scoreboards
const ESPN_ENDPOINTS = {
    nfl: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
    ncaaf: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard',
    nba: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
    ncaab: 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard',
    nhl: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard',
    mlb: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard',
};

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);

        // Fetch scores from ESPN for all sports concurrently
        const fetchPromises = Object.entries(ESPN_ENDPOINTS).map(([sport, url]) => {
            return fetch(url).then(async res => {
                if (!res.ok) {
                    console.error(`Failed to fetch ${sport}: ${res.status}`);
                    return [];
                }
                const data = await res.json();
                const events = data.events || [];
                console.log(`${sport}: ${events.length} games found`);
                return events.map(event => ({ ...event, sportKey: sport }));
            }).catch(err => {
                console.error(`Error fetching ${sport}:`, err.message);
                return [];
            });
        });

        const results = await Promise.all(fetchPromises);
        const allGames = results.flat();
        console.log(`Total games from ESPN: ${allGames.length}`);

        // Transform ESPN data to our format
        const liveScores = allGames.map(event => {
            const competition = event.competitions?.[0];
            if (!competition) return null;

            const homeTeam = competition.competitors?.find(c => c.homeAway === 'home');
            const awayTeam = competition.competitors?.find(c => c.homeAway === 'away');
            
            if (!homeTeam || !awayTeam) return null;

            // Determine status
            const statusType = competition.status?.type?.name || 'STATUS_SCHEDULED';
            let status = 'Scheduled';
            if (statusType === 'STATUS_IN_PROGRESS' || statusType === 'STATUS_HALFTIME') {
                status = 'Live';
            } else if (statusType === 'STATUS_FINAL' || statusType === 'STATUS_FINAL_OT') {
                status = 'Final';
            }

            // Include Final games for ticker display (shows recent results)

            const homeScore = homeTeam.score || '0';
            const awayScore = awayTeam.score || '0';
            const gameTime = new Date(event.date);

            // Sport display names
            const sportNames = {
                nfl: 'NFL',
                ncaaf: 'NCAAF',
                nba: 'NBA',
                ncaab: 'NCAAB',
                nhl: 'NHL',
                mlb: 'MLB'
            };

            return {
                id: event.id,
                sport_title: sportNames[event.sportKey] || event.sportKey.toUpperCase(),
                home_team: homeTeam.team?.shortDisplayName || homeTeam.team?.displayName || 'Home',
                away_team: awayTeam.team?.shortDisplayName || awayTeam.team?.displayName || 'Away',
                status: status,
                commence_time: event.date,
                score: status === 'Live' 
                    ? `${awayScore} - ${homeScore}` 
                    : gameTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
                detail: competition.status?.type?.shortDetail || ''
            };
        }).filter(Boolean);

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
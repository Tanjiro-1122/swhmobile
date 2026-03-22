import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Authenticate user
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`📊 Generating personalized insights for user: ${user.email}`);

    // Fetch user's saved data
    const [matches, playerStats, teamStats] = await Promise.all([
      base44.entities.Match.filter({ created_by: user.email }, '-created_date', 50),
      base44.entities.PlayerStats.filter({ created_by: user.email }, '-created_date', 50),
      base44.entities.TeamStats.filter({ created_by: user.email }, '-created_date', 50)
    ]);

    console.log(`📈 Found ${matches.length} matches, ${playerStats.length} players, ${teamStats.length} teams`);

    // Extract user preferences
    const favoriteSports = user.favorite_sports || [];
    const favoriteLeagues = user.favorite_leagues || [];
    const favoriteTeams = user.favorite_teams || [];
    const favoritePlayers = user.favorite_players || [];
    const bettingStyle = user.betting_style || 'balanced';

    // Analyze user's historical data to identify patterns
    const sportsFrequency = {};
    const leaguesFrequency = {};
    const teamsFrequency = {};
    
    matches.forEach(m => {
      sportsFrequency[m.sport] = (sportsFrequency[m.sport] || 0) + 1;
      leaguesFrequency[m.league] = (leaguesFrequency[m.league] || 0) + 1;
      if (m.home_team) teamsFrequency[m.home_team] = (teamsFrequency[m.home_team] || 0) + 1;
      if (m.away_team) teamsFrequency[m.away_team] = (teamsFrequency[m.away_team] || 0) + 1;
    });

    playerStats.forEach(p => {
      sportsFrequency[p.sport] = (sportsFrequency[p.sport] || 0) + 1;
      if (p.team) teamsFrequency[p.team] = (teamsFrequency[p.team] || 0) + 1;
    });

    teamStats.forEach(t => {
      sportsFrequency[t.sport] = (sportsFrequency[t.sport] || 0) + 1;
      if (t.team_name) teamsFrequency[t.team_name] = (teamsFrequency[t.team_name] || 0) + 1;
    });

    // Generate insights using AI
    const insightsPrompt = `You are an expert sports betting analyst generating personalized insights for a user.

USER PROFILE:
- Favorite Sports: ${favoriteSports.length > 0 ? favoriteSports.join(', ') : 'Not specified'}
- Favorite Leagues: ${favoriteLeagues.length > 0 ? favoriteLeagues.join(', ') : 'Not specified'}
- Favorite Teams: ${favoriteTeams.length > 0 ? favoriteTeams.join(', ') : 'Not specified'}
- Favorite Players: ${favoritePlayers.length > 0 ? favoritePlayers.join(', ') : 'Not specified'}
- Betting Style: ${bettingStyle}

USER'S SEARCH HISTORY (Last 50 searches):
- Most searched sports: ${Object.entries(sportsFrequency).sort((a,b) => b[1] - a[1]).slice(0, 3).map(([sport, count]) => `${sport} (${count}x)`).join(', ')}
- Most searched leagues: ${Object.entries(leaguesFrequency).sort((a,b) => b[1] - a[1]).slice(0, 3).map(([league, count]) => `${league} (${count}x)`).join(', ')}
- Most tracked teams: ${Object.entries(teamsFrequency).sort((a,b) => b[1] - a[1]).slice(0, 5).map(([team, count]) => `${team} (${count}x)`).join(', ')}

RECENT SAVED MATCHES (sample):
${matches.slice(0, 5).map(m => `- ${m.home_team} vs ${m.away_team} (${m.sport}, ${m.league}) - Predicted: ${m.prediction?.winner}, Confidence: ${m.prediction?.confidence}`).join('\n')}

RECENT SAVED PLAYERS (sample):
${playerStats.slice(0, 5).map(p => `- ${p.player_name} (${p.team}, ${p.sport})`).join('\n')}

RECENT SAVED TEAMS (sample):
${teamStats.slice(0, 5).map(t => `- ${t.team_name} (${t.sport}, ${t.league})`).join('\n')}

CURRENT DATE/TIME: ${new Date().toISOString()} (${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} at ${new Date().toLocaleTimeString('en-US')})

YOUR TASK:
Generate personalized insights and recommendations based on this user's profile and behavior. Return a JSON object with:

1. suggested_matches: Array of 3-5 upcoming matches the user would likely be interested in (use real-time data from ESPN, StatMuse). Include:
   - match_description: "Team A vs Team B"
   - sport: Sport name
   - league: League name
   - date: Game date/time
   - why_recommended: Why this matches user's interests (1-2 sentences)
   - confidence_level: "high", "medium", or "low"

2. players_to_watch: Array of 3-5 players the user should track. Include:
   - player_name: Full name
   - team: Team name
   - sport: Sport name
   - reason: Why they should watch this player (1-2 sentences with recent stats)
   - next_game: When/who they play next

3. betting_trends: Object analyzing the user's betting patterns. Include:
   - win_rate_analysis: Analysis of their high-confidence predictions vs actual outcomes (if data available)
   - favorite_bet_types: Most common bet types they analyze (spreads, over/under, etc.)
   - strengths: 2-3 areas where they seem to have good success/interest
   - areas_to_improve: 1-2 areas they could explore more

4. strategy_recommendations: Array of 3-5 actionable betting tips tailored to their style. Each should be:
   - tip: The recommendation (1 sentence)
   - explanation: Why this matters for their betting style (2-3 sentences)
   - risk_level: "low", "medium", or "high" based on their betting_style preference

5. personalized_message: A friendly, encouraging message (2-3 sentences) summarizing their betting journey and next steps.

CRITICAL REQUIREMENTS:
- Use REAL-TIME, LIVE data from ESPN.com, StatMuse.com, and official league websites
- All suggested matches must be UPCOMING games happening TODAY or in the next 7 days
- Include specific game times and dates for all suggestions
- Use the most recent statistics (last 5-10 games, not season averages from months ago)
- Tailor recommendations to their ${bettingStyle} betting style
- If they have favorite teams/players, prioritize those in suggestions
- Be encouraging and educational, not just promotional
- For player stats, use data from the last 2 weeks maximum

Return valid JSON only.`;

    const insights = await base44.integrations.Core.InvokeLLM({
      prompt: insightsPrompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          suggested_matches: {
            type: "array",
            items: {
              type: "object",
              properties: {
                match_description: { type: "string" },
                sport: { type: "string" },
                league: { type: "string" },
                date: { type: "string" },
                why_recommended: { type: "string" },
                confidence_level: { type: "string" }
              }
            }
          },
          players_to_watch: {
            type: "array",
            items: {
              type: "object",
              properties: {
                player_name: { type: "string" },
                team: { type: "string" },
                sport: { type: "string" },
                reason: { type: "string" },
                next_game: { type: "string" }
              }
            }
          },
          betting_trends: {
            type: "object",
            properties: {
              win_rate_analysis: { type: "string" },
              favorite_bet_types: { type: "string" },
              strengths: { type: "array", items: { type: "string" } },
              areas_to_improve: { type: "array", items: { type: "string" } }
            }
          },
          strategy_recommendations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                tip: { type: "string" },
                explanation: { type: "string" },
                risk_level: { type: "string" }
              }
            }
          },
          personalized_message: { type: "string" }
        },
        required: ["suggested_matches", "players_to_watch", "betting_trends", "strategy_recommendations", "personalized_message"]
      }
    });

    console.log('✅ Insights generated successfully');

    // Update user's last_insights_generated timestamp
    await base44.auth.updateMe({
      last_insights_generated: new Date().toISOString()
    });

    return Response.json({
      success: true,
      insights,
      generated_at: new Date().toISOString(),
      data_analyzed: {
        matches_count: matches.length,
        players_count: playerStats.length,
        teams_count: teamStats.length
      }
    });

  } catch (error) {
    console.error('❌ Error generating insights:', error);
    return Response.json({ 
      error: 'Failed to generate insights', 
      details: error.message 
    }, { status: 500 });
  }
});
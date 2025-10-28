// Backend function to fetch live odds from The Odds API
// This keeps your API key secure on the server side

export default async function getOddsData(params) {
  const { sport, apiKey } = params;
  
  // The Odds API endpoint
  const API_KEY = apiKey || process.env.ODDS_API_KEY;
  const BASE_URL = 'https://api.the-odds-api.com/v4';
  
  try {
    // Fetch upcoming games with odds
    const response = await fetch(
      `${BASE_URL}/sports/${sport}/odds/?apiKey=${API_KEY}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`,
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`The Odds API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Check remaining quota
    const remaining = response.headers.get('x-requests-remaining');
    const used = response.headers.get('x-requests-used');
    
    console.log(`📊 API Quota: ${used} used, ${remaining} remaining`);
    
    return {
      success: true,
      data: data,
      quota: {
        remaining: parseInt(remaining),
        used: parseInt(used)
      }
    };
    
  } catch (error) {
    console.error('❌ The Odds API Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Available sports on The Odds API:
// - americanfootball_nfl
// - basketball_nba
// - icehockey_nhl
// - baseball_mlb
// - soccer_epl (Premier League)
// - soccer_uefa_champs_league
// And many more...
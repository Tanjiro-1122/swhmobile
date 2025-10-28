// Backend function to fetch completed game scores from The Odds API
// Used for updating match results automatically

export default async function getScores(params) {
  const { sport, apiKey, daysFrom = 1 } = params;
  
  const API_KEY = apiKey || process.env.ODDS_API_KEY;
  const BASE_URL = 'https://api.the-odds-api.com/v4';
  
  try {
    // Fetch recent scores (completed games)
    const response = await fetch(
      `${BASE_URL}/sports/${sport}/scores/?apiKey=${API_KEY}&daysFrom=${daysFrom}`,
      {
        headers: {
          'Accept': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`The Odds API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Filter for completed games only
    const completedGames = data.filter(game => game.completed === true);
    
    const remaining = response.headers.get('x-requests-remaining');
    const used = response.headers.get('x-requests-used');
    
    console.log(`📊 Scores API Quota: ${used} used, ${remaining} remaining`);
    
    return {
      success: true,
      scores: completedGames,
      quota: {
        remaining: parseInt(remaining),
        used: parseInt(used)
      }
    };
    
  } catch (error) {
    console.error('❌ Scores API Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
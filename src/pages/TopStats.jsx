import React from "react";
import { Tv } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import FloatingDashboardButton from "@/components/navigation/FloatingDashboardButton";
import BettingBriefsContent from "@/components/hub/BettingBriefsContent";

export default function TopStats() {

  return (
    const prompts = {
        nfl: `You are a sports data expert. PRIORITIZE THESE SOURCES IN ORDER:

    PRIMARY SOURCE (CHECK FIRST):
    1. The Odds API - Check for current NFL odds, lines, player props

    SECONDARY SOURCES:
    2. ESPN.com/nfl/standings
    3. NFL.com

    Search for the CURRENT 2024-2025 NFL season standings and player statistics.

CRITICAL: You MUST provide EXACTLY 10 teams and EXACTLY 10 players with ALL required fields.

Teams (EXACTLY 10): rank (1-10), name (e.g., "Kansas City Chiefs"), wins (number), losses (number), winPct (e.g., "0.750"), pointsFor (e.g., "28.5"), pointsAgainst (e.g., "18.2"), streak (e.g., "W3"), division (e.g., "AFC West")

Players (EXACTLY 10): rank (1-10), name (e.g., "Patrick Mahomes"), team, position (QB/RB/WR/TE), stat1Label (e.g., "Pass Yds"), stat1Value (e.g., "3250"), stat2Label (e.g., "Pass TD"), stat2Value (e.g., "28"), stat3Label (e.g., "Rating"), stat3Value (e.g., "105.2"), gamesPlayed (number)

Use CURRENT 2024-2025 season data. Search ESPN and NFL.com NOW.`,

      nba: `You are a sports data expert. PRIORITIZE THESE SOURCES IN ORDER:

      PRIMARY SOURCE (CHECK FIRST):
      1. The Odds API - Check for current NBA odds, lines, player props

      SECONDARY SOURCES:
      2. ESPN.com/nba/standings
      3. NBA.com

      Search for the CURRENT 2024-2025 NBA season standings and player statistics.

CRITICAL: You MUST provide EXACTLY 10 teams and EXACTLY 10 players with ALL required fields.

Teams (EXACTLY 10): rank (1-10), name (e.g., "Boston Celtics"), wins (number), losses (number), winPct (e.g., "0.667"), pointsFor (e.g., "115.2"), pointsAgainst (e.g., "108.5"), streak (e.g., "W5"), division (e.g., "Atlantic" or "Eastern Conference")

Players (EXACTLY 10): rank (1-10), name (e.g., "Luka Doncic"), team, position (PG/SG/SF/PF/C), stat1Label (e.g., "PPG"), stat1Value (e.g., "28.5"), stat2Label (e.g., "APG"), stat2Value (e.g., "8.2"), stat3Label (e.g., "RPG"), stat3Value (e.g., "9.1"), gamesPlayed (number)

Use CURRENT 2024-2025 season data. Search ESPN and NBA.com NOW.`,

      mlb: `You are a sports data expert. PRIORITIZE THESE SOURCES IN ORDER:

      PRIMARY SOURCE (CHECK FIRST):
      1. The Odds API - Check for current MLB odds, lines, player props

      SECONDARY SOURCES:
      2. ESPN.com/mlb
      3. MLB.com

      Search for the FINAL 2024 MLB season standings and statistics (season ended in October 2024).

CRITICAL: You MUST provide EXACTLY 10 teams and EXACTLY 10 players with ALL required fields.

Teams (EXACTLY 10): rank (1-10), name (e.g., "Los Angeles Dodgers"), wins (number), losses (number), winPct (e.g., "0.605"), pointsFor (e.g., "5.2" - runs per game), pointsAgainst (e.g., "4.1" - runs allowed), streak (e.g., "Won World Series" or "Lost NLCS"), division (e.g., "NL West")

Players (EXACTLY 10): rank (1-10), name (e.g., "Shohei Ohtani"), team, position (OF/1B/SS/SP/RP), stat1Label (e.g., "AVG" or "ERA"), stat1Value (e.g., ".310" or "2.45"), stat2Label (e.g., "HR" or "Wins"), stat2Value (e.g., "45" or "18"), stat3Label (e.g., "RBI" or "K"), stat3Value (e.g., "120" or "250"), gamesPlayed (number)

Use FINAL 2024 season data.`,

      nhl: `You are a sports data expert. PRIORITIZE THESE SOURCES IN ORDER:

      PRIMARY SOURCE (CHECK FIRST):
      1. The Odds API - Check for current NHL odds, lines, player props

      SECONDARY SOURCES:
      2. ESPN.com/nhl/standings
      3. NHL.com

      Search for the CURRENT 2024-2025 NHL season standings and player statistics.

CRITICAL: You MUST provide EXACTLY 10 teams and EXACTLY 10 players with ALL required fields.

Teams (EXACTLY 10): rank (1-10), name (e.g., "Colorado Avalanche"), wins (number), losses (number including OT/SO), winPct (e.g., "0.625"), pointsFor (e.g., "3.5" - goals per game), pointsAgainst (e.g., "2.8"), streak (e.g., "W4"), division (e.g., "Central")

Players (EXACTLY 10): rank (1-10), name (e.g., "Connor McDavid"), team, position (C/LW/RW/D/G), stat1Label (e.g., "Goals"), stat1Value (e.g., "25"), stat2Label (e.g., "Assists"), stat2Value (e.g., "42"), stat3Label (e.g., "+/-"), stat3Value (e.g., "+18"), gamesPlayed (number)

Use CURRENT 2024-2025 season data. Search ESPN and NHL.com NOW.`,

      soccer: `You are a sports data expert. PRIORITIZE THESE SOURCES IN ORDER:

      PRIMARY SOURCE (CHECK FIRST):
      1. The Odds API - Check for current Soccer odds, lines, player props

      SECONDARY SOURCES:
      2. FIFA.com/fifa-world-ranking
      3. transfermarkt.com

      Search for CURRENT FIFA World Rankings and top European league player statistics.

CRITICAL: You MUST provide EXACTLY 10 teams and EXACTLY 10 players with ALL required fields.

Teams (EXACTLY 10 national teams): rank (1-10), name (e.g., "Argentina"), wins (recent 10 games), losses (recent 10 games), winPct (e.g., "0.70"), pointsFor (e.g., "2.5" - goals per game), pointsAgainst (e.g., "0.8"), streak (e.g., "W-W-D"), division (e.g., "CONMEBOL" or "UEFA")

Players (EXACTLY 10 from top leagues): rank (1-10), name (e.g., "Erling Haaland"), team (club name), position (FW/MF/DF/GK), stat1Label (e.g., "Goals"), stat1Value (e.g., "22"), stat2Label (e.g., "Assists"), stat2Value (e.g., "8"), stat3Label (e.g., "Apps"), stat3Value (e.g., "20"), gamesPlayed (number)


    <div className="min-h-screen pb-24">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-sm px-4 py-2 mb-4">
            <Tv className="w-4 h-4 mr-2 inline" />
            THE NEWS
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-2 flex items-center justify-center gap-3">
            <Tv className="w-10 h-10" />
            The News
          </h1>
          <p className="text-white/70">
            Latest sports betting briefs and updates
          </p>
          <div className="mt-4">
            <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm px-4 py-2">
              🎁 FREE FOR ALL USERS - A Gift From Us!
            </Badge>
          </div>
        </div>

        <BettingBriefsContent />
      </div>
      <FloatingDashboardButton />
    </div>
  );
}
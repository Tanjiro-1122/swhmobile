import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, TrendingUp, Target, Shield, DollarSign, Brain, Zap, Award } from "lucide-react";
import { motion } from "framer-motion";

export default function LearningCenter() {
  const [selectedLesson, setSelectedLesson] = useState(null);

  const beginnerLessons = [
    {
      id: 1,
      title: "Understanding Betting Odds",
      icon: DollarSign,
      difficulty: "Beginner",
      duration: "5 min",
      content: `# Understanding Betting Odds

**American Odds (Moneyline)**
American odds are displayed with a plus (+) or minus (-) sign.

**Negative Odds (Favorites)**
- Example: -150
- Meaning: You need to bet $150 to win $100
- The team/player is favored to win

**Positive Odds (Underdogs)**
- Example: +200
- Meaning: If you bet $100, you win $200
- The team/player is the underdog

**Common Examples:**
- -110: Bet $110 to win $100 (most common, called "juice")
- -200: Bet $200 to win $100 (heavy favorite)
- +150: Bet $100 to win $150 (moderate underdog)
- +300: Bet $100 to win $300 (big underdog)

**Quick Calculation:**
For favorites: (100 / odds) × stake = profit
For underdogs: (odds / 100) × stake = profit`
    },
    {
      id: 2,
      title: "Types of Bets Explained",
      icon: Target,
      difficulty: "Beginner",
      duration: "8 min",
      content: `# Types of Bets Explained

**1. Moneyline Bet**
Pick which team will win the game outright.
- Example: Lakers -150, Celtics +130
- Simplest bet type

**2. Point Spread**
The favorite must win by more than the spread.
- Example: Lakers -5.5 (-110)
- Lakers must win by 6+ points to cover
- Celtics +5.5: Celtics can lose by 5 or less, or win

**3. Over/Under (Totals)**
Bet on total combined points/goals.
- Example: Over 225.5 (-110)
- If total is 226+, Over wins
- If total is 225 or less, Under wins

**4. Prop Bets**
Bet on specific player/team statistics.
- Example: LeBron James Over 28.5 points
- Will Steph Curry make 4+ three-pointers?

**5. Parlay**
Combine multiple bets for bigger payout.
- All selections must win
- Higher risk, higher reward
- Example: Lakers ML + Over 225.5 + Celtics +5.5`
    },
    {
      id: 3,
      title: "Bankroll Management Basics",
      icon: Shield,
      difficulty: "Beginner",
      duration: "10 min",
      content: `# Bankroll Management Basics

**What is Bankroll Management?**
Managing your betting funds to survive losing streaks and maximize profits.

**The 1-5% Rule**
- Never risk more than 1-5% of your bankroll on a single bet
- Example: $1,000 bankroll = $10-50 per bet
- Protects you from going broke on a bad streak

**Unit System**
- 1 unit = 1% of your bankroll
- Adjust bet sizes based on confidence:
  - High confidence: 3-5 units
  - Medium confidence: 2-3 units
  - Low confidence: 1-2 units

**Record Keeping**
Track every bet:
- Date, sport, bet type
- Odds, stake, result
- Running profit/loss
- Win rate percentage

**Never Chase Losses**
- Don't increase bet size to recover losses
- Stick to your unit system
- Accept that losses are part of betting

**Set Limits**
- Daily loss limit (stop if reached)
- Weekly betting budget
- Never bet with money you can't afford to lose`
    },
    {
      id: 4,
      title: "Reading Sports Statistics",
      icon: TrendingUp,
      difficulty: "Beginner",
      duration: "12 min",
      content: `# Reading Sports Statistics

**Basketball (NBA)**
Key stats to analyze:
- **Points Per Game (PPG)**: Team/player scoring average
- **Field Goal % (FG%)**: Shooting efficiency (45%+ is good)
- **Three-Point % (3P%)**: Beyond the arc (35%+ is good)
- **Rebounds**: Defensive (DEF) and Offensive (OFF)
- **Assists**: Ball movement indicator
- **Turnovers**: Mistakes (fewer is better)
- **+/- (Plus/Minus)**: Point differential when player is on court

**Football (NFL)**
Key stats to analyze:
- **Passing Yards**: QB effectiveness
- **Rushing Yards**: Running game strength
- **Turnovers**: INT + Fumbles (game changers)
- **Red Zone %**: Scoring efficiency inside 20-yard line
- **Third Down %**: Ability to sustain drives
- **Sacks Allowed/Made**: Pass protection/pressure

**Soccer/Football**
Key stats to analyze:
- **Goals Scored/Allowed**: Offensive/defensive strength
- **Possession %**: Ball control
- **Shots on Target**: Accuracy indicator
- **Pass Completion %**: Team cohesion (80%+ is good)
- **Expected Goals (xG)**: Quality of chances created

**What to Look For:**
- Recent form (last 5-10 games)
- Home vs Away splits
- Head-to-head history
- Injuries to key players
- Schedule (back-to-back games, travel)`
    }
  ];

  const intermediateLessons = [
    {
      id: 5,
      title: "Line Shopping & Finding Value",
      icon: Zap,
      difficulty: "Intermediate",
      duration: "10 min",
      content: `# Line Shopping & Finding Value

**What is Line Shopping?**
Comparing odds across multiple sportsbooks to find the best price.

**Why It Matters:**
- -110 vs -105 = 5 cents saved per bet
- Over 100 bets: $500+ extra profit
- Can be difference between profit and loss long-term

**Example:**
Same bet, different books:
- DraftKings: Lakers -5.5 (-115)
- FanDuel: Lakers -5.5 (-108)
- BetMGM: Lakers -5.5 (-110)

**Best choice:** FanDuel (-108)

**Finding Value Bets:**
Value = When you believe probability is higher than odds suggest

Formula: (Odds Probability) < (Your Estimated Probability)

Example:
- Team A: +200 odds (33% implied probability)
- Your analysis: Team A has 40% chance to win
- This is VALUE (+7% edge)

**Tools for Line Shopping:**
1. Odds comparison websites
2. Multiple sportsbook accounts
3. Live odds trackers
4. Bankroll spread across books

**Steam Moves:**
When odds suddenly shift across all books
- Usually indicates sharp money
- Can signal value before adjustment
- Act quickly when spotted`
    },
    {
      id: 6,
      title: "Understanding Public vs Sharp Money",
      icon: Brain,
      difficulty: "Intermediate",
      duration: "12 min",
      content: `# Public vs Sharp Money

**Public Money (Casual Bettors):**
- 70-80% of total betting handle
- Bet on favorites and popular teams
- Emotional betting (hometown bias)
- Reactive to recent news/games

**Sharp Money (Professional Bettors):**
- 20-30% of betting handle
- Larger bet sizes
- Early movers (bet when lines open)
- Statistical analysis-based
- Contrarian approach

**Reverse Line Movement:**
When line moves OPPOSITE to public betting percentage

Example:
- 75% of bets on Lakers -5.5
- Line moves to Lakers -4.5
- Indicates sharp money on Celtics
- Books respect sharp action more

**How to Identify Sharp Action:**
1. Early line movement (first hour after release)
2. Large moves without injury news
3. Line moves against public percentage
4. Steam moves across multiple books

**Betting Against the Public:**
- Public often wrong on big games
- Contrarian approach can be profitable
- Look for 70%+ public on one side
- Check if line is moving opposite direction

**When to Fade Sharp Money:**
Sometimes sharps are wrong too!
- Weather changes after they bet
- Late injury news
- Your analysis shows different angle`
    },
    {
      id: 7,
      title: "Live Betting Strategies",
      icon: Award,
      difficulty: "Intermediate",
      duration: "15 min",
      content: `# Live Betting Strategies

**What is Live Betting?**
Placing bets while the game is in progress.

**Advantages:**
- Watch game before committing
- React to momentum shifts
- Better read on team performance
- Hedge pre-game bets

**Key Strategies:**

**1. Momentum Betting**
- Team on scoring run: bet them
- Team deflated after bad play: fade them
- Watch for coaching adjustments

**2. Situational Betting**
- Star player in foul trouble: fade that team
- Weather changes mid-game: adjust totals
- Injury during game: immediate value

**3. Middle Opportunities**
- Bet Lakers -5.5 pre-game
- Live bet Celtics +8.5 in-game
- Win both if Lakers win by 6, 7, or 8

**4. Hedging**
- Bet Lakers -3 pre-game ($100)
- Lakers up 12 at halftime
- Bet Celtics +12.5 live ($50)
- Guarantee profit on either outcome

**5. Total Adjustments**
- Slow-paced first half: bet under
- High-scoring start: bet over adjusted total
- Watch pace and possessions

**Common Mistakes:**
- Chasing losses in-game
- Not having plan before live betting
- Emotional betting on momentum
- Ignoring adjusted juice (-140 live vs -110 pre-game)

**Best Live Betting Spots:**
- After first score (overreaction)
- Halftime adjustments
- After emotional momentum swing
- When public panics`
    }
  ];

  const advancedLessons = [
    {
      id: 8,
      title: "Advanced Statistical Models",
      icon: Brain,
      difficulty: "Advanced",
      duration: "20 min",
      content: `# Advanced Statistical Models

**Building Your Own Model:**

**1. Data Collection**
Gather historical data:
- Team statistics (offense, defense)
- Player statistics
- Situational data (home/away, rest days)
- Weather conditions
- Referee tendencies

**2. Key Metrics to Include:**

**Offensive Efficiency:**
- Points per 100 possessions
- Effective Field Goal % (eFG%)
- True Shooting % (TS%)
- Assist-to-Turnover ratio

**Defensive Efficiency:**
- Points allowed per 100 possessions
- Opponent FG%
- Steals + Blocks
- Defensive rating

**3. Regression Analysis**
Use linear regression to predict outcomes:
- Dependent variable: Point differential
- Independent variables: Team stats
- Calculate coefficients for each factor

**4. Pythagorean Expectation**
Expected Win % = (Points Scored)^2 / [(Points Scored)^2 + (Points Allowed)^2]

Identifies over/underperforming teams.

**5. Elo Rating System**
Dynamic rating that updates after each game:
- Higher Elo = stronger team
- Predict win probability based on Elo difference
- Adjust for home court advantage (+100 Elo)

**6. Situational Adjustments:**
- Back-to-back games: -3 points
- Travel: -2 points per time zone
- Rest advantage: +4 points
- Revenge game: +2 points

**7. Machine Learning Approaches:**
- Random Forest models
- Neural networks
- XGBoost algorithms
- Train on 3+ years of data

**Model Validation:**
- Backtest on previous seasons
- Track ROI over 500+ predictions
- Adjust parameters quarterly
- Compare to market odds (closing lines)

**When Model Disagrees with Line:**
- 3%+ edge = bet
- 1-3% edge = small bet
- Under 1% = pass

**Continuous Improvement:**
- Track which factors perform best
- Remove low-impact variables
- Add new metrics as discovered
- Recalibrate monthly`
    }
  ];

  const allLessons = [...beginnerLessons, ...intermediateLessons, ...advancedLessons];

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'Beginner': return 'bg-green-100 text-green-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Learning Center</h1>
              <p className="text-gray-600">Master sports betting from beginner to pro</p>
            </div>
          </div>
        </div>

        {selectedLesson ? (
          // Lesson View
          <div className="space-y-6">
            <Button
              variant="outline"
              onClick={() => setSelectedLesson(null)}
              className="mb-4"
            >
              ← Back to Lessons
            </Button>

            <Card className="border-2 border-indigo-200">
              <CardHeader className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-3xl mb-2">{selectedLesson.title}</CardTitle>
                    <div className="flex items-center gap-3">
                      <Badge className={getDifficultyColor(selectedLesson.difficulty)}>
                        {selectedLesson.difficulty}
                      </Badge>
                      <Badge className="bg-white/20 text-white border-white/30">
                        {selectedLesson.duration}
                      </Badge>
                    </div>
                  </div>
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    {React.createElement(selectedLesson.icon, { className: "w-8 h-8" })}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                <div className="prose prose-lg max-w-none">
                  {selectedLesson.content.split('\n').map((line, idx) => {
                    if (line.startsWith('# ')) {
                      return <h2 key={idx} className="text-3xl font-bold text-gray-900 mb-4 mt-8">{line.replace('# ', '')}</h2>;
                    } else if (line.startsWith('**') && line.endsWith('**')) {
                      return <h3 key={idx} className="text-xl font-bold text-gray-900 mb-3 mt-6">{line.replace(/\*\*/g, '')}</h3>;
                    } else if (line.startsWith('- ')) {
                      return <li key={idx} className="text-gray-700 ml-6 mb-2">{line.replace('- ', '')}</li>;
                    } else if (line.trim() === '') {
                      return <div key={idx} className="h-4" />;
                    } else {
                      return <p key={idx} className="text-gray-700 leading-relaxed mb-4">{line}</p>;
                    }
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Lessons List
          <Tabs defaultValue="beginner" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 h-14">
              <TabsTrigger value="beginner" className="text-lg">
                Beginner
              </TabsTrigger>
              <TabsTrigger value="intermediate" className="text-lg">
                Intermediate
              </TabsTrigger>
              <TabsTrigger value="advanced" className="text-lg">
                Advanced
              </TabsTrigger>
            </TabsList>

            <TabsContent value="beginner" className="space-y-4">
              {beginnerLessons.map((lesson, index) => (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="border-2 border-green-200 hover:border-green-400 transition-colors cursor-pointer"
                        onClick={() => setSelectedLesson(lesson)}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                          {React.createElement(lesson.icon, { className: "w-8 h-8 text-white" })}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{lesson.title}</h3>
                          <div className="flex items-center gap-3">
                            <Badge className={getDifficultyColor(lesson.difficulty)}>
                              {lesson.difficulty}
                            </Badge>
                            <span className="text-sm text-gray-600">⏱️ {lesson.duration}</span>
                          </div>
                        </div>
                        <Button variant="outline">
                          Start Lesson →
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </TabsContent>

            <TabsContent value="intermediate" className="space-y-4">
              {intermediateLessons.map((lesson, index) => (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="border-2 border-yellow-200 hover:border-yellow-400 transition-colors cursor-pointer"
                        onClick={() => setSelectedLesson(lesson)}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
                          {React.createElement(lesson.icon, { className: "w-8 h-8 text-white" })}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{lesson.title}</h3>
                          <div className="flex items-center gap-3">
                            <Badge className={getDifficultyColor(lesson.difficulty)}>
                              {lesson.difficulty}
                            </Badge>
                            <span className="text-sm text-gray-600">⏱️ {lesson.duration}</span>
                          </div>
                        </div>
                        <Button variant="outline">
                          Start Lesson →
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              {advancedLessons.map((lesson, index) => (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="border-2 border-red-200 hover:border-red-400 transition-colors cursor-pointer"
                        onClick={() => setSelectedLesson(lesson)}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center flex-shrink-0">
                          {React.createElement(lesson.icon, { className: "w-8 h-8 text-white" })}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{lesson.title}</h3>
                          <div className="flex items-center gap-3">
                            <Badge className={getDifficultyColor(lesson.difficulty)}>
                              {lesson.difficulty}
                            </Badge>
                            <span className="text-sm text-gray-600">⏱️ {lesson.duration}</span>
                          </div>
                        </div>
                        <Button variant="outline">
                          Start Lesson →
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </TabsContent>
          </Tabs>
        )}

        {/* Quick Tips Card */}
        {!selectedLesson && (
          <Card className="mt-8 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-6 h-6 text-blue-600" />
                Pro Tips for Success
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Start Small</h4>
                    <p className="text-sm text-gray-600">Begin with small bets while learning. Focus on understanding concepts before increasing stakes.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Track Everything</h4>
                    <p className="text-sm text-gray-600">Keep detailed records of all bets. You can't improve what you don't measure.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Specialize</h4>
                    <p className="text-sm text-gray-600">Focus on 1-2 sports to become an expert rather than spreading too thin.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">4</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1">Be Patient</h4>
                    <p className="text-sm text-gray-600">Betting success is measured over hundreds of bets, not individual wins/losses.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
export const lessons = {
  beginner: [
    {
      id: "odds-formats",
      title: "Understanding Odds Formats",
      duration: "5 min",
      content: `## Understanding Odds Formats

There are three main odds formats used worldwide:

### American Odds (Moneyline)
- **Positive odds (+150)**: Shows how much you win on a $100 bet. +150 means you win $150 on a $100 bet.
- **Negative odds (-150)**: Shows how much you need to bet to win $100. -150 means you bet $150 to win $100.

### Decimal Odds
- Simply multiply your stake by the decimal to get total payout
- Example: $100 at 2.50 odds = $250 total ($150 profit)
- Common in Europe, Australia, and Canada

### Fractional Odds
- Common in UK betting
- Example: 3/1 means you win $3 for every $1 bet
- 1/2 means you bet $2 to win $1

### Converting Between Formats
- American +150 = Decimal 2.50 = Fractional 3/2
- American -150 = Decimal 1.67 = Fractional 2/3`,
      quiz: [
        {
          question: "If you bet $100 at +200 odds and win, how much profit do you make?",
          options: ["$100", "$200", "$300", "$50"],
          correct: 1,
          explanation: "+200 means you win $200 for every $100 wagered."
        },
        {
          question: "What does -110 odds mean?",
          options: ["You win $110 on a $100 bet", "You bet $110 to win $100", "You lose $110", "The game is tied"],
          correct: 1,
          explanation: "Negative odds show how much you need to bet to win $100."
        },
        {
          question: "Decimal odds of 3.00 means a $50 bet returns:",
          options: ["$50", "$100", "$150", "$200"],
          correct: 2,
          explanation: "$50 × 3.00 = $150 total return ($100 profit + $50 stake)."
        }
      ]
    },
    {
      id: "bet-types",
      title: "Types of Sports Bets",
      duration: "7 min",
      content: `## Types of Sports Bets

### Moneyline
Pick the winner of the game. The simplest bet type.
- Favorite has negative odds (lower payout)
- Underdog has positive odds (higher payout)

### Point Spread
The favorite must win by more than the spread, or the underdog must lose by less (or win outright).
- Lakers -5.5 means they must win by 6+ points
- Celtics +5.5 means they can lose by up to 5 points

### Over/Under (Totals)
Bet on whether the total combined score will be over or under a set number.
- Over 220.5 means combined score must be 221+
- Under 220.5 means combined score must be 220 or less

### Parlays
Combine multiple bets into one ticket. All selections must win, but payouts are much higher.
- Higher risk, higher reward
- One loss = entire parlay loses

### Props (Proposition Bets)
Bet on specific events within a game:
- "LeBron scores 30+ points"
- "Total touchdowns over 4.5"
- "First team to score"`,
      quiz: [
        {
          question: "In a point spread bet, Lakers -7.5 vs Celtics +7.5, the Lakers win 110-105. Who covers?",
          options: ["Lakers cover", "Celtics cover", "Push (tie)", "Neither"],
          correct: 1,
          explanation: "Lakers won by 5 points, but needed to win by 8+ to cover -7.5. Celtics +7.5 covers."
        },
        {
          question: "What happens if one leg of a 4-team parlay loses?",
          options: ["You win partial payout", "The entire parlay loses", "That leg is voided", "You get your money back"],
          correct: 1,
          explanation: "In a parlay, ALL legs must win. One loss means the entire bet loses."
        },
        {
          question: "The total is set at 48.5. Final score is 27-21. Which bet wins?",
          options: ["Over", "Under", "Push", "Void"],
          correct: 1,
          explanation: "27 + 21 = 48, which is under 48.5. The Under wins."
        }
      ]
    },
    {
      id: "reading-lines",
      title: "How to Read Betting Lines",
      duration: "6 min",
      content: `## How to Read Betting Lines

### Understanding a Full Line
Here's a typical betting line:
**Lakers -5.5 (-110) vs Celtics +5.5 (-110) | O/U 220.5**

Breaking it down:
- **Lakers -5.5**: Lakers favored by 5.5 points
- **(-110)**: The juice/vig - bet $110 to win $100
- **Celtics +5.5**: Celtics are underdogs getting 5.5 points
- **O/U 220.5**: Total points line is 220.5

### The Juice (Vig)
- Standard juice is -110 on both sides
- This is how sportsbooks make money
- Better odds = less juice (e.g., -105)

### Line Movement
- Lines change based on betting action
- "Steam" = sharp money moving a line
- Opening line vs closing line can differ significantly

### Key Numbers in Football
- 3 and 7 are most common margins of victory
- Getting +3 instead of +2.5 is valuable
- Half-points eliminate pushes`,
      quiz: [
        {
          question: "What does 'juice' or 'vig' refer to?",
          options: ["The total points", "The sportsbook's commission", "The point spread", "The winning team"],
          correct: 1,
          explanation: "Juice/vig is the commission built into the odds, typically -110 meaning you bet $110 to win $100."
        },
        {
          question: "If a line moves from -3 to -4.5, what likely happened?",
          options: ["More money came in on the favorite", "More money came in on the underdog", "The game was postponed", "Nothing significant"],
          correct: 0,
          explanation: "When the spread increases, it means more money is coming in on the favorite."
        },
        {
          question: "Why is +3 better than +2.5 in football betting?",
          options: ["It pays more", "3 is a common margin of victory", "It's easier to win", "There's no difference"],
          correct: 1,
          explanation: "Many NFL games are decided by exactly 3 points (field goal), so +3 gives you a push instead of a loss."
        }
      ]
    }
  ],
  intermediate: [
    {
      id: "bankroll-management",
      title: "Bankroll Management",
      duration: "10 min",
      content: `## Bankroll Management

The most important skill in sports betting isn't picking winners—it's managing your money.

### The Golden Rules
1. **Never bet more than 1-5% of your bankroll** on a single bet
2. **Set a budget** and stick to it religiously
3. **Track every bet** you make

### Unit Sizing
Define a "unit" as 1-2% of your total bankroll:
- **$1,000 bankroll** = 1 unit is $10-20
- **$5,000 bankroll** = 1 unit is $50-100

### Confidence-Based Betting
- **1 unit**: Standard confidence
- **2 units**: High confidence
- **3 units**: Maximum confidence (rare!)

### The Kelly Criterion
A mathematical formula for optimal bet sizing:
**Kelly % = (bp - q) / b**
Where: b = decimal odds - 1, p = win probability, q = loss probability

### Avoid These Mistakes
- ❌ Chasing losses with bigger bets
- ❌ Betting your entire bankroll on "sure things"
- ❌ Emotional betting after a big win or loss
- ❌ Increasing unit size after a winning streak`,
      quiz: [
        {
          question: "You have a $2,000 bankroll. What's the maximum you should bet on a single game using the 5% rule?",
          options: ["$200", "$100", "$500", "$50"],
          correct: 1,
          explanation: "$2,000 × 5% = $100 maximum per bet."
        },
        {
          question: "What is 'chasing losses'?",
          options: ["Betting bigger to recover previous losses", "Betting on favorites only", "Tracking your bets", "Taking a break after losing"],
          correct: 0,
          explanation: "Chasing losses means increasing bet sizes to try to quickly recover losses—a dangerous habit."
        },
        {
          question: "If your 1 unit = $25 and you place a 2-unit bet, how much are you wagering?",
          options: ["$25", "$50", "$75", "$100"],
          correct: 1,
          explanation: "2 units × $25 per unit = $50 total wager."
        }
      ]
    },
    {
      id: "line-shopping",
      title: "Line Shopping & Getting the Best Odds",
      duration: "8 min",
      content: `## Line Shopping & Getting the Best Odds

### What is Line Shopping?
Comparing odds across multiple sportsbooks to find the best price for your bet.

### Why It Matters
- Getting -105 instead of -110 = 2.3% better value
- Over thousands of bets, this adds up significantly
- Professional bettors ALWAYS line shop

### Example
You want to bet on the Chiefs:
- Book A: Chiefs -3 (-110)
- Book B: Chiefs -2.5 (-115)
- Book C: Chiefs -3 (-105) ✓ Best value!

### Best Practices
1. **Have accounts at multiple books** (3-5 minimum)
2. **Check odds before every bet**
3. **Use odds comparison sites**
4. **Look for reduced juice books** (-105 instead of -110)

### When Lines Differ Significantly
- Big differences may indicate sharp action
- Could signal injury news or inside information
- Be cautious betting into stale lines`,
      quiz: [
        {
          question: "How much do you save per $100 bet getting -105 vs -110?",
          options: ["$0.50", "$2.38", "$5.00", "$10.00"],
          correct: 1,
          explanation: "At -110 you bet $110 to win $100. At -105 you bet $105 to win $100. Savings: $5 on $110 = ~$2.38 per $100."
        },
        {
          question: "How many sportsbook accounts should serious bettors have?",
          options: ["Just 1", "2", "3-5 minimum", "10+"],
          correct: 2,
          explanation: "Having 3-5 accounts allows you to consistently find the best lines."
        },
        {
          question: "If lines are significantly different across books, what might this indicate?",
          options: ["A computer error", "Sharp money or news", "The game is rigged", "Nothing important"],
          correct: 1,
          explanation: "Large line differences often indicate sharp bettors have information or news broke."
        }
      ]
    },
    {
      id: "understanding-variance",
      title: "Understanding Variance & Sample Size",
      duration: "12 min",
      content: `## Understanding Variance & Sample Size

### What is Variance?
The natural fluctuation in results due to luck, even for skilled bettors.

### Short-Term vs Long-Term
- **Short-term**: Anything can happen (luck dominates)
- **Long-term**: Skill becomes evident (1000+ bets)

### Why Good Bettors Lose Streaks
- A 55% winner will lose 5+ in a row regularly
- Losing 10 in a row happens more than you think
- This is NORMAL, not a sign you're doing something wrong

### The Math of Losing Streaks
With 55% win rate, probability of:
- 5 losses in a row: 1.8% (once per 55 bets)
- 7 losses in a row: 0.4% (once per 250 bets)
- 10 losses in a row: 0.03% (once per 3000 bets)

### How to Handle Variance
1. **Stick to your system** - Don't change strategy during cold streaks
2. **Trust the process** - Focus on making good bets, not results
3. **Keep unit sizes consistent** - Don't increase bets to "get back"
4. **Track long-term** - Judge performance over months, not days

### Sample Size Guidelines
- 100 bets: Still very noisy
- 500 bets: Starting to see trends
- 1000+ bets: Meaningful data`,
      quiz: [
        {
          question: "A bettor with 55% win rate should expect to lose 5 in a row approximately:",
          options: ["Never", "Once every 55 bets", "Once every 500 bets", "Once per year"],
          correct: 1,
          explanation: "With a 55% win rate, losing 5 straight happens about once every 55 bets—it's normal!"
        },
        {
          question: "How many bets do you need for meaningful performance data?",
          options: ["50", "100", "500", "1000+"],
          correct: 3,
          explanation: "You need 1000+ bets to truly evaluate your betting performance due to variance."
        },
        {
          question: "After a 7-game losing streak, what should you do?",
          options: ["Double your bets", "Change your strategy completely", "Stick to your system", "Take a month off"],
          correct: 2,
          explanation: "Losing streaks are normal. If your analysis is sound, stick to your system."
        }
      ]
    }
  ],
  advanced: [
    {
      id: "value-betting",
      title: "Finding Value Bets",
      duration: "15 min",
      content: `## Finding Value Bets

A value bet occurs when the probability of an outcome is greater than what the odds suggest.

### Expected Value (EV) Formula
**EV = (Win Probability × Profit) - (Loss Probability × Stake)**

Example: Team at +150 (implied 40% chance) but you calculate 50% true probability:
- EV = (0.50 × $150) - (0.50 × $100) = $75 - $50 = **+$25 EV**

### Converting Odds to Implied Probability
- **Positive odds**: 100 / (odds + 100)
- **Negative odds**: odds / (odds + 100)

Examples:
- +200 = 100/300 = 33.3%
- -150 = 150/250 = 60%

### Finding Value - Key Principles
1. **Build your own models** - Don't rely solely on "experts"
2. **Look for market inefficiencies**:
   - Early lines before sharp action
   - Less popular leagues/sports
   - Player props with limited info
3. **Track Closing Line Value (CLV)** - Did your line get better or worse?

### Signs of Value
- Odds that don't match your calculated probability
- Late line movement against public consensus
- Under-hyped teams with strong fundamentals
- Markets overreacting to recent events`,
      quiz: [
        {
          question: "A team has +200 odds. What implied probability is the book giving them?",
          options: ["20%", "33.3%", "50%", "66.7%"],
          correct: 1,
          explanation: "100 / (200 + 100) = 100/300 = 33.3% implied probability."
        },
        {
          question: "If you calculate a team has 45% chance to win but they're at +150 (40% implied), is this a value bet?",
          options: ["Yes, it's +EV", "No, it's -EV", "It's neutral", "Can't determine"],
          correct: 0,
          explanation: "Your probability (45%) > implied probability (40%), so this is a positive expected value bet."
        },
        {
          question: "What is Closing Line Value (CLV)?",
          options: ["The final score", "Whether your line improved", "The total payout", "The opening odds"],
          correct: 1,
          explanation: "CLV measures if the line moved in your favor after you bet—a key indicator of sharp betting."
        }
      ]
    },
    {
      id: "sharp-vs-public",
      title: "Sharp Money vs Public Money",
      duration: "12 min",
      content: `## Sharp Money vs Public Money

### Who Are "Sharps"?
Professional bettors who:
- Bet large amounts
- Have proven track records
- Move betting lines
- Books respect and sometimes limit

### Who is the "Public"?
Recreational bettors who:
- Bet smaller amounts
- Follow popular teams/narratives
- Often bet favorites and overs
- Create betting opportunities for sharps

### Reading Line Movement
- **Sharp action**: Big line move on low ticket count
- **Public action**: Small line move despite high ticket count
- **Reverse line movement**: Line moves against the betting %

### Following Sharp Money
- Watch for steam moves (sudden line changes)
- Lines moving toward less popular side
- Professional tracking services available

### Fading the Public
Sometimes profitable to bet against:
- Heavy public favorites
- Popular overs in primetime games
- Teams coming off big wins
- "Trendy" picks everyone's talking about

### Caution
- Don't blindly follow sharps
- Understand WHY a line is moving
- Sharps are wrong too—they just have an edge`,
      quiz: [
        {
          question: "What is 'reverse line movement'?",
          options: ["Line goes to 0", "Line moves opposite to betting %", "Line returns to opening number", "Line is taken down"],
          correct: 1,
          explanation: "Reverse line movement is when the line moves toward the less-bet side, often indicating sharp money."
        },
        {
          question: "80% of bets are on Team A, but the line moves toward Team B. What does this suggest?",
          options: ["Team A is the lock", "Sharp money on Team B", "The game is fixed", "Betting is closed"],
          correct: 1,
          explanation: "When the line moves against the betting percentage, sharp money is likely on the other side."
        },
        {
          question: "Which is a common public betting tendency?",
          options: ["Betting underdogs", "Betting unders", "Betting overs and favorites", "Fading popular teams"],
          correct: 2,
          explanation: "The public typically loves betting favorites and overs, especially in primetime games."
        }
      ]
    },
    {
      id: "live-betting",
      title: "In-Play/Live Betting Strategies",
      duration: "10 min",
      content: `## In-Play/Live Betting Strategies

### Why Live Betting?
- React to what's actually happening
- Find value when books are slow to adjust
- Hedge pre-game bets
- Take advantage of momentum shifts

### Keys to Success
1. **Watch the game** - Don't bet blind
2. **Know the sport deeply** - Understand flow and momentum
3. **Act fast** - Lines change quickly
4. **Have a plan** - Know your targets before the game

### Common Strategies

#### Momentum Fading
- Team goes up big early, live line overreacts
- Bet the trailing team at inflated odds
- Works best in sports with high variance (basketball, football)

#### Hedging
- Your pre-game bet is winning
- Lock in profit by betting the other side live
- Calculate guaranteed profit vs potential upside

#### Key Number Targeting
- Wait for live lines to hit key numbers
- Football: +3, +7 / Basketball: +10
- Patient bettors get better numbers

### Live Betting Pitfalls
- ❌ Chasing with emotional bets
- ❌ Over-betting on "gut feelings"
- ❌ Ignoring the juice (live juice is often higher)
- ❌ Not accounting for injuries/ejections`,
      quiz: [
        {
          question: "What is 'momentum fading' in live betting?",
          options: ["Betting the hot team", "Betting against a team that jumped out big", "Betting on ties", "Betting total points"],
          correct: 1,
          explanation: "Momentum fading means betting against a team that's up big early, as live lines often overreact."
        },
        {
          question: "Why might live betting juice be higher than pre-game?",
          options: ["Games are more exciting", "Books have less time to set accurate lines", "More people are betting", "It's always the same"],
          correct: 1,
          explanation: "Books charge higher juice on live bets because they have less time to set accurate lines."
        },
        {
          question: "What is hedging?",
          options: ["Betting the same side twice", "Betting both sides to lock in profit", "Waiting for better odds", "Canceling a bet"],
          correct: 1,
          explanation: "Hedging means betting the opposite side of your original bet to guarantee some profit."
        }
      ]
    },
    {
      id: "prop-betting",
      title: "Mastering Player Props",
      duration: "14 min",
      content: `## Mastering Player Props

### Why Props?
- Less efficient market = more value
- More information advantages for bettors
- Fun and engaging way to watch games
- Build expertise in specific areas

### Types of Player Props
- **Points/Scoring** (most popular)
- **Rebounds/Assists**
- **Passing/Rushing/Receiving yards**
- **Strikeouts/Hits**
- **Goals/Shots**

### Research Factors

#### Basketball Props
- Minutes projection (key!)
- Pace of game (possessions)
- Matchup (guard vs guard, etc.)
- Recent usage rate
- Rest days and travel

#### Football Props
- Game script expectations
- Defensive rankings vs position
- Weather conditions
- Target share trends
- Red zone opportunities

### Finding Edge
1. **Track your own projections**
2. **Look for news others miss**
3. **Understand how books set lines**
4. **Target less popular players** (more mistakes)
5. **Consider game script** (blowout = backups play)

### Common Mistakes
- Ignoring playing time
- Not adjusting for pace
- Overvaluing recent games
- Forgetting about garbage time`,
      quiz: [
        {
          question: "What's the MOST important factor for NBA player point props?",
          options: ["Last game performance", "Minutes projection", "Team record", "Jersey number"],
          correct: 1,
          explanation: "Minutes are crucial—a player can't score if they're not on the court. Always check expected minutes."
        },
        {
          question: "Why are player props potentially more +EV than game lines?",
          options: ["They pay more", "Less efficient market", "Easier to predict", "Lower juice"],
          correct: 1,
          explanation: "The props market is less efficient because books have less data and sharp action on individual players."
        },
        {
          question: "How does game script affect player props?",
          options: ["It doesn't", "Blowouts mean starters rest early", "Close games mean more passing", "Both B and C"],
          correct: 3,
          explanation: "Game script matters—blowouts rest starters, close games change play calling. Consider both."
        }
      ]
    }
  ]
};

export const getLessonById = (id) => {
  for (const level of Object.values(lessons)) {
    const found = level.find(lesson => lesson.id === id);
    if (found) return found;
  }
  return null;
};

export const getAllLessons = () => {
  return Object.entries(lessons).flatMap(([level, lessonList]) => 
    lessonList.map(lesson => ({ ...lesson, level }))
  );
};
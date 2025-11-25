import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Clock, ArrowLeft, GraduationCap, TrendingUp, Brain } from "lucide-react";
import ReactMarkdown from "react-markdown";

const lessons = {
  beginner: [
    {
      id: 1,
      title: "Understanding Odds Formats",
      duration: "5 min",
      content: `## Understanding Odds Formats

There are three main odds formats used worldwide:

### American Odds (Moneyline)
- **Positive odds (+150)**: Shows how much you win on a $100 bet
- **Negative odds (-150)**: Shows how much you need to bet to win $100

### Decimal Odds
- Simply multiply your stake by the decimal to get total payout
- Example: $100 at 2.50 odds = $250 total ($150 profit)

### Fractional Odds
- Common in UK betting
- Example: 3/1 means you win $3 for every $1 bet`
    },
    {
      id: 2,
      title: "Types of Sports Bets",
      duration: "7 min",
      content: `## Types of Sports Bets

### Moneyline
Pick the winner of the game. Simplest bet type.

### Point Spread
The favorite must win by more than the spread, or the underdog must lose by less.

### Over/Under (Totals)
Bet on whether the total combined score will be over or under a set number.

### Parlays
Combine multiple bets into one. All selections must win, but payouts are higher.

### Props
Bet on specific events within a game (e.g., "Player X scores 30+ points")`
    }
  ],
  intermediate: [
    {
      id: 3,
      title: "Bankroll Management",
      duration: "10 min",
      content: `## Bankroll Management

### The Golden Rules
1. **Never bet more than 1-5% of your bankroll** on a single bet
2. **Set a budget** and stick to it
3. **Track every bet** you make

### Unit Sizing
- Define a "unit" as 1-2% of your total bankroll
- Bet 1-3 units per wager based on confidence

### Avoid These Mistakes
- Chasing losses with bigger bets
- Betting your entire bankroll on "sure things"
- Emotional betting after a big win or loss`
    }
  ],
  advanced: [
    {
      id: 4,
      title: "Finding Value Bets",
      duration: "15 min",
      content: `## Finding Value Bets

A value bet occurs when the probability of an outcome is greater than what the odds suggest.

### Expected Value Formula
EV = (Probability of Win × Potential Profit) - (Probability of Loss × Stake)

### Key Principles
1. **Do your own research** - Don't just follow public opinion
2. **Look for line movement** - Sharp money often moves lines
3. **Specialize** - Focus on sports/leagues you know well

### Signs of Value
- Odds that don't match your calculated probability
- Late line movement against public consensus
- Under-hyped teams with strong fundamentals`
    }
  ]
};

export default function LearningCenterContent() {
  const [selectedLesson, setSelectedLesson] = useState(null);

  if (selectedLesson) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setSelectedLesson(null)} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Lessons
        </Button>
        <Card className="border-2 border-blue-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-blue-600" />
              {selectedLesson.title}
            </CardTitle>
            <Badge variant="secondary" className="w-fit">
              <Clock className="w-3 h-3 mr-1" />
              {selectedLesson.duration}
            </Badge>
          </CardHeader>
          <CardContent className="p-6">
            <div className="prose prose-gray max-w-none">
              <ReactMarkdown>{selectedLesson.content}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="beginner">
        <TabsList className="bg-gray-100 p-1">
          <TabsTrigger value="beginner" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
            <GraduationCap className="w-4 h-4 mr-2" />
            Beginner
          </TabsTrigger>
          <TabsTrigger value="intermediate" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-white">
            <TrendingUp className="w-4 h-4 mr-2" />
            Intermediate
          </TabsTrigger>
          <TabsTrigger value="advanced" className="data-[state=active]:bg-red-500 data-[state=active]:text-white">
            <Brain className="w-4 h-4 mr-2" />
            Advanced
          </TabsTrigger>
        </TabsList>

        {Object.entries(lessons).map(([level, levelLessons]) => (
          <TabsContent key={level} value={level}>
            <div className="grid md:grid-cols-2 gap-4">
              {levelLessons.map((lesson) => (
                <Card 
                  key={lesson.id} 
                  className="border-2 border-gray-200 hover:border-blue-300 cursor-pointer transition-all hover:shadow-lg"
                  onClick={() => setSelectedLesson(lesson)}
                >
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{lesson.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      {lesson.duration}
                    </div>
                    <Button className="mt-4 w-full" variant="outline">
                      Start Lesson
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
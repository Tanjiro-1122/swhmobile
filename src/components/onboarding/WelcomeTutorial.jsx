import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, ArrowRight, Sparkles, Search, TrendingUp, Calculator } from "lucide-react";

const tutorialSteps = [
  {
    title: "Welcome to Sports Wager Helper! 🏆",
    description: "Let's take a quick tour of the key features that will help you make smarter bets.",
    icon: Sparkles,
    color: "from-purple-500 to-pink-500"
  },
  {
    title: "Search Any Match 🔍",
    description: "Type any game (like 'Lakers vs Celtics') and get instant AI predictions with win probabilities, injury reports, and betting insights.",
    icon: Search,
    color: "from-blue-500 to-cyan-500"
  },
  {
    title: "Live Odds Comparison 💰",
    description: "Compare odds from DraftKings, FanDuel, and BetMGM in real-time to find the best value for your bets.",
    icon: TrendingUp,
    color: "from-green-500 to-emerald-500"
  },
  {
    title: "Power User Tools 🧮",
    description: "Use our Parlay Builder, Betting Calculator, ROI Tracker, and Bankroll Manager to bet like a pro.",
    icon: Calculator,
    color: "from-orange-500 to-red-500"
  }
];

export default function WelcomeTutorial() {
  const [currentStep, setCurrentStep] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    // Check if user has seen the tutorial
    const hasSeenTutorial = localStorage.getItem('hasSeenTutorial');
    if (!hasSeenTutorial || hasSeenTutorial !== 'true') {
      setShowTutorial(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    localStorage.setItem('hasSeenTutorial', 'true');
    setShowTutorial(false);
  };

  const handleComplete = () => {
    localStorage.setItem('hasSeenTutorial', 'true');
    setShowTutorial(false);
  };

  if (!showTutorial) return null;

  const step = tutorialSteps[currentStep];
  const Icon = step.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="max-w-md w-full"
        >
          <Card className="border-2 border-purple-300 shadow-2xl overflow-hidden">
            <div className={`bg-gradient-to-r ${step.color} p-8 text-white relative`}>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSkip}
                className="absolute top-4 right-4 text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </Button>
              <div className="flex items-center justify-center mb-4">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Icon className="w-10 h-10" />
                </div>
              </div>
              <h2 className="text-3xl font-black text-center mb-2">{step.title}</h2>
            </div>

            <CardContent className="p-8">
              <p className="text-lg text-gray-700 text-center mb-8 leading-relaxed">
                {step.description}
              </p>

              {/* Progress Dots */}
              <div className="flex items-center justify-center gap-2 mb-6">
                {tutorialSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 rounded-full transition-all ${
                      index === currentStep
                        ? 'w-8 bg-purple-600'
                        : index < currentStep
                        ? 'w-2 bg-purple-400'
                        : 'w-2 bg-gray-300'
                    }`}
                  />
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  className="flex-1"
                >
                  Skip Tutorial
                </Button>
                <Button
                  onClick={handleNext}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold"
                >
                  {currentStep < tutorialSteps.length - 1 ? (
                    <>
                      Next
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  ) : (
                    "Get Started!"
                  )}
                </Button>
              </div>

              <p className="text-center text-sm text-gray-500 mt-4">
                Step {currentStep + 1} of {tutorialSteps.length}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
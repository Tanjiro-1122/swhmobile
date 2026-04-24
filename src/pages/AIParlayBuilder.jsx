import { useState, useEffect, useRef } from "react";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Brain } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ParlayBuilderForm from "../components/parlay/ParlayBuilderForm";
import ParlayDisplay from "../components/parlay/ParlayDisplay";
import RequireAuth from "../components/auth/RequireAuth";
import { useFreeLookupTracker, FreeLookupModal, FreeLookupBanner } from "../components/auth/FreeLookupTracker";
import { toast } from "sonner";
import { useNavigate } from 'react-router-dom';

function AIParlayBuilderContent() {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [currentParlay, setCurrentParlay] = useState(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const queryClient = useQueryClient();

  const { lookupsRemaining, recordLookup, canLookup, userTier } = useFreeLookupTracker();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    base44.auth.isAuthenticated().then(setIsAuthenticated).catch(() => setIsAuthenticated(false));
  }, []);

  const saveParlayMutation = useMutation({
    mutationFn: (parlayData) => base44.entities.Parlay.create(parlayData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parlays'] });
      toast.success("Parlay saved successfully!");
    },
    onError: () => {
      toast.error("Failed to save parlay");
    }
  });

  const handleGenerate = async ({ sport, risk_level, stake_amount }) => {
    if (!canLookup()) {
      setShowLimitModal(true);
      return;
    }

    setIsGenerating(true);
    setError(null);
    setCurrentParlay(null);

    try {
      const response = await base44.functions.invoke('generateParlay', {
        sport,
        risk_level,
        stake_amount
      });

      if (!response.data || response.data.error) {
        throw new Error(response.data?.error || "Failed to generate parlay");
      }

      setCurrentParlay(response.data);
      recordLookup();

    } catch (err) {
      console.error("Parlay generation error:", err);
      const status = err?.status ?? err?.response?.status;
      if (status === 429 || err.message?.toLowerCase().includes("rate limit") || err.message?.toLowerCase().includes("limit reached")) {
        setShowLimitModal(true);
      } else {
        setError(err.message || "Failed to generate parlay. Please try again.");
      }
    }

    setIsGenerating(false);
  };

  const handleSave = () => {
    if (!currentParlay) return;

    const parlayToSave = {
      parlay_name: currentParlay.parlay_name,
      legs: currentParlay.legs,
      total_odds: currentParlay.total_odds,
      stake_amount: currentParlay.stake_amount,
      potential_payout: currentParlay.potential_payout,
      legs_total: currentParlay.legs?.length || 0,
      legs_won: 0,
      result: "pending"
    };

    saveParlayMutation.mutate(parlayToSave);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Back to Dashboard */}
      <div className="px-4 pt-4 pb-2">
        <button
          onClick={() => navigate(createPageUrl("Dashboard"))}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Dashboard
        </button>
      </div>
      <button
        onClick={() => navigate(createPageUrl("Dashboard"))}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "none", border: "none", cursor: "pointer",
          color: "#888", fontSize: 14, padding: "12px 16px 4px",
          fontWeight: 500
        }}
      >
        ← Back
      </button>
      <FreeLookupBanner lookupsRemaining={lookupsRemaining} isAuthenticated={isAuthenticated} userTier={userTier} />
      <FreeLookupModal 
        show={showLimitModal} 
        onClose={() => setShowLimitModal(false)}
        lookupsRemaining={lookupsRemaining}
      />

      <div className="px-6 sm:px-6 lg:px-8 max-w-7xl mx-auto py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-gray-900">AI Parlay Builder</h1>
              <p className="text-gray-600 text-lg">Let AI build optimized parlays based on live data and your risk tolerance</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="mb-8">
          <ParlayBuilderForm onGenerate={handleGenerate} isGenerating={isGenerating} />
        </div>

        {/* Error */}
        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-50 border-2 border-red-200">
            <AlertDescription className="text-red-900">{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isGenerating && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full opacity-20 animate-ping" />
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full opacity-75 animate-spin" style={{ clipPath: 'polygon(50% 0%, 100% 0%, 100% 50%, 50% 50%)' }} />
                <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-purple-500" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Building Your Parlay</h3>
              <p className="text-gray-700">Analyzing today's games and finding value bets...</p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {/* Display Parlay */}
        <AnimatePresence>
          {currentParlay && !isGenerating && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
            >
              <ParlayDisplay parlay={currentParlay} onSave={handleSave} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* How It Works */}
        {!currentParlay && !isGenerating && (
          <div className="mt-8 bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-3">
                  <span className="text-2xl font-black text-purple-600">1</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Choose Your Parameters</h3>
                <p className="text-sm text-gray-600">Select your sport, risk level (conservative, balanced, or aggressive), and stake amount.</p>
              </div>
              <div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
                  <span className="text-2xl font-black text-blue-600">2</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">AI Analyzes Games</h3>
                <p className="text-sm text-gray-600">Our AI fetches live data from StatMuse and ESPN, analyzing odds, team stats, injuries, and trends.</p>
              </div>
              <div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-3">
                  <span className="text-2xl font-black text-green-600">3</span>
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Get Your Parlay</h3>
                <p className="text-sm text-gray-600">Receive a custom parlay with detailed reasoning for each leg, risk factors, and potential payout.</p>
              </div>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-8 bg-white border-2 border-gray-200 rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-gray-700">
            <strong className="font-bold text-gray-900">⚠️ Responsible Gambling:</strong> This AI parlay builder is for educational and entertainment purposes only. All predictions are based on statistical analysis and do not guarantee results. Always gamble responsibly and never bet more than you can afford to lose.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AIParlayBuilder() {
  return (
    <RequireAuth pageName="AI Parlay Builder">
      <AIParlayBuilderContent />
    </RequireAuth>
  );
}
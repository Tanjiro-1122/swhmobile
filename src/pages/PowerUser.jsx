import React, { useState } from "react";
import { Zap, Calculator, TrendingUp, DollarSign, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import RequireAuth from "../components/auth/RequireAuth";

// Import the tool components
import ParlayBuilderContent from "../components/poweruser/ParlayBuilderContent";
import BettingCalculatorContent from "../components/poweruser/BettingCalculatorContent";
import ROITrackerContent from "../components/poweruser/ROITrackerContent";
import BankrollManagerContent from "../components/poweruser/BankrollManagerContent";

function PowerUserContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-black text-gray-900">Power User Tools</h1>
              <p className="text-xl text-gray-600">Advanced betting tools for serious bettors</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <Tabs defaultValue="parlay" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-16 bg-white/80 backdrop-blur-sm border-2 border-purple-200">
            <TabsTrigger value="parlay" className="text-base font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white">
              <Calculator className="w-5 h-5 mr-2" />
              Parlay Builder
            </TabsTrigger>
            <TabsTrigger value="calculator" className="text-base font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <Calculator className="w-5 h-5 mr-2" />
              Betting Calculator
            </TabsTrigger>
            <TabsTrigger value="roi" className="text-base font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-green-600 data-[state=active]:text-white">
              <TrendingUp className="w-5 h-5 mr-2" />
              ROI Tracker
            </TabsTrigger>
            <TabsTrigger value="bankroll" className="text-base font-semibold data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white">
              <Wallet className="w-5 h-5 mr-2" />
              Bankroll Manager
            </TabsTrigger>
          </TabsList>

          <TabsContent value="parlay">
            <ParlayBuilderContent />
          </TabsContent>

          <TabsContent value="calculator">
            <BettingCalculatorContent />
          </TabsContent>

          <TabsContent value="roi">
            <ROITrackerContent />
          </TabsContent>

          <TabsContent value="bankroll">
            <BankrollManagerContent />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function PowerUser() {
  return (
    <RequireAuth pageName="Power User Tools">
      <PowerUserContent />
    </RequireAuth>
  );
}
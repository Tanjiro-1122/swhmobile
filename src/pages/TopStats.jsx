import React from "react";
import { Tv } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import FloatingDashboardButton from "@/components/navigation/FloatingDashboardButton";
import BettingBriefsContent from "@/components/hub/BettingBriefsContent";

export default function TopStats() {
  return (
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
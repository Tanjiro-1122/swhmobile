import React from "react";
import { Tv, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import BettingBriefsContent from "@/components/hub/BettingBriefsContent";

export default function TopStats() {
  return (
    <div className="min-h-screen pb-24">
      <div className="max-w-7xl mx-auto">
        <div className="w-full flex justify-start mb-2">
            <Link to={createPageUrl('Dashboard')}>
                <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 -ml-4">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </Button>
            </Link>
        </div>
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
      
    </div>
  );
}
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LiveMarketTicker } from "@/components/widgets/LiveMarketTicker";

export default function SportsNewsTicker() {
  useEffect(() => {
    // Load the RSS widget script
    const existingScript = document.querySelector('script[src="https://widget.rss.app/v1/wall.js"]');
    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://widget.rss.app/v1/wall.js";
      script.type = "text/javascript";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <div className="pb-24">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <div className="w-full flex justify-start mb-2">
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 -ml-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm px-4 py-2 mb-4">
            <Newspaper className="w-4 h-4 mr-2 inline" />
            LIVE SPORTS NEWS
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-2 flex items-center justify-center gap-3">
            <Newspaper className="w-10 h-10" />
            Sports News Ticker
          </h1>
          <p className="text-white/70">
            Live scores and latest sports news updates
          </p>
        </div>

        {/* Live Market Ticker */}
        <div className="mb-8 rounded-xl overflow-hidden border border-white/10">
          <div className="bg-slate-800/50 px-4 py-2 border-b border-white/10">
            <h2 className="text-white font-bold text-sm flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              Live Scores
            </h2>
          </div>
          <LiveMarketTicker />
        </div>

        {/* RSS News Widget */}
        <div className="bg-slate-800/50 rounded-xl border border-white/10 p-4">
          <div className="mb-4">
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-cyan-400" />
              Latest Sports News
            </h2>
          </div>
          <div className="bg-white rounded-lg overflow-hidden min-h-[600px]">
            <rssapp-wall id="tZXFs6qB7XkfmdxB"></rssapp-wall>
          </div>
        </div>
      </div>
    </div>
  );
}
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

        {/* Sports News Links */}
        <div className="bg-slate-800/50 rounded-xl border border-white/10 p-4">
          <div className="mb-4">
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-cyan-400" />
              Latest Sports News
            </h2>
            <p className="text-white/60 text-sm mt-1">Click to read the latest updates from top sports sources</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { name: 'ESPN', url: 'https://www.espn.com', color: 'from-red-600 to-red-700' },
              { name: 'CBS Sports', url: 'https://www.cbssports.com', color: 'from-blue-600 to-blue-700' },
              { name: 'Bleacher Report', url: 'https://www.bleacherreport.com', color: 'from-orange-500 to-orange-600' },
              { name: 'The Athletic', url: 'https://www.theathletic.com', color: 'from-slate-700 to-slate-800' },
              { name: 'Fox Sports', url: 'https://www.foxsports.com', color: 'from-blue-500 to-blue-600' },
              { name: 'NBC Sports', url: 'https://www.nbcsports.com', color: 'from-purple-600 to-purple-700' },
              { name: 'NFL', url: 'https://www.nfl.com/news', color: 'from-blue-800 to-blue-900' },
              { name: 'NBA', url: 'https://www.nba.com/news', color: 'from-orange-600 to-red-600' },
            ].map((source) => (
              <a
                key={source.name}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`bg-gradient-to-r ${source.color} text-white font-bold py-4 px-4 rounded-lg text-center hover:opacity-90 transition-opacity shadow-lg`}
              >
                {source.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
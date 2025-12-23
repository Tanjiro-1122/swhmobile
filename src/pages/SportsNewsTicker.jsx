import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Newspaper, ExternalLink, TrendingUp, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LiveMarketTicker } from "@/components/widgets/LiveMarketTicker";
import { motion } from "framer-motion";

// Featured articles data - curated top stories
const featuredArticles = [
  {
    source: 'ESPN',
    category: 'NFL',
    title: 'Latest NFL News & Updates',
    description: 'Get the latest NFL news, scores, stats, standings, and more from ESPN.',
    image: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=400&h=250&fit=crop',
    url: 'https://www.espn.com/nfl/',
    color: 'from-red-600 to-red-700',
    hot: true
  },
  {
    source: 'CBS Sports',
    category: 'NBA',
    title: 'NBA Scores, News & Standings',
    description: 'Complete NBA coverage with scores, standings, and expert analysis.',
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=250&fit=crop',
    url: 'https://www.cbssports.com/nba/',
    color: 'from-blue-600 to-blue-700',
    hot: false
  },
  {
    source: 'Bleacher Report',
    category: 'MLB',
    title: 'MLB Breaking News & Analysis',
    description: 'Stay updated with the latest MLB trades, rumors, and game coverage.',
    image: 'https://images.unsplash.com/photo-1566577134770-3d85bb3a9cc4?w=400&h=250&fit=crop',
    url: 'https://bleacherreport.com/mlb',
    color: 'from-orange-500 to-orange-600',
    hot: false
  },
  {
    source: 'The Athletic',
    category: 'NHL',
    title: 'NHL In-Depth Coverage',
    description: 'Premium hockey analysis, insider reports, and game breakdowns.',
    image: 'https://images.unsplash.com/photo-1580748142215-5ba0bfce00af?w=400&h=250&fit=crop',
    url: 'https://www.nytimes.com/athletic/nhl/',
    color: 'from-slate-700 to-slate-800',
    hot: false
  },
  {
    source: 'Fox Sports',
    category: 'NCAAF',
    title: 'College Football Headlines',
    description: 'NCAAF rankings, scores, and championship coverage.',
    image: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=400&h=250&fit=crop',
    url: 'https://www.foxsports.com/college-football',
    color: 'from-blue-500 to-blue-600',
    hot: true
  },
  {
    source: 'NBC Sports',
    category: 'Soccer',
    title: 'Premier League & Soccer News',
    description: 'Latest soccer news from Premier League, Champions League, and MLS.',
    image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&h=250&fit=crop',
    url: 'https://www.nbcsports.com/soccer',
    color: 'from-purple-600 to-purple-700',
    hot: false
  }
];

const quickLinks = [
  { name: 'ESPN', url: 'https://www.espn.com', color: 'bg-red-600' },
  { name: 'CBS Sports', url: 'https://www.cbssports.com', color: 'bg-blue-600' },
  { name: 'Bleacher Report', url: 'https://www.bleacherreport.com', color: 'bg-orange-500' },
  { name: 'The Athletic', url: 'https://www.theathletic.com', color: 'bg-slate-700' },
  { name: 'Fox Sports', url: 'https://www.foxsports.com', color: 'bg-blue-500' },
  { name: 'NBC Sports', url: 'https://www.nbcsports.com', color: 'bg-purple-600' },
  { name: 'NFL.com', url: 'https://www.nfl.com/news', color: 'bg-blue-800' },
  { name: 'NBA.com', url: 'https://www.nba.com/news', color: 'bg-orange-600' },
  { name: 'MLB.com', url: 'https://www.mlb.com/news', color: 'bg-red-700' },
  { name: 'NHL.com', url: 'https://www.nhl.com/news', color: 'bg-slate-800' },
];

export default function SportsNewsTicker() {
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
            Sports News & Scores
          </h1>
          <p className="text-white/70">
            Live scores, featured articles, and the latest sports updates
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

        {/* Featured Articles Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-xl flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              Featured Stories
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredArticles.map((article, index) => (
              <motion.a
                key={article.title}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <Card className="bg-slate-800/50 border-white/10 overflow-hidden hover:border-white/30 transition-all h-full">
                  <div className="relative h-40 overflow-hidden">
                    <img 
                      src={article.image} 
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <Badge className={`bg-gradient-to-r ${article.color} text-white text-xs`}>
                        {article.source}
                      </Badge>
                      {article.hot && (
                        <Badge className="bg-red-500 text-white text-xs animate-pulse">
                          🔥 HOT
                        </Badge>
                      )}
                    </div>
                    <Badge className="absolute top-3 right-3 bg-black/50 text-white text-xs">
                      {article.category}
                    </Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="text-white font-bold text-lg mb-2 group-hover:text-cyan-400 transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-slate-400 text-sm line-clamp-2 mb-3">
                      {article.description}
                    </p>
                    <div className="flex items-center text-cyan-400 text-sm font-semibold">
                      Read Article <ExternalLink className="w-4 h-4 ml-1" />
                    </div>
                  </CardContent>
                </Card>
              </motion.a>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-slate-800/50 rounded-xl border border-white/10 p-4">
          <div className="mb-4">
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-cyan-400" />
              Quick Links
            </h2>
            <p className="text-white/60 text-sm mt-1">Jump directly to your favorite sports sources</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {quickLinks.map((source) => (
              <a
                key={source.name}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`${source.color} text-white font-semibold py-2 px-4 rounded-lg text-sm hover:opacity-80 transition-opacity shadow-lg flex items-center gap-2`}
              >
                {source.name}
                <ExternalLink className="w-3 h-3" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
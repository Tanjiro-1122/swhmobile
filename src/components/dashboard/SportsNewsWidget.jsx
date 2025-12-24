import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ExternalLink, Newspaper, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const newsItems = [
    {
        source: 'ESPN',
        title: 'Latest injury updates across major leagues',
        category: 'Injuries',
        color: 'text-red-400',
        url: 'https://www.espn.com/nba/injuries'
    },
    {
        source: 'CBS Sports',
        title: 'Expert picks and predictions',
        category: 'Predictions',
        color: 'text-blue-400',
        url: 'https://www.cbssports.com/nba/expert-picks/'
    },
    {
        source: 'Yahoo Sports',
        title: 'Breaking sports news & analysis',
        category: 'News',
        color: 'text-purple-400',
        url: 'https://sports.yahoo.com/'
    }
];

export default function SportsNewsWidget() {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
        >
            <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
                <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Newspaper className="w-5 h-5 text-cyan-400" />
                        <h3 className="font-bold text-white">Quick Links</h3>
                        <div className="flex items-center gap-1 ml-auto text-xs text-slate-400">
                            <Clock className="w-3 h-3" />
                            <span>Live</span>
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        {newsItems.map((item, index) => (
                            <a
                                key={index}
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg hover:bg-slate-700/50 transition-colors group"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-xs font-medium ${item.color}`}>{item.source}</span>
                                        <span className="text-xs text-slate-500">•</span>
                                        <span className="text-xs text-slate-500">{item.category}</span>
                                    </div>
                                    <p className="text-sm text-slate-300 truncate group-hover:text-white transition-colors">
                                        {item.title}
                                    </p>
                                </div>
                                <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 flex-shrink-0 mt-1 transition-colors" />
                            </a>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
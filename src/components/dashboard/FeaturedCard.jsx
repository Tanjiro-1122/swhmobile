import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function FeaturedCard({ item, index }) {
  const Icon = item.Icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link to={createPageUrl(item.page)} className="block group">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/90 border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300">
          {/* Gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-transparent to-cyan-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 p-[1px]">
                  <div className="w-full h-full rounded-xl bg-slate-900 flex items-center justify-center">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">{item.title}</h3>
                  <p className="text-purple-400 font-semibold text-sm">{item.subtitle}</p>
                </div>
              </div>
              
              {item.tag && (
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${item.tagColor}`}>
                  {item.tag}
                </span>
              )}
            </div>
            
            <p className="text-slate-400 text-sm mb-4">{item.description}</p>
            
            <div className="flex items-center text-purple-400 text-sm font-medium group-hover:text-purple-300 transition-colors">
              <span>Open</span>
              <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
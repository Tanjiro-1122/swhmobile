import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

const glowColors = {
  purple: "from-purple-500 via-fuchsia-500 to-pink-500",
  cyan: "from-cyan-400 via-blue-500 to-indigo-500",
  lime: "from-lime-400 via-emerald-500 to-teal-500",
  orange: "from-orange-400 via-red-500 to-pink-500",
  gold: "from-yellow-400 via-amber-500 to-orange-500",
};

export default function NeonCard({ item, index, glowColor = "purple" }) {
  const Icon = item.Icon;
  const gradient = glowColors[glowColor] || glowColors.purple;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: 0.05 + index * 0.08,
        duration: 0.5,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={{ y: -5, scale: 1.02 }}
      className="h-full"
    >
      <Link to={createPageUrl(item.page)} className="block h-full group">
        <div className="relative h-full">
          {/* Animated glow border */}
          <div className={`absolute -inset-[1px] bg-gradient-to-r ${gradient} rounded-2xl opacity-0 group-hover:opacity-100 blur-sm transition-all duration-500`} />
          <div className={`absolute -inset-[1px] bg-gradient-to-r ${gradient} rounded-2xl opacity-20 group-hover:opacity-60 transition-all duration-500`} />
          
          {/* Card content */}
          <div className="relative h-full bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-700/50 group-hover:border-transparent transition-all duration-500 overflow-hidden">
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)`,
                backgroundSize: '24px 24px'
              }} />
            </div>

            {/* Top accent line */}
            <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${gradient} opacity-50 group-hover:opacity-100 transition-opacity duration-300`} />

            {/* Content */}
            <div className="relative p-6 flex flex-col h-full">
              {/* Tag */}
              {item.tag && (
                <motion.div 
                  className={`absolute top-4 right-4 text-[10px] font-black px-3 py-1 rounded-full ${item.tagColor} shadow-lg`}
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {item.tag}
                </motion.div>
              )}

              {/* Icon with glow */}
              <div className="relative mb-4">
                <div className={`absolute inset-0 bg-gradient-to-r ${gradient} rounded-xl blur-lg opacity-0 group-hover:opacity-40 transition-opacity duration-500`} />
                <div className={`relative w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} p-[1px]`}>
                  <div className="w-full h-full rounded-xl bg-slate-900 flex items-center justify-center overflow-hidden">
                    {item.customIcon ? (
                      <img src={item.customIcon} alt={item.title} className="w-full h-full object-cover rounded-xl" />
                    ) : Icon ? (
                      <Icon className="w-7 h-7 text-white" />
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Text content */}
              <h3 className="text-lg font-black text-white tracking-tight mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300 transition-all duration-300">
                {item.title}
              </h3>
              <p className={`text-sm font-semibold bg-gradient-to-r ${gradient} bg-clip-text text-transparent mb-2`}>
                {item.subtitle}
              </p>
              <p className="text-slate-400 text-sm mt-auto group-hover:text-slate-300 transition-colors leading-relaxed">
                {item.description}
              </p>

              {/* Arrow indicator */}
              <div className="absolute bottom-5 right-5">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${gradient} p-[1px] opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0`}>
                  <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                    <ChevronRight className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
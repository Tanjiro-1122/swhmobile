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
      whileHover={{ y: -3 }}
    >
      <Link to={createPageUrl(item.page)} className="block group">
        <div className="relative overflow-hidden rounded-2xl bg-slate-900/90 border border-slate-700/50 hover:border-lime-500/50 transition-all duration-500">
          {/* Animated glow border */}
          <motion.div 
            className="absolute -inset-px bg-gradient-to-r from-lime-500 via-cyan-500 to-purple-500 rounded-2xl opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500"
          />
          <motion.div 
            className="absolute -inset-px bg-gradient-to-r from-lime-500 via-cyan-500 to-purple-500 rounded-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"
          />
          
          {/* Card inner */}
          <div className="relative bg-slate-900/95 rounded-2xl m-px overflow-hidden">
            {/* Scan line effect */}
            <motion.div
              className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100"
              style={{
                background: 'linear-gradient(180deg, transparent 0%, rgba(163, 230, 53, 0.05) 50%, transparent 100%)',
                backgroundSize: '100% 20px',
              }}
              animate={{ backgroundPosition: ['0% 0%', '0% 100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            />
            
            {/* Top accent line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-lime-500/50 to-transparent" />
            
            <div className="relative p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  {/* Icon with glow */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-lime-500 to-cyan-500 rounded-xl blur-lg opacity-0 group-hover:opacity-50 transition-opacity" />
                    <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-lime-500 to-cyan-500 p-[2px]">
                      <div className="w-full h-full rounded-xl bg-slate-900 flex items-center justify-center overflow-hidden">
                        {item.customIcon ? (
                          <img src={item.customIcon} alt={item.title} className="w-full h-full object-cover rounded-xl" />
                        ) : Icon ? (
                          <Icon className="w-7 h-7 text-lime-400" />
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-lime-400 group-hover:to-cyan-400 transition-all">{item.title}</h3>
                    <p className="text-lime-400/80 font-semibold text-sm">{item.subtitle}</p>
                  </div>
                </div>
                
                {item.tag && (
                  <motion.span 
                    className={`text-xs font-bold px-3 py-1 rounded-full border ${item.tagColor}`}
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ boxShadow: '0 0 10px rgba(163, 230, 53, 0.3)' }}
                  >
                    {item.tag}
                  </motion.span>
                )}
              </div>
              
              <p className="text-slate-400 text-sm mb-4">{item.description}</p>
              
              {/* Futuristic CTA */}
              <div className="flex items-center gap-2">
                <span className="text-lime-400 text-sm font-bold uppercase tracking-wider">Access</span>
                <div className="flex-1 h-px bg-gradient-to-r from-lime-500/50 to-transparent" />
                <motion.div 
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-lime-500 to-cyan-500 p-[1px] opacity-70 group-hover:opacity-100 transition-opacity"
                  whileHover={{ scale: 1.1 }}
                >
                  <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                    <ChevronRight className="w-4 h-4 text-lime-400 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
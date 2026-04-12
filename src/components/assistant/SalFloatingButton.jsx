import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';

export default function SalFloatingButton() {
  const [isHovered, setIsHovered] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="absolute bottom-20 right-0 w-64 bg-slate-800 border border-purple-500/30 rounded-xl p-4 shadow-2xl shadow-purple-500/20"
          >
            <button 
              onClick={(e) => { e.preventDefault(); setIsDismissed(true); }}
              className="absolute -top-2 -right-2 w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-white font-bold text-sm mb-1">Ask S.A.L. the Owl!</h4>
                <p className="text-slate-400 text-xs">Your AI Sports Librarian is ready to help with predictions, stats & betting insights.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Link to={createPageUrl('AskSAL')}>
        <motion.div
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="relative"
        >
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full blur-lg opacity-60 animate-pulse" />
          
          {/* Main button */}
          <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 p-1 shadow-2xl cursor-pointer border-2 border-purple-400/50">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/e6d91dd0c_AfriendlyrobotowlmascotwithpurpleandlimegreenaccentswearingstylishglassesholdinganopenglowingbookwithalightbulbaboveitsheadSportswhistlearoundneckModernvectorstyledarkbackgrou.jpg"
              alt="S.A.L. the Owl"
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          
          {/* Notification dot */}
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">AI</span>
          </span>
        </motion.div>
      </Link>
    </div>
  );
}
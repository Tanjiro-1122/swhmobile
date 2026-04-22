import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Zap } from 'lucide-react';

const SAL_IMG = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/e6d91dd0c_AfriendlyrobotowlmascotwithpurpleandlimegreenaccentswearingstylishglassesholdinganopenglowingbookwithalightbulbaboveitsheadSportswhistlearoundneckModernvectorstyledarkbackgrou.jpg";

export default function SalFloatingButton() {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.92 }}
            transition={{ type: 'spring', damping: 25 }}
            className="w-72 bg-gray-900 border border-purple-500/30 rounded-2xl shadow-2xl shadow-purple-500/20 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-gray-800">
              <div className="relative w-10 h-10 flex-shrink-0">
                <div className="absolute inset-0 bg-purple-500/30 rounded-xl blur-md" />
                <img src={SAL_IMG} alt="S.A.L." className="relative w-10 h-10 rounded-xl object-cover border border-purple-500/30" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-black text-sm">S.A.L. is ready</p>
                <p className="text-green-400 text-xs font-medium">● Online · Live odds loaded</p>
              </div>
              <button onClick={() => setDismissed(true)} className="text-gray-600 hover:text-gray-400 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Body */}
            <div className="p-4 space-y-3">
              <p className="text-gray-400 text-xs leading-relaxed">
                Your AI sports detective. Ask about any game, player, or betting angle — with live odds built in.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {["Tonight's best bet?", "Build me a parlay", "NBA pick today?", "Explain the spread"].map(q => (
                  <Link key={q} to={`${createPageUrl('AskSAL')}?q=${encodeURIComponent(q)}`}
                    className="text-center px-2 py-2 bg-gray-800 hover:bg-purple-500/10 border border-gray-700 hover:border-purple-500/30 rounded-xl text-xs text-gray-300 hover:text-purple-300 transition-all font-medium">
                    {q}
                  </Link>
                ))}
              </div>
              <Link to={createPageUrl('AskSAL')}
                className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl text-sm transition-all">
                <MessageCircle className="w-4 h-4" /> Open Full Chat
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main button */}
      <motion.button
        onClick={() => setExpanded(v => !v)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="relative w-16 h-16 rounded-full"
      >
        {/* Glow rings */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full blur-xl opacity-50" />
        <motion.div
          className="absolute -inset-2 rounded-full border-2 border-purple-500/30"
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />
        {/* Avatar */}
        <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-purple-400/60 shadow-2xl bg-gray-900">
          <img src={SAL_IMG} alt="S.A.L." className="w-full h-full object-cover" />
          {expanded && (
            <div className="absolute inset-0 bg-purple-900/60 flex items-center justify-center">
              <X className="w-6 h-6 text-white" />
            </div>
          )}
        </div>
        {/* Live badge */}
        {!expanded && (
          <motion.span
            className="absolute -top-1 -right-1 flex items-center gap-0.5 bg-green-500 rounded-full border-2 border-gray-950 px-1.5 py-0.5"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <Zap className="w-2.5 h-2.5 text-white" />
            <span className="text-[9px] font-black text-white">AI</span>
          </motion.span>
        )}
      </motion.button>
    </div>
  );
}

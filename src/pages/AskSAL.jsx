import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import RequireAuth from '@/components/auth/RequireAuth';
import ReactMarkdown from 'react-markdown';

const ANIMATED_OWL_VIDEO = 'https://i.imgur.com/U6Qr1lM.mp4';
const SESSION_MESSAGES_KEY = 'sal_messages_v2';

// ── Live Odds Context Helper ─────────────────────────────────────────────────
const SPORTS_TO_FETCH = ['basketball_nba', 'americanfootball_nfl', 'baseball_mlb', 'icehockey_nhl'];
const SPORT_LABELS = { basketball_nba: 'NBA', americanfootball_nfl: 'NFL', baseball_mlb: 'MLB', icehockey_nhl: 'NHL' };

async function fetchLiveOddsContext() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const allLines = [];
    for (const sportKey of SPORTS_TO_FETCH) {
      try {
        const res = await fetch(`/api/getLiveOdds?sportKey=${sportKey}`);
        if (!res.ok) continue;
        const games = await res.json();
        if (!Array.isArray(games) || games.length === 0) continue;
        const label = SPORT_LABELS[sportKey];
        const todaysGames = games.filter(g => g.commence_time?.startsWith(today));
        const gamesToShow = (todaysGames.length > 0 ? todaysGames : games).slice(0, 3);
        if (gamesToShow.length === 0) continue;
        allLines.push(`${label} TODAY:`);
        for (const game of gamesToShow) {
          const bk = game.bookmakers?.[0];
          if (!bk) continue;
          const oddsLines = [];
          for (const market of bk.markets || []) {
            if (market.key === 'h2h') {
              const ml = market.outcomes?.map(o => `${o.name} ${o.price > 0 ? '+' : ''}${o.price}`).join(' / ');
              if (ml) oddsLines.push(`ML: ${ml}`);
            }
            if (market.key === 'spreads') {
              const sp = market.outcomes?.map(o => `${o.name} ${o.point > 0 ? '+' : ''}${o.point} (${o.price > 0 ? '+' : ''}${o.price})`).join(' / ');
              if (sp) oddsLines.push(`Spread: ${sp}`);
            }
          }
          if (oddsLines.length > 0) {
            allLines.push(`  ${game.home_team} vs ${game.away_team} — ${oddsLines.join(' | ')}`);
          }
        }
      } catch { /* skip */ }
    }
    return allLines.length > 0 ? `\n\n[LIVE ODDS (use in your answer, don't repeat this block):\n${allLines.join('\n')}]` : '';
  } catch { return ''; }
}

function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-2`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center flex-shrink-0 mt-1 text-sm">
          🦉
        </div>
      )}
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
        isUser
          ? 'bg-purple-600 text-white rounded-tr-sm'
          : 'bg-slate-800 text-slate-100 rounded-tl-sm border border-slate-700/50'
      }`}>
        {isUser ? (
          <p className="leading-relaxed">{message.content}</p>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none leading-relaxed">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div className="flex justify-start gap-2">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center flex-shrink-0 text-sm">
        🦉
      </div>
      <div className="bg-slate-800 border border-slate-700/50 rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1.5 items-center h-5">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-purple-400"
              animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function AskSALPage() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Restore session messages
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_MESSAGES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          setShowIntro(false);
        }
      }
    } catch {}
  }, []);

  // Save messages to session storage
  useEffect(() => {
    if (messages.length > 0) {
      try { sessionStorage.setItem(SESSION_MESSAGES_KEY, JSON.stringify(messages)); } catch {}
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    const content = newMessage.trim();
    if (!content || isSending) return;

    setNewMessage('');
    setShowIntro(false);

    const userMsg = { role: 'user', content };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsSending(true);

    try {
      const oddsContext = await fetchLiveOddsContext();
      const messageWithContext = `[Today: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}${oddsContext}]\n\n${content}`;

      const resp = await fetch('/api/sal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageWithContext,
          history: messages.slice(-10), // last 10 for context
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Server error: ${resp.status}`);
      }

      const data = await resp.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      console.error('[SAL] send error:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "Blast! The trail has gone cold, my friend. The archives seem unresponsive at the moment. Please try again."
      }]);
    } finally {
      setIsSending(false);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setShowIntro(true);
    try { sessionStorage.removeItem(SESSION_MESSAGES_KEY); } catch {}
  };

  // Intro Screen
  if (showIntro && messages.length === 0) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col">
        {/* Back button */}
        <div className="px-4 pt-6">
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10 -ml-2">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Intro content */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 pb-8">
          <motion.div
            className="relative mb-6"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-500 via-cyan-500 to-lime-500 rounded-3xl blur-2xl opacity-30" />
            <video
              src={ANIMATED_OWL_VIDEO}
              autoPlay loop muted playsInline
              className="relative w-28 h-28 rounded-3xl object-cover border-2 border-purple-400/40 shadow-2xl"
            />
          </motion.div>

          <h1 className="text-3xl font-black mb-2">
            <span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-lime-400 bg-clip-text text-transparent">
              Ask S.A.L.
            </span>
          </h1>
          <p className="text-gray-400 text-base mb-1 font-medium">Sports Analysis & Logic</p>
          <p className="text-gray-500 text-sm mb-8 max-w-xs">
            Your AI sports detective. Ask anything about matchups, players, odds, and betting strategy.
          </p>

          {/* Quick prompts */}
          <div className="w-full max-w-sm space-y-2 mb-6">
            {[
              "Are there any NBA games today worth betting on?",
              "Break down the Lakers vs Celtics matchup",
              "Who's the best value play in MLB this week?",
            ].map(prompt => (
              <button
                key={prompt}
                onClick={() => { setNewMessage(prompt); setTimeout(() => inputRef.current?.focus(), 100); }}
                className="w-full text-left px-4 py-3 rounded-2xl bg-gray-900 border border-gray-800 text-gray-300 text-sm hover:border-purple-500/40 hover:bg-purple-500/5 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="w-full max-w-sm">
            <form onSubmit={handleSend} className="relative">
              <Textarea
                ref={inputRef}
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="State your case..."
                className="bg-slate-800/80 border-purple-500/30 rounded-2xl pr-14 text-sm focus:ring-purple-500 focus:border-purple-500 min-h-[60px] resize-none text-white"
                rows={2}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
              />
              <Button
                type="submit"
                disabled={!newMessage.trim()}
                className="absolute right-3 bottom-3 bg-gradient-to-r from-purple-600 to-indigo-600 disabled:from-slate-700 disabled:to-slate-700 rounded-xl w-9 h-9 p-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Chat screen
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-6 pb-3 flex-shrink-0">
        <Link to={createPageUrl('Dashboard')}>
          <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-xs">🦉</div>
          <span className="text-white font-bold text-sm">S.A.L.</span>
        </div>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-xs transition-colors pr-1"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          New chat
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MessageBubble message={msg} />
            </motion.div>
          ))}
        </AnimatePresence>
        {isSending && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <ThinkingBubble />
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-6 pt-2 flex-shrink-0 border-t border-gray-800/60 bg-gray-950">
        <form onSubmit={handleSend} className="relative">
          <Textarea
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Present your next case to S.A.L..."
            className="bg-slate-800/80 border-slate-700 rounded-2xl pr-14 text-sm focus:ring-purple-500 focus:border-purple-500 min-h-[52px] resize-none text-white"
            rows={2}
            disabled={isSending}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="absolute right-3 bottom-3 bg-gradient-to-r from-purple-600 to-indigo-600 disabled:from-slate-700 disabled:to-slate-700 rounded-xl w-9 h-9 p-0"
          >
            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function AskSAL() {
  return (
    <RequireAuth pageName="Ask S.A.L.">
      <AskSALPage />
    </RequireAuth>
  );
}

import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, ArrowLeft, RefreshCw, Zap, BookOpen, Trophy, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import RequireAuth from '@/components/auth/RequireAuth';
import { useFreeLookupTracker, FreeLookupModal } from '@/components/auth/FreeLookupTracker';
import ReactMarkdown from 'react-markdown';

const SAL_IMG = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/e6d91dd0c_AfriendlyrobotowlmascotwithpurpleandlimegreenaccentswearingstylishglassesholdinganopenglowingbookwithalightbulbaboveitsheadSportswhistlearoundneckModernvectorstyledarkbackgrou.jpg";
const SESSION_KEY = 'sal_messages_v3';

const SPORT_KEYS = ['basketball_nba','americanfootball_nfl','baseball_mlb','icehockey_nhl'];
const SPORT_LABELS = { basketball_nba:'NBA', americanfootball_nfl:'NFL', baseball_mlb:'MLB', icehockey_nhl:'NHL' };

// Only fetch odds when the message is actually about sports/betting
const ODDS_WORDS = ["bet","wager","odds","spread","parlay","pick","tonight","today","game","match",
  "nba","nfl","mlb","nhl","soccer","mma","boxing","line","over","under","prop","value","favorite",
  "underdog","win","lose","score","vs","prediction","predict","analyze","analysis","should i"];
function needsOdds(msg) {
  const lower = (msg||"").toLowerCase();
  return ODDS_WORDS.some(w => lower.includes(w));
}

async function fetchOddsContext() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const lines = [];
    for (const sk of SPORT_KEYS.slice(0,3)) {
      try {
        const res = await fetch(`/api/getLiveOdds?sport=${sk}`);
        if (!res.ok) continue;
        const d = await res.json();
        const games = (d.games || []).filter(g => g.commence_time?.startsWith(today)).slice(0,3);
        if (!games.length) continue;
        lines.push(`${SPORT_LABELS[sk]}:`);
        for (const g of games) {
          const dk = g.bookmakers?.[0]?.markets?.[0]?.outcomes || [];
          const odds = dk.map(o => `${o.name.split(' ').pop()} ${o.price > 0 ? '+' : ''}${o.price}`).join(' / ');
          if (odds) lines.push(`  ${g.away_team} @ ${g.home_team}: ${odds}`);
        }
      } catch {}
    }
    return lines.length ? `\n\n[TODAY'S LIVE ODDS:\n${lines.join('\n')}]` : '';
  } catch { return ''; }
}

const QUICK_PROMPTS = [
  { label: "Tonight's best bet?", icon: "🔥" },
  { label: "NBA underdog pick?", icon: "🏀" },
  { label: "NFL value play?", icon: "🏈" },
  { label: "MLB moneyline value?", icon: "⚾" },
  { label: "Build me a parlay", icon: "⚡" },
  { label: "Explain the spread", icon: "📚" },
  { label: "Hot streak player?", icon: "📈" },
  { label: "Safe 2-leg parlay?", icon: "🎯" },
];

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} gap-3`}>
      {!isUser && (
        <div className="flex-shrink-0 mt-1">
          <div className="relative w-9 h-9">
            <div className="absolute inset-0 bg-purple-500/30 rounded-xl blur-sm" />
            <img src={SAL_IMG} alt="S.A.L." className="relative w-9 h-9 rounded-xl object-cover border border-purple-500/30" />
          </div>
        </div>
      )}
      <div className={`max-w-[82%] ${isUser
        ? 'bg-gradient-to-br from-purple-600 to-indigo-700 text-white rounded-3xl rounded-tr-sm px-5 py-3.5'
        : 'bg-gray-800 border border-gray-700 text-gray-100 rounded-3xl rounded-tl-sm px-5 py-4'
      }`}>
        {isUser ? (
          <p className="text-sm leading-relaxed">{msg.content}</p>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none leading-relaxed text-sm">
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ThinkingBubble() {
  return (
    <div className="flex justify-start gap-3">
      <div className="relative w-9 h-9 flex-shrink-0">
        <div className="absolute inset-0 bg-purple-500/30 rounded-xl blur-sm animate-pulse" />
        <img src={SAL_IMG} alt="S.A.L." className="relative w-9 h-9 rounded-xl object-cover border border-purple-500/30" />
      </div>
      <div className="bg-gray-800 border border-gray-700 rounded-3xl rounded-tl-sm px-5 py-4">
        <div className="flex gap-1.5 items-center h-5">
          {[0,1,2].map(i => (
            <motion.div key={i} className="w-2.5 h-2.5 rounded-full bg-purple-400"
              animate={{ scale:[1,1.5,1], opacity:[0.4,1,0.4] }}
              transition={{ duration:1, repeat:Infinity, delay:i*0.2 }} />
          ))}
        </div>
        <p className="text-[10px] text-gray-600 mt-1">Consulting the archives...</p>
      </div>
    </div>
  );
}

function AskSALPage() {
  const navigate = useNavigate();
  const { recordLookup, canLookup, lookupsRemaining, userTier } = useFreeLookupTracker();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          setShowIntro(false);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(messages)); } catch {}
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (content) => {
    if (!canLookup()) { setShowModal(true); return; }
    const text = content || input.trim();
    if (!text || sending) return;
    setInput('');
    setShowIntro(false);
    const newMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, newMsg]);
    setSending(true);
    try {
      const oddsCtx = needsOdds(text) ? await fetchOddsContext() : "";
      const today = new Date().toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
      const resp = await fetch('/api/sal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `[Today: ${today}${oddsCtx}]\n\n${text}`,
          history: messages.slice(-10),
          skip_odds: !!oddsCtx,
        }),
      });
      const data = await resp.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply || "Hmm, my deductions are unclear. Try again!" }]);
      // Deduct a lookup for free/guest users
      recordLookup();
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "The archives went dark — please try again in a moment." }]);
    }
    setSending(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const reset = () => {
    setMessages([]);
    setShowIntro(true);
    try { sessionStorage.removeItem(SESSION_KEY); } catch {}
  };

  // ── Intro screen ──────────────────────────────────────────────────────────
  if (showIntro) return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-6 pb-4">
        <button onClick={() => navigate(createPageUrl('Dashboard'))}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /><span className="text-sm font-semibold">Dashboard</span>
        </button>
        <span className="text-[10px] text-gray-600 font-bold uppercase tracking-wider">Sports Analysis & Logic</span>
        <div className="w-16" />
      </div>

      {/* Hero */}
      <div className="flex flex-col items-center px-6 pb-4 pt-2">
        <motion.div className="relative mb-5"
          animate={{ y:[0,-8,0] }} transition={{ duration:3.5, repeat:Infinity, ease:'easeInOut' }}>
          <div className="absolute -inset-6 bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-500 rounded-3xl blur-3xl opacity-20" />
          <div className="relative w-28 h-28 rounded-3xl overflow-hidden border-2 border-purple-500/40 shadow-2xl shadow-purple-500/20">
            <img src={SAL_IMG} alt="S.A.L." className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-gray-950 flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
        </motion.div>

        <h1 className="text-4xl font-black text-center mb-1">
          <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">S.A.L.</span>
        </h1>
        <p className="text-white font-bold text-lg mb-1">Sports Analysis & Logic</p>
        <p className="text-gray-500 text-sm text-center max-w-xs mb-6">
          Your AI sports detective — live odds, matchup breakdowns, player trends, betting strategy.
        </p>

        {/* Capability pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {[
            { icon: "🏆", text: "Picks & Predictions" },
            { icon: "📊", text: "Live Odds Aware" },
            { icon: "🧠", text: "AI Analysis" },
            { icon: "🎯", text: "Parlay Builder" },
          ].map(p => (
            <span key={p.text} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-full text-xs text-gray-300 font-medium">
              <span>{p.icon}</span>{p.text}
            </span>
          ))}
        </div>
      </div>

      {/* Quick prompts */}
      <div className="px-5 mb-4">
        <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-3">Quick Questions</p>
        <div className="grid grid-cols-2 gap-2">
          {QUICK_PROMPTS.map(p => (
            <button key={p.label} onClick={() => send(p.label)}
              className="flex items-center gap-2 px-3 py-3 bg-gray-900 border border-gray-800 hover:border-purple-500/30 hover:bg-purple-500/5 rounded-2xl text-left transition-all group">
              <span className="text-lg flex-shrink-0">{p.icon}</span>
              <span className="text-xs text-gray-300 group-hover:text-white font-medium leading-snug">{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="px-5 pb-8 mt-auto">
        <div className="bg-gray-900 border border-gray-700 focus-within:border-purple-500/50 rounded-2xl p-1.5 flex gap-2 transition-colors">
          <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} rows={2}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="State your case to S.A.L...."
            className="flex-1 bg-transparent text-white text-sm px-3 py-2 outline-none resize-none placeholder:text-gray-500" />
          <button onClick={() => send()} disabled={!input.trim() || sending}
            className="self-end mb-1 w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 disabled:opacity-40 rounded-xl flex items-center justify-center transition-all active:scale-95 flex-shrink-0">
            {sending ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
          </button>
        </div>
        <p className="text-center text-[10px] text-gray-600 mt-2">Powered by GPT-4o · Live odds injected</p>
      </div>
    </div>
  );

  // ── Chat screen ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 pt-5 pb-3 border-b border-gray-800/60 bg-gray-950 sticky top-0 z-10">
        <button onClick={() => navigate(createPageUrl('Dashboard'))}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors min-h-[44px] px-1">
          <ArrowLeft className="w-4 h-4" /><span className="text-sm font-semibold">Back</span>
        </button>
        <div className="flex items-center gap-2">
          <div className="relative w-8 h-8">
            <div className="absolute inset-0 bg-purple-500/30 rounded-xl blur-sm" />
            <img src={SAL_IMG} alt="S.A.L." className="relative w-8 h-8 rounded-xl object-cover border border-purple-500/30" />
          </div>
          <div className="leading-tight">
            <p className="text-white font-black text-sm">S.A.L.</p>
            <p className="text-[10px] text-green-400 font-medium">● Online</p>
          </div>
        </div>
        <button onClick={reset} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-300 text-xs transition-colors min-h-[44px] px-1">
          <RefreshCw className="w-3.5 h-3.5" /> New
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <AnimatePresence>
          {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
        </AnimatePresence>
        {sending && <ThinkingBubble />}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts bar */}
      <div className="flex-shrink-0 px-4 py-2 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 w-max">
          {QUICK_PROMPTS.slice(0,5).map(p => (
            <button key={p.label} onClick={() => send(p.label)} disabled={sending}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 border border-gray-800 hover:border-purple-500/30 rounded-xl text-xs text-gray-400 hover:text-purple-300 transition-all disabled:opacity-40">
              <span>{p.icon}</span>{p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 pb-6 pt-1 bg-gray-950 border-t border-gray-800/60">
        <div className="bg-gray-900 border border-gray-700 focus-within:border-purple-500/50 rounded-2xl p-1.5 flex gap-2 transition-colors">
          <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} rows={2}
            disabled={sending}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Present your next case..."
            className="flex-1 bg-transparent text-white text-sm px-3 py-2 outline-none resize-none placeholder:text-gray-500 disabled:opacity-50" />
          <button onClick={() => send()} disabled={!input.trim() || sending}
            className="self-end mb-1 w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 disabled:opacity-40 rounded-xl flex items-center justify-center transition-all active:scale-95 flex-shrink-0">
            {sending ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
          </button>
        </div>
      </div>
      <FreeLookupModal show={showModal} onClose={() => setShowModal(false)} />
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

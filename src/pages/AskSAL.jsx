import { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import MessageBubble from '@/components/assistant/MessageBubble';
import ProcessingSteps from '@/components/assistant/ProcessingSteps';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import RequireAuth from '@/components/auth/RequireAuth';

const ANIMATED_OWL_VIDEO = 'https://i.imgur.com/U6Qr1lM.mp4';
const AGENT_NAME = 'bettingAssistant';
const SESSION_MESSAGES_KEY = 'sal_messages';
const SESSION_CONVERSATION_KEY = 'sal_conversation';
const SESSION_SHOW_INTRO_KEY = 'sal_showIntro';
const LAST_MEMORY_KEY = 'sal_last_memory';
const MAX_MEMORY_DISPLAY_LENGTH = 120;

// ─── Live Odds Context Helper ────────────────────────────────────────────────
// Fetches today's top game odds to inject into S.A.L.'s context
// This gives S.A.L. real numbers instead of relying on web search alone
const SPORTS_TO_FETCH = ['basketball_nba', 'americanfootball_nfl', 'baseball_mlb', 'icehockey_nhl'];
const SPORT_LABELS = {
    basketball_nba: 'NBA',
    americanfootball_nfl: 'NFL', 
    baseball_mlb: 'MLB',
    icehockey_nhl: 'NHL',
};

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
                    const gameTime = new Date(game.commence_time).toLocaleTimeString('en-US', {
                        hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York'
                    });
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
                        if (market.key === 'totals') {
                            const tot = market.outcomes?.map(o => `${o.name} ${o.point} (${o.price > 0 ? '+' : ''}${o.price})`).join(' / ');
                            if (tot) oddsLines.push(`O/U: ${tot}`);
                        }
                    }
                    if (oddsLines.length > 0) {
                        allLines.push(`  ${game.home_team} vs ${game.away_team} @ ${gameTime} ET — ${oddsLines.join(' | ')}`);
                    }
                }
            } catch (e) { /* skip failed sport */ }
        }
        
        if (allLines.length === 0) return '';
        return `\n\n[LIVE ODDS CONTEXT — Use these real lines in your answer, do NOT repeat this block to the user:]\n${allLines.join('\n')}`;
    } catch (e) {
        return ''; // fail silently — S.A.L. will still work without odds
    }
}
// ─────────────────────────────────────────────────────────────────────────────


function AskSALPage() {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [conversation, setConversation] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [processingStep, setProcessingStep] = useState(null);
    const [showIntro, setShowIntro] = useState(true);
    const [hasRestoredSession, setHasRestoredSession] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        let savedMessages = null;
        let savedConversation = null;
        let savedShowIntro = null;
        let hasSessionData = false;

        try {
            const rawMessages = sessionStorage.getItem(SESSION_MESSAGES_KEY);
            if (rawMessages !== null) {
                hasSessionData = true;
                const parsedMessages = JSON.parse(rawMessages);
                if (Array.isArray(parsedMessages)) {
                    savedMessages = parsedMessages;
                }
            }
        } catch (error) {
            console.error('Failed to parse saved SAL messages:', error);
        }

        try {
            const rawConversation = sessionStorage.getItem(SESSION_CONVERSATION_KEY);
            if (rawConversation !== null) {
                hasSessionData = true;
                const parsedConversation = JSON.parse(rawConversation);
                if (parsedConversation && typeof parsedConversation === 'object') {
                    savedConversation = parsedConversation;
                }
            }
        } catch (error) {
            console.error('Failed to parse saved SAL conversation:', error);
        }

        try {
            const rawShowIntro = sessionStorage.getItem(SESSION_SHOW_INTRO_KEY);
            if (rawShowIntro !== null) {
                hasSessionData = true;
                const parsedShowIntro = JSON.parse(rawShowIntro);
                if (typeof parsedShowIntro === 'boolean') {
                    savedShowIntro = parsedShowIntro;
                }
            }
        } catch (error) {
            console.error('Failed to parse saved SAL intro state:', error);
        }

        if (savedMessages) {
            setMessages(savedMessages);
        }

        if (savedConversation) {
            setConversation(savedConversation);
            setShowIntro(false);
        } else if (savedShowIntro !== null) {
            setShowIntro(savedShowIntro);
        }

        if (!hasSessionData) {
            const lastMemory = localStorage.getItem(LAST_MEMORY_KEY);
            if (lastMemory) {
                const truncatedMemory = lastMemory.length > MAX_MEMORY_DISPLAY_LENGTH
                    ? `${lastMemory.slice(0, MAX_MEMORY_DISPLAY_LENGTH)}...`
                    : lastMemory;
                setShowIntro(false);
                setMessages([{
                    role: 'assistant',
                    content: `Welcome back, my friend! Last time, we were exploring: "${truncatedMemory}" — shall we pick up where we left off, or venture into new territory?`
                }]);
            }
        }

        setHasRestoredSession(true);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (!hasRestoredSession) return;
        sessionStorage.setItem(SESSION_MESSAGES_KEY, JSON.stringify(messages));

        const lastMessage = messages[messages.length - 1];
        if (lastMessage?.role === 'assistant' && lastMessage.content) {
            localStorage.setItem(LAST_MEMORY_KEY, lastMessage.content);
        }
    }, [messages, hasRestoredSession]);

    useEffect(() => {
        if (!hasRestoredSession) return;
        if (conversation) {
            sessionStorage.setItem(SESSION_CONVERSATION_KEY, JSON.stringify(conversation));
        } else {
            sessionStorage.removeItem(SESSION_CONVERSATION_KEY);
        }
    }, [conversation, hasRestoredSession]);

    useEffect(() => {
        if (!hasRestoredSession) return;
        sessionStorage.setItem(SESSION_SHOW_INTRO_KEY, JSON.stringify(showIntro));
    }, [showIntro, hasRestoredSession]);

    useEffect(() => {
        if (!conversation) return;
        const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
            setMessages(data.messages || []);
            const lastMessage = data.messages[data.messages.length - 1];
            
            if (lastMessage?.role === 'assistant') {
                if (lastMessage.tool_calls?.length > 0) {
                    const hasRunningTools = lastMessage.tool_calls.some(tc => tc.status === 'running' || tc.status === 'in_progress');
                    const hasCompletedTools = lastMessage.tool_calls.some(tc => tc.status === 'completed' || tc.status === 'success');
                    
                    // Progress through steps based on tool status
                    if (hasRunningTools && processingStep === 'searching') {
                        setProcessingStep('examining');
                    } else if (hasCompletedTools && processingStep === 'examining') {
                        setProcessingStep('deducing');
                    }
                }
                if (lastMessage.content) {
                    setProcessingStep('complete');
                    setTimeout(() => {
                        setProcessingStep(null);
                        setIsSending(false);
                    }, 800);
                }
            }
        });
        return () => unsubscribe();
    }, [conversation, processingStep]);

    useEffect(() => {
        if (!isSending) return;
        const timeout = setTimeout(() => {
            if (isSending) {
                setIsSending(false);
                setProcessingStep(null);
                // Only show timeout message if the last message is from user (no response received)
                setMessages(prev => {
                    const lastMsg = prev[prev.length - 1];
                    if (lastMsg?.role === 'user') {
                        return [...prev, {
                            role: 'assistant',
                            content: "Blast! The trail has gone cold, my friend. The archives seem unresponsive at the moment. Please try again - tap the send button to re-submit your question."
                        }];
                    }
                    return prev;
                });
            }
        }, 30000); // 30 seconds timeout for faster feedback
        return () => clearTimeout(timeout);
    }, [isSending]);

    const startNewChat = async (initialMessage) => {
        setIsLoading(true);
        setShowIntro(false);
        setIsSending(true);
        setProcessingStep('searching');
        
        try {
            const newConversation = await base44.agents.createConversation({
                agent_name: AGENT_NAME,
                metadata: { name: 'Ask SAL Chat' }
            });
            
            // Set conversation first so subscription can be established
            setConversation(newConversation);
            // Only show the user's actual message (not the date context)
            setMessages([{ role: 'user', content: initialMessage }]);
            setIsLoading(false);
            
            // Small delay to ensure subscription is established before sending message
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Prepend date + live odds context (hidden from user display)
            const oddsContext = await fetchLiveOddsContext();
            const messageWithContext = `[SYSTEM DATE CONTEXT - DO NOT REPEAT THIS TO USER: Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. Use "today" or "tomorrow" naturally in responses, not the full date.]${oddsContext}\n\n${initialMessage}`;
            await base44.agents.addMessage(newConversation, {
                role: 'user',
                content: messageWithContext,
            });
        } catch (error) {
            console.error("Failed to create conversation:", error);
            setIsLoading(false);
            setIsSending(false);
            setProcessingStep(null);
        }
    };

    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        const content = newMessage.trim();
        if (!content) return;

        if (!conversation) {
            setNewMessage('');
            await startNewChat(content);
            return;
        }

        setNewMessage('');
        // Only show the user's actual message in the UI
        setMessages(prev => [...prev, { role: 'user', content }]);
        setIsSending(true);
        setProcessingStep('searching');

        try {
            // Prepend date + live odds context (hidden from user display)
            const oddsContext = await fetchLiveOddsContext();
            const messageWithContext = `[SYSTEM DATE CONTEXT - DO NOT REPEAT THIS TO USER: Today is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. Use "today" or "tomorrow" naturally in responses, not the full date.]${oddsContext}\n\n${content}`;
            await base44.agents.addMessage(conversation, {
                role: 'user',
                content: messageWithContext,
            });
        } catch (error) {
            console.error("Failed to send message:", error);
            setIsSending(false);
            setProcessingStep(null);
        }
    };

    // Intro Screen - "Ask S.A.L."
    if (showIntro && messages.length === 0 && !isLoading) {
        return (
            <div className="overflow-x-hidden">
                <div className="max-w-6xl mx-auto w-full">
                    <div className="w-full flex justify-start mb-2">
                        <Link to={createPageUrl('Dashboard')}>
                            <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 -ml-4">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Dashboard
                            </Button>
                        </Link>
                    </div>

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4"
                    >
                        {/* Animated Owl */}
                        <motion.div
                            className="relative mb-8"
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <div className="absolute -inset-4 bg-gradient-to-r from-purple-500 via-cyan-500 to-lime-500 rounded-3xl blur-2xl opacity-40" />
                            <video 
                                src={ANIMATED_OWL_VIDEO}
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="relative w-32 h-32 md:w-40 md:h-40 rounded-3xl object-cover border-2 border-purple-400/50 shadow-2xl"
                            />
                        </motion.div>

                        {/* Title */}
                        <h1 className="text-3xl md:text-4xl font-black mb-3">
                            <span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-lime-400 bg-clip-text text-transparent">
                                Ask S.A.L.
                            </span>
                        </h1>
                        <p className="text-slate-400 text-lg mb-8 max-w-md">
                            Greetings, my curious friend! What sporting mystery shall we unravel together today?
                        </p>

                        {/* Input */}
                        <div className="w-full max-w-lg">
                            <form onSubmit={handleSendMessage} className="relative">
                                <Textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="State your case... What do you wish to know?"
                                    className="bg-slate-800/80 border-2 border-purple-500/30 rounded-xl pr-14 text-base focus:ring-purple-500 focus:border-purple-500 min-h-[80px] resize-none"
                                    rows={3}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage(e);
                                        }
                                    }}
                                />
                                <Button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="absolute right-3 bottom-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-slate-600 disabled:to-slate-700 rounded-xl"
                                    size="sm"
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </form>
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    // Chat Screen with Processing Steps
    return (
        <div className="overflow-x-hidden">
            <div className="max-w-6xl mx-auto w-full">
                <div className="w-full flex justify-start mb-2">
                    <Link to={createPageUrl('Dashboard')}>
                        <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 -ml-4">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Dashboard
                        </Button>
                    </Link>
                </div>

                {/* Chat Section */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative min-h-[600px] rounded-2xl overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-cyan-500 to-lime-500 rounded-2xl p-[2px]">
                        <div className="absolute inset-[2px] bg-slate-900 rounded-2xl" />
                    </div>
                    
                    <div className="relative h-full flex flex-col rounded-2xl overflow-hidden border border-transparent bg-slate-900/80 backdrop-blur-sm min-h-[600px]">
                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-6">
                            {isLoading && (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto" />
                                        <p className="text-slate-400 mt-4">The game is afoot...</p>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                <AnimatePresence>
                                    {messages.map((msg, index) => (
                                        <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                            <MessageBubble message={msg} />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                
                                {/* Processing Steps UI - Always show when sending */}
                                {isSending && processingStep && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        <ProcessingSteps currentStep={processingStep} />
                                    </motion.div>
                                )}
                                
                                <div ref={messagesEndRef} />
                            </div>
                        </div>

                        {/* Input Area */}
                        <div className="p-3 md:p-4 border-t border-white/10 bg-slate-900/80">
                            <form onSubmit={handleSendMessage} className="relative">
                                <Textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Present your next case to S.A.L..."
                                    className="bg-slate-800/80 border-slate-700 rounded-xl pr-20 text-sm focus:ring-purple-500 focus:border-purple-500 min-h-[50px] resize-none"
                                    rows={2}
                                    disabled={isLoading || isSending}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage(e);
                                        }
                                    }}
                                />
                                <Button
                                    type="submit"
                                    disabled={!newMessage.trim() || isSending || isLoading}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-slate-600 disabled:to-slate-700 rounded-xl px-3"
                                    size="sm"
                                >
                                    {isSending || isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </Button>
                            </form>
                        </div>
                    </div>
                </motion.div>
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


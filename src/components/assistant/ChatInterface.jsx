import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Loader2, Sparkles, MessageCircle, Lightbulb, TrendingUp, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import MessageBubble from './MessageBubble';
import { motion, AnimatePresence } from 'framer-motion';

const quickPrompts = [
  { icon: TrendingUp, text: "What are today's best bets?", color: "from-green-500 to-emerald-600" },
  { icon: Users, text: "Compare two players for me", color: "from-blue-500 to-cyan-600" },
  { icon: Lightbulb, text: "Explain parlays to a beginner", color: "from-purple-500 to-pink-600" },
  { icon: MessageCircle, text: "Analyze tonight's NBA games", color: "from-orange-500 to-red-600" },
];

export default function ChatInterface({ conversationId, agentName }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [conversation, setConversation] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (!conversationId) {
            setIsLoading(false);
            setMessages([]);
            setConversation(null);
            return;
        }

        setIsLoading(true);

        base44.agents.getConversation(conversationId)
            .then(conv => {
                setConversation(conv);
                setMessages(conv.messages || []);
                setIsLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch conversation:", err);
                setIsLoading(false);
            });

        const unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
            setMessages(data.messages || []);
            const lastMessage = data.messages[data.messages.length - 1];
            if (lastMessage.role === 'assistant' && lastMessage.content) {
              setIsSending(false);
            }
        });

        return () => unsubscribe();
    }, [conversationId]);

    const handleSendMessage = async (e, promptText = null) => {
        if (e) e.preventDefault();
        const content = (promptText || newMessage).trim();
        if (!content || !conversation) return;

        setNewMessage('');
        setIsSending(true);

        try {
            await base44.agents.addMessage(conversation, {
                role: 'user',
                content: content,
            });
        } catch (error) {
            console.error("Failed to send message:", error);
            setIsSending(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <div className="relative inline-block">
                        <div className="absolute inset-0 bg-purple-500 rounded-full blur-xl opacity-30 animate-pulse" />
                        <Loader2 className="relative w-12 h-12 text-purple-400 animate-spin" />
                    </div>
                    <p className="text-slate-400 mt-4">Loading conversation...</p>
                </div>
            </div>
        );
    }
    
    if (!conversationId) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 overflow-auto">
                {/* S.A.L. Introduction */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    transition={{ type: 'spring', duration: 0.6 }}
                    className="relative mb-8"
                >
                    {/* Animated rings */}
                    <div className="absolute inset-0 -m-8">
                        <div className="absolute inset-0 border-2 border-purple-500/20 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
                        <div className="absolute inset-2 border-2 border-cyan-500/20 rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
                        <div className="absolute inset-4 border-2 border-lime-500/20 rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />
                    </div>
                    
                    {/* Owl image */}
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-cyan-500 to-lime-500 rounded-3xl blur-2xl opacity-40" />
                        <img 
                            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/e6d91dd0c_AfriendlyrobotowlmascotwithpurpleandlimegreenaccentswearingstylishglassesholdinganopenglowingbookwithalightbulbaboveitsheadSportswhistlearoundneckModernvectorstyledarkbackgrou.jpg"
                            alt="S.A.L. the Owl - Sports AI Librarian"
                            className="relative w-32 h-32 rounded-3xl object-cover shadow-2xl border-2 border-purple-500/50"
                        />
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <h2 className="text-3xl font-black mb-2">
                        <span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-lime-400 bg-clip-text text-transparent">
                            Welcome to S.A.L.
                        </span>
                    </h2>
                    <p className="text-slate-300 text-lg mb-2">Sports AI Librarian</p>
                    <p className="text-slate-500 max-w-md mb-8">
                        I'm your AI-powered sports betting assistant. Ask me about predictions, 
                        player stats, team analysis, or betting strategies!
                    </p>
                </motion.div>

                {/* Quick Prompts */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="w-full max-w-lg"
                >
                    <p className="text-slate-500 text-sm mb-4 flex items-center justify-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        Start a new chat and try asking:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {quickPrompts.map((prompt, idx) => (
                            <motion.button
                                key={idx}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.6 + idx * 0.1 }}
                                className={`group p-4 rounded-xl bg-gradient-to-r ${prompt.color} bg-opacity-10 border border-white/10 hover:border-white/30 transition-all text-left`}
                                onClick={() => {
                                    // Can't send without conversation, just show the text
                                    setNewMessage(prompt.text);
                                }}
                            >
                                <div className="flex items-start gap-3">
                                    <prompt.icon className="w-5 h-5 text-white/80 mt-0.5" />
                                    <span className="text-white/90 text-sm font-medium">{prompt.text}</span>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.length === 0 && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-8"
                    >
                        <div className="inline-flex items-center gap-2 bg-purple-500/20 border border-purple-500/30 rounded-full px-4 py-2 mb-4">
                            <Sparkles className="w-4 h-4 text-purple-400" />
                            <span className="text-purple-300 text-sm">New Conversation Started</span>
                        </div>
                        <p className="text-slate-500 text-sm">Ask S.A.L. anything about sports betting!</p>
                    </motion.div>
                )}
                
                <AnimatePresence>
                    {messages.map((msg, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <MessageBubble message={msg} />
                        </motion.div>
                    ))}
                </AnimatePresence>
                
                {isSending && messages[messages.length - 1]?.role === 'user' && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-start gap-3"
                    >
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center flex-shrink-0">
                            <img 
                                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/e6d91dd0c_AfriendlyrobotowlmascotwithpurpleandlimegreenaccentswearingstylishglassesholdinganopenglowingbookwithalightbulbaboveitsheadSportswhistlearoundneckModernvectorstyledarkbackgrou.jpg"
                                alt="S.A.L."
                                className="w-full h-full rounded-xl object-cover"
                            />
                        </div>
                        <div className="bg-slate-800 rounded-2xl rounded-tl-sm px-4 py-3">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-lime-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                <span className="text-slate-400 text-sm ml-2">S.A.L. is thinking...</span>
                            </div>
                        </div>
                    </motion.div>
                )}
                
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/10 bg-slate-900/80 backdrop-blur-sm">
                <form onSubmit={handleSendMessage} className="relative">
                    <div className="relative">
                        <Textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Ask S.A.L. about predictions, stats, or betting advice..."
                            className="bg-slate-800/80 border-slate-700 rounded-xl pr-24 text-base focus:ring-purple-500 focus:border-purple-500 min-h-[60px] resize-none"
                            rows={2}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage(e);
                                }
                            }}
                        />
                        <Button
                            type="submit"
                            disabled={!newMessage.trim() || isSending}
                            className="absolute right-3 top-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-slate-600 disabled:to-slate-700 rounded-xl px-4"
                            size="lg"
                        >
                            {isSending ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                </>
                            )}
                        </Button>
                    </div>
                    <p className="text-slate-600 text-xs mt-2 text-center">
                        Press Enter to send • Shift+Enter for new line
                    </p>
                </form>
            </div>
        </div>
    );
}
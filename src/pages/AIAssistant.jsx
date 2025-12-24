import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Loader2, Sparkles, Brain, Zap, Trophy, TrendingUp, Users, Lightbulb, MessageCircle, BookOpen, Newspaper, RefreshCw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import MessageBubble from '@/components/assistant/MessageBubble';
import AnimatedSAL3D from '@/components/assistant/AnimatedSAL3D';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import RequireAuth from '@/components/auth/RequireAuth';



const AGENT_NAME = 'bettingAssistant';

const quickPrompts = [
  { icon: TrendingUp, text: "What are today's best bets?", color: "from-emerald-500 to-cyan-600" },
  { icon: Users, text: "Compare two players for me", color: "from-blue-500 to-purple-600" },
  { icon: Lightbulb, text: "Explain parlays to a beginner", color: "from-purple-500 to-pink-600" },
  { icon: MessageCircle, text: "Analyze tonight's NBA games", color: "from-orange-500 to-red-600" },
];

function SALHubPage() {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [conversation, setConversation] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (!conversation) return;
        const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
            setMessages(data.messages || []);
            const lastMessage = data.messages[data.messages.length - 1];
            if (lastMessage?.role === 'assistant' && lastMessage.content) {
                setIsSending(false);
            }
        });
        return () => unsubscribe();
    }, [conversation?.id]);

    useEffect(() => {
        if (!isSending) return;
        const timeout = setTimeout(() => {
            if (isSending) {
                setIsSending(false);
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: "I'm having trouble getting a response right now. Please try again."
                }]);
            }
        }, 60000);
        return () => clearTimeout(timeout);
    }, [isSending]);

    const startNewChat = async (initialMessage = null) => {
        setIsLoading(true);
        try {
            const newConversation = await base44.agents.createConversation({
                agent_name: AGENT_NAME,
                metadata: { name: 'Chat' }
            });
            setConversation(newConversation);
            setMessages([]);
            setIsLoading(false);
            
            if (initialMessage) {
                setMessages([{ role: 'user', content: initialMessage }]);
                setIsSending(true);
                await base44.agents.addMessage(newConversation, {
                    role: 'user',
                    content: initialMessage,
                });
            }
        } catch (error) {
            console.error("Failed to create conversation:", error);
            setIsLoading(false);
        }
    };

    const handleSendMessage = async (e, promptText = null) => {
        if (e) e.preventDefault();
        const content = (promptText || newMessage).trim();
        if (!content) return;

        if (!conversation) {
            setNewMessage('');
            await startNewChat(content);
            return;
        }

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

    const handleQuickPrompt = (promptText) => {
        handleSendMessage(null, promptText);
    };

    return (
        <div className="overflow-x-hidden">
            <div className="max-w-6xl mx-auto w-full">
                {/* Back Button */}
                <div className="w-full flex justify-start mb-2">
                    <Link to={createPageUrl('Dashboard')}>
                        <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 -ml-4">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Dashboard
                        </Button>
                    </Link>
                </div>

                {/* Hero Header with S.A.L. */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 bg-gradient-to-br from-purple-900/40 via-slate-900/60 to-cyan-900/40 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-purple-500/20"
                >
                    <div className="flex items-center gap-4">
                        <div className="relative flex-shrink-0">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-cyan-500 to-lime-500 rounded-2xl blur-xl opacity-50 animate-pulse" />
                            <img 
                                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/e6d91dd0c_AfriendlyrobotowlmascotwithpurpleandlimegreenaccentswearingstylishglassesholdinganopenglowingbookwithalightbulbaboveitsheadSportswhistlearoundneckModernvectorstyledarkbackgrou.jpg"
                                alt="S.A.L. the Owl"
                                className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover border-2 border-purple-500/50 shadow-2xl"
                            />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black">
                                <span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-lime-400 bg-clip-text text-transparent">
                                    S.A.L. Hub
                                </span>
                            </h1>
                            <p className="text-slate-400 text-sm md:text-base">Your Sports AI Librarian • Chat, Learn & Connect</p>
                        </div>
                    </div>
                    
                    {/* Feature badges */}
                    <div className="flex flex-wrap items-center gap-2 mt-4">
                        <div className="flex items-center gap-1.5 bg-purple-500/20 border border-purple-500/30 rounded-full px-3 py-1">
                            <Brain className="w-3 h-3 text-purple-400" />
                            <span className="text-purple-300 text-xs font-medium">AI Chat</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-cyan-500/20 border border-cyan-500/30 rounded-full px-3 py-1">
                            <BookOpen className="w-3 h-3 text-cyan-400" />
                            <span className="text-cyan-300 text-xs font-medium">Lessons</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-lime-500/20 border border-lime-500/30 rounded-full px-3 py-1">
                            <Users className="w-3 h-3 text-lime-400" />
                            <span className="text-lime-300 text-xs font-medium">Community</span>
                        </div>
                    </div>
                </motion.div>

                {/* Chat Section */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative min-h-[500px] rounded-2xl overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-cyan-500 to-lime-500 rounded-2xl p-[2px]">
                        <div className="absolute inset-[2px] bg-slate-900 rounded-2xl" />
                    </div>
                    
                    <div className="relative h-full flex flex-col rounded-2xl overflow-hidden border border-transparent bg-slate-900/80 backdrop-blur-sm min-h-[500px]">
                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-6">
                            <AnimatePresence>
                                {messages.length === 0 && !isLoading && !isSending && (
                                    <motion.div
                                        key="sal-intro"
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <AnimatedSAL3D 
                                            onPromptClick={(text) => handleQuickPrompt(text)} 
                                            isExiting={false}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {isLoading && (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto" />
                                        <p className="text-slate-400 mt-4">Starting conversation...</p>
                                    </div>
                                </div>
                            )}

                            {messages.length > 0 && (
                                <div className="space-y-4">
                                    <AnimatePresence>
                                        {messages.map((msg, index) => (
                                            <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                                <MessageBubble message={msg} />
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                    
                                    {isSending && messages[messages.length - 1]?.role === 'user' && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-3">
                                            <img 
                                                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/e6d91dd0c_AfriendlyrobotowlmascotwithpurpleandlimegreenaccentswearingstylishglassesholdinganopenglowingbookwithalightbulbaboveitsheadSportswhistlearoundneckModernvectorstyledarkbackgrou.jpg"
                                                alt="S.A.L."
                                                className="h-8 w-8 rounded-full object-cover flex-shrink-0 border border-purple-500/50"
                                            />
                                            <div className="bg-slate-800/80 border border-white/10 rounded-2xl rounded-bl-lg px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                                                    <span className="text-slate-400 text-sm">Searching for sports data...</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                    
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-3 md:p-4 border-t border-white/10 bg-slate-900/80">
                            <form onSubmit={handleSendMessage} className="relative">
                                <Textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Ask S.A.L. anything about sports betting..."
                                    className="bg-slate-800/80 border-slate-700 rounded-xl pr-20 text-sm focus:ring-purple-500 focus:border-purple-500 min-h-[50px] resize-none"
                                    rows={2}
                                    disabled={isLoading}
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

export default function AIAssistant() {
    return (
        <RequireAuth pageName="S.A.L. Hub">
            <SALHubPage />
        </RequireAuth>
    );
}
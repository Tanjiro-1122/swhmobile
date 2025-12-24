import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Loader2, Sparkles, Brain, Zap, Trophy, TrendingUp, Users, Lightbulb, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import MessageBubble from '@/components/assistant/MessageBubble';
import { motion, AnimatePresence } from 'framer-motion';

const AGENT_NAME = 'bettingAssistant';

const quickPrompts = [
  { icon: TrendingUp, text: "What are today's best bets?", color: "from-emerald-500 to-cyan-600" },
  { icon: Users, text: "Compare two players for me", color: "from-blue-500 to-purple-600" },
  { icon: Lightbulb, text: "Explain parlays to a beginner", color: "from-purple-500 to-pink-600" },
  { icon: MessageCircle, text: "Analyze tonight's NBA games", color: "from-orange-500 to-red-600" },
];

export default function AIAssistantPage() {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [conversation, setConversation] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Subscribe to conversation updates when we have one
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

    const startNewChat = async (initialMessage = null) => {
        setIsLoading(true);
        try {
            const newConversation = await base44.agents.createConversation({
                agent_name: AGENT_NAME,
                metadata: { name: 'Chat' }
            });
            setConversation(newConversation);
            setMessages([]);
            
            // If there's an initial message, send it
            if (initialMessage) {
                setIsSending(true);
                await base44.agents.addMessage(newConversation, {
                    role: 'user',
                    content: initialMessage,
                });
            }
        } catch (error) {
            console.error("Failed to create conversation:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async (e, promptText = null) => {
        if (e) e.preventDefault();
        const content = (promptText || newMessage).trim();
        if (!content) return;

        // If no conversation exists, start one with this message
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
        <div className="min-h-[calc(100vh-150px)] flex flex-col">
            {/* Hero Header */}
            <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-6"
            >
                <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-cyan-500 to-lime-500 rounded-2xl blur-xl opacity-50 animate-pulse" />
                        <img 
                            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/e6d91dd0c_AfriendlyrobotowlmascotwithpurpleandlimegreenaccentswearingstylishglassesholdinganopenglowingbookwithalightbulbaboveitsheadSportswhistlearoundneckModernvectorstyledarkbackgrou.jpg"
                            alt="S.A.L. the Owl"
                            className="relative w-20 h-20 rounded-2xl object-cover border-2 border-purple-500/50 shadow-2xl"
                        />
                    </div>
                    <div className="text-left">
                        <h1 className="text-3xl sm:text-4xl font-black">
                            <span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-lime-400 bg-clip-text text-transparent">
                                S.A.L. the Owl
                            </span>
                        </h1>
                        <p className="text-slate-400 text-lg">Your Sports AI Librarian</p>
                    </div>
                </div>
                
                {/* Feature badges */}
                <div className="flex flex-wrap items-center justify-center gap-3">
                    <div className="flex items-center gap-2 bg-purple-500/20 border border-purple-500/30 rounded-full px-4 py-1.5">
                        <Brain className="w-4 h-4 text-purple-400" />
                        <span className="text-purple-300 text-sm font-medium">AI-Powered</span>
                    </div>
                    <div className="flex items-center gap-2 bg-cyan-500/20 border border-cyan-500/30 rounded-full px-4 py-1.5">
                        <Zap className="w-4 h-4 text-cyan-400" />
                        <span className="text-cyan-300 text-sm font-medium">Real-Time Data</span>
                    </div>
                    <div className="flex items-center gap-2 bg-lime-500/20 border border-lime-500/30 rounded-full px-4 py-1.5">
                        <Trophy className="w-4 h-4 text-lime-400" />
                        <span className="text-lime-300 text-sm font-medium">Expert Insights</span>
                    </div>
                </div>
            </motion.div>

            {/* Main Chat Container */}
            <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="relative flex-1 min-h-[500px] rounded-2xl overflow-hidden"
            >
                {/* Gradient border effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-cyan-500 to-lime-500 rounded-2xl p-[2px]">
                    <div className="absolute inset-[2px] bg-slate-900 rounded-2xl" />
                </div>
                
                {/* Content */}
                <div className="relative h-full flex flex-col rounded-2xl overflow-hidden border border-transparent bg-slate-900/80 backdrop-blur-sm">
                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {/* Welcome screen when no messages */}
                        {messages.length === 0 && !isLoading && (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.8 }} 
                                    animate={{ opacity: 1, scale: 1 }} 
                                    className="relative mb-8"
                                >
                                    <div className="absolute inset-0 -m-8">
                                        <div className="absolute inset-0 border-2 border-purple-500/20 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
                                        <div className="absolute inset-2 border-2 border-cyan-500/20 rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
                                    </div>
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-cyan-500 to-lime-500 rounded-3xl blur-2xl opacity-40" />
                                        <img 
                                            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/e6d91dd0c_AfriendlyrobotowlmascotwithpurpleandlimegreenaccentswearingstylishglassesholdinganopenglowingbookwithalightbulbaboveitsheadSportswhistlearoundneckModernvectorstyledarkbackgrou.jpg"
                                            alt="S.A.L."
                                            className="relative w-28 h-28 rounded-3xl object-cover shadow-2xl border-2 border-purple-500/50"
                                        />
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <h2 className="text-2xl font-black mb-2">
                                        <span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-lime-400 bg-clip-text text-transparent">
                                            Ready to Help!
                                        </span>
                                    </h2>
                                    <p className="text-slate-500 max-w-md mb-6">
                                        Ask me about predictions, player stats, team analysis, or betting strategies.
                                    </p>
                                </motion.div>

                                {/* Quick Prompts - Now clickable */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                    className="w-full max-w-lg"
                                >
                                    <p className="text-slate-600 text-sm mb-4">Try asking:</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {quickPrompts.map((prompt, idx) => (
                                            <motion.button
                                                key={idx}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.6 + idx * 0.1 }}
                                                onClick={() => handleQuickPrompt(prompt.text)}
                                                className={`group p-4 rounded-xl bg-gradient-to-r ${prompt.color} hover:scale-105 transition-all text-left shadow-lg`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <prompt.icon className="w-5 h-5 text-white mt-0.5" />
                                                    <span className="text-white text-sm font-medium">{prompt.text}</span>
                                                </div>
                                            </motion.button>
                                        ))}
                                    </div>
                                </motion.div>
                            </div>
                        )}

                        {/* Loading state */}
                        {isLoading && (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center">
                                    <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto" />
                                    <p className="text-slate-400 mt-4">Starting conversation...</p>
                                </div>
                            </div>
                        )}

                        {/* Messages */}
                        {messages.length > 0 && (
                            <div className="space-y-6">
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
                        )}
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
                                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:from-slate-600 disabled:to-slate-700 rounded-xl px-4"
                                    size="lg"
                                >
                                    {isSending || isLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Send className="w-5 h-5" />
                                    )}
                                </Button>
                            </div>
                            <p className="text-slate-600 text-xs mt-2 text-center">
                                Press Enter to send • Shift+Enter for new line
                            </p>
                        </form>
                    </div>
                </div>
            </motion.div>

            {/* Bottom tips */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-4 text-center"
            >
                <p className="text-slate-500 text-sm">
                    <Sparkles className="w-4 h-4 inline mr-1 text-purple-400" />
                    Ask about predictions, player stats, team analysis, or betting strategies
                </p>
            </motion.div>
        </div>
    );
}
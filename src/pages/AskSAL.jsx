import React, { useState, useEffect, useRef } from 'react';
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

function AskSALPage() {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [conversation, setConversation] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [processingStep, setProcessingStep] = useState(null);
    const [showIntro, setShowIntro] = useState(true);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

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
    }, [conversation?.id, processingStep]);

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
                            content: "Blast! The trail has gone cold, my friend. The archives seem unresponsive at the moment. Shall we attempt another investigation?"
                        }];
                    }
                    return prev;
                });
            }
        }, 45000); // Reduced to 45 seconds for faster feedback
        return () => clearTimeout(timeout);
    }, [isSending]);

    // Helper to get formatted date context
    const getDateContext = () => {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const today = now.toLocaleDateString('en-US', options);
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toLocaleDateString('en-US', options);
        return `[CURRENT DATE CONTEXT: Today is ${today}. Tomorrow is ${tomorrowStr}.]`;
    };

    const startNewChat = async (initialMessage) => {
        setIsLoading(true);
        setShowIntro(false);
        try {
            const newConversation = await base44.agents.createConversation({
                agent_name: AGENT_NAME,
                metadata: { name: 'Ask SAL Chat' }
            });
            setConversation(newConversation);
            setMessages([{ role: 'user', content: initialMessage }]);
            setIsLoading(false);
            setIsSending(true);
            setProcessingStep('searching');
            
            // Prepend date context to help AI know current date
            const messageWithContext = `${getDateContext()}\n\nUser question: ${initialMessage}`;
            await base44.agents.addMessage(newConversation, {
                role: 'user',
                content: messageWithContext,
            });
        } catch (error) {
            console.error("Failed to create conversation:", error);
            setIsLoading(false);
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
        setMessages(prev => [...prev, { role: 'user', content }]);
        setIsSending(true);
        setProcessingStep('searching');

        try {
            // Prepend date context to help AI know current date
            const messageWithContext = `${getDateContext()}\n\nUser question: ${content}`;
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

                            {messages.length > 0 ? (
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
                            ) : isSending && processingStep ? (
                                <div className="space-y-4">
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                        <ProcessingSteps currentStep={processingStep} />
                                    </motion.div>
                                    <div ref={messagesEndRef} />
                                </div>
                            ) : null}
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
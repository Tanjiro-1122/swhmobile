import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Send, Loader2, Brain, Users, BookOpen, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import MessageBubble from '@/components/assistant/MessageBubble';
import AnimatedSAL3D from '@/components/assistant/AnimatedSAL3D';
import ProcessingSteps from '@/components/assistant/ProcessingSteps';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import RequireAuth from '@/components/auth/RequireAuth';

const ANIMATED_OWL_VIDEO = 'https://i.imgur.com/U6Qr1lM.mp4';



const AGENT_NAME = 'bettingAssistant';

function SALHubPage() {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [conversation, setConversation] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [processingStep, setProcessingStep] = useState(null); // 'gathering' | 'analyzing' | 'complete'
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (!conversation) return;
        const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
            setMessages(data.messages || []);
            const lastMessage = data.messages[data.messages.length - 1];
            
            // Check for tool calls to determine processing step
            if (lastMessage?.role === 'assistant') {
                if (lastMessage.tool_calls?.length > 0) {
                    const hasCompletedTools = lastMessage.tool_calls.some(tc => tc.status === 'completed' || tc.status === 'success');
                    if (hasCompletedTools && processingStep === 'gathering') {
                        setProcessingStep('analyzing');
                    }
                }
                if (lastMessage.content) {
                    setProcessingStep('complete');
                    setTimeout(() => {
                        setProcessingStep(null);
                        setIsSending(false);
                    }, 500);
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
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: "Blast! The trail has gone cold, my friend. The archives seem unresponsive at the moment. Shall we attempt another investigation?"
                }]);
            }
        }, 90000);
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
                setProcessingStep('gathering');
                await base44.agents.addMessage(newConversation, {
                    role: 'user',
                    content: initialMessage,
                });
            }
        } catch (error) {
            console.error("Failed to create conversation:", error);
            setIsLoading(false);
            setProcessingStep(null);
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
        setProcessingStep('gathering');

        try {
            await base44.agents.addMessage(conversation, {
                role: 'user',
                content: content,
            });
        } catch (error) {
            console.error("Failed to send message:", error);
            setIsSending(false);
            setProcessingStep(null);
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
                            <video 
                                src={ANIMATED_OWL_VIDEO}
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover border-2 border-purple-500/50 shadow-2xl"
                            />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black">
                                <span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-lime-400 bg-clip-text text-transparent">
                                    S.A.L. the Detective
                                </span>
                            </h1>
                            <p className="text-slate-400 text-sm md:text-base">Your Sports AI Librarian • The game is afoot!</p>
                        </div>
                    </div>
                    
                    {/* Feature badges */}
                    <div className="flex flex-wrap items-center gap-2 mt-4">
                        <div className="flex items-center gap-1.5 bg-purple-500/20 border border-purple-500/30 rounded-full px-3 py-1">
                            <Brain className="w-3 h-3 text-purple-400" />
                            <span className="text-purple-300 text-xs font-medium">Deductive AI</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-cyan-500/20 border border-cyan-500/30 rounded-full px-3 py-1">
                            <BookOpen className="w-3 h-3 text-cyan-400" />
                            <span className="text-cyan-300 text-xs font-medium">Live Archives</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-lime-500/20 border border-lime-500/30 rounded-full px-3 py-1">
                            <Users className="w-3 h-3 text-lime-400" />
                            <span className="text-lime-300 text-xs font-medium">Expert Analysis</span>
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
                            {messages.length === 0 && !isLoading && (
                                <AnimatedSAL3D onPromptClick={(text) => handleQuickPrompt(text)} />
                            )}

                            {isLoading && (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto" />
                                        <p className="text-slate-400 mt-4">Preparing the investigation...</p>
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
                                    
                                    {/* Processing Steps UI */}
                                    {isSending && processingStep && messages[messages.length - 1]?.role === 'user' && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                            <ProcessingSteps currentStep={processingStep} />
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

export default function AIAssistant() {
    return (
        <RequireAuth pageName="S.A.L. Hub">
            <SALHubPage />
        </RequireAuth>
    );
}
import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Bot, Send, Loader2, BrainCircuit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import MessageBubble from './MessageBubble';
import { motion } from 'framer-motion';

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
            // If the last message is from assistant and it's not a tool call, it means it's done generating.
            const lastMessage = data.messages[data.messages.length - 1];
            if (lastMessage.role === 'assistant' && lastMessage.content) {
              setIsSending(false);
            }
        });

        return () => unsubscribe();
    }, [conversationId]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !conversation) return;

        const content = newMessage.trim();
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
            // Optionally, show an error to the user
        }
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }
    
    if (!conversationId) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}>
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center mb-6 shadow-2xl shadow-indigo-600/30">
                        <BrainCircuit className="w-12 h-12 text-indigo-100" />
                    </div>
                </motion.div>
                <motion.h2 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="text-3xl font-bold text-white mb-2">
                    AI Betting Assistant
                </motion.h2>
                <motion.p 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                    className="text-slate-400 max-w-md">
                    Select a chat or start a new one to get AI-powered betting insights, predictions, and analysis.
                </motion.p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((msg, index) => (
                    <MessageBubble key={index} message={msg} />
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-white/10 bg-slate-900/50">
                <form onSubmit={handleSendMessage} className="relative">
                    <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Ask for predictions, player stats, or betting advice..."
                        className="bg-slate-800 border-slate-700 rounded-lg pr-28 text-base focus:ring-indigo-500"
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600"
                        size="lg"
                    >
                        {isSending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </Button>
                </form>
            </div>
        </div>
    );
}
import React, { useState } from 'react';
import ConversationList from '@/components/assistant/ConversationList';
import ChatInterface from '@/components/assistant/ChatInterface';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { PanelLeftClose, PanelLeftOpen, Sparkles, Brain, Zap, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlatform } from '@/components/hooks/usePlatform';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const AGENT_NAME = 'bettingAssistant';

export default function AIAssistantPage() {
    const [selectedConversationId, setSelectedConversationId] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const queryClient = useQueryClient();
    const { isMobileScreen } = usePlatform();

    const handleNewConversation = async () => {
        try {
            const newConversation = await base44.agents.createConversation({
                agent_name: AGENT_NAME,
                metadata: { name: 'New Chat' }
            });
            await queryClient.invalidateQueries(['agentConversations', AGENT_NAME]);
            setSelectedConversationId(newConversation.id);
            if(isMobileScreen) setSidebarOpen(false);
        } catch (error) {
            console.error("Failed to create new conversation:", error);
        }
    };
    
    const handleConversationSelect = (id) => {
        setSelectedConversationId(id);
        if(isMobileScreen) setSidebarOpen(false);
    }

    return (
        <div className="min-h-[calc(100vh-150px)]">
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
                <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
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
                className="relative h-[calc(100vh-320px)] min-h-[500px] rounded-2xl overflow-hidden"
            >
                {/* Gradient border effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-cyan-500 to-lime-500 rounded-2xl p-[2px]">
                    <div className="absolute inset-[2px] bg-slate-900 rounded-2xl" />
                </div>
                
                {/* Content */}
                <div className="relative h-full flex rounded-2xl overflow-hidden border border-transparent">
                    {isMobileScreen && (
                        <Button 
                            variant="ghost"
                            size="icon"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="absolute top-2 left-2 z-20 text-white bg-slate-800/80 hover:bg-slate-700"
                        >
                            {sidebarOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
                        </Button>
                    )}

                    {/* Sidebar */}
                    <div className={cn(
                        "transition-all duration-300 bg-slate-900/95 backdrop-blur-sm",
                        isMobileScreen 
                            ? `absolute top-0 left-0 h-full z-10 ${sidebarOpen ? 'w-72' : 'w-0'}`
                            : "w-80 border-r border-white/10"
                    )}>
                        <ConversationList
                            agentName={AGENT_NAME}
                            selectedConversationId={selectedConversationId}
                            onConversationSelect={handleConversationSelect}
                            onNewConversation={handleNewConversation}
                        />
                    </div>
                    
                    {/* Chat Area */}
                    <div className="flex-1 flex flex-col bg-slate-900/80 backdrop-blur-sm">
                        <ChatInterface conversationId={selectedConversationId} agentName={AGENT_NAME} />
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
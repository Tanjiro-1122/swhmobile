import React, { useState } from 'react';
import ConversationList from '@/components/assistant/ConversationList';
import ChatInterface from '@/components/assistant/ChatInterface';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlatform } from '@/components/hooks/usePlatform';
import { cn } from '@/lib/utils';

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
        <div className="h-[calc(100vh-100px)] flex bg-slate-900/50 border border-white/10 rounded-2xl overflow-hidden">
            {isMobileScreen && (
                 <Button 
                    variant="ghost"
                    size="icon"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="absolute top-2 left-2 z-20 text-white"
                >
                    {sidebarOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
                </Button>
            )}

            <div className={cn(
                "transition-all duration-300",
                isMobileScreen 
                    ? `absolute top-0 left-0 h-full z-10 ${sidebarOpen ? 'w-64' : 'w-0'}`
                    : "w-80"
            )}>
                 <ConversationList
                    agentName={AGENT_NAME}
                    selectedConversationId={selectedConversationId}
                    onConversationSelect={handleConversationSelect}
                    onNewConversation={handleNewConversation}
                />
            </div>
            
            <div className="flex-1 flex flex-col">
                <ChatInterface conversationId={selectedConversationId} agentName={AGENT_NAME} />
            </div>
        </div>
    );
}
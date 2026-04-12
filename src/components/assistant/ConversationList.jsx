import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MessageSquarePlus, BotMessageSquare, Loader2, ServerCrash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import moment from 'moment';

export default function ConversationList({ agentName, selectedConversationId, onConversationSelect, onNewConversation }) {
    const { data: conversations, isLoading, error } = useQuery({
        queryKey: ['agentConversations', agentName],
        queryFn: () => base44.agents.listConversations({ agent_name: agentName }),
        enabled: !!agentName,
        refetchInterval: 30000,
    });

    return (
        <div className="bg-slate-900/80 backdrop-blur-sm border-r border-white/10 h-full flex flex-col">
            <div className="p-4 border-b border-white/10">
                <Button onClick={onNewConversation} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white">
                    <MessageSquarePlus className="w-4 h-4 mr-2" />
                    New Chat
                </Button>
            </div>
            <div className="flex-1 overflow-y-auto">
                {isLoading && (
                    <div className="flex items-center justify-center p-6 text-slate-400">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        <span>Loading chats...</span>
                    </div>
                )}
                {error && (
                    <div className="p-6 text-red-400 text-center">
                        <ServerCrash className="w-6 h-6 mx-auto mb-2" />
                        <p className="font-semibold">Error loading chats</p>
                        <p className="text-xs">{error.message}</p>
                    </div>
                )}
                {conversations && conversations.length === 0 && (
                     <div className="p-6 text-center text-slate-400">
                        <BotMessageSquare className="w-8 h-8 mx-auto mb-2" />
                        <p className="font-semibold">No chats yet</p>
                        <p className="text-sm">Start a new chat to begin.</p>
                    </div>
                )}
                <nav className="p-2 space-y-1">
                    {conversations && conversations.map(conv => (
                        <button
                            key={conv.id}
                            onClick={() => onConversationSelect(conv.id)}
                            className={cn(
                                "w-full text-left p-3 rounded-lg transition-colors text-slate-300 hover:bg-white/10",
                                selectedConversationId === conv.id && "bg-indigo-600/50 text-white"
                            )}
                        >
                            <p className="font-semibold truncate">{conv.metadata?.name || 'New Conversation'}</p>
                            <p className="text-xs text-slate-400">{moment(conv.created_date).fromNow()}</p>
                        </button>
                    ))}
                </nav>
            </div>
        </div>
    );
}
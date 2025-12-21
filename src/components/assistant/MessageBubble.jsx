import React from 'react';
import ReactMarkdown from 'react-markdown';
import { User, CheckCircle2, AlertCircle, Loader2, Zap } from 'lucide-react';
import { cn } from "@/lib/utils";

const FunctionDisplay = ({ toolCall }) => {
    const name = toolCall?.name || 'Function';
    const status = toolCall?.status || 'pending';
    
    const statusConfig = {
        pending: { icon: Loader2, color: 'text-slate-400', spin: true },
        running: { icon: Loader2, color: 'text-blue-500', spin: true },
        in_progress: { icon: Loader2, color: 'text-blue-500', spin: true },
        completed: { icon: CheckCircle2, color: 'text-green-500', spin: false },
        success: { icon: CheckCircle2, color: 'text-green-500', spin: false },
        failed: { icon: AlertCircle, color: 'text-red-500', spin: false },
        error: { icon: AlertCircle, color: 'text-red-500', spin: false }
    }[status] || { icon: Zap, color: 'text-slate-500', spin: false };

    const Icon = statusConfig.icon;
    const formattedName = name.split('.').pop().replace(/_/g, ' ');

    return (
        <div className="mt-2 text-xs flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5">
            <Icon className={cn("h-4 w-4", statusConfig.color, statusConfig.spin && "animate-spin")} />
            <span className="text-slate-300 capitalize">{formattedName}</span>
        </div>
    );
};

export default function MessageBubble({ message }) {
    const isUser = message.role === 'user';
    const isAssistant = message.role === 'assistant';

    const renderableContent = message.content && typeof message.content === 'string' && message.content.trim() !== '';

    return (
        <div className={cn("flex gap-4", isUser ? "justify-end" : "justify-start")}>
            {isAssistant && (
                <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/e6d91dd0c_AfriendlyrobotowlmascotwithpurpleandlimegreenaccentswearingstylishglassesholdinganopenglowingbookwithalightbulbaboveitsheadSportswhistlearoundneckModernvectorstyledarkbackgrou.jpg"
                    alt="S.A.L."
                    className="h-8 w-8 rounded-full object-cover flex-shrink-0 mt-1 border border-purple-500/50"
                />
            )}
            <div className={cn("max-w-[90%] sm:max-w-[80%] flex flex-col", isUser && "items-end")}>
                {renderableContent && (
                    <div className={cn(
                        "rounded-2xl px-4 py-3",
                        isUser 
                            ? "bg-indigo-600 text-white rounded-br-lg" 
                            : "bg-slate-800/80 border border-white/10 text-slate-200 rounded-bl-lg"
                    )}>
                        <ReactMarkdown
                            className="prose prose-sm prose-invert max-w-none prose-p:my-0"
                            components={{
                                a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300" />,
                            }}
                        >
                            {message.content}
                        </ReactMarkdown>
                    </div>
                )}
                
                {message.tool_calls?.length > 0 && (
                    <div className="space-y-1 mt-2">
                        {message.tool_calls.map((toolCall, idx) => (
                            <FunctionDisplay key={idx} toolCall={toolCall} />
                        ))}
                    </div>
                )}
            </div>
             {isUser && (
                <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-5 h-5 text-slate-300" />
                </div>
            )}
        </div>
    );
}
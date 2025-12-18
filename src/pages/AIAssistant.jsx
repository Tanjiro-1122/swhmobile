import React from 'react';
import { Bot } from 'lucide-react';

export default function AIAssistantPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
            <Bot className="w-24 h-24 text-purple-400 mb-6" />
            <h1 className="text-4xl font-bold text-white mb-2">AI Assistant</h1>
            <p className="text-xl text-slate-400">Coming soon! An interactive AI to help you with your betting analysis.</p>
        </div>
    );
}
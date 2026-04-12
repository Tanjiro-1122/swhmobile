import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AIAssistantChat() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Create conversation on mount
    const initConversation = async () => {
      try {
        const conversation = await base44.agents.createConversation({
          agent_name: "bettingAssistant",
          metadata: {
            name: "Learning Center Chat",
            description: "AI Assistant helping with sports betting education"
          }
        });
        setConversationId(conversation.id);
        
        // Subscribe to updates
        const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
          setMessages(data.messages || []);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Failed to initialize conversation:", error);
      }
    };

    initConversation();
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !conversationId || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setIsLoading(true);

    try {
      const conversation = await base44.agents.getConversation(conversationId);
      await base44.agents.addMessage(conversation, {
        role: "user",
        content: userMessage
      });
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-2 border-purple-300 shadow-lg h-[600px] flex flex-col">
      <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-b-2 border-purple-400">
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-6 h-6" />
          AI Betting Assistant
          <Sparkles className="w-4 h-4 ml-auto animate-pulse" />
        </CardTitle>
        <p className="text-sm text-white/80 mt-1">Ask me anything about sports betting strategies, terms, or concepts!</p>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <Bot className="w-16 h-16 mx-auto mb-4 text-purple-600" />
                <p className="text-gray-600 font-semibold mb-2">Welcome to your AI Betting Assistant!</p>
                <p className="text-sm text-gray-500">Ask questions like:</p>
                <div className="mt-4 space-y-2 text-sm text-left max-w-md mx-auto">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    💡 "What is value betting?"
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    💡 "How do I calculate implied probability?"
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                    💡 "What's the best bankroll management strategy?"
                  </div>
                </div>
              </motion.div>
            ) : (
              messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {message.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  </div>
                  
                  {message.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </AnimatePresence>
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t-2 border-gray-200 p-4 bg-white">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask your betting question..."
              disabled={isLoading || !conversationId}
              className="flex-1 border-2 border-purple-300 focus:border-purple-500"
            />
            <Button
              type="submit"
              disabled={isLoading || !inputMessage.trim() || !conversationId}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
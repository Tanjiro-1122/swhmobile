import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, MessageSquare, Users, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function VIPDiscordCard() {
  const discordInviteUrl = "https://discord.gg/2TswBjam";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50 shadow-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 text-white p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black mb-1">VIP Discord Channel</CardTitle>
              <p className="text-sm text-purple-100">Exclusive access for VIP & Legacy members</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <Crown className="w-3 h-3 mr-1" />
                VIP ONLY
              </Badge>
              <Badge variant="outline" className="border-purple-300 text-purple-700">
                <Users className="w-3 h-3 mr-1" />
                Private Community
              </Badge>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-gray-900">Share Betting Strategies</div>
                  <div className="text-sm text-gray-600">Discuss picks and strategies with fellow VIP members</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-gray-900">Early Feature Access</div>
                  <div className="text-sm text-gray-600">Be the first to know about new tools and updates</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-gray-900">Priority Support</div>
                  <div className="text-sm text-gray-600">Get faster responses from our team</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-gray-900">Network with Sharp Bettors</div>
                  <div className="text-sm text-gray-600">Learn from experienced members</div>
                </div>
              </div>
            </div>

            <Button
              onClick={() => window.open(discordInviteUrl, '_blank')}
              className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 hover:from-purple-700 hover:via-indigo-700 hover:to-pink-700 text-white font-bold text-lg py-6 shadow-lg"
            >
              <MessageSquare className="w-5 h-5 mr-2" />
              Join VIP Discord Now
            </Button>

            <p className="text-xs text-center text-gray-500 mt-3">
              💬 Click above to join our exclusive Discord community
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, BellOff, TrendingUp, Trophy, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PushNotifications() {
  const [permission, setPermission] = useState("default");
  const [isSupported, setIsSupported] = useState(false);
  const [settings, setSettings] = useState({
    oddsChanges: true,
    gameStarts: true,
    dailyBestBets: true,
    aiPredictions: false
  });

  useEffect(() => {
    // Check if notifications are supported
    if ('Notification' in window && 'serviceWorker' in navigator) {
      setIsSupported(true);
      setPermission(Notification.permission);
      
      // Load saved settings
      const saved = localStorage.getItem('notificationSettings');
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) {
      alert('Push notifications are not supported in your browser');
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        // Subscribe to push notifications
        const registration = await navigator.serviceWorker.ready;
        
        // In a real app, you'd get a VAPID key from your server
        // For now, we'll just show local notifications
        showWelcomeNotification();
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const showWelcomeNotification = () => {
    if (permission === 'granted') {
      new Notification('🎉 Notifications Enabled!', {
        body: "You'll now receive alerts for odds changes, game starts, and daily best bets.",
        icon: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/4616ada62_image.png',
        badge: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/4616ada62_image.png',
        tag: 'welcome',
        requireInteraction: false
      });
    }
  };

  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('notificationSettings', JSON.stringify(newSettings));
  };

  const sendTestNotification = () => {
    if (permission === 'granted') {
      new Notification('🏀 Odds Alert!', {
        body: 'Lakers vs Celtics: Odds moved from -5.5 to -7.0 on DraftKings',
        icon: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/4616ada62_image.png',
        badge: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/4616ada62_image.png',
        tag: 'test'
      });
    }
  };

  if (!isSupported) {
    return (
      <Card className="border-yellow-300 bg-yellow-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-yellow-800">
            <BellOff className="w-6 h-6" />
            <div>
              <div className="font-bold">Notifications Not Supported</div>
              <div className="text-sm">Your browser doesn't support push notifications</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-purple-200">
      <CardHeader className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
        <CardTitle className="flex items-center gap-3">
          <Bell className="w-6 h-6" />
          Push Notifications
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Permission Status */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="font-bold text-gray-900">Notification Status</div>
            <div className="text-sm text-gray-600">
              {permission === 'granted' && '✅ Enabled'}
              {permission === 'denied' && '❌ Blocked'}
              {permission === 'default' && '⏳ Not enabled yet'}
            </div>
          </div>
          <Badge className={
            permission === 'granted' ? 'bg-green-500' :
            permission === 'denied' ? 'bg-red-500' :
            'bg-gray-400'
          }>
            {permission.toUpperCase()}
          </Badge>
        </div>

        {/* Enable Notifications */}
        {permission === 'default' && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Button
                onClick={requestPermission}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-6 text-lg font-bold"
              >
                <Bell className="w-5 h-5 mr-2" />
                Enable Push Notifications
              </Button>
            </motion.div>
          </AnimatePresence>
        )}

        {/* Notification Settings */}
        {permission === 'granted' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <div>
                  <Label htmlFor="odds-changes" className="font-bold text-gray-900">Odds Changes</Label>
                  <div className="text-sm text-gray-600">Alert when odds move significantly</div>
                </div>
              </div>
              <Switch
                id="odds-changes"
                checked={settings.oddsChanges}
                onCheckedChange={(checked) => updateSetting('oddsChanges', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-green-600" />
                <div>
                  <Label htmlFor="game-starts" className="font-bold text-gray-900">Game Start Reminders</Label>
                  <div className="text-sm text-gray-600">Notify 30min before games</div>
                </div>
              </div>
              <Switch
                id="game-starts"
                checked={settings.gameStarts}
                onCheckedChange={(checked) => updateSetting('gameStarts', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-orange-600" />
                <div>
                  <Label htmlFor="daily-bets" className="font-bold text-gray-900">Daily Best Bets</Label>
                  <div className="text-sm text-gray-600">Morning summary of top picks</div>
                </div>
              </div>
              <Switch
                id="daily-bets"
                checked={settings.dailyBestBets}
                onCheckedChange={(checked) => updateSetting('dailyBestBets', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-purple-600" />
                <div>
                  <Label htmlFor="ai-predictions" className="font-bold text-gray-900">AI Predictions</Label>
                  <div className="text-sm text-gray-600">New match analysis available</div>
                </div>
              </div>
              <Switch
                id="ai-predictions"
                checked={settings.aiPredictions}
                onCheckedChange={(checked) => updateSetting('aiPredictions', checked)}
              />
            </div>

            {/* Test Notification */}
            <Button
              onClick={sendTestNotification}
              variant="outline"
              className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <Bell className="w-4 h-4 mr-2" />
              Send Test Notification
            </Button>
          </div>
        )}

        {/* Denied State */}
        {permission === 'denied' && (
          <div className="p-4 bg-red-50 rounded-lg border border-red-200 text-red-800 text-sm">
            <div className="font-bold mb-2">⚠️ Notifications Blocked</div>
            <div>To enable notifications, please:</div>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Click the lock icon in your browser's address bar</li>
              <li>Find "Notifications" in the permissions</li>
              <li>Change it to "Allow"</li>
              <li>Reload this page</li>
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Utility functions to trigger notifications (export for use in other components)
export const sendOddsChangeNotification = (match, oldOdds, newOdds) => {
  if (Notification.permission === 'granted') {
    const settings = JSON.parse(localStorage.getItem('notificationSettings') || '{}');
    if (settings.oddsChanges) {
      new Notification(`📊 Odds Alert: ${match.home_team} vs ${match.away_team}`, {
        body: `Odds moved from ${oldOdds} to ${newOdds}`,
        icon: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/4616ada62_image.png',
        tag: `odds-${match.id}`
      });
    }
  }
};

export const sendGameStartNotification = (match) => {
  if (Notification.permission === 'granted') {
    const settings = JSON.parse(localStorage.getItem('notificationSettings') || '{}');
    if (settings.gameStarts) {
      new Notification(`🏀 Game Starting Soon!`, {
        body: `${match.home_team} vs ${match.away_team} starts in 30 minutes`,
        icon: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/4616ada62_image.png',
        tag: `game-start-${match.id}`,
        requireInteraction: true
      });
    }
  }
};

export const sendDailyBestBetsNotification = (bets) => {
  if (Notification.permission === 'granted') {
    const settings = JSON.parse(localStorage.getItem('notificationSettings') || '{}');
    if (settings.dailyBestBets) {
      new Notification('🌟 Today\'s Best Bets are Ready!', {
        body: `${bets.length} top picks with high confidence. Tap to view.`,
        icon: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/4616ada62_image.png',
        tag: 'daily-bets',
        requireInteraction: true
      });
    }
  }
};
import React from "react";
import RequireAuth from "../components/auth/RequireAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, Bell, Palette, Database } from "lucide-react";
import PushNotifications from "../components/mobile/PushNotifications";
import ThemeToggle from "../components/mobile/ThemeToggle";
import { Badge } from "@/components/ui/badge";

function SettingsContent() {
  const cacheSize = () => {
    try {
      let total = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage[key].length + key.length;
        }
      }
      return (total / 1024).toFixed(2);
    } catch {
      return '0';
    }
  };

  const clearCache = () => {
    if (confirm('Clear all cached data? This will remove offline data but won\'t affect your account.')) {
      const keysToKeep = ['theme', 'notificationSettings', 'installPromptDismissed'];
      for (let key in localStorage) {
        if (!keysToKeep.includes(key)) {
          localStorage.removeItem(key);
        }
      }
      alert('Cache cleared successfully!');
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 dark:from-slate-950 dark:via-purple-950 dark:to-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <SettingsIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Settings</h1>
              <p className="text-slate-400">Manage your app preferences</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Theme Settings */}
          <Card className="border-2 border-slate-700 bg-slate-800/50 dark:bg-slate-900/50">
            <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
              <CardTitle className="flex items-center gap-3">
                <Palette className="w-6 h-6" />
                Theme & Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-white mb-1">Dark Mode</div>
                  <div className="text-sm text-slate-400">Switch between light and dark theme</div>
                </div>
                <ThemeToggle variant="switch" />
              </div>
              
              <div className="mt-4 p-4 bg-slate-900/50 dark:bg-slate-950/50 rounded-lg">
                <div className="text-xs text-slate-400 mb-2">Quick Preview:</div>
                <div className="flex gap-2">
                  <div className="flex-1 h-12 bg-white dark:bg-slate-800 rounded border border-slate-300 dark:border-slate-700"></div>
                  <div className="flex-1 h-12 bg-blue-500 dark:bg-blue-600 rounded"></div>
                  <div className="flex-1 h-12 bg-purple-500 dark:bg-purple-600 rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Push Notifications */}
          <PushNotifications />

          {/* Offline & Cache Settings */}
          <Card className="border-2 border-slate-700 bg-slate-800/50 dark:bg-slate-900/50">
            <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white">
              <CardTitle className="flex items-center gap-3">
                <Database className="w-6 h-6" />
                Offline Mode & Cache
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-900/50 dark:bg-slate-950/50 rounded-lg">
                <div>
                  <div className="font-bold text-white mb-1">Offline Mode</div>
                  <div className="text-sm text-slate-400">App works without internet</div>
                </div>
                <Badge className="bg-green-500">✅ Enabled</Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-900/50 dark:bg-slate-950/50 rounded-lg">
                <div>
                  <div className="font-bold text-white mb-1">Cache Size</div>
                  <div className="text-sm text-slate-400">{cacheSize()} KB stored locally</div>
                </div>
                <button
                  onClick={clearCache}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-bold transition-colors"
                >
                  Clear Cache
                </button>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>💡 Offline Features:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-blue-800 dark:text-blue-200">
                    <li>View your last 20 analyzed matches</li>
                    <li>Access saved player & team stats</li>
                    <li>Use betting calculators</li>
                    <li>Browse learning center content</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  return (
    <RequireAuth pageName="Settings">
      <SettingsContent />
    </RequireAuth>
  );
}
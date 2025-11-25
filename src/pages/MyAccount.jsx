import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Heart, Trophy, CreditCard } from "lucide-react";
import RequireAuth from "@/components/auth/RequireAuth";

import ProfileContent from "@/components/hub/ProfileContent";
import PreferencesContent from "@/components/hub/PreferencesContent";
import SavedResultsContent from "@/components/hub/SavedResultsContent";
import SubscriptionContent from "@/components/hub/SubscriptionContent";

function MyAccountContent() {
  const [activeTab, setActiveTab] = useState("profile");

  return (
        <div className="min-h-screen">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8 bg-black/40 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
                👤 MY ACCOUNT
              </h1>
              <p className="text-white/70 text-lg">Manage your profile, preferences, and saved results</p>
            </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 bg-black/40 backdrop-blur-sm p-2 rounded-xl border border-white/10">
            <TabsTrigger 
              value="profile" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white"
            >
              <User className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger 
              value="subscription" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Subscription</span>
            </TabsTrigger>
            <TabsTrigger 
              value="preferences" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-red-600 data-[state=active]:text-white"
            >
              <Heart className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Preferences</span>
            </TabsTrigger>
            <TabsTrigger 
              value="saved" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-600 data-[state=active]:text-white"
            >
              <Trophy className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Saved</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <ProfileContent />
          </TabsContent>

          <TabsContent value="subscription">
            <SubscriptionContent />
          </TabsContent>

          <TabsContent value="preferences">
            <PreferencesContent />
          </TabsContent>

          <TabsContent value="saved">
            <SavedResultsContent />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function MyAccount() {
  return (
    <RequireAuth pageName="My Account">
      <MyAccountContent />
    </RequireAuth>
  );
}
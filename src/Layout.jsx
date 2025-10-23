
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Trophy, User, Shield, Bookmark, Zap, Target } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const navigationItems = [
  {
    title: "Match Analysis",
    url: createPageUrl("Dashboard"),
    icon: Trophy,
    description: "Live match predictions",
    color: "from-blue-500 to-cyan-500"
  },
  {
    title: "Player Stats",
    url: createPageUrl("PlayerStats"),
    icon: User,
    description: "Individual performance",
    color: "from-purple-500 to-pink-500"
  },
  {
    title: "Team Stats",
    url: createPageUrl("TeamStats"),
    icon: Shield,
    description: "Team analytics",
    color: "from-green-500 to-emerald-500"
  },
  {
    title: "Saved Results",
    url: createPageUrl("SavedResults"),
    icon: Bookmark,
    description: "Your predictions",
    color: "from-orange-500 to-red-500"
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Sidebar className="border-r border-slate-700 bg-slate-900/95 backdrop-blur-xl">
          <SidebarHeader className="border-b border-slate-700 p-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/50">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-white">Sports Wager Saver</h2>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  AI Sports Analytics
                </p>
              </div>
            </div>
          </SidebarHeader>
          
          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-2 mb-2">
                Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-2">
                  {navigationItems.map((item) => {
                    const isActive = location.pathname === item.url;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          className={`relative overflow-hidden rounded-xl transition-all duration-300 ${
                            isActive 
                              ? 'bg-gradient-to-r ' + item.color + ' text-white shadow-lg scale-105' 
                              : 'hover:bg-slate-800 text-slate-300 hover:text-white hover:scale-102'
                          }`}
                        >
                          <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              isActive ? 'bg-white/20' : 'bg-slate-800'
                            }`}>
                              <item.icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold">{item.title}</div>
                              <div className={`text-xs ${isActive ? 'text-white/80' : 'text-slate-500'}`}>
                                {item.description}
                              </div>
                            </div>
                            {isActive && (
                              <div className="absolute right-0 top-0 bottom-0 w-1 bg-white rounded-l-full" />
                            )}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="border-t border-slate-700 p-4">
            <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                <p className="text-xs font-semibold text-amber-400">Live Data</p>
              </div>
              <p className="text-xs text-slate-400">
                Powered by StatMuse, ESPN & official league sources
              </p>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Header */}
          <header className="bg-slate-900/95 backdrop-blur-xl border-b border-slate-700 px-6 py-4 md:hidden">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-slate-800 p-2 rounded-lg transition-colors text-white" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-lg font-bold text-white">Sports Wager Saver</h1>
              </div>
            </div>
          </header>

          {/* Main content area */}
          <div className="flex-1 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, PieChart, Bot, User } from "lucide-react";
import { motion } from "framer-motion";

const tabs = [
  { id: "Dashboard", label: "Home", icon: Home },
  { id: "AnalysisHub", label: "Analysis", icon: PieChart },
  { id: "AIAssistant", label: "Ask SAL", icon: Bot },
  { id: "MyAccount", label: "Account", icon: User },
];

export default function MobileBottomTabs() {
  const location = useLocation();
  
  const isActive = (pageId) => {
    const path = location.pathname;
    if (pageId === "Dashboard" && (path === "/" || path === "/Dashboard")) return true;
    return path.includes(pageId);
  };

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-t border-slate-700/50 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const active = isActive(tab.id);
          const Icon = tab.icon;
          
          return (
            <Link
              key={tab.id}
              to={createPageUrl(tab.id)}
              className="flex flex-col items-center justify-center flex-1 h-full relative"
            >
              {active && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-b-full"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <Icon 
                className={`w-6 h-6 transition-colors ${
                  active ? "text-purple-400" : "text-slate-400"
                }`} 
              />
              <span 
                className={`text-xs mt-1 font-medium transition-colors ${
                  active ? "text-purple-400" : "text-slate-500"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
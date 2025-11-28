import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FloatingDashboardButton() {
  return (
    <>
      {/* Large spacer to prevent content from being hidden behind the fixed button */}
      <div className="h-28 md:h-32" aria-hidden="true" />
      <div 
        className="fixed left-1/2 transform -translate-x-1/2 z-[9999]"
        style={{ 
          bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))'
        }}
      >
        <Link to={createPageUrl("Dashboard")}>
          <Button className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold gap-2 shadow-2xl px-6 md:px-8 py-3 md:py-4 text-base md:text-lg rounded-full border-2 border-white/20 min-h-[48px]">
            <Home className="w-5 h-5" />
            Dashboard
          </Button>
        </Link>
      </div>
    </>
  );
}
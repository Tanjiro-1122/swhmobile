import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function FloatingDashboardButton() {
  return (
    <>
      {/* Spacer to prevent content from being hidden behind the fixed button */}
      <div className="h-32" />
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-[9999]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}>
        <Link to={createPageUrl("Dashboard")}>
          <Button className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold gap-2 shadow-2xl px-8 py-4 text-lg rounded-full border-2 border-white/20 min-h-[44px]">
            <Home className="w-5 h-5" />
            Dashboard
          </Button>
        </Link>
      </div>
    </>
  );
}
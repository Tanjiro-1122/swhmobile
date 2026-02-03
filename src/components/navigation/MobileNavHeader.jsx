import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const ROOT_PAGES = ["Dashboard", "Home", "Index"];

export default function MobileNavHeader({ currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  const isRootPage = ROOT_PAGES.some(page => 
    location.pathname === "/" || 
    location.pathname === `/${page}` ||
    currentPageName === page
  );

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(createPageUrl("Dashboard"));
    }
  };

  return (
    <header 
      className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-b border-slate-700/50 md:hidden"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex items-center h-14 px-4">
        {isRootPage ? (
          <Link to={createPageUrl("Dashboard")} className="flex items-center gap-3">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/4616ada62_image.png"
              alt="SWH"
              className="w-8 h-8 rounded-lg object-cover"
            />
            <span className="font-bold text-white text-lg">Sports Wager Helper</span>
          </Link>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="text-white hover:bg-white/10 -ml-2 gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </Button>
        )}
      </div>
    </header>
  );
}
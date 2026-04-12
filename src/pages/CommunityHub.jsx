import { lazy, Suspense } from "react";
import { MessageSquare, Loader2, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import RequireAuth from "@/components/auth/RequireAuth";

// Lazy load content components
const CommunityContent = lazy(() => import("@/components/hub/CommunityContent"));

// Loading fallback
const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
  </div>
);

function CommunityHubPage() {
  return (
    <div className="overflow-x-hidden">
      <div className="max-w-6xl mx-auto w-full">
        <div className="w-full flex justify-start mb-2">
            <Link to={createPageUrl('Dashboard')}>
                <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 -ml-4">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Dashboard
                </Button>
            </Link>
        </div>
        {/* Header */}
        <div className="mb-6 bg-black/40 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="w-8 h-8 text-orange-400" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
              Community Hub
            </h1>
          </div>
          <p className="text-white/70 text-base md:text-lg">Connect with other bettors and share strategies</p>
        </div>

        <Suspense fallback={<LoadingSpinner />}>
          <CommunityContent />
        </Suspense>
      </div>
    </div>
  );
}

export default function CommunityHub() {
  return (
    <RequireAuth pageName="Community & Learning">
      <CommunityHubPage />
    </RequireAuth>
  );
}
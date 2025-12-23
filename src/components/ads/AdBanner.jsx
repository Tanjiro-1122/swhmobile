import React, { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

export default function AdBanner({ slot, format = "auto", className = "" }) {
  const adRef = useRef(null);
  const adLoaded = useRef(false);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) return null;
      return base44.auth.me();
    },
  });

  const userTier = currentUser?.subscription_type || 'free';
  const isPaidUser = userTier === 'legacy' || userTier === 'vip_annual' || userTier === 'premium_monthly';

  useEffect(() => {
    // Don't show ads to paid users
    if (isPaidUser) return;

    // Load AdSense script if not already loaded
    if (!window.adsbygoogle && !document.querySelector('script[src*="adsbygoogle"]')) {
      const script = document.createElement('script');
      script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9805351454092862";
      script.async = true;
      script.crossOrigin = "anonymous";
      document.head.appendChild(script);
    }

    // Push ad once component mounts and script is ready
    const pushAd = () => {
      if (adRef.current && !adLoaded.current) {
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          adLoaded.current = true;
        } catch (e) {
          console.error('AdSense error:', e);
        }
      }
    };

    // Wait for script to load
    const checkAndPush = setInterval(() => {
      if (window.adsbygoogle) {
        pushAd();
        clearInterval(checkAndPush);
      }
    }, 100);

    // Cleanup
    return () => clearInterval(checkAndPush);
  }, [isPaidUser]);

  // Don't render anything for paid users
  if (isPaidUser) return null;

  return (
    <div className={`ad-container ${className}`}>
      <div className="text-center text-xs text-slate-500 mb-1">Advertisement</div>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-9805351454092862"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
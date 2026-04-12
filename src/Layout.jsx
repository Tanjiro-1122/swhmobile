import React, { Suspense, useEffect } from 'react';
import { usePlatform } from '@/components/hooks/usePlatform';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';

const WebLayout = React.lazy(() => import('./components/layout/WebLayout'));
const MobileLayout = React.lazy(() => import('./components/layout/MobileLayout'));

const FullScreenLoader = () => (
  <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center gap-4">
    <img 
      src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/e6d91dd0c_AfriendlyrobotowlmascotwithpurpleandlimegreenaccentswearingstylishglassesholdinganopenglowingbookwithalightbulbaboveitsheadSportswhistlearoundneckModernvectorstyledarkbackgrou.jpg"
      alt="S.A.L. the Owl - Loading"
      className="w-20 h-20 rounded-2xl object-cover animate-pulse border-2 border-purple-500/50"
    />
    <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
    <p className="text-slate-400 text-sm">S.A.L. is getting things ready...</p>
  </div>
);

export default function Layout(props) {
  const { isNativeApp, isMobileScreen, isWeb } = usePlatform();
  const renderMobileLayout = isNativeApp || (isWeb && isMobileScreen);

  useEffect(() => {
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    const requiredContent = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';

    if (viewportMeta) {
      if (viewportMeta.getAttribute('content') !== requiredContent) {
        viewportMeta.setAttribute('content', requiredContent);
      }
    } else {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = requiredContent;
      document.head.appendChild(meta);
    }
  }, []);

  useEffect(() => {
    // --- Start of one-time setup ---
    const setupOnce = () => {
      // Preconnect to critical domains
      const preconnectDomains = [
        'https://qtrypzzcjebvfcihiynt.supabase.co',
        'https://ajax.googleapis.com',
        'https://www.gstatic.com',
        'https://web2application.com',
        'https://unpkg.com'
      ];
      preconnectDomains.forEach(domain => {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = domain;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
      });

      // Apple-specific meta tags for native feel
      const appleMeta = {
        'apple-mobile-web-app-capable': 'yes',
        'apple-mobile-web-app-status-bar-style': 'black-translucent'
      };
      Object.entries(appleMeta).forEach(([name, content]) => {
        const meta = document.createElement('meta');
        meta.name = name;
        meta.content = content;
        document.head.appendChild(meta);
      });
      
      // Theme color based on system preference
      const updateThemeColor = () => {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        let themeColorMeta = document.querySelector('meta[name="theme-color"]');
        if (!themeColorMeta) {
          themeColorMeta = document.createElement('meta');
          themeColorMeta.name = 'theme-color';
          document.head.appendChild(themeColorMeta);
        }
        themeColorMeta.content = isDark ? '#0f172a' : '#ffffff';
        document.documentElement.classList.toggle('dark', isDark);
      };
      updateThemeColor();
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateThemeColor);

      // Load essential third-party scripts
      const scripts = [
        "https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js",
        "https://www.gstatic.com/firebasejs/7.11.0/firebase.js",
        "https://web2application.com/w2a/webapps/36296/web2app1.js",
        "https://unpkg.com/webtonative@1.0.81/webtonative.min.js"
      ];
      scripts.forEach(src => {
        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        document.head.appendChild(script);
      });

      // Add manifest link for PWA
      const manifestLink = document.createElement('link');
      manifestLink.rel = "manifest";
      manifestLink.href = "/manifest.json";
      document.head.appendChild(manifestLink);
    };

    // Run setup only once
    if (!window.appInitialized) {
      setupOnce();
      window.appInitialized = true;
    }
    // --- End of one-time setup ---

    const logFrontendError = async (error, contextInfo) => {
      try {
        // Ensure we have a valid error object
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : (new Error(errorMessage)).stack;

        await base44.functions.invoke('logError', {
          error_type: 'frontend',
          severity: 'error',
          function_name: contextInfo.source || 'GlobalErrorHandler',
          error_message: errorMessage,
          error_stack: errorStack,
          context: {
             ...contextInfo,
             url: window.location.href,
             userAgent: navigator.userAgent,
          }
        });
      } catch (loggingError) {
        console.error("Failed to log error to backend:", loggingError);
      }
    };
    
    const errorHandler = (event) => {
      // Don't log generic "Script error." messages
      if (event.message.includes('Script error')) {
        return;
      }
      logFrontendError(event.error || new Error(event.message), { source: 'window.onerror' });
    };

    const promiseRejectionHandler = (event) => {
      logFrontendError(event.reason, { source: 'unhandledrejection' });
    };

    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', promiseRejectionHandler);

    // Cleanup listeners on component unmount
    return () => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', promiseRejectionHandler);
    };
  }, []); // Empty dependency array ensures this runs only once per app load.

  return (
    <Suspense fallback={<FullScreenLoader />}>
      {renderMobileLayout ? <MobileLayout {...props} /> : <WebLayout {...props} />}
    </Suspense>
  );
}
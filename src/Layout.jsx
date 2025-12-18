import React, { Suspense, useEffect } from 'react';
import { usePlatform } from './components/hooks/usePlatform';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';

const WebLayout = React.lazy(() => import('./components/layout/WebLayout'));
const MobileLayout = React.lazy(() => import('./components/layout/MobileLayout'));

const FullScreenLoader = () => (
  <div className="fixed inset-0 bg-slate-900 flex items-center justify-center">
    <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
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
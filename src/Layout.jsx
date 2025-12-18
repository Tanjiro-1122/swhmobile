import React, { Suspense } from 'react';
import { usePlatform } from './components/hooks/usePlatform';
import { Loader2 } from 'lucide-react';

const WebLayout = React.lazy(() => import('./components/layout/WebLayout'));
const MobileLayout = React.lazy(() => import('./components/layout/MobileLayout'));

const FullScreenLoader = () => (
  <div className="fixed inset-0 bg-slate-900 flex items-center justify-center">
    <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
  </div>
);

export default function Layout(props) {
  const { isWeb } = usePlatform();

  return (
    <Suspense fallback={<FullScreenLoader />}>
      {isWeb ? <WebLayout {...props} /> : <MobileLayout {...props} />}
    </Suspense>
  );
}
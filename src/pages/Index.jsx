import { useEffect, useState } from 'react';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';

export default function Index() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          window.location.replace(createPageUrl('Dashboard'));
        } else {
          window.location.replace(createPageUrl('Home'));
        }
      } catch (error) {
        // If auth check fails, default to Home
        window.location.replace(createPageUrl('Home'));
      }
    };
    
    checkAuthAndRedirect();
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-900 flex items-center justify-center">
      <Loader2 className="w-12 h-12 text-lime-400 animate-spin" />
    </div>
  );
}
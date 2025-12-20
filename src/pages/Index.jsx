import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';

export default function Index() {
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (isAuth) {
          navigate(createPageUrl('Dashboard'), { replace: true });
        } else {
          navigate(createPageUrl('Home'), { replace: true });
        }
      } catch (error) {
        // If auth check fails, default to Home
        navigate(createPageUrl('Home'), { replace: true });
      } finally {
        setChecking(false);
      }
    };
    
    checkAuthAndRedirect();
  }, [navigate]);

  return (
    <div className="fixed inset-0 bg-slate-900 flex items-center justify-center">
      <Loader2 className="w-12 h-12 text-lime-400 animate-spin" />
    </div>
  );
}
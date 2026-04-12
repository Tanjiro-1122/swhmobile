import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Loader2 } from 'lucide-react';

export default function Index() {
  const [_checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        // Try to fetch the actual user - this will fail with 401 if not authenticated
        const user = await base44.auth.me();
        if (user && user.id) {
          navigate(createPageUrl('Dashboard'), { replace: true });
        } else {
          navigate(createPageUrl('Home'), { replace: true });
        }
      } catch (_error) {
        // Any error (including 401 Unauthorized) means not authenticated
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
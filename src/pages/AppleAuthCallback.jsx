import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AppleAuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState(null);

  useEffect(() => {
    async function handleCallback() {
      try {
        console.log('[AppleCallback] Starting callback handler');
        console.log('[AppleCallback] Full URL:', window.location.href);
        console.log('[AppleCallback] Search params:', window.location.search);
        setStatus('processing');

        const params = new URLSearchParams(window.location.search);
        
        // Get authorization data from query params (response_mode=query)
        const code = params.get('code');
        const id_token = params.get('id_token');
        const state = params.get('state');
        const error = params.get('error');
        const userParam = params.get('user');

        console.log('[AppleCallback] Parsed Apple response:', { 
          code: code ? 'present' : 'missing', 
          id_token: id_token ? 'present' : 'missing',
          state, 
          error,
          user: userParam ? 'present' : 'missing'
        });

        // Check if we're in a popup (opened by parent window)
        const isPopup = window.opener && window.opener !== window;
        console.log('[AppleCallback] isPopup:', isPopup);

        if (error) {
          console.error('[AppleCallback] Apple returned error:', error);
          setError(error);
          setStatus('error');
          return;
        }

        if (!code) {
          console.error('[AppleCallback] No authorization code received');
          setError('No authorization code received');
          setStatus('error');
          return;
        }

        // If in popup, post message back to opener
        if (isPopup) {
          console.log('[AppleCallback] Posting auth data to opener');
          setStatus('success');
          
          window.opener.postMessage({
            type: 'apple_auth',
            code,
            id_token,
            state,
            user: userParam
          }, window.location.origin);
          
          console.log('[AppleCallback] Message posted, closing popup');
          
          // Close popup after short delay
          setTimeout(() => {
            window.close();
          }, 500);
        } else {
          // Direct navigation (not popup) - shouldn't happen with our flow but handle it
          console.log('[AppleCallback] Direct navigation detected (not popup)');
          setError('Please use the Apple Sign-In button');
          setStatus('error');
        }
      } catch (err) {
        console.error('Error during Apple callback handling:', err);
        setError(err.message || 'Authentication error');
        setStatus('error');
      }
    }

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800/50 rounded-lg p-8 text-center border border-slate-700">
        {status === 'processing' && (
          <>
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Processing Apple Sign-In</h2>
            <p className="text-slate-400">Please wait...</p>
          </>
        )}

        {status === 'exchanging' && (
          <>
            <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Verifying with Apple</h2>
            <p className="text-slate-400">Exchanging credentials...</p>
          </>
        )}

        {status === 'signing-in' && (
          <>
            <Loader2 className="w-12 h-12 text-green-500 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Signing You In</h2>
            <p className="text-slate-400">Almost there...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Success!</h2>
            <p className="text-slate-400">Redirecting to dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Authentication Failed</h2>
            <p className="text-slate-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.href = '/'}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              Return to Home
            </button>
          </>
        )}
      </div>
    </div>
  );
}
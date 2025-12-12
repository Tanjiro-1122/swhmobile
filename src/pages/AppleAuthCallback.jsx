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
        setStatus('processing');

        // Since Apple redirects with form_post, the backend will handle it automatically
        // But if we're here from a GET redirect, try to handle it client-side
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');

        if (code) {
          // We have a code in the URL, exchange it
          setStatus('exchanging');
          const resp = await base44.functions.invoke('handleAppleSignIn', {
            action: 'exchangeCode',
            authorizationCode: code,
            nonce: sessionStorage.getItem('apple_nonce') || null
          });

          if (resp.data?.success && resp.data?.sessionToken) {
            setStatus('signing-in');
            await base44.auth.setToken(resp.data.sessionToken);
            setStatus('success');
            window.location.href = '/';
            return;
          }

          if (resp.data?.reason === 'link_required') {
            navigate('/link-account', { state: { hint: resp.data.message } });
            return;
          }

          setError(resp.data?.error || 'Authentication failed');
          setStatus('error');
        } else {
          // No code - might be waiting for form_post from Apple
          // Give it a moment, then show error
          setTimeout(() => {
            setError('No authorization code received');
            setStatus('error');
          }, 3000);
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
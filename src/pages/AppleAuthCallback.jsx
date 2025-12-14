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

        const params = new URLSearchParams(window.location.search);
        const success = params.get('success');
        const apple_id = params.get('apple_id');
        const email = params.get('email');
        const is_private = params.get('is_private');
        const name = params.get('name');

        // If we have Apple user data from the redirect, handle popup or direct flow
        if (success === 'true' && apple_id) {
          setStatus('processing');
          
          // Check if we're in a popup (opened by parent window)
          const isPopup = window.opener && window.opener !== window;
          
          if (isPopup) {
            // Store data in opener's localStorage
            window.opener.localStorage.setItem('apple_provider_id', apple_id);
            window.opener.localStorage.setItem('apple_provider_email', email || '');
            window.opener.localStorage.setItem('apple_is_private_email', is_private || 'false');
            window.opener.localStorage.setItem('apple_provider_name', name || '');
            
            setStatus('success');
            
            // Redirect opener to Base44 login
            if (email && is_private !== 'true') {
              window.opener.location.href = `${window.location.origin}${base44.auth.getLoginUrl(`/MyAccount?activate_iap=true&email=${encodeURIComponent(email)}`)}`;
            } else {
              window.opener.location.href = `${window.location.origin}${base44.auth.getLoginUrl('/MyAccount?activate_iap=true')}`;
            }
            
            // Close popup after short delay
            setTimeout(() => {
              window.close();
            }, 500);
          } else {
            // Direct navigation (not popup)
            localStorage.setItem('apple_provider_id', apple_id);
            localStorage.setItem('apple_provider_email', email || '');
            localStorage.setItem('apple_is_private_email', is_private || 'false');
            localStorage.setItem('apple_provider_name', name || '');

            if (email) {
              try {
                await navigator.clipboard.writeText(email);
              } catch (e) {
                console.log('Could not copy email');
              }
            }

            setStatus('success');
            
            // Redirect to Base44 login with email prefilled
            if (email && is_private !== 'true') {
              base44.auth.redirectToLogin(`/MyAccount?activate_iap=true&email=${encodeURIComponent(email)}`);
            } else {
              base44.auth.redirectToLogin('/MyAccount?activate_iap=true');
            }
          }
        } else {
          setTimeout(() => {
            setError('No authorization received');
            setStatus('error');
          }, 2000);
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
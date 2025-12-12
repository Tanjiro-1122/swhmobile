import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppleAuthCallback() {
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Completing Apple sign-in...');

  useEffect(() => {
    handleAppleCallback();
  }, []);

  const handleAppleCallback = async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const error = params.get('error');

      if (error) {
        setStatus('error');
        setMessage(`Apple sign-in failed: ${error}`);
        return;
      }

      if (!code) {
        setStatus('error');
        setMessage('No authorization code received from Apple');
        return;
      }

      let userInfo = null;
      const hash = window.location.hash;
      if (hash) {
        try {
          const hashParams = new URLSearchParams(hash.substring(1));
          const userParam = hashParams.get('user');
          if (userParam) {
            userInfo = JSON.parse(decodeURIComponent(userParam));
          }
        } catch (e) {
          console.warn('Could not parse user info from hash:', e);
        }
      }

      setMessage('Verifying with Apple...');
      const response = await base44.functions.invoke('handleAppleSignIn', {
        action: 'exchangeCode',
        authorizationCode: code,
        user: userInfo
      });

      if (response.data?.success) {
        const { appleUser, linkedUserEmail, sessionToken } = response.data;

        if (appleUser) {
          localStorage.setItem('apple_provider_id', appleUser.id);
          localStorage.setItem('apple_provider_email', appleUser.email || '');
          localStorage.setItem('apple_is_private_email', appleUser.isPrivateEmail ? 'true' : 'false');
        }

        if (sessionToken) {
          console.log('Setting session token from Apple callback');
          setMessage('Logging you in...');
          await base44.auth.setToken(sessionToken);
          setStatus('success');
          setMessage('Sign-in successful! Redirecting...');
          
          const pendingIAP = localStorage.getItem('pending_iap_product');
          setTimeout(() => {
            window.location.href = pendingIAP ? '/MyAccount?activate_iap=true' : '/Dashboard';
          }, 1000);
          return;
        }

        if (linkedUserEmail) {
          setMessage('Account found! Redirecting to login...');
          setTimeout(() => {
            base44.auth.redirectToLogin(`/MyAccount?email=${encodeURIComponent(linkedUserEmail)}`);
          }, 1500);
          return;
        }

        setStatus('success');
        setMessage('Apple sign-in successful! Please complete your account setup.');
        setTimeout(() => {
          base44.auth.redirectToLogin('/MyAccount');
        }, 2000);

      } else {
        setStatus('error');
        setMessage(response.data?.error || 'Failed to verify Apple sign-in');
      }
    } catch (error) {
      console.error('Apple callback error:', error);
      setStatus('error');
      setMessage('An error occurred during sign-in. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-white/10 bg-slate-800/50 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          {status === 'processing' && (
            <>
              <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Processing Sign-In</h2>
              <p className="text-gray-400">{message}</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Success!</h2>
              <p className="text-gray-400">{message}</p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Sign-In Failed</h2>
              <p className="text-gray-400 mb-6">{message}</p>
              <Button
                onClick={() => window.location.href = '/Dashboard'}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Return to Dashboard
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
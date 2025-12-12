// src/pages/AppleAuthCallback.jsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';

export default function AppleAuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    async function handleCallback() {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');

        // optional: state check if you stored one before redirect
        const expectedState = sessionStorage.getItem('apple_auth_state');
        if (state && expectedState && state !== expectedState) {
          console.error('Apple callback: state mismatch');
          // show or navigate to error UI if desired
          return;
        }

        if (!code) {
          console.error('Apple callback: no authorization code present');
          return;
        }

        // call your Base44 function that exchanges the code
        const resp = await fetch('https://base44.app/api/apps/68f93544702b554e3e1f7297/functions/handleAppleSignIn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'exchangeCode',
            authorizationCode: code,
            nonce: sessionStorage.getItem('apple_nonce') || null
          })
        });

        console.log('handleAppleSignIn status:', resp.status, [...resp.headers.entries()]);
        const result = await resp.json();
        console.log('handleAppleSignIn result:', result);

        if (result && result.success && result.sessionToken) {
          try {
            console.log('Calling base44.auth.setToken...');
            await base44.auth.setToken(result.sessionToken);
            console.log('base44.auth.setToken succeeded — redirecting to /');
            // either reload or navigate to home / protected area
            window.location.href = '/';
            return;
          } catch (setErr) {
            console.error('base44.auth.setToken failed:', setErr);
            // fallback: show error UI
            return;
          }
        }

        if (result && result.reason === 'link_required') {
          // Server asked to link accounts — route to your linking UI
          navigate('/link-account', { state: { hint: result.message } });
          return;
        }

        console.error('No session token returned or exchange failed:', result);
      } catch (err) {
        console.error('Error during Apple callback handling:', err);
      }
    }

    handleCallback();
  }, [navigate]);

  return <div>Signing in with Apple…</div>;
}
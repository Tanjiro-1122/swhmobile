import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AppleSignInTest() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExchanging, setIsExchanging] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [appleConfig, setAppleConfig] = useState(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await base44.functions.invoke('handleAppleSignIn', {
          action: 'getClientId'
        });
        if (response.data?.clientId) {
          setAppleConfig(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch Apple config:', err);
      }
    };
    fetchConfig();
  }, []);

  const handleManualAppleAuth = () => {
    if (!appleConfig) {
      alert('Apple configuration not loaded yet');
      return;
    }

    const state = Math.random().toString(36).substring(7);
    const nonce = Math.random().toString(36).substring(7);
    
    const authUrl = `https://appleid.apple.com/auth/authorize?` +
      `client_id=${encodeURIComponent(appleConfig.clientId)}&` +
      `redirect_uri=${encodeURIComponent(appleConfig.redirectUri)}&` +
      `response_type=code&` +
      `response_mode=form_post&` +
      `scope=name%20email&` +
      `state=${state}&` +
      `nonce=${nonce}`;
    
    window.open(authUrl, '_blank', 'width=600,height=700');
  };

  const handleGenerateClientSecret = async () => {
    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const response = await base44.functions.invoke('testAppleAuth', {
        action: 'generateClientSecret'
      });

      if (response.data?.success) {
        setClientSecret(response.data.clientSecret);
        setResult({
          type: 'success',
          title: 'Client Secret Generated',
          message: 'JWT token generated successfully using your .p8 key',
          data: {
            expiresAt: response.data.expiresAt,
            algorithm: 'ES256',
            kid: response.data.keyId
          }
        });
      } else {
        throw new Error(response.data?.error || 'Failed to generate client secret');
      }
    } catch (err) {
      setError({
        message: err.message,
        details: err.response?.data || err.toString()
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExchangeCode = async () => {
    if (!authCode.trim()) {
      setError({ message: 'Please enter an authorization code' });
      return;
    }

    setIsExchanging(true);
    setError(null);
    setResult(null);

    try {
      const response = await base44.functions.invoke('testAppleAuth', {
        action: 'exchangeCode',
        authorizationCode: authCode.trim()
      });

      if (response.data?.success) {
        setResult({
          type: 'success',
          title: 'Token Exchange Successful',
          message: 'Successfully exchanged authorization code with Apple',
          data: {
            hasIdToken: !!response.data.id_token,
            hasAccessToken: !!response.data.access_token,
            hasRefreshToken: !!response.data.refresh_token,
            appleUser: response.data.appleUser,
            tokenType: response.data.token_type
          }
        });
      } else {
        throw new Error(response.data?.error || 'Token exchange failed');
      }
    } catch (err) {
      setError({
        message: err.message,
        details: err.response?.data || err.toString()
      });
    } finally {
      setIsExchanging(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Apple Sign-In Testing</h1>
          <p className="text-slate-400">Test your Apple authentication configuration</p>
        </div>

        {/* Generate Client Secret */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">1. Generate Client Secret</CardTitle>
            <CardDescription className="text-slate-400">
              Generate a JWT token signed with your .p8 private key (ES256)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleGenerateClientSecret}
              disabled={isGenerating}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Client Secret'
              )}
            </Button>

            {clientSecret && (
              <div className="space-y-2">
                <Label className="text-slate-300">Generated Client Secret (JWT)</Label>
                <Textarea
                  value={clientSecret}
                  readOnly
                  className="font-mono text-xs bg-slate-900 text-slate-300 border-slate-600"
                  rows={6}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Get Authorization Code */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">2. Get Authorization Code</CardTitle>
            <CardDescription className="text-slate-400">
              Click to open Apple's authorization page and retrieve the authorization code
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleManualAppleAuth}
              disabled={!appleConfig}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Open Apple Sign-In (New Window)
            </Button>
            <Alert className="bg-yellow-900/20 border-yellow-700">
              <AlertDescription className="text-slate-300 text-sm">
                <strong>Note:</strong> After signing in with Apple, you'll be redirected back. 
                Check your browser's network tab or the redirect URL for the <code className="bg-slate-700 px-1 py-0.5 rounded">code</code> parameter. 
                Copy that value and paste it below.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Exchange Authorization Code */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">3. Exchange Authorization Code</CardTitle>
            <CardDescription className="text-slate-400">
              Exchange an authorization code from Apple for id_token and access_token
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Authorization Code</Label>
              <Input
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value)}
                placeholder="Paste authorization code from Apple redirect"
                className="bg-slate-900 text-slate-300 border-slate-600"
              />
            </div>

            <Button
              onClick={handleExchangeCode}
              disabled={isExchanging || !authCode.trim()}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isExchanging ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exchanging...
                </>
              ) : (
                'Exchange Code with Apple'
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <Alert className="bg-green-900/20 border-green-700">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-slate-200">
              <div className="space-y-2">
                <div className="font-semibold">{result.title}</div>
                <div className="text-sm text-slate-300">{result.message}</div>
                {result.data && (
                  <pre className="mt-2 p-3 bg-slate-900 rounded text-xs overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Errors */}
        {error && (
          <Alert className="bg-red-900/20 border-red-700">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <AlertDescription className="text-slate-200">
              <div className="space-y-2">
                <div className="font-semibold">Error: {error.message}</div>
                {error.details && (
                  <pre className="mt-2 p-3 bg-slate-900 rounded text-xs overflow-auto">
                    {JSON.stringify(error.details, null, 2)}
                  </pre>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Instructions */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">How to Use</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-300 space-y-2">
            <p><strong>Step 1:</strong> Click "Generate Client Secret" to verify your .p8 key configuration</p>
            <p><strong>Step 2:</strong> Click "Open Apple Sign-In" to trigger the authorization flow</p>
            <p><strong>Step 3:</strong> After signing in, look for the <code className="bg-slate-700 px-1 py-0.5 rounded">code</code> parameter in the URL or network tab</p>
            <p><strong>Step 4:</strong> Paste the code and click "Exchange Code" to test the full flow</p>
            <p className="text-yellow-400 mt-4"><strong>Tip:</strong> Open browser DevTools (F12) → Network tab before clicking "Open Apple Sign-In" to capture all redirects</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle, Key } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AppleKeyTester() {
  const [keyInput, setKeyInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);

  const [ssoConfig, setSsoConfig] = useState(null);
  const [configLoading, setConfigLoading] = useState(false);

  const handleTest = async () => {
    if (!keyInput.trim()) return;
    
    setIsLoading(true);
    setResult(null);

    try {
      const response = await base44.functions.invoke('handleAppleSignIn', {
        action: 'testManualKey',
        manualKey: keyInput
      });

      setResult(response.data);
    } catch (error) {
      setResult({
        success: false,
        error: error.message || "Unknown error occurred"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateSSOConfig = async () => {
      setConfigLoading(true);
      try {
          const response = await base44.functions.invoke('handleAppleSignIn', {
              action: 'getSSOConfig'
          });
          if (response.data.success) {
              setSsoConfig(response.data.config);
          } else {
              alert("Error: " + (response.data.error || "Failed to generate config"));
          }
      } catch (error) {
          alert("Error: " + error.message);
      } finally {
          setConfigLoading(false);
      }
  };

  const copyToClipboard = (text) => {
      navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 flex flex-col items-center justify-center gap-8">
    <Link to={createPageUrl("Dashboard")} className="text-slate-400 hover:text-white transition-colors">
    ← Back to Dashboard
    </Link>

    {/* SSO Helper Card */}
    <Card className="w-full max-w-3xl bg-slate-900 border-slate-700 text-slate-100 shadow-2xl">
    <CardHeader className="border-b border-slate-800">
      <CardTitle className="flex items-center gap-2 text-white">
          <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
          </div>
          Apple SSO Configuration Helper
      </CardTitle>
      <p className="text-slate-400 text-sm">
          Use these values to configure <strong>Apple</strong> in the <strong>Dashboard → Authentication → Single Sign-On (SSO)</strong> section.
      </p>
    </CardHeader>
    <CardContent className="p-6 space-y-6">
      {!ssoConfig ? (
           <Button 
              onClick={generateSSOConfig} 
              disabled={configLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-12 text-lg font-bold"
           >
              {configLoading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Generate Configuration Values"}
           </Button>
      ) : (
          <div className="space-y-4">
              <div className="grid gap-4">
                  <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Discovery URL</label>
                      <div className="flex gap-2">
                          <code className="flex-1 bg-black/50 p-3 rounded border border-slate-700 font-mono text-sm text-blue-300 break-all">
                              {ssoConfig.discoveryUrl}
                          </code>
                          <Button variant="outline" size="icon" onClick={() => copyToClipboard(ssoConfig.discoveryUrl)}><Copy className="w-4 h-4" /></Button>
                      </div>
                  </div>

                  <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Client ID</label>
                      <div className="flex gap-2">
                          <code className="flex-1 bg-black/50 p-3 rounded border border-slate-700 font-mono text-sm text-green-300 break-all">
                              {ssoConfig.clientId}
                          </code>
                          <Button variant="outline" size="icon" onClick={() => copyToClipboard(ssoConfig.clientId)}><Copy className="w-4 h-4" /></Button>
                      </div>
                  </div>

                  <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">Client Secret (Generated - Valid 6 Months)</label>
                      <div className="flex gap-2">
                          <code className="flex-1 bg-black/50 p-3 rounded border border-slate-700 font-mono text-sm text-yellow-300 break-all line-clamp-1 hover:line-clamp-none transition-all cursor-pointer">
                              {ssoConfig.clientSecret}
                          </code>
                          <Button variant="outline" size="icon" onClick={() => copyToClipboard(ssoConfig.clientSecret)}><Copy className="w-4 h-4" /></Button>
                      </div>
                      <p className="text-xs text-yellow-500/80">* This secret expires in 180 days. You will need to regenerate and update it then.</p>
                  </div>

                  <div className="space-y-2">
                       <label className="text-xs font-bold text-slate-500 uppercase">Redirect URI (Callback URL)</label>
                       <div className="flex gap-2">
                           <code className="flex-1 bg-black/50 p-3 rounded border border-slate-700 font-mono text-sm text-purple-300 break-all">
                               {ssoConfig.redirectUri}
                           </code>
                           <Button variant="outline" size="icon" onClick={() => copyToClipboard(ssoConfig.redirectUri)}><Copy className="w-4 h-4" /></Button>
                       </div>
                       <p className="text-xs text-slate-500">Paste this into the Apple Developer Portal if needed, but mostly for the Base44 Dashboard.</p>
                   </div>
              </div>
          </div>
      )}
    </CardContent>
    </Card>

    <Card className="w-full max-w-3xl bg-slate-900 border-slate-800 text-slate-100 opacity-75 hover:opacity-100 transition-opacity">
    <CardHeader>
    <CardTitle className="flex items-center gap-2 text-white text-lg">
    <Key className="w-5 h-5 text-slate-400" />
    Key Validator (Debug Tool)
    </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
    <Textarea
    placeholder="Paste .p8 key content here to validate format..."
    className="font-mono text-xs h-24 bg-slate-950 border-slate-800 text-slate-300"
    value={keyInput}
    onChange={(e) => setKeyInput(e.target.value)}
    />

    <Button 
    onClick={handleTest} 
    disabled={isLoading || !keyInput}
    variant="outline"
    className="w-full"
    >
    {isLoading ? (
      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
    ) : (
      "Validate Key Format"
    )}
    </Button>

    {result && (
    <div className={`mt-4 p-4 rounded-lg border ${result.success ? 'bg-green-900/20 border-green-800' : 'bg-red-900/20 border-red-800'}`}>
       <p className="text-sm font-mono">{result.message || result.error}</p>
    </div>
    )}
    </CardContent>
    </Card>
    </div>
  );
}
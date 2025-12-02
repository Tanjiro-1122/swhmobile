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

  return (
    <div className="min-h-screen bg-slate-950 p-6 flex flex-col items-center justify-center">
        <Link to={createPageUrl("Dashboard")} className="mb-8 text-slate-400 hover:text-white transition-colors">
            ← Back to Dashboard
        </Link>
      <Card className="w-full max-w-2xl bg-slate-900 border-slate-800 text-slate-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Key className="w-6 h-6 text-blue-400" />
            Apple Private Key Tester
          </CardTitle>
          <p className="text-slate-400 text-sm">
            Paste the content of your <code>.p8</code> file below to verify if it is a valid Apple Sign In key.
            This will check the format and encryption type.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
            className="font-mono text-xs h-64 bg-slate-950 border-slate-800 text-slate-300"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
          />
          
          <Button 
            onClick={handleTest} 
            disabled={isLoading || !keyInput}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              "Test Key Validity"
            )}
          </Button>

          {result && (
            <div className={`mt-4 p-4 rounded-lg border ${result.success ? 'bg-green-900/20 border-green-800' : 'bg-red-900/20 border-red-800'}`}>
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                )}
                <div>
                  <h3 className={`font-semibold ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                    {result.success ? "Valid Key Detected" : "Invalid Key Detected"}
                  </h3>
                  <p className="text-slate-300 text-sm mt-1">
                    {result.message || result.error}
                  </p>
                  {result.details && (
                    <div className="mt-2 bg-black/30 p-2 rounded text-xs font-mono text-slate-400 overflow-x-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
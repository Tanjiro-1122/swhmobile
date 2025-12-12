import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function TestAppleKey() {
  const [keyContent, setKeyContent] = useState("");
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);

  const testKey = async () => {
    setTesting(true);
    setResult(null);
    
    try {
      const response = await base44.functions.invoke('handleAppleSignIn', {
        action: 'testManualKey',
        manualKey: keyContent
      });
      
      setResult(response.data);
    } catch (error) {
      setResult({ success: false, error: error.message });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Test Apple P8 Private Key</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Paste your P8 key content (entire file or just the base64 part):
            </label>
            <Textarea
              value={keyContent}
              onChange={(e) => setKeyContent(e.target.value)}
              placeholder="-----BEGIN PRIVATE KEY-----&#10;MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...&#10;-----END PRIVATE KEY-----"
              rows={8}
              className="font-mono text-sm"
            />
          </div>

          <Button 
            onClick={testKey} 
            disabled={!keyContent || testing}
            className="w-full"
          >
            {testing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing Key...
              </>
            ) : (
              'Test Key'
            )}
          </Button>

          {result && (
            <Alert className={result.success ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}>
              <div className="flex items-start gap-2">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                )}
                <AlertDescription className={result.success ? "text-green-800" : "text-red-800"}>
                  {result.success ? (
                    <div>
                      <div className="font-bold mb-1">✓ Valid Key</div>
                      <div className="text-sm">{result.message}</div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-bold mb-1">✗ Invalid Key</div>
                      <div className="text-sm">{result.error}</div>
                    </div>
                  )}
                </AlertDescription>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
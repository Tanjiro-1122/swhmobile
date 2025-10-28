import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Key, Save, ExternalLink, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function ApiKeySettings() {
  const [apiKey, setApiKey] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load saved API key from localStorage
    const storedKey = localStorage.getItem('odds_api_key');
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('odds_api_key', apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Key className="w-5 h-5 text-blue-400" />
          The Odds API Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-blue-500/10 border-blue-500/30">
          <AlertDescription className="text-blue-300 text-sm">
            Get your free API key from{" "}
            <a 
              href="https://the-odds-api.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline font-bold inline-flex items-center gap-1"
            >
              the-odds-api.com
              <ExternalLink className="w-3 h-3" />
            </a>
            {" "}(500 free requests/month)
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-300">API Key</label>
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Odds API key"
            className="bg-slate-900 border-slate-700 text-white"
          />
        </div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={handleSave}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {saved ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save API Key
              </>
            )}
          </Button>
        </motion.div>

        <div className="pt-4 border-t border-slate-700">
          <h4 className="text-sm font-semibold text-white mb-2">How to get your API key:</h4>
          <ol className="text-sm text-slate-400 space-y-1 list-decimal list-inside">
            <li>Visit <span className="text-blue-400">the-odds-api.com</span></li>
            <li>Click "Get API Key" and sign up</li>
            <li>Copy your API key from the dashboard</li>
            <li>Paste it above and click Save</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
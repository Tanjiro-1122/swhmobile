import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Shield, Lock, CheckCircle, AlertTriangle, Loader2, Database
} from "lucide-react";
import { motion } from "framer-motion";

export default function DataExportConsentGate({ onAccept, isLoading }) {
  const [agreed, setAgreed] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      {/* Main Consent Card */}
      <Card className="border border-purple-500/30 bg-black/40 backdrop-blur-sm overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Data Privacy Agreement</h2>
              <p className="text-white/80 text-sm">Required before exporting your gaming data</p>
            </div>
          </div>
        </div>

        <CardContent className="p-6 space-y-5">
          {/* What We Store */}
          <div>
            <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              What Data is Stored
            </h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                Your bet history (types, odds, stakes, results)
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                Saved match analyses, player stats, and team stats
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                Performance metrics and ROI calculations
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                AI prediction outcomes and accuracy records
              </li>
            </ul>
          </div>

          {/* Security Measures */}
          <div>
            <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-purple-400" />
              How We Protect Your Data
            </h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                All data is encrypted at rest and in transit (AES-256 / TLS 1.3)
              </li>
              <li className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                Your data is only accessible to you — nobody else can view or download it
              </li>
              <li className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                We never sell, share, or disclose your gaming data to third parties
              </li>
              <li className="flex items-start gap-2">
                <Shield className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                Export files are generated on-demand and not cached on our servers
              </li>
            </ul>
          </div>

          {/* What We Don't Do */}
          <div>
            <h3 className="text-white font-bold text-sm mb-3 flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-red-400" />
              What We Do NOT Do
            </h3>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                We never share your data with sportsbooks, advertisers, or any third party
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                We never use your personal betting data in aggregate analytics or reports
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                We never retain exported files beyond the moment of download
              </li>
            </ul>
          </div>

          {/* Revoke Notice */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <p className="text-amber-300 text-xs">
              <strong>You can revoke this consent at any time.</strong> Revoking consent will disable data export features but will not delete previously stored data. Contact support to request full data deletion.
            </p>
          </div>

          {/* Agreement Checkbox */}
          <div className="border-t border-white/10 pt-4">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 rounded border-white/30 bg-white/10 text-purple-500 focus:ring-purple-500"
              />
              <span className="text-sm text-slate-300 group-hover:text-white transition-colors">
                I agree to securely store my gaming information with Sports Wager Helper. I understand that my data is encrypted, private, and will not be shared with anyone. I consent to exporting my data in CSV and PDF formats for personal use only.
              </span>
            </label>
          </div>

          <Button
            onClick={onAccept}
            disabled={!agreed || isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4 mr-2" />
                I Agree — Enable Secure Data Export
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
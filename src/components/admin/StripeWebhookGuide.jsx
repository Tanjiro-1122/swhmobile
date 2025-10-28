import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Copy, Webhook, AlertCircle, ExternalLink } from "lucide-react";

export default function StripeWebhookGuide() {
  const [copied, setCopied] = useState(false);

  const webhookUrl = `${window.location.origin}/api/stripe-webhook`;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border-2 border-purple-300 bg-purple-50">
      <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <CardTitle className="flex items-center gap-3">
          <Webhook className="w-6 h-6" />
          Stripe Webhook Setup (Required for Auto-Upgrades)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <Alert className="bg-yellow-50 border-yellow-300">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <AlertDescription className="text-yellow-800 ml-2">
            <strong>⚠️ Important:</strong> Without webhooks, users won't automatically get upgraded after payment. You'll have to upgrade them manually in the Admin Panel.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <h3 className="font-bold text-lg text-gray-900">Why You Need Webhooks:</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>✅ Automatically upgrade users from Free → VIP/Premium after payment</li>
            <li>✅ Handle failed payments and downgrade users</li>
            <li>✅ Process refunds automatically</li>
            <li>✅ Track subscription cancellations</li>
          </ul>
        </div>

        <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
          <h3 className="font-bold text-gray-900 mb-3">📋 Setup Steps:</h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-purple-600 text-white">Step 1</Badge>
                <span className="font-semibold text-gray-900">Go to Stripe Dashboard</span>
              </div>
              <a
                href="https://dashboard.stripe.com/webhooks"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 underline"
              >
                Open Stripe Webhooks
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-purple-600 text-white">Step 2</Badge>
                <span className="font-semibold text-gray-900">Click "Add endpoint"</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-purple-600 text-white">Step 3</Badge>
                <span className="font-semibold text-gray-900">Paste this webhook URL:</span>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-gray-100 px-3 py-2 rounded border border-gray-300 text-sm font-mono text-gray-800 break-all">
                  {webhookUrl}
                </code>
                <Button
                  onClick={() => copyToClipboard(webhookUrl)}
                  size="sm"
                  variant="outline"
                  className="flex-shrink-0"
                >
                  {copied ? <CheckCircle className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-purple-600 text-white">Step 4</Badge>
                <span className="font-semibold text-gray-900">Select these events:</span>
              </div>
              <ul className="list-none space-y-1 ml-4 text-sm text-gray-700">
                <li>✓ <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">checkout.session.completed</code></li>
                <li>✓ <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">customer.subscription.created</code></li>
                <li>✓ <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">customer.subscription.updated</code></li>
                <li>✓ <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">customer.subscription.deleted</code></li>
                <li>✓ <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">invoice.payment_failed</code></li>
              </ul>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-purple-600 text-white">Step 5</Badge>
                <span className="font-semibold text-gray-900">Click "Add endpoint"</span>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-purple-600 text-white">Step 6</Badge>
                <span className="font-semibold text-gray-900">Copy the "Signing secret"</span>
              </div>
              <p className="text-sm text-gray-600 ml-4">
                After creating the webhook, Stripe will show you a "Signing secret" (starts with <code className="bg-gray-100 px-1 rounded text-xs">whsec_...</code>). Copy this - you'll need it!
              </p>
            </div>
          </div>
        </div>

        <Alert className="bg-blue-50 border-blue-300">
          <AlertDescription className="text-blue-800">
            <strong>💡 Note:</strong> The base44 platform will handle the webhook endpoint automatically. You just need to configure it in Stripe and provide the signing secret to base44 support.
          </AlertDescription>
        </Alert>

        <div className="bg-green-50 rounded-lg p-4 border-2 border-green-200">
          <h3 className="font-bold text-green-900 mb-2 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            After Setup:
          </h3>
          <ul className="list-disc list-inside space-y-1 text-green-800 text-sm">
            <li>Users will automatically get upgraded after payment</li>
            <li>You'll receive webhook confirmations in Stripe dashboard</li>
            <li>Failed payments will automatically downgrade users</li>
            <li>No manual work required!</li>
          </ul>
        </div>

        <Alert>
          <AlertDescription>
            <strong>Need Help?</strong> Contact base44 support with your webhook signing secret and they'll complete the integration for you.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
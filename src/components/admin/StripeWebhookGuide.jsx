import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StripeWebhookGuide() {
  const webhookURL = "YOUR_BASE44_WEBHOOK_URL"; // Replace with actual webhook URL when available

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <Card className="border-2 border-blue-200 bg-blue-50">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-6 h-6" />
          Stripe Webhook Setup Required
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <Alert className="bg-yellow-50 border-yellow-300">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <AlertDescription className="text-yellow-800 ml-2">
            <strong>Important:</strong> To automatically upgrade users after payment, you must set up Stripe webhooks. 
            Follow the steps below.
          </AlertDescription>
        </Alert>

        <div>
          <h3 className="font-bold text-gray-900 mb-3 text-lg">📋 Setup Instructions (5 minutes):</h3>
          
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-blue-500">Step 1</Badge>
                <span className="font-bold text-gray-900">Go to Stripe Webhooks Page</span>
              </div>
              <p className="text-gray-700 mb-2">
                Visit: <a href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                  https://dashboard.stripe.com/webhooks
                </a>
              </p>
              <Button
                onClick={() => window.open('https://dashboard.stripe.com/webhooks', '_blank')}
                variant="outline"
                size="sm"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Stripe Webhooks
              </Button>
            </div>

            <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-blue-500">Step 2</Badge>
                <span className="font-bold text-gray-900">Click "Add Endpoint"</span>
              </div>
              <p className="text-gray-700">
                Click the blue "Add endpoint" button in the top right corner.
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-blue-500">Step 3</Badge>
                <span className="font-bold text-gray-900">Add Webhook URL</span>
              </div>
              <p className="text-gray-700 mb-2">
                In the "Endpoint URL" field, paste this URL:
              </p>
              <div className="bg-gray-100 p-3 rounded border border-gray-300 flex items-center justify-between">
                <code className="text-sm text-gray-800">{webhookURL}</code>
                <Button
                  onClick={() => copyToClipboard(webhookURL)}
                  variant="ghost"
                  size="sm"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                ⚠️ If you don't have this URL yet, contact base44 support to get your webhook endpoint
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-blue-500">Step 4</Badge>
                <span className="font-bold text-gray-900">Select Events to Listen</span>
              </div>
              <p className="text-gray-700 mb-2">
                Click "Select events" and choose these two events:
              </p>
              <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
                <li><code className="bg-gray-100 px-2 py-0.5 rounded text-sm">checkout.session.completed</code></li>
                <li><code className="bg-gray-100 px-2 py-0.5 rounded text-sm">customer.subscription.deleted</code></li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-blue-500">Step 5</Badge>
                <span className="font-bold text-gray-900">Save and Copy Signing Secret</span>
              </div>
              <p className="text-gray-700 mb-2">
                Click "Add endpoint". Then:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-gray-700 ml-4">
                <li>Click on your newly created webhook</li>
                <li>Click "Reveal" next to "Signing secret"</li>
                <li>Copy the secret (starts with <code>whsec_...</code>)</li>
                <li>Send it to base44 support or add it to your environment variables</li>
              </ol>
            </div>

            <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-green-500">Step 6</Badge>
                <span className="font-bold text-gray-900">Test the Webhook</span>
              </div>
              <p className="text-gray-700 mb-2">
                In Stripe webhook settings, click "Send test webhook" and select:
              </p>
              <code className="bg-gray-100 px-2 py-1 rounded text-sm">checkout.session.completed</code>
              <p className="text-gray-700 mt-2">
                If you see a green checkmark (200 response), it's working! ✅
              </p>
            </div>
          </div>
        </div>

        <Alert className="bg-green-50 border-green-300">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <AlertDescription className="text-green-800 ml-2">
            <strong>Once webhooks are set up:</strong> Users will be automatically upgraded to VIP/Premium immediately after payment. 
            No manual work required!
          </AlertDescription>
        </Alert>

        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="font-bold text-gray-900 mb-2">❓ Need Help?</h4>
          <p className="text-gray-700 text-sm">
            If you're stuck, contact base44 support or email support@sportswagerhelper.com. 
            We can help you set up webhooks or provide your webhook endpoint URL.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
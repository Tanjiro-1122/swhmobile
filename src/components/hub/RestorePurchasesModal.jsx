import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { base44 } from "@/api/base44Client";
import { Loader2, CheckCircle2, AlertCircle, Apple, Smartphone } from "lucide-react";

export default function RestorePurchasesModal({ open, onOpenChange }) {
  const [restoring, setRestoring] = useState(false);
  const [result, setResult] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent || '';
    setIsIOS(/iPhone|iPad|iPod/i.test(ua));
    setIsAndroid(/Android/i.test(ua));
  }, []);

  const handleRestore = async () => {
    setRestoring(true);
    setResult(null);

    try {
      if (isIOS) {
        // iOS restore logic
        if (typeof window.WTN !== 'undefined' && typeof window.WTN.getReceipt === 'function') {
          window.WTN.getReceipt({
            callback: async (data) => {
              if (data.isSuccess && data.receipt) {
                try {
                  const response = await base44.functions.invoke('restoreAppleReceipt', {
                    receiptBase64: data.receipt
                  });

                  if (response.data?.success) {
                    setResult({
                      type: 'success',
                      message: `Successfully restored ${response.data.subscription.type} subscription!`,
                      subscription: response.data.subscription
                    });
                    // Refresh page after 2 seconds to show updated subscription
                    setTimeout(() => window.location.reload(), 2000);
                  } else {
                    setResult({
                      type: 'error',
                      message: response.data?.error || 'Failed to restore purchases'
                    });
                  }
                } catch (error) {
                  setResult({
                    type: 'error',
                    message: 'Server error during restore. Please try again.'
                  });
                }
              } else {
                setResult({
                  type: 'error',
                  message: 'Could not retrieve receipt from device'
                });
              }
              setRestoring(false);
            }
          });
        } else {
          setTimeout(() => {
            setResult({
              type: 'info',
              message: 'This feature requires the iOS app. Please open Sports Wager Helper in the App Store.'
            });
            setRestoring(false);
          }, 500);
        }
      } else if (isAndroid) {
        // Android restore logic
        if (typeof window.WTN !== 'undefined' && typeof window.WTN.getPurchases === 'function') {
          window.WTN.getPurchases({
            callback: async (data) => {
              if (data.isSuccess && data.purchases && data.purchases.length > 0) {
                try {
                  // Find most recent subscription purchase
                  const subscriptionPurchase = data.purchases.find(p => 
                    p.productId && (p.productId.includes('premium') || p.productId.includes('vip') || p.productId.includes('annual'))
                  );

                  if (!subscriptionPurchase) {
                    setResult({
                      type: 'error',
                      message: 'No valid subscription purchases found to restore.'
                    });
                    setRestoring(false);
                    return;
                  }

                  const response = await base44.functions.invoke('restoreGooglePlayPurchase', {
                    purchaseToken: subscriptionPurchase.purchaseToken,
                    productId: subscriptionPurchase.productId
                  });

                  if (response.data?.success) {
                    setResult({
                      type: 'success',
                      message: `Successfully restored your subscription!`
                    });
                    // Refresh page after 2 seconds to show updated subscription
                    setTimeout(() => window.location.reload(), 2000);
                  } else {
                    setResult({
                      type: 'error',
                      message: response.data?.error || 'Failed to restore purchases'
                    });
                  }
                } catch (error) {
                  setResult({
                    type: 'error',
                    message: 'Server error during restore. Please try again.'
                  });
                }
              } else {
                setResult({
                  type: 'error',
                  message: 'No purchases found on this device'
                });
              }
              setRestoring(false);
            }
          });
        } else {
          setTimeout(() => {
            setResult({
              type: 'info',
              message: 'This feature requires the Android app. Please open Sports Wager Helper in the Play Store.'
            });
            setRestoring(false);
          }, 500);
        }
      } else {
        setResult({
          type: 'info',
          message: 'Restore purchases is only available on mobile devices.'
        });
        setRestoring(false);
      }
    } catch (error) {
      setResult({
        type: 'error',
        message: 'An error occurred. Please try again or contact support.'
      });
      setRestoring(false);
    }
  };

  const Icon = isIOS ? Apple : Smartphone;
  const storeName = isIOS ? "App Store" : isAndroid ? "Google Play" : "App Store/Google Play";
  const accountType = isIOS ? "Apple ID" : isAndroid ? "Google account" : "account";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="w-5 h-5" />
            Restore Purchases
          </DialogTitle>
          <DialogDescription>
            Restore your {storeName} subscription to link it with your account
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {result && (
            <Alert className={
              result.type === 'success' ? 'bg-green-50 border-green-300' :
              result.type === 'error' ? 'bg-red-50 border-red-300' :
              'bg-blue-50 border-blue-300'
            }>
              {result.type === 'success' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              {result.type === 'error' && <AlertCircle className="h-4 w-4 text-red-600" />}
              <AlertDescription className={
                result.type === 'success' ? 'text-green-800' :
                result.type === 'error' ? 'text-red-800' :
                'text-blue-800'
              }>
                {result.message}
              </AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-gray-600 space-y-2">
            <p className="font-semibold">Instructions:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Make sure you're signed in to the same {accountType} used for purchase</li>
              <li>Open the Sports Wager Helper {isIOS ? "iOS" : isAndroid ? "Android" : "mobile"} app</li>
              <li>Click the "Restore Purchases" button below</li>
              <li>Your subscription will be linked to this account</li>
            </ol>
          </div>

          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
            <p className="font-semibold mb-1">Note:</p>
            <p>If you cannot access the mobile app or encounter issues, please contact support with your {storeName} transaction ID or receipt screenshot.</p>
          </div>

          <Button 
            onClick={handleRestore} 
            disabled={restoring}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            {restoring ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Restoring...
              </>
            ) : (
              <>
                <Icon className="w-4 h-4 mr-2" />
                Restore Purchases
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
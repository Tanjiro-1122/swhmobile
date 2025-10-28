import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft, HelpCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function PaymentCancelled() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-2xl"
      >
        <Card className="border-2 border-slate-700 bg-slate-800/90 shadow-2xl">
          <CardContent className="p-8 sm:p-12 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 150 }}
              className="w-24 h-24 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center border-4 border-red-500"
            >
              <XCircle className="w-16 h-16 text-red-500" />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-black text-white mb-4"
            >
              Payment Cancelled
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-slate-300 mb-8"
            >
              No charges were made to your account
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-slate-700/50 rounded-xl p-6 mb-8 text-left"
            >
              <h2 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                <HelpCircle className="w-5 h-5" />
                What Happened?
              </h2>
              <p className="text-slate-300 mb-4">
                Your payment was cancelled before completion. This could have happened for several reasons:
              </p>
              <ul className="space-y-2 text-slate-300 list-disc list-inside">
                <li>You clicked the back button during checkout</li>
                <li>Payment was declined by your bank</li>
                <li>You closed the payment window</li>
                <li>Technical issue with the payment processor</li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 mb-8"
            >
              <p className="text-blue-300 mb-3">
                💡 <strong>Want to try again?</strong>
              </p>
              <p className="text-slate-300 text-sm">
                Head back to our pricing page to select your plan. If you experienced a technical issue, 
                please try a different payment method or contact support.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Button
                onClick={() => navigate(createPageUrl("Pricing"))}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-lg py-6"
                size="lg"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Pricing
              </Button>
              <Button
                onClick={() => navigate(createPageUrl("Dashboard"))}
                variant="outline"
                className="flex-1 border-2 border-slate-600 text-slate-300 hover:bg-slate-700 font-bold text-lg py-6"
                size="lg"
              >
                Continue with Free Plan
              </Button>
            </motion.div>

            <div className="mt-8 pt-6 border-t border-slate-700">
              <p className="text-slate-400 text-sm mb-2">
                <strong>Need help?</strong>
              </p>
              <p className="text-slate-500 text-sm">
                Contact support at support@sportswagerhelper.com or use the feedback button
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
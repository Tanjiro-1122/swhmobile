import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm mx-auto mb-6">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-black mb-4">Privacy Policy</h1>
            <p className="text-xl text-purple-100">Last Updated: {new Date().toLocaleDateString()}</p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-8 space-y-8 text-slate-300">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Information We Collect</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Account Information</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Email address</li>
                    <li>Full name</li>
                    <li>Password (encrypted)</li>
                    <li>Subscription status</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Usage Data</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Search queries and predictions viewed</li>
                    <li>Pages visited and time spent</li>
                    <li>Device and browser information</li>
                    <li>IP address and location (city/state level)</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Payment Information</h3>
                  <p>Processed securely through Stripe. We do NOT store credit card numbers.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. How We Use Your Information</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide and improve our Service</li>
                <li>Send you predictions and updates (if subscribed to emails)</li>
                <li>Process payments and manage subscriptions</li>
                <li>Analyze usage patterns to improve accuracy</li>
                <li>Comply with legal obligations</li>
                <li>Prevent fraud and abuse</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. Data Sharing</h2>
              <p className="leading-relaxed mb-4">
                We do NOT sell your personal information. We may share data with:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Stripe:</strong> For payment processing</li>
                <li><strong>Base44:</strong> Our hosting and database provider</li>
                <li><strong>Law Enforcement:</strong> When required by law</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Cookies and Tracking</h2>
              <p className="leading-relaxed">
                We use localStorage to track your free searches (5 limit for non-subscribers). 
                No third-party advertising cookies. You can clear your browser data anytime.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Data Security</h2>
              <p className="leading-relaxed">
                We use industry-standard encryption and security measures. However, no system is 100% secure. 
                Use strong passwords and enable two-factor authentication when available.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Your Rights</h2>
              <p className="leading-relaxed mb-4">You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Access your data (email us for a copy)</li>
                <li>Correct inaccurate information</li>
                <li>Delete your account</li>
                <li>Opt-out of marketing emails</li>
                <li>Export your saved predictions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Data Retention</h2>
              <p className="leading-relaxed">
                We retain your account data as long as your account is active. If you delete your account, 
                we remove personal information within 30 days (some data may be retained for legal compliance).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Children's Privacy</h2>
              <p className="leading-relaxed">
                Our Service is NOT intended for users under 21. We do not knowingly collect data from minors.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Changes to This Policy</h2>
              <p className="leading-relaxed">
                We may update this Privacy Policy from time to time. We'll notify you of significant changes 
                via email or prominent notice on the website.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. Contact Us</h2>
              <p className="leading-relaxed">
                Questions or concerns about privacy? Email us at: <a href="mailto:sportswagerhelper@outlook.com" className="text-blue-400 hover:text-blue-300">sportswagerhelper@outlook.com</a>
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
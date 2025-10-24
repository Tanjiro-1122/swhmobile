import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, AlertTriangle, Scale } from "lucide-react";
import { motion } from "framer-motion";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm mx-auto mb-6">
              <Scale className="w-10 h-10" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-black mb-4">Terms of Service</h1>
            <p className="text-xl text-blue-100">Last Updated: {new Date().toLocaleDateString()}</p>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Important Notice */}
        <Card className="bg-red-500/10 border-2 border-red-500/50 mb-8">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-8 h-8 text-red-400 flex-shrink-0" />
              <div>
                <h3 className="text-xl font-bold text-red-300 mb-2">⚠️ GAMBLING DISCLAIMER</h3>
                <p className="text-red-200 leading-relaxed">
                  Sports Wager Helper provides sports analytics and predictions FOR ENTERTAINMENT PURPOSES ONLY. 
                  We are NOT a licensed gambling operator. All predictions are AI-generated estimates based on 
                  statistical analysis and should not be considered financial or betting advice. Gambling involves 
                  risk of loss. Only bet what you can afford to lose. If you have a gambling problem, call 
                  1-800-GAMBLER.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Terms Content */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-8 space-y-8 text-slate-300">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
              <p className="leading-relaxed">
                By accessing and using Sports Wager Helper ("the Service"), you agree to be bound by these Terms 
                of Service. If you do not agree to these terms, please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Age Requirement</h2>
              <p className="leading-relaxed mb-4">
                You must be at least 21 years old to use this Service. By using this Service, you represent and 
                warrant that you are at least 21 years of age.
              </p>
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <p className="text-yellow-300 font-semibold">🔞 21+ ONLY - Age verification may be required</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. Service Description</h2>
              <p className="leading-relaxed mb-4">
                Sports Wager Helper provides:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>AI-powered sports analytics and predictions</li>
                <li>Statistical analysis of matches, players, and teams</li>
                <li>Betting market insights and probabilities</li>
                <li>Historical performance tracking</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. No Guarantee of Accuracy</h2>
              <p className="leading-relaxed mb-4">
                <strong className="text-red-400">IMPORTANT:</strong> All predictions, statistics, and analyses are 
                estimates based on available data and AI algorithms. We make NO GUARANTEES regarding:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Accuracy of predictions</li>
                <li>Winning outcomes</li>
                <li>Profitability of betting decisions</li>
                <li>Real-time data accuracy</li>
              </ul>
              <p className="leading-relaxed mt-4">
                Past performance does not guarantee future results. Sports outcomes are inherently unpredictable.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Not Financial or Betting Advice</h2>
              <p className="leading-relaxed">
                The information provided by Sports Wager Helper is FOR INFORMATIONAL AND ENTERTAINMENT PURPOSES ONLY. 
                It is not intended as, and should not be considered, financial advice, betting advice, or a 
                recommendation to place any wagers. You are solely responsible for your own betting decisions and 
                any consequences thereof.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Subscription and Payments</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Free Account</h3>
                  <p>Limited to 5 searches. No credit card required.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">VIP Lifetime (First 20 Users)</h3>
                  <p>FREE unlimited access for the first 20 users who sign up. Non-transferable. No expiration.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Premium Monthly ($9.99/month)</h3>
                  <p>Unlimited searches. Billed monthly via Stripe. Cancel anytime.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Premium Yearly ($99/year)</h3>
                  <p>Unlimited searches. Save 17% vs monthly. Billed annually via Stripe.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Refund Policy</h2>
              <p className="leading-relaxed">
                Monthly subscriptions: No refunds for partial months. Cancel anytime to avoid future charges.
                <br />
                Yearly subscriptions: 30-day money-back guarantee if you're not satisfied.
                <br />
                VIP Lifetime: Non-refundable (it's free anyway!).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Responsible Gambling</h2>
              <p className="leading-relaxed mb-4">
                We strongly encourage responsible gambling practices:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Never bet more than you can afford to lose</li>
                <li>Set strict budgets and stick to them</li>
                <li>Don't chase losses</li>
                <li>Take breaks if gambling becomes stressful</li>
                <li>Seek help if you have a gambling problem: 1-800-GAMBLER</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. User Conduct</h2>
              <p className="leading-relaxed mb-4">You agree NOT to:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Share your account credentials</li>
                <li>Resell or redistribute our predictions</li>
                <li>Use bots or automated systems to access the Service</li>
                <li>Attempt to reverse-engineer our AI algorithms</li>
                <li>Use the Service for illegal purposes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">10. Limitation of Liability</h2>
              <p className="leading-relaxed">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, SPORTS WAGER HELPER SHALL NOT BE LIABLE FOR ANY INDIRECT, 
                INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF 
                PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR USE OF THE SERVICE 
                OR ANY BETTING DECISIONS MADE BASED ON OUR PREDICTIONS.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">11. Data Sources</h2>
              <p className="leading-relaxed">
                We aggregate data from public sources including StatMuse, ESPN, Basketball-Reference, 
                Pro-Football-Reference, and official league websites. We are not affiliated with these organizations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">12. Changes to Terms</h2>
              <p className="leading-relaxed">
                We reserve the right to modify these Terms at any time. Continued use of the Service after changes 
                constitutes acceptance of the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">13. Contact</h2>
              <p className="leading-relaxed">
                Questions about these Terms? Email us at: <a href="mailto:sportswagerhelper@outlook.com" className="text-blue-400 hover:text-blue-300">sportswagerhelper@outlook.com</a>
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
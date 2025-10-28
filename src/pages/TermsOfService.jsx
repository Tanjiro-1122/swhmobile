
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CreditCard, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="border-2 border-slate-700 bg-slate-800/90 backdrop-blur-xl">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardTitle className="text-3xl font-bold flex items-center gap-3">
              <FileText className="w-8 h-8" />
              Terms of Service
            </CardTitle>
            <p className="text-blue-100 mt-2">Last Updated: January 2025</p>
          </CardHeader>

          <CardContent className="p-6 sm:p-8 space-y-8 text-slate-300">
            <div className="space-y-6 text-gray-700"> {/* This div was originally for space-y-6, adjusting to new design */}
              <section className="bg-red-50 p-6 rounded-lg border-2 border-red-200 text-red-800">
                <h2 className="text-2xl font-bold text-red-900 mb-3">⚠️ IMPORTANT DISCLAIMERS</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>NOT A LICENSED BETTING ADVISOR:</strong> We are NOT a licensed gambling advisor, bookmaker, or financial advisor</li>
                  <li><strong>EDUCATIONAL PURPOSES:</strong> All predictions and analyses are for informational and educational purposes ONLY</li>
                  <li><strong>NO GUARANTEES:</strong> Past performance does NOT guarantee future results. All sports betting involves risk</li>
                  <li><strong>BET RESPONSIBLY:</strong> Never bet more than you can afford to lose. If you have a gambling problem, seek help immediately</li>
                  <li><strong>AGE RESTRICTION:</strong> You must be 18+ (or 21+ where legally required) to use this app</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">1. Agreement to Terms</h2>
                <p>
                  By accessing and using Sports Wager Helper ("the App"), you agree to be bound by these Terms of Service ("Terms"). 
                  If you disagree with any part of these terms, you may not use our app.
                </p>
                <p className="mt-4">
                  These Terms apply to all users, including Free users, VIP Lifetime members, and Premium Monthly subscribers.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">2. Service Description</h2>
                <p>Sports Wager Helper provides:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>AI-Powered Analysis:</strong> Match predictions, player statistics, and team performance data</li>
                  <li><strong>Live Odds Comparison:</strong> Real-time odds from multiple sportsbooks</li>
                  <li><strong>Betting Tools:</strong> Calculators, bankroll management, ROI tracking, parlay builders</li>
                  <li><strong>Educational Content:</strong> Betting strategies, terminology, and responsible gambling resources</li>
                  <li><strong>Community Features:</strong> Discussion forums and bet sharing (optional)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">3. User Eligibility</h2>
                <h3 className="text-xl font-semibold text-gray-200 mb-2">3.1 Age Requirements</h3>
                <p>
                  You must be at least <strong>18 years old</strong> (or <strong>21 years old</strong> in jurisdictions where that is the legal gambling age) 
                  to use this app. By using our services, you confirm that you meet this age requirement.
                </p>

                <h3 className="text-xl font-semibold text-gray-200 mb-2 mt-4">3.2 Legal Compliance</h3>
                <p>
                  You are responsible for ensuring that your use of the app complies with all applicable laws in your jurisdiction. 
                  Sports betting is illegal in some regions - it is YOUR responsibility to know and follow local laws.
                </p>
              </section>
              
              {/* The following section replaces the original "4. Subscription Plans" and "5. Refund Policy" */}
              <section>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-green-400" />
                  4. Payments & Refunds
                </h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Pricing Plans</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li><strong>Free Tier:</strong> 5 free lookups, limited features</li>
                      <li><strong>VIP Lifetime:</strong> $149.99 one-time payment (limited to first 20 users)</li>
                      <li><strong>Premium Monthly:</strong> $29.99/month recurring subscription</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Payment Processing</h3>
                    <p>All payments processed securely through Stripe. We do not store credit card information.</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Refund Policy</h3>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li><strong>VIP Lifetime:</strong> 14-day money-back guarantee from purchase date (no questions asked)</li>
                      <li><strong>Premium Monthly:</strong> No refunds for partial months. Cancel before next billing cycle to avoid charges</li>
                      <li><strong>Technical Issues:</strong> If our app has significant downtime (greater than 24 hours), contact us for pro-rated refund</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Cancellation</h3>
                    <p>Premium Monthly can be cancelled anytime via Settings &rarr; Billing. Access continues until end of billing period.</p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">5. Prohibited Uses</h2>
                <p>You agree NOT to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>❌ Use the app if you're under the legal gambling age</li>
                  <li>❌ Share your account credentials with others</li>
                  <li>❌ Scrape, copy, or redistribute our AI predictions commercially</li>
                  <li>❌ Reverse engineer or attempt to hack the app</li>
                  <li>❌ Use bots or automated systems to abuse free lookups</li>
                  <li>❌ Post illegal, offensive, or harmful content in community forums</li>
                  <li>❌ Claim our predictions as your own work</li>
                  <li>❌ Use the app for any illegal gambling activities</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">6. Intellectual Property</h2>
                <h3 className="text-xl font-semibold text-gray-200 mb-2">6.1 Our Content</h3>
                <p>
                  All app content (AI algorithms, designs, logos, text, graphics) is owned by Sports Wager Helper and protected by copyright laws. 
                  You may NOT copy, reproduce, or distribute our content without written permission.
                </p>

                <h3 className="text-xl font-semibold text-gray-200 mb-2 mt-4">6.2 Your Content</h3>
                <p>
                  When you post in community forums or share bets, you grant us a license to display and distribute that content within the app. 
                  You retain ownership of your posts.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">7. Disclaimers and Limitations of Liability</h2>
                <div className="bg-yellow-50 p-6 rounded-lg border-2 border-yellow-200 text-yellow-800">
                  <h3 className="text-xl font-bold text-yellow-900 mb-3">🚨 READ CAREFULLY 🚨</h3>
                  
                  <h4 className="font-bold text-yellow-800 mb-2">7.1 No Warranty</h4>
                  <p className="mb-4">
                    THE APP IS PROVIDED "AS IS" WITHOUT ANY WARRANTIES. We do not guarantee that:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Our predictions will be accurate</li>
                    <li>You will win money using our analysis</li>
                    <li>The app will be error-free or uninterrupted</li>
                    <li>Third-party odds data will always be available or accurate</li>
                  </ul>

                  <h4 className="font-bold text-yellow-800 mb-2 mt-4">7.2 Limitation of Liability</h4>
                  <p>
                    <strong>WE ARE NOT LIABLE FOR:</strong>
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li>Any financial losses from bets placed based on our analysis</li>
                    <li>Incorrect predictions or data errors</li>
                    <li>Technical issues, downtime, or data loss</li>
                    <li>Third-party services (sportsbooks, odds providers) failures</li>
                    <li>Gambling addiction or related harm</li>
                  </ul>
                  
                  <p className="font-bold mt-4">
                    MAXIMUM LIABILITY: Our total liability is limited to the amount you paid for your subscription (if any) in the last 12 months.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">8. Data Accuracy</h2>
                <p>
                  We strive for accuracy but cannot guarantee that:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>AI predictions are 100% correct (they're probabilistic, not certain)</li>
                  <li>Odds from third-party APIs are real-time (slight delays possible)</li>
                  <li>Injury reports are instantly updated (check official team sources)</li>
                  <li>Weather data is perfectly accurate</li>
                </ul>
                <p className="mt-4 font-semibold text-red-600">
                  ⚠️ ALWAYS verify critical information (odds, injury status) directly with sportsbooks before placing bets.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">9. Responsible Gambling</h2>
                <div className="bg-red-50 p-6 rounded-lg border-2 border-red-200 text-red-800">
                  <p className="font-bold mb-3">
                    We are committed to promoting responsible gambling. If you or someone you know has a gambling problem:
                  </p>
                  <ul className="list-none space-y-2">
                    <li>🇺🇸 <strong>National Gambling Helpline:</strong> 1-800-522-4700</li>
                    <li>🌐 <strong>Gamblers Anonymous:</strong> www.gamblersanonymous.org</li>
                    <li>💬 <strong>Crisis Text Line:</strong> Text "HELP" to 741741</li>
                  </ul>
                  <p className="mt-4">
                    <strong>Warning Signs:</strong> Chasing losses, betting more than you can afford, hiding betting from family, feeling anxious about betting
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">10. Account Termination</h2>
                <h3 className="text-xl font-semibold text-gray-200 mb-2">10.1 By You</h3>
                <p>
                  You may delete your account anytime through app settings. Your data will be permanently deleted within 30 days.
                </p>

                <h3 className="text-xl font-semibold text-gray-200 mb-2 mt-4">10.2 By Us</h3>
                <p>
                  We reserve the right to suspend or terminate accounts that:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Violate these Terms of Service</li>
                  <li>Abuse the system (e.g., creating multiple free accounts)</li>
                  <li>Engage in fraudulent activity</li>
                  <li>Post harmful content in community forums</li>
                </ul>
                <p className="mt-2">
                  Terminated accounts may not be eligible for refunds (except where required by law).
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">11. Changes to Terms</h2>
                <p>
                  We may modify these Terms at any time. Material changes will be communicated via:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Email notification</li>
                  <li>In-app notification</li>
                  <li>Updated "Last Modified" date</li>
                </ul>
                <p className="mt-4">
                  Continued use of the app after changes means you accept the new Terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">12. Governing Law</h2>
                <p>
                  These Terms are governed by the laws of [Your State/Country]. 
                  Any disputes will be resolved in the courts of [Your Jurisdiction].
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-3">13. Contact Us</h2>
                <p>Questions about these Terms? Contact us:</p>
                <ul className="list-none space-y-2 mt-4">
                  <li><strong>Email:</strong> support@sportswagerhelper.com</li>
                  <li><strong>In-App:</strong> Use the feedback button</li>
                  <li><strong>Mail:</strong> [Your Company Address]</li>
                </ul>
              </section>

              <section className="bg-green-50 p-6 rounded-lg border-2 border-green-200 mt-8 text-green-800">
                <h2 className="text-xl font-bold text-green-900 mb-3">✅ By Using This App, You Agree That:</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li>You are of legal gambling age in your jurisdiction</li>
                  <li>You understand that sports betting involves financial risk</li>
                  <li>Our predictions are educational, not guaranteed to be accurate</li>
                  <li>You are solely responsible for your betting decisions</li>
                  <li>You will gamble responsibly and within your means</li>
                </ul>
              </section>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}

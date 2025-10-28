
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="border-2 border-purple-200">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-8 h-8 text-purple-600" />
              <h1 className="text-4xl font-bold text-gray-900">Terms of Service</h1>
            </div>
            
            <p className="text-sm text-gray-600 mb-8">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>

            <div className="space-y-6 text-gray-700">
              <section className="bg-red-50 p-6 rounded-lg border-2 border-red-200">
                <h2 className="text-2xl font-bold text-red-900 mb-3">⚠️ IMPORTANT DISCLAIMERS</h2>
                <ul className="list-disc pl-6 space-y-2 text-red-800">
                  <li><strong>NOT A LICENSED BETTING ADVISOR:</strong> We are NOT a licensed gambling advisor, bookmaker, or financial advisor</li>
                  <li><strong>EDUCATIONAL PURPOSES:</strong> All predictions and analyses are for informational and educational purposes ONLY</li>
                  <li><strong>NO GUARANTEES:</strong> Past performance does NOT guarantee future results. All sports betting involves risk</li>
                  <li><strong>BET RESPONSIBLY:</strong> Never bet more than you can afford to lose. If you have a gambling problem, seek help immediately</li>
                  <li><strong>AGE RESTRICTION:</strong> You must be 18+ (or 21+ where legally required) to use this app</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">1. Agreement to Terms</h2>
                <p>
                  By accessing and using Sports Wager Helper ("the App"), you agree to be bound by these Terms of Service ("Terms"). 
                  If you disagree with any part of these terms, you may not use our app.
                </p>
                <p className="mt-4">
                  These Terms apply to all users, including Free users, VIP Lifetime members, and Premium Monthly subscribers.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">2. Service Description</h2>
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
                <h2 className="text-2xl font-bold text-gray-900 mb-3">3. User Eligibility</h2>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">3.1 Age Requirements</h3>
                <p>
                  You must be at least <strong>18 years old</strong> (or <strong>21 years old</strong> in jurisdictions where that is the legal gambling age) 
                  to use this app. By using our services, you confirm that you meet this age requirement.
                </p>

                <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">3.2 Legal Compliance</h3>
                <p>
                  You are responsible for ensuring that your use of the app complies with all applicable laws in your jurisdiction. 
                  Sports betting is illegal in some regions - it is YOUR responsibility to know and follow local laws.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">4. Subscription Plans</h2>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">4.1 Free Tier</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>5 free match/player/team lookups</li>
                  <li>Limited access to premium features</li>
                  <li>No subscription required</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">4.2 VIP Lifetime</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>One-time payment</strong> for lifetime access</li>
                  <li>Unlimited searches and analysis</li>
                  <li>First 20 users only (limited offer)</li>
                  <li>All premium features forever</li>
                  <li><strong>Non-refundable</strong> after 14-day money-back guarantee period</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">4.3 Premium Monthly</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Monthly recurring subscription</li>
                  <li>Unlimited searches and analysis</li>
                  <li>Cancel anytime (no prorated refunds for partial months)</li>
                  <li>Auto-renews unless cancelled 24 hours before renewal date</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">5. Refund Policy</h2>
                <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4 mb-4">
                  <h3 className="text-xl font-bold text-amber-900 mb-2">⚠️ IMPORTANT: Usage-Based Refund Policy</h3>
                  <p className="text-amber-800 font-semibold">
                    Refunds are ONLY available if you have used fewer than 20 searches (match predictions, player stats, or team stats combined).
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-800 mb-2">5.1 VIP Annual Subscription</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>14-Day Refund Window:</strong> Request a refund within 14 days of purchase</li>
                  <li><strong>Usage Limit:</strong> Refund is ONLY granted if you have performed fewer than 20 total searches (match predictions + player stats + team stats)</li>
                  <li><strong>How to Check Your Usage:</strong> Your total search count is visible in your account settings</li>
                  <li><strong>No Questions Asked:</strong> If you meet the criteria above (within 14 days + under 20 searches), we'll process your refund immediately</li>
                  <li><strong>After 20 Searches:</strong> No refunds available, as you have significantly utilized the service</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">5.2 Premium Monthly Subscription</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>No Prorated Refunds:</strong> No refunds for partial months</li>
                  <li><strong>Cancel Anytime:</strong> Cancel before next billing cycle to avoid future charges</li>
                  <li><strong>Access Until End of Period:</strong> You retain access until the end of your current billing period after cancellation</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">5.3 Technical Issues</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Significant Downtime:</strong> If our app has significant downtime (>24 consecutive hours), contact us for a pro-rated refund</li>
                  <li><strong>Service Failure:</strong> If our AI analysis or data sources fail to work as advertised, we'll investigate and may issue a refund or credit</li>
                </ul>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mt-4">
                  <h3 className="text-lg font-bold text-blue-900 mb-2">📊 How We Calculate Usage</h3>
                  <p className="text-blue-800 mb-2">Your "search count" includes:</p>
                  <ul className="list-disc pl-6 space-y-1 text-blue-800">
                    <li>Each match prediction/analysis</li>
                    <li>Each player stats lookup</li>
                    <li>Each team stats lookup</li>
                    <li>Each "Today's Best Bets" generation</li>
                  </ul>
                  <p className="text-blue-800 mt-2">
                    <strong>Example:</strong> If you've searched 10 matches, looked up 5 players, and 3 teams, your total count is 18 searches (eligible for refund if within 14 days).
                  </p>
                </div>

                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 mt-4">
                  <h3 className="text-lg font-bold text-red-900 mb-2">🚫 No Refunds After 20 Searches</h3>
                  <p className="text-red-800">
                    Once you've performed 20 or more searches, you have substantially utilized our premium AI services and data. 
                    At this point, refunds are no longer available. This policy protects against abuse while ensuring genuine dissatisfaction 
                    is addressed fairly.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">5.4 How to Request a Refund</h3>
                <p className="mb-2">To request a refund:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Email:</strong> support@sportswagerhelper.com with your account email and reason</li>
                  <li><strong>Subject Line:</strong> "Refund Request - [Your Email]"</li>
                  <li><strong>We'll Check:</strong> Your purchase date and total search count</li>
                  <li><strong>Processing Time:</strong> Refunds processed within 5-7 business days if approved</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">6. Prohibited Uses</h2>
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
                <h2 className="text-2xl font-bold text-gray-900 mb-3">7. Intellectual Property</h2>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">7.1 Our Content</h3>
                <p>
                  All app content (AI algorithms, designs, logos, text, graphics) is owned by Sports Wager Helper and protected by copyright laws. 
                  You may NOT copy, reproduce, or distribute our content without written permission.
                </p>

                <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">7.2 Your Content</h3>
                <p>
                  When you post in community forums or share bets, you grant us a license to display and distribute that content within the app. 
                  You retain ownership of your posts.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">8. Disclaimers and Limitations of Liability</h2>
                <div className="bg-yellow-50 p-6 rounded-lg border-2 border-yellow-200">
                  <h3 className="text-xl font-bold text-yellow-900 mb-3">🚨 READ CAREFULLY 🚨</h3>
                  
                  <h4 className="font-bold text-yellow-800 mb-2">8.1 No Warranty</h4>
                  <p className="text-yellow-800 mb-4">
                    THE APP IS PROVIDED "AS IS" WITHOUT ANY WARRANTIES. We do not guarantee that:
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-yellow-800">
                    <li>Our predictions will be accurate</li>
                    <li>You will win money using our analysis</li>
                    <li>The app will be error-free or uninterrupted</li>
                    <li>Third-party odds data will always be available or accurate</li>
                  </ul>

                  <h4 className="font-bold text-yellow-800 mb-2 mt-4">8.2 Limitation of Liability</h4>
                  <p className="text-yellow-800">
                    <strong>WE ARE NOT LIABLE FOR:</strong>
                  </p>
                  <ul className="list-disc pl-6 space-y-1 text-yellow-800">
                    <li>Any financial losses from bets placed based on our analysis</li>
                    <li>Incorrect predictions or data errors</li>
                    <li>Technical issues, downtime, or data loss</li>
                    <li>Third-party services (sportsbooks, odds providers) failures</li>
                    <li>Gambling addiction or related harm</li>
                  </ul>
                  
                  <p className="text-yellow-800 font-bold mt-4">
                    MAXIMUM LIABILITY: Our total liability is limited to the amount you paid for your subscription (if any) in the last 12 months.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">9. Data Accuracy</h2>
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
                <h2 className="text-2xl font-bold text-gray-900 mb-3">10. Responsible Gambling</h2>
                <div className="bg-red-50 p-6 rounded-lg border-2 border-red-200">
                  <p className="text-red-800 font-bold mb-3">
                    We are committed to promoting responsible gambling. If you or someone you know has a gambling problem:
                  </p>
                  <ul className="list-none space-y-2 text-red-800">
                    <li>🇺🇸 <strong>National Gambling Helpline:</strong> 1-800-522-4700</li>
                    <li>🌐 <strong>Gamblers Anonymous:</strong> www.gamblersanonymous.org</li>
                    <li>💬 <strong>Crisis Text Line:</strong> Text "HELP" to 741741</li>
                  </ul>
                  <p className="text-red-800 mt-4">
                    <strong>Warning Signs:</strong> Chasing losses, betting more than you can afford, hiding betting from family, feeling anxious about betting
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">11. Account Termination</h2>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">11.1 By You</h3>
                <p>
                  You may delete your account anytime through app settings. Your data will be permanently deleted within 30 days.
                </p>

                <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">11.2 By Us</h3>
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
                <h2 className="text-2xl font-bold text-gray-900 mb-3">12. Changes to Terms</h2>
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
                <h2 className="text-2xl font-bold text-gray-900 mb-3">13. Governing Law</h2>
                <p>
                  These Terms are governed by the laws of [Your State/Country]. 
                  Any disputes will be resolved in the courts of [Your Jurisdiction].
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">14. Contact Us</h2>
                <p>Questions about these Terms? Contact us:</p>
                <ul className="list-none space-y-2 mt-4">
                  <li><strong>Email:</strong> support@sportswagerhelper.com</li>
                  <li><strong>In-App:</strong> Use the feedback button</li>
                  <li><strong>Mail:</strong> [Your Company Address]</li>
                </ul>
              </section>

              <section className="bg-green-50 p-6 rounded-lg border-2 border-green-200 mt-8">
                <h2 className="text-xl font-bold text-green-900 mb-3">✅ By Using This App, You Agree That:</h2>
                <ul className="list-disc pl-6 space-y-2 text-green-800">
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
      </div>
    </div>
  );
}

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Shield } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="border-2 border-blue-200">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-8 h-8 text-blue-600" />
              <h1 className="text-4xl font-bold text-gray-900">Privacy Policy</h1>
            </div>
            
            <p className="text-sm text-gray-600 mb-8">
              Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>

            <div className="space-y-6 text-gray-700">
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">1. Introduction</h2>
                <p>
                  Welcome to Sports Wager Helper ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. 
                  This privacy policy explains how we collect, use, and safeguard your information when you use our mobile application and services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">2. Information We Collect</h2>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">2.1 Personal Information</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Account Information:</strong> Email address, full name, and password (encrypted)</li>
                  <li><strong>Subscription Data:</strong> Payment information (processed securely by third-party processors), subscription tier (Free, VIP Lifetime, Premium Monthly)</li>
                  <li><strong>Profile Data:</strong> User preferences, saved searches, and bookmarked content</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">2.2 Usage Data</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Search History:</strong> Match analyses, player stats, and team stats you've searched for</li>
                  <li><strong>Betting Tracking:</strong> Your personal betting records, bankroll data, ROI calculations (stored locally and privately)</li>
                  <li><strong>App Analytics:</strong> Pages viewed, features used, time spent in app (anonymized)</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">2.3 Automatically Collected Data</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Device Information:</strong> Device type, operating system, app version</li>
                  <li><strong>Location Data:</strong> General location (country/region) for odds display - NOT precise GPS tracking</li>
                  <li><strong>Cookies:</strong> Session cookies for login authentication</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">3. How We Use Your Information</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Provide Services:</strong> AI-powered match analysis, player statistics, team data, and betting insights</li>
                  <li><strong>Personalization:</strong> Save your searches, track your betting performance, customize your experience</li>
                  <li><strong>Communication:</strong> Send important updates, subscription notifications, and (if opted-in) betting alerts</li>
                  <li><strong>Improve Our App:</strong> Analyze usage patterns to enhance features and fix bugs</li>
                  <li><strong>Security:</strong> Detect fraud, abuse, and protect user accounts</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">4. Data Sharing and Third Parties</h2>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">4.1 Third-Party Services We Use</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>The Odds API:</strong> For live sports betting odds (they may collect anonymized usage data)</li>
                  <li><strong>OpenAI/AI Services:</strong> For AI-powered analysis (we anonymize queries, no personal data shared)</li>
                  <li><strong>Payment Processors:</strong> Stripe or similar (they handle payment data securely, we never see card numbers)</li>
                  <li><strong>Cloud Hosting:</strong> Base44 platform for secure data storage</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">4.2 We Do NOT:</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>❌ Sell your personal data to third parties</li>
                  <li>❌ Share your betting history with anyone</li>
                  <li>❌ Track your precise GPS location</li>
                  <li>❌ Share data with sportsbooks or gambling companies</li>
                  <li>❌ Use your data for targeted advertising</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">5. Data Security</h2>
                <p>We implement industry-standard security measures:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>🔒 <strong>Encryption:</strong> All data transmitted using SSL/TLS encryption</li>
                  <li>🔒 <strong>Secure Storage:</strong> Passwords hashed and salted, never stored in plain text</li>
                  <li>🔒 <strong>Access Controls:</strong> Only you can access your betting history and saved data</li>
                  <li>🔒 <strong>Regular Audits:</strong> Security reviews and updates</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">6. Your Rights</h2>
                <p>You have the right to:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Access:</strong> Request a copy of all data we have about you</li>
                  <li><strong>Correction:</strong> Update or correct your personal information</li>
                  <li><strong>Deletion:</strong> Request deletion of your account and all associated data</li>
                  <li><strong>Export:</strong> Download your betting history and saved searches</li>
                  <li><strong>Opt-Out:</strong> Unsubscribe from marketing emails or push notifications</li>
                </ul>
                <p className="mt-4">
                  To exercise these rights, contact us at: <strong>privacy@sportswagerhelper.com</strong>
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">7. Data Retention</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Active Accounts:</strong> We retain your data as long as your account is active</li>
                  <li><strong>Deleted Accounts:</strong> Data permanently deleted within 30 days of account deletion request</li>
                  <li><strong>Legal Requirements:</strong> Some data may be retained longer if required by law (e.g., payment records for tax purposes)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">8. Children's Privacy</h2>
                <p className="font-semibold text-red-600">
                  ⚠️ Our app is NOT for users under 18 years old (or 21+ where legally required for gambling content).
                </p>
                <p className="mt-2">
                  We do not knowingly collect data from minors. If you believe a minor has provided us with personal information, 
                  please contact us immediately and we will delete it.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">9. International Users</h2>
                <p>
                  If you access our app from outside the United States, your data may be transferred to and stored in the US. 
                  By using our app, you consent to this transfer. We comply with applicable data protection laws including GDPR for EU users.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">10. Changes to This Policy</h2>
                <p>
                  We may update this privacy policy from time to time. We will notify you of significant changes via:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Email notification to your registered email address</li>
                  <li>In-app notification when you next open the app</li>
                  <li>Updated "Last Modified" date at the top of this policy</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">11. Contact Us</h2>
                <p>If you have questions about this privacy policy or your data, contact us:</p>
                <ul className="list-none space-y-2 mt-4">
                  <li><strong>Email:</strong> privacy@sportswagerhelper.com</li>
                  <li><strong>Support:</strong> Use the feedback button in the app</li>
                  <li><strong>Mail:</strong> [Your Company Address]</li>
                </ul>
              </section>

              <section className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200 mt-8">
                <h2 className="text-xl font-bold text-blue-900 mb-3">📱 Mobile App Specific Information</h2>
                <p className="text-blue-800">
                  <strong>Push Notifications:</strong> If you enable push notifications, we'll use your device token to send alerts about 
                  odds changes, game starts, and betting insights. You can disable these anytime in your device settings.
                </p>
                <p className="text-blue-800 mt-2">
                  <strong>Camera Access:</strong> Only requested if you use features like scanning betting slips (optional feature). 
                  We never access your camera without explicit permission.
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
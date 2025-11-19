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
                  This privacy policy explains how we collect, use, store, and safeguard your information when you use our mobile application and services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">2. Information We Collect</h2>
                
                <h3 className="text-xl font-semibold text-gray-800 mb-2">2.1 Personal Information</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Account Information:</strong> Email address, full name, password (encrypted)</li>
                  <li><strong>Subscription Data:</strong> Payment information (processed by Stripe), subscription tier (Free, Premium Monthly, VIP Annual, Legacy), billing history, subscription start/end dates</li>
                  <li><strong>Profile Information:</strong> User preferences, favorite sports, favorite teams, notification settings</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">2.2 Sports Betting Analysis Data</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Search & Analysis History:</strong> All match prediction queries, player statistics lookups, team analysis requests, timestamps of searches</li>
                  <li><strong>Saved Predictions:</strong> AI-generated match predictions, win probabilities, confidence scores, key factors, player projections</li>
                  <li><strong>Prediction Outcomes:</strong> User-recorded actual results of predictions, correctness tracking (won/lost), outcome dates</li>
                  <li><strong>AI Calibration Data:</strong> Historical accuracy metrics, confidence calibration scores, prediction performance by sport/league</li>
                  <li><strong>Betting Tools Data:</strong> User-entered bets, parlays, bankroll transactions, ROI calculations, alerts, odds tracking (all optional features)</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">2.3 Community & Interaction Data</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Community Posts:</strong> Posts, comments, upvotes, shared betting picks (if you choose to participate)</li>
                  <li><strong>Social Interactions:</strong> Replies to other users, community reputation scores</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">2.4 Automatically Collected Data</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Device Information:</strong> Device type, operating system, browser type, screen resolution</li>
                  <li><strong>Location Data:</strong> Approximate location based on IP address (to comply with gambling laws and regional restrictions)</li>
                  <li><strong>Usage Analytics:</strong> Pages visited, features used, time spent in app, button clicks, navigation patterns</li>
                  <li><strong>Cookies & Local Storage:</strong> Session cookies, authentication tokens, preference cookies, free lookup counters, tutorial completion status</li>
                  <li><strong>Performance Data:</strong> App load times, error logs, crash reports (to improve app stability)</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">2.5 Third-Party Data Sources</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Sports Data APIs:</strong> We fetch real-time sports statistics, odds, injury reports, and weather data from third-party providers (ESPN, StatMuse, official league APIs) to generate predictions. This data is not personally identifiable.</li>
                  <li><strong>AI/LLM Services:</strong> Your prediction queries are sent to AI language model providers to generate analysis. These requests do not include personally identifiable information beyond the sports query itself.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">3. How We Use Your Information</h2>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Service Provision:</strong> Generate AI predictions, provide match analysis, calculate win probabilities, display player/team statistics, manage your account and subscriptions</li>
                  <li><strong>AI Model Training & Improvement:</strong> Use aggregated prediction outcomes and calibration data to improve AI accuracy. Individual user predictions are anonymized before being used for model training.</li>
                  <li><strong>Personalization:</strong> Recommend relevant matches based on your search history, remember favorite sports/teams, customize your feed</li>
                  <li><strong>Analytics & Performance Monitoring:</strong> Track AI prediction accuracy, calibrate confidence scores, measure feature usage, identify bugs and crashes</li>
                  <li><strong>Communication:</strong> Send important app updates, subscription renewal notices, new feature announcements, promotional emails (opt-out available), responsible gambling reminders</li>
                  <li><strong>Security & Fraud Prevention:</strong> Detect suspicious betting patterns, prevent multiple free account abuse, protect user accounts from unauthorized access</li>
                  <li><strong>Legal Compliance:</strong> Verify gambling age restrictions (18+/21+), comply with regional gambling laws, respond to legal requests, enforce Terms of Service</li>
                  <li><strong>Payment Processing:</strong> Process subscription payments via Stripe, manage billing, handle refunds, track subscription status</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">4. Information Sharing & Third Parties</h2>
                
                <h3 className="text-xl font-semibold text-gray-800 mb-2">4.1 Third-Party Services We Use</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Stripe (Payment Processing):</strong> Shares: Email, name, subscription tier, payment amount. Purpose: Process payments securely. Note: We never see your full credit card number - Stripe handles all card data.</li>
                  <li><strong>Base44 Platform (Hosting):</strong> Shares: All app data (database, files). Purpose: Host application and database. Data Location: USA servers. Security: Encrypted at rest and in transit.</li>
                  <li><strong>AI/LLM Providers:</strong> Shares: Your sports prediction queries (e.g., "Lakers vs Celtics prediction"). Purpose: Generate AI analysis and predictions. Note: We do NOT share your email, name, or any identifiable information with AI providers.</li>
                  <li><strong>Sports Data APIs (StatMuse, ESPN, etc.):</strong> Shares: API requests for sports statistics (no personal data). Purpose: Fetch live odds, stats, injury reports, weather data.</li>
                  <li><strong>Firebase/Push Notification Services:</strong> Shares: Device tokens, user ID. Purpose: Send optional push notifications for alerts.</li>
                  <li><strong>Analytics Services:</strong> Shares: Anonymized usage data (pages visited, features used). Purpose: Understand app usage patterns to improve features. No personally identifiable information is shared.</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">4.2 Legal Disclosures</h3>
                <p className="mb-2">We may disclose your information if required by law:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>To comply with subpoenas, court orders, or legal processes</li>
                  <li>To enforce our Terms of Service or investigate violations</li>
                  <li>To protect the rights, safety, or property of Sports Wager Helper, our users, or the public</li>
                  <li>In connection with a merger, acquisition, or sale of assets (users will be notified)</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">4.3 What We DON'T Share</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>❌ We NEVER sell your personal information to advertisers or data brokers</li>
                  <li>❌ We DON'T share your betting history, predictions, or analysis with sportsbooks</li>
                  <li>❌ We DON'T sell your email to marketing companies or third-party lists</li>
                  <li>❌ We DON'T share your community posts publicly outside the app without consent</li>
                  <li>❌ We DON'T provide raw user data to AI training companies (only aggregated, anonymized insights)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">5. Data Security & Protection</h2>
                <p className="mb-4">We implement multiple layers of security to protect your data:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Encryption in Transit:</strong> All data transmitted to/from our app is encrypted using TLS 1.3 (SSL/HTTPS)</li>
                  <li><strong>Encryption at Rest:</strong> User data stored in our database is encrypted at rest using AES-256 encryption</li>
                  <li><strong>Password Security:</strong> Passwords are hashed using industry-standard bcrypt with salt, never stored in plain text</li>
                  <li><strong>Authentication Tokens:</strong> Session tokens expire after inactivity and are securely stored</li>
                  <li><strong>Access Control:</strong> Employee/admin access to user data is strictly limited on a need-to-know basis and logged for audit trails</li>
                  <li><strong>Regular Security Audits:</strong> We conduct security reviews, penetration testing, and vulnerability scanning</li>
                  <li><strong>Secure Infrastructure:</strong> Hosted on secure, SOC 2 compliant servers with DDoS protection</li>
                  <li><strong>Data Backups:</strong> Regular encrypted backups with disaster recovery procedures</li>
                </ul>

                <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4 mt-4">
                  <p className="text-sm text-amber-900">
                    <strong>⚠️ Important Security Notice:</strong> While we implement industry-leading security measures, 
                    no system is 100% secure. We cannot guarantee absolute security of your data. You are responsible 
                    for maintaining the confidentiality of your account password. Never share your password with anyone.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">6. Your Privacy Rights</h2>
                
                <h3 className="text-xl font-semibold text-gray-800 mb-2">6.1 Right to Access</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Request a copy of all personal data we have about you</li>
                  <li>View your saved predictions, search history, and account information within the app</li>
                  <li>Receive a detailed report of your data usage</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">6.2 Right to Correction</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Update your profile information (name, email) in account settings</li>
                  <li>Correct inaccurate or outdated information</li>
                  <li>Modify your preferences and notification settings</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">6.3 Right to Delete (Account Deletion)</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Within the App:</strong> Go to Profile → Delete Account section to permanently delete your account and all associated data</li>
                  <li><strong>What Gets Deleted:</strong> All predictions, saved results, betting history, community posts, ROI data, profile information</li>
                  <li><strong>Timeline:</strong> Data is permanently erased within 30 days of deletion request</li>
                  <li><strong>Note:</strong> Some data may be retained for legal/accounting purposes (e.g., payment records for tax compliance)</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">6.4 Right to Data Portability</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Export your data in JSON or CSV format (contact us to request)</li>
                  <li>Transfer your data to another service</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">6.5 Right to Opt-Out</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Marketing Emails:</strong> Unsubscribe via link in emails or in account settings</li>
                  <li><strong>Push Notifications:</strong> Disable in your device settings or app notification preferences</li>
                  <li><strong>Cookies:</strong> Disable via browser settings (may affect app functionality)</li>
                  <li><strong>Note:</strong> Critical account-related emails (password resets, subscription confirmations) cannot be disabled</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">6.6 Right to Object</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Object to processing of your data for marketing purposes</li>
                  <li>Opt-out of having your anonymized data used for AI model improvement (contact us)</li>
                </ul>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mt-4">
                  <h3 className="text-lg font-bold text-blue-900 mb-2">How to Exercise Your Rights</h3>
                  <p className="text-sm text-blue-800 mb-2">
                    <strong>Email:</strong> privacy@sportswagerhelper.com<br />
                    <strong>Subject:</strong> "Privacy Rights Request - [Your Request Type]"<br />
                    <strong>Response Time:</strong> We will respond within 30 days
                  </p>
                  <p className="text-sm text-blue-800">
                    To protect your privacy, we may ask you to verify your identity before processing your request.
                  </p>
                </div>

                <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">6.7 California Privacy Rights (CCPA)</h3>
                <p className="mb-2">If you are a California resident, you have additional rights under the California Consumer Privacy Act:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Right to know what personal information is collected, used, shared, or sold</li>
                  <li>Right to delete personal information (with exceptions for legal obligations)</li>
                  <li>Right to opt-out of the "sale" of personal information (Note: We do NOT sell your data)</li>
                  <li>Right to non-discrimination for exercising your privacy rights</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">6.8 European Privacy Rights (GDPR)</h3>
                <p className="mb-2">If you are in the European Economic Area (EEA), you have rights under the General Data Protection Regulation:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Right to access, rectification, erasure, and restriction of processing</li>
                  <li>Right to data portability and to object to processing</li>
                  <li>Right to withdraw consent at any time</li>
                  <li>Right to lodge a complaint with your local data protection authority</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">7. Data Retention Periods</h2>
                
                <h3 className="text-xl font-semibold text-gray-800 mb-2">7.1 Active Account Data</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Profile & Account Info:</strong> Retained as long as your account is active</li>
                  <li><strong>Subscription Data:</strong> Retained for active subscription period + 7 years (tax/legal requirement)</li>
                  <li><strong>Saved Predictions (Free Users):</strong> Automatically deleted after 30 days</li>
                  <li><strong>Saved Predictions (VIP/Premium):</strong> Unlimited retention - kept forever unless you delete your account</li>
                  <li><strong>Community Posts:</strong> Retained indefinitely unless you delete them or your account</li>
                  <li><strong>Betting History:</strong> Retained as long as your account is active (optional feature)</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">7.2 Deleted Account Data</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Personal Information:</strong> Permanently deleted within 30 days of account deletion</li>
                  <li><strong>Predictions & Analysis:</strong> Deleted within 30 days</li>
                  <li><strong>Community Posts:</strong> Deleted or anonymized within 30 days</li>
                  <li><strong>Financial Records:</strong> Retained for 7 years for tax/legal compliance (name, email, payment amount, dates)</li>
                  <li><strong>Aggregated Analytics:</strong> Anonymized data used for AI improvement may be retained indefinitely (no personal identifiers)</li>
                </ul>

                <h3 className="text-xl font-semibold text-gray-800 mb-2 mt-4">7.3 Inactive Account Policy</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Inactivity Period:</strong> Accounts with no login for 3+ years are considered inactive</li>
                  <li><strong>Warning Notification:</strong> We'll email you 60 days before deletion</li>
                  <li><strong>Deletion Process:</strong> If no response, account and data are permanently deleted</li>
                  <li><strong>Exception:</strong> Active paid subscriptions prevent automatic deletion</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">8. Children's Privacy</h2>
                <p className="font-semibold text-red-600 mb-2">
                  ⚠️ Our app is NOT for users under 18 years old (or 21+ where legally required for gambling content).
                </p>
                <p>
                  We do not knowingly collect data from minors. If you believe a minor has provided us with personal information, 
                  please contact us immediately at privacy@sportswagerhelper.com and we will delete it.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">9. International Users & Data Transfers</h2>
                <p className="mb-2">
                  If you access our app from outside the United States, your data may be transferred to and stored in the US. 
                  By using our app, you consent to this transfer.
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>We comply with applicable data protection laws including GDPR for EU users</li>
                  <li>Data transfers are protected by appropriate safeguards</li>
                  <li>EU users have specific rights under GDPR (see section 6.8)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">10. Changes to This Policy</h2>
                <p className="mb-2">
                  We may update this privacy policy from time to time. We will notify you of significant changes via:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Email notification to your registered email address</li>
                  <li>In-app notification when you next open the app</li>
                  <li>Updated "Last Modified" date at the top of this policy</li>
                </ul>
                <p className="mt-2">
                  Continued use of the app after changes means you accept the updated policy.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">11. Contact Us</h2>
                <p className="mb-2">If you have questions about this privacy policy or your data, contact us:</p>
                <ul className="list-none space-y-2 mt-4">
                  <li><strong>Privacy Inquiries:</strong> privacy@sportswagerhelper.com</li>
                  <li><strong>General Support:</strong> support@sportswagerhelper.com</li>
                  <li><strong>In-App:</strong> Use the feedback button</li>
                </ul>
              </section>

              <section className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200 mt-8">
                <h2 className="text-xl font-bold text-blue-900 mb-3">📱 Mobile App Specific Information</h2>
                <p className="text-blue-800 mb-3">
                  <strong>Push Notifications:</strong> If you enable push notifications, we'll use your device token to send alerts about 
                  odds changes, game starts, and betting insights. You can disable these anytime in your device settings or app preferences.
                </p>
                <p className="text-blue-800 mb-3">
                  <strong>Camera Access:</strong> Only requested if you use features like scanning betting slips (optional feature). 
                  We never access your camera without explicit permission.
                </p>
                <p className="text-blue-800">
                  <strong>Local Storage:</strong> The app uses local storage on your device to cache data for offline access and 
                  improve performance. This data is protected by your device's security measures.
                </p>
              </section>

              <section className="bg-green-50 p-6 rounded-lg border-2 border-green-200 mt-6">
                <h2 className="text-xl font-bold text-green-900 mb-3">✅ Your Privacy Matters</h2>
                <p className="text-green-800">
                  We are committed to transparency and protecting your privacy. This policy outlines exactly what data we collect, 
                  how we use it, and your rights to control it. If you have any concerns or questions, please don't hesitate to 
                  contact us at privacy@sportswagerhelper.com.
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, MessageSquare, HelpCircle, FileText, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";

export default function Support() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <HelpCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-gray-900">Support</h1>
              <p className="text-gray-600">We're here to help you get the most out of Sports Wager Helper</p>
            </div>
          </div>
        </div>

        {/* Contact Card */}
        <Card className="border-2 border-blue-200 shadow-xl mb-8">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200">
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-6 h-6 text-blue-600" />
              Contact Us
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="text-center">
              <p className="text-gray-700 mb-4 text-lg">
                Have questions or need assistance? We're here to help!
              </p>
              <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6 inline-block">
                <div className="flex items-center gap-3 justify-center mb-2">
                  <Mail className="w-6 h-6 text-blue-600" />
                  <span className="text-sm font-semibold text-gray-600">Email Support</span>
                </div>
                <a 
                  href="mailto:support@sportswagerhelper.com"
                  className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  support@sportswagerhelper.com
                </a>
              </div>
              <p className="text-sm text-gray-600 mt-4">
                We typically respond within 24 hours
              </p>
            </div>
          </CardContent>
        </Card>

        {/* FAQs */}
        <Card className="border-2 border-purple-200 shadow-xl mb-8">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b-2 border-purple-200">
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-purple-600" />
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-gray-900 mb-2">How many free lookups do I get?</h3>
                <p className="text-gray-700">Free users get 5 free lookups to try our match analysis, player stats, and team stats features.</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-2">What's included in Premium?</h3>
                <p className="text-gray-700">Premium members get unlimited searches, AI-powered value bet analysis, odds tracking, and personalized insights for $19.99/month.</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-2">What makes VIP Annual special?</h3>
                <p className="text-gray-700">VIP Annual members get everything in Premium plus sharp vs public money indicators, unlimited data retention, and access to our exclusive VIP Discord community for $149.99/year.</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-2">How do I cancel my subscription?</h3>
                <p className="text-gray-700">You can manage your subscription anytime from your Profile page. Click "Manage Subscription" to update or cancel through our secure payment portal.</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-2">Where does the data come from?</h3>
                <p className="text-gray-700">We use AI-powered analysis with real-time data from StatMuse, ESPN, Basketball-Reference, and official league sources to provide accurate predictions and statistics.</p>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-2">Is this legal?</h3>
                <p className="text-gray-700">Yes! Sports Wager Helper is an information and analysis tool. We do not accept bets or facilitate gambling. We provide educational content to help you make informed decisions.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resources */}
        <Card className="border-2 border-gray-200 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b-2 border-gray-200">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-gray-600" />
              Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-4">
              <Link
                to={createPageUrl("PrivacyPolicy")}
                className="flex items-center gap-3 p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all"
              >
                <Shield className="w-8 h-8 text-blue-600" />
                <div>
                  <div className="font-bold text-gray-900">Privacy Policy</div>
                  <div className="text-sm text-gray-600">How we protect your data</div>
                </div>
              </Link>

              <Link
                to={createPageUrl("TermsOfService")}
                className="flex items-center gap-3 p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-purple-300 hover:shadow-md transition-all"
              >
                <FileText className="w-8 h-8 text-purple-600" />
                <div>
                  <div className="font-bold text-gray-900">Terms of Service</div>
                  <div className="text-sm text-gray-600">Our terms and conditions</div>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-amber-50 border-2 border-amber-200 rounded-lg">
          <p className="text-sm text-amber-900">
            <strong>⚠️ Responsible Gambling:</strong> Sports Wager Helper provides analysis and predictions for informational purposes only. 
            Always gamble responsibly and never bet more than you can afford to lose. If you or someone you know has a gambling problem, 
            call the National Council on Problem Gambling Helpline at 1-800-522-4700.
          </p>
        </div>
      </div>
    </div>
  );
}
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, MessageSquare, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function Contact() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm mx-auto mb-6">
              <Mail className="w-10 h-10" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-black mb-4">Get in Touch</h1>
            <p className="text-xl text-purple-100 max-w-2xl mx-auto">
              Have questions, feedback, or need support? We'd love to hear from you!
            </p>
          </motion.div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Email Contact Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="md:col-span-3"
          >
            <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-2 border-slate-700">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Mail className="w-10 h-10 text-blue-400" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">Email Us</h2>
                <p className="text-slate-400 text-lg mb-6">
                  Send us your questions, feedback, or support requests
                </p>
                <a 
                  href="mailto:sportswagerhelper@outlook.com" 
                  className="inline-block text-3xl sm:text-4xl font-bold text-blue-400 hover:text-blue-300 transition-colors"
                >
                  sportswagerhelper@outlook.com
                </a>
              </CardContent>
            </Card>
          </motion.div>

          {/* Info Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700 h-full">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                    <Clock className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Response Time</h3>
                  <p className="text-slate-400 text-sm">
                    We typically respond within 2-4 hours during business hours
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700 h-full">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                    <MessageSquare className="w-6 h-6 text-green-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Support Topics</h3>
                  <p className="text-slate-400 text-sm">
                    Technical issues, subscription questions, feedback, or general inquiries
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-slate-700 h-full">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mb-4">
                    <Mail className="w-6 h-6 text-orange-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">Direct Contact</h3>
                  <p className="text-slate-400 text-sm">
                    No forms, no hassle. Just send us an email and we'll get back to you
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { ArrowRight, BarChart, BrainCircuit, Users } from 'lucide-react';

const FeatureCard = ({ icon, title, description, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: delay, duration: 0.5 }}
  >
    <Card className="bg-slate-800/50 border-white/10 h-full text-center p-6">
      <div className="mb-4 inline-block p-4 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400">{description}</p>
    </Card>
  </motion.div>
);

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-y-auto">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-grid-slate-700/20 [mask-image:linear-gradient(to_bottom,white_20%,transparent_100%)]"></div>
      </div>
      
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/4616ada62_image.png"
                alt="SWH Logo"
                className="w-10 h-10 rounded-lg"
              />
              <span className="text-xl font-bold">Sports Wager Helper</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to={createPageUrl('Dashboard')} className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">
                Sign In
              </Link>
              <Button asChild className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-full">
                <Link to={createPageUrl('Pricing')}>Get Started <ArrowRight className="w-4 h-4 ml-2" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-40 pb-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black tracking-tighter">
              The Smarter Way to Bet on Sports
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-lg lg:text-xl text-slate-300">
              Stop guessing. Start winning. Leverage powerful AI analytics, data-driven insights, and robust tracking tools to make more informed decisions and gain an edge.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <Button size="lg" asChild className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-full text-lg px-8 py-6">
                <Link to={createPageUrl('Pricing')}>
                  Unlock Your Edge
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-2 border-slate-600 hover:bg-slate-800 hover:text-white rounded-full text-lg px-8 py-6">
                <Link to={createPageUrl('Dashboard')}>
                  Explore Dashboard
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Features Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              delay={0.2}
              icon={<BrainCircuit className="w-8 h-8 text-white" />}
              title="AI-Powered Predictions"
              description="Our advanced models analyze thousands of data points to deliver predictions with a quantifiable edge."
            />
            <FeatureCard
              delay={0.4}
              icon={<BarChart className="w-8 h-8 text-white" />}
              title="Advanced Analytics"
              description="Dive deep into player stats, team performance, and historical data to build your own winning strategies."
            />
            <FeatureCard
              delay={0.6}
              icon={<Users className="w-8 h-8 text-white" />}
              title="Community & Insights"
              description="Join a community of savvy bettors, access daily briefs, and learn from expert analysis."
            />
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center text-slate-500">
        <p>&copy; {new Date().getFullYear()} Sports Wager Helper. All Rights Reserved.</p>
        <div className="flex justify-center gap-6 mt-4">
            <Link to={createPageUrl("TermsOfService")} className="text-sm hover:text-slate-300">Terms of Service</Link>
            <Link to={createPageUrl("PrivacyPolicy")} className="text-sm hover:text-slate-300">Privacy Policy</Link>
        </div>
      </footer>

      <style jsx>{`
        .bg-grid-slate-700\/20 {
          background-image: linear-gradient(white 1px, transparent 1px), linear-gradient(to right, white 1px, transparent 1px);
          background-size: 4rem 4rem;
        }
      `}</style>
    </div>
  );
}
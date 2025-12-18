import React from 'react';
import { motion } from 'framer-motion';
import { Bot, BarChart, LineChart, Users, Zap } from 'lucide-react';

const features = [
  {
    name: 'AI-Powered Predictions',
    description: 'Our advanced AI models analyze thousands of data points to give you the most accurate game predictions and player prop insights.',
    icon: Bot,
  },
  {
    name: 'Comprehensive Player Stats',
    description: 'Dive deep into player performance with detailed stats, recent form, and injury updates. Everything you need to know in one place.',
    icon: BarChart,
  },
  {
    name: 'Live Odds & Line Movement',
    description: 'Track real-time odds from top sportsbooks. Get alerts on significant line movements to capitalize on opportunities.',
    icon: LineChart,
  },
  {
    name: 'Community & Expert Insights',
    description: 'Join a community of bettors. Share your picks, discuss strategies, and get insights from our daily AI-generated briefs.',
    icon: Users,
  },
];

export default function FeaturesSection() {
  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl lg:text-center"
        >
          <h2 className="text-base font-semibold leading-7 text-indigo-400">Your Unfair Advantage</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Everything you need to bet smarter
          </p>
          <p className="mt-6 text-lg leading-8 text-slate-300">
            From deep-dive analytics to community wisdom, our platform is designed to give you a winning edge.
          </p>
        </motion.div>
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8 }}
          className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none"
        >
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-2">
            {features.map((feature) => (
              <div key={feature.name} className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                  <feature.icon className="h-5 w-5 flex-none text-indigo-400" aria-hidden="true" />
                  {feature.name}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-slate-300">
                  <p className="flex-auto">{feature.description}</p>
                </dd>
              </div>
            ))}
          </dl>
        </motion.div>
      </div>
    </div>
  );
}
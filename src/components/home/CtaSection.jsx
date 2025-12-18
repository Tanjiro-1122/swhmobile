import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function CtaSection() {
  return (
    <div className="mx-auto max-w-7xl py-24 sm:px-6 sm:py-32 lg:px-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.8 }}
        className="relative isolate overflow-hidden bg-slate-800 px-6 py-24 text-center shadow-2xl sm:rounded-3xl sm:px-16"
      >
        <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Ready to elevate your game?
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-slate-300">
          Join thousands of users who are making smarter, data-driven betting decisions. Get started today and see the difference.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link to={createPageUrl('Dashboard')}>
            <Button size="lg" className="bg-indigo-500 hover:bg-indigo-400 text-white font-semibold">Get started</Button>
          </Link>
          <Link to={createPageUrl('Pricing')}>
            <Button size="lg" variant="ghost" className="text-white hover:bg-white/10">
              Learn more <span aria-hidden="true">→</span>
            </Button>
          </Link>
        </div>
        <div 
          className="absolute -top-24 left-1/2 -z-10 -translate-x-1/2 transform-gpu blur-3xl" 
          aria-hidden="true"
        >
          <div 
            className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-[#804dee] to-[#9089fc] opacity-20" 
            style={{
              clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }} 
          />
        </div>
      </motion.div>
    </div>
  )
}
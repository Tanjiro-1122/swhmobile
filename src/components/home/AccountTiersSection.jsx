import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const tiers = [
  {
    name: 'Free',
    id: 'tier-free',
    href: '#',
    priceMonthly: '$0',
    description: 'Get a taste of the action with limited access to our powerful tools.',
    features: ['5 AI match predictions per month', 'Basic player and team stats', 'Access to community forums'],
    mostPopular: false,
  },
  {
    name: 'Premium',
    id: 'tier-premium',
    href: '#',
    priceMonthly: '$19.99',
    description: 'Unlock the full power of our AI for unlimited insights and analysis.',
    features: [
      'Unlimited AI predictions',
      'Complete player and team stats',
      'Live odds and line movement alerts',
      'ROI and bet tracking tools',
      'Priority support',
    ],
    mostPopular: true,
  },
  {
    name: 'VIP Annual',
    id: 'tier-vip',
    href: '#',
    priceMonthly: '$12.50',
    description: 'Become a VIP for exclusive features and the best value.',
    features: [
      'Everything in Premium',
      '37% saving vs. monthly',
      'Daily AI insight briefs',
      'Exclusive VIP Discord channel',
      'Early access to new features',
    ],
    mostPopular: false,
  },
]

export default function AccountTiersSection() {
  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <h2 className="text-base font-semibold leading-7 text-indigo-400">Pricing</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            The right price for you, whoever you are
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8 }}
          className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3"
        >
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`rounded-3xl p-8 ring-2 xl:p-10 ${tier.mostPopular ? 'ring-indigo-500 bg-slate-800/50' : 'ring-slate-700'}`}
            >
              <h3 id={tier.id} className={`text-lg font-semibold leading-8 ${tier.mostPopular ? 'text-indigo-400' : 'text-white'}`}>
                {tier.name}
              </h3>
              <p className="mt-4 text-sm leading-6 text-slate-300">{tier.description}</p>
              <p className="mt-6 flex items-baseline gap-x-1">
                <span className="text-4xl font-bold tracking-tight text-white">{tier.priceMonthly}</span>
                {tier.name !== 'Free' && <span className="text-sm font-semibold leading-6 text-slate-300">/month</span>}
              </p>
              <Link to={createPageUrl('Pricing')} aria-describedby={tier.id}>
                <Button
                  variant={tier.mostPopular ? 'default' : 'outline'}
                  className={`w-full mt-6 ${tier.mostPopular ? 'bg-indigo-500 hover:bg-indigo-400 text-white' : 'border-white/50 text-white hover:bg-white/10'}`}
                >
                  {tier.name === 'Free' ? 'Get started' : 'Choose plan'}
                </Button>
              </Link>
              <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-slate-300 xl:mt-10">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <Check className="h-6 w-5 flex-none text-indigo-400" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
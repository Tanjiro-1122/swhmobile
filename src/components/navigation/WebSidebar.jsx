import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Badge } from '@/components/ui/badge';
import { Home, LayoutGrid, BarChart2, Users, Newspaper, Crown, Cog } from 'lucide-react';
import { detectPlatform } from '@/components/utils/platform';

const navLinks = [
  { name: 'Dashboard', href: 'Dashboard', icon: Home },
  { name: 'Analysis Hub', href: 'AnalysisHub', icon: LayoutGrid },
  { name: 'Tracking Tools', href: 'BettingHub', icon: BarChart2 },
  { name: 'Daily Briefs', href: 'DailyBriefs', icon: Newspaper, webOnly: true },
  { name: 'Community', href: 'CommunityHub', icon: Users },
  { name: 'Pricing', href: 'Pricing', icon: Crown },
  { name: 'My Account', href: 'MyAccount', icon: Cog },
];

export default function WebSidebar({ currentPageName }) {
  const { isWeb } = detectPlatform();
  return (
    <aside className="w-64 flex-shrink-0 bg-slate-800/50 backdrop-blur-lg border-r border-white/10 flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-white/10">
         <Link to={createPageUrl("Dashboard")} className="flex items-center gap-3">
            <img
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/4616ada62_image.png"
              alt="SWH Logo"
              className="w-10 h-10 rounded-lg object-cover"
            />
            <span className="text-lg font-bold text-white">SWH</span>
          </Link>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navLinks.map((link) => {
          const isActive = currentPageName === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.name}
              to={createPageUrl(link.href)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-purple-600/20 text-white'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{link.name}</span>
              {link.webOnly && isWeb && <Badge className="ml-auto bg-cyan-500 text-white">WEB</Badge>}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-4 border-t border-white/10">
        <p className="text-xs text-slate-400 text-center">&copy; {new Date().getFullYear()} Sports Wager Helper</p>
      </div>
    </aside>
  );
}
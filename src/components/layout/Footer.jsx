import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Facebook, Instagram, ShoppingBag } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-slate-900 border-t border-slate-800">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid md:grid-cols-4 gap-8">
                    <div className="md:col-span-2">
                        <Link to={createPageUrl('Home')} className="flex items-center gap-3 mb-4">
                            <img
                                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68f93544702b554e3e1f7297/4616ada62_image.png"
                                alt="Sports Wager Helper"
                                className="w-10 h-10 rounded-xl object-cover"
                            />
                            <span className="text-xl font-bold text-white">Sports Wager Helper</span>
                        </Link>
                        <p className="text-slate-400 max-w-sm">
                            The evolution in sports betting with machine learning and real-time data analysis. Join the smart money movement.
                        </p>
                    </div>
                    <div>
                        <h3 className="font-bold text-white mb-4">Product</h3>
                        <ul className="space-y-2">
                            <li><Link to={createPageUrl('AnalysisHub')} className="text-slate-400 hover:text-lime-300 transition-colors">Analysis Engine</Link></li>
                            <li><Link to={createPageUrl('Dashboard')} className="text-slate-400 hover:text-lime-300 transition-colors">Dashboard</Link></li>
                            <li><Link to={createPageUrl('Pricing')} className="text-slate-400 hover:text-lime-300 transition-colors">Pricing</Link></li>
                            <li><Link to={createPageUrl('AIAssistant')} className="text-slate-400 hover:text-lime-300 transition-colors">AI Assistant</Link></li>
                        </ul>
                    </div>
                     <div>
                        <h3 className="font-bold text-white mb-4">Company</h3>
                        <ul className="space-y-2">
                            <li><Link to={createPageUrl('Community')} className="text-slate-400 hover:text-lime-300 transition-colors">Community</Link></li>
                            <li><Link to={createPageUrl('PrivacyPolicy')} className="text-slate-400 hover:text-lime-300 transition-colors">Privacy Policy</Link></li>
                            <li><Link to={createPageUrl('TermsOfService')} className="text-slate-400 hover:text-lime-300 transition-colors">Terms of Service</Link></li>
                             <li><Link to={createPageUrl('ContactUs')} className="text-slate-400 hover:text-lime-300 transition-colors">Contact</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="mt-12 border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center">
                     <p className="text-slate-500 text-sm mb-4 md:mb-0">
                        &copy; {new Date().getFullYear()} Sports Wager Helper AI. All rights reserved.
                    </p>
                    <div className="flex items-center gap-4">
                        <a 
                            href="https://www.facebook.com/profile.php?id=61582630155332" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-blue-500 transition-colors"
                        >
                            <Facebook className="w-5 h-5" />
                        </a>
                        <a 
                            href="https://www.instagram.com/swh_javierhuertas?igsh=MXNjZ3g2dGZsZGt5dQ%3D%3D&utm_source=qr" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-pink-500 transition-colors"
                        >
                            <Instagram className="w-5 h-5" />
                        </a>
                        <a 
                            href="https://amzn.to/4awgbi3" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-orange-500 transition-colors"
                            title="Shop on Amazon"
                        >
                            <ShoppingBag className="w-5 h-5" />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
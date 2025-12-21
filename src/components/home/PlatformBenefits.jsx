import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Smartphone, Monitor, Zap, BarChart3, Clock, Calculator } from "lucide-react";
import { motion } from "framer-motion";

export default function PlatformBenefits() {
    return (
        <section className="py-16">
            <div className="text-center mb-12">
                <h2 className="text-4xl sm:text-5xl font-black tracking-tighter mb-4">
                    Two Platforms. <span className="text-lime-400">One Goal.</span>
                </h2>
                <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                    Use the mobile app for quick lookups on the go, and the website for deep analysis and power tools.
                </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                {/* Mobile App Card */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <Card className="h-full bg-gradient-to-br from-cyan-900/40 to-slate-900 border border-cyan-500/30 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl" />
                        <CardContent className="p-8 relative">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
                                    <Smartphone className="w-7 h-7 text-cyan-400" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white">Mobile App</h3>
                                    <p className="text-cyan-300 text-sm font-medium">Quick & On-The-Go</p>
                                </div>
                            </div>
                            
                            <p className="text-slate-300 mb-6">
                                Perfect for checking stats before placing a bet, getting quick insights, and staying updated wherever you are.
                            </p>
                            
                            <ul className="space-y-3">
                                <li className="flex items-center gap-3 text-slate-200">
                                    <Zap className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                                    <span>Instant player & team lookups</span>
                                </li>
                                <li className="flex items-center gap-3 text-slate-200">
                                    <Clock className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                                    <span>Live scores & quick insights</span>
                                </li>
                                <li className="flex items-center gap-3 text-slate-200">
                                    <Smartphone className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                                    <span>Credit packs for casual use</span>
                                </li>
                            </ul>
                            
                            <div className="mt-8 pt-6 border-t border-cyan-500/20">
                                <p className="text-sm text-slate-400">
                                    Available on <span className="text-cyan-300 font-semibold">iOS</span> and <span className="text-cyan-300 font-semibold">Android</span>
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
                
                {/* Website Card */}
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <Card className="h-full bg-gradient-to-br from-purple-900/40 to-slate-900 border border-purple-500/30 overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
                        <div className="absolute top-4 right-4 bg-lime-400 text-slate-900 text-xs font-bold px-3 py-1 rounded-full">
                            FULL POWER
                        </div>
                        <CardContent className="p-8 relative">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                                    <Monitor className="w-7 h-7 text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white">Website</h3>
                                    <p className="text-purple-300 text-sm font-medium">Deep Analysis & Power</p>
                                </div>
                            </div>
                            
                            <p className="text-slate-300 mb-6">
                                For serious bettors who want the complete toolkit - advanced tracking, calculators, and comprehensive analysis.
                            </p>
                            
                            <ul className="space-y-3">
                                <li className="flex items-center gap-3 text-slate-200">
                                    <BarChart3 className="w-5 h-5 text-purple-400 flex-shrink-0" />
                                    <span>Performance tracking & ROI analysis</span>
                                </li>
                                <li className="flex items-center gap-3 text-slate-200">
                                    <Calculator className="w-5 h-5 text-purple-400 flex-shrink-0" />
                                    <span>Betting calculators & odds comparison</span>
                                </li>
                                <li className="flex items-center gap-3 text-slate-200">
                                    <Monitor className="w-5 h-5 text-purple-400 flex-shrink-0" />
                                    <span>Daily AI briefs & advanced tools</span>
                                </li>
                            </ul>
                            
                            <div className="mt-8 pt-6 border-t border-purple-500/20">
                                <p className="text-sm text-slate-400">
                                    Full subscription plans at <span className="text-purple-300 font-semibold">sportswagerhelper.com</span>
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </section>
    );
}
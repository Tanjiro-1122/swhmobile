import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Globe, Lock } from "lucide-react";
import { motion } from "framer-motion";

export default function WebExclusiveCard({ item, index }) {
    const Icon = item.Icon;
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
            className="h-full"
        >
            <div className="block h-full">
                <Card className="h-full bg-slate-900/60 border border-slate-600/50 rounded-xl relative overflow-hidden">
                    {/* Diagonal stripe overlay */}
                    <div className="absolute inset-0 opacity-10">
                        <div 
                            className="absolute inset-0" 
                            style={{
                                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 20px)'
                            }}
                        />
                    </div>
                    
                    <CardContent className="relative p-5 flex flex-col h-full">
                        {/* Web Exclusive Badge */}
                        <div className="absolute top-3 right-3 flex items-center gap-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                            <Globe className="w-3 h-3" />
                            WEB EXCLUSIVE
                        </div>
                        
                        <div className="flex items-center gap-4 mb-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-700/30 flex items-center justify-center border border-slate-600/50 flex-shrink-0 text-slate-500">
                                <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-base font-bold text-slate-400 tracking-tight">{item.title}</h3>
                                <p className="text-slate-500 text-xs font-medium">{item.subtitle}</p>
                            </div>
                        </div>
                        
                        <p className="text-slate-500 text-sm mb-4">{item.description}</p>
                        
                        {/* CTA Message */}
                        <div className="mt-auto pt-3 border-t border-slate-700/50">
                            <div className="flex items-center gap-2 text-blue-400">
                                <Lock className="w-4 h-4" />
                                <span className="text-xs font-semibold">Visit sportswagerhelper.com</span>
                            </div>
                            <p className="text-slate-500 text-xs mt-1">Full power features on desktop</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </motion.div>
    );
}
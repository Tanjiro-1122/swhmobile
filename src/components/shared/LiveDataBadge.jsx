import React from "react";
import { Badge } from "@/components/ui/badge";
import { Radio, Database } from "lucide-react";
import { motion } from "framer-motion";

export default function LiveDataBadge({ sources = ["StatMuse", "ESPN"] }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="inline-flex items-center gap-2"
    >
      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 flex items-center gap-1.5 px-3 py-1.5">
        <Radio className="w-3.5 h-3.5 animate-pulse" />
        <span className="font-semibold">LIVE DATA</span>
      </Badge>
      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <Database className="w-3 h-3" />
        <span>{sources.join(" • ")}</span>
      </div>
    </motion.div>
  );
}
import { motion } from "framer-motion";
import { TrendingUp, Users, Activity, CloudRain, Calendar, Shield, Zap } from "lucide-react";

const factorIcons = {
  "form": TrendingUp,
  "home": Shield,
  "injury": Activity,
  "weather": CloudRain,
  "history": Calendar,
  "momentum": Zap,
  "default": Users
};

const factorColors = {
  high: "from-emerald-500 to-green-400",
  medium: "from-yellow-500 to-amber-400",
  low: "from-red-500 to-orange-400"
};

export default function FactorBreakdown({ factors = [] }) {
  // Parse factors into structured data if they're strings
  const parsedFactors = factors.map((factor) => {
    if (typeof factor === "string") {
      // Try to determine impact from keywords
      const lowImpact = /injury|absent|missing|poor|weak/i.test(factor);
      const highImpact = /strong|excellent|dominant|streak|home|advantage/i.test(factor);
      
      return {
        name: factor,
        impact: lowImpact ? "low" : highImpact ? "high" : "medium",
        value: lowImpact ? 30 + Math.random() * 20 : highImpact ? 70 + Math.random() * 25 : 45 + Math.random() * 25,
        type: "default"
      };
    }
    return factor;
  });

  if (parsedFactors.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-gray-700 flex items-center gap-2">
        <Activity className="w-4 h-4" />
        Contributing Factors
      </div>
      <div className="space-y-2">
        {parsedFactors.slice(0, 5).map((factor, index) => {
          const Icon = factorIcons[factor.type] || factorIcons.default;
          const colorClass = factorColors[factor.impact] || factorColors.medium;
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-50 rounded-lg p-3 border border-gray-100"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full bg-gradient-to-r ${colorClass} flex items-center justify-center`}>
                    <Icon className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs font-medium text-gray-700 line-clamp-1">{factor.name}</span>
                </div>
                <span className={`text-xs font-bold ${
                  factor.impact === "high" ? "text-emerald-600" : 
                  factor.impact === "low" ? "text-red-500" : "text-yellow-600"
                }`}>
                  {factor.impact === "high" ? "+" : factor.impact === "low" ? "-" : "~"}{Math.round(factor.value)}%
                </span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className={`h-full bg-gradient-to-r ${colorClass} rounded-full`}
                  initial={{ width: 0 }}
                  animate={{ width: `${factor.value}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
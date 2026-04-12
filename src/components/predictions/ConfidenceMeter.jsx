import { motion } from "framer-motion";

export default function ConfidenceMeter({ value, size = "md", showLabel = true }) {
  // Risk is inverse of confidence - high confidence = low risk
  const getRiskLevel = (val) => {
    if (val >= 80) return { bg: "from-emerald-500 to-green-400", text: "text-emerald-600", label: "Low Risk" };
    if (val >= 65) return { bg: "from-green-500 to-lime-400", text: "text-green-600", label: "Low Risk" };
    if (val >= 50) return { bg: "from-yellow-500 to-amber-400", text: "text-yellow-600", label: "Medium Risk" };
    if (val >= 35) return { bg: "from-orange-500 to-amber-500", text: "text-orange-600", label: "High Risk" };
    return { bg: "from-red-500 to-orange-500", text: "text-red-600", label: "High Risk" };
  };

  const getColor = getRiskLevel;

  const colors = getColor(value);
  const sizeClasses = {
    sm: { ring: "w-16 h-16", text: "text-sm", label: "text-xs" },
    md: { ring: "w-20 h-20", text: "text-lg", label: "text-xs" },
    lg: { ring: "w-24 h-24", text: "text-xl", label: "text-sm" }
  };

  const s = sizeClasses[size];
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className={`relative ${s.ring}`}>
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-gray-200"
          />
          {/* Animated progress circle */}
          <motion.circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="8"
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{ strokeDasharray: circumference }}
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" className={colors.bg.split(" ")[0].replace("from-", "stop-")} stopColor={value >= 65 ? "#10b981" : value >= 50 ? "#eab308" : "#ef4444"} />
              <stop offset="100%" className={colors.bg.split(" ")[1]?.replace("to-", "stop-")} stopColor={value >= 65 ? "#84cc16" : value >= 50 ? "#f59e0b" : "#f97316"} />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span 
            className={`font-black ${s.text} ${colors.text}`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            {value}%
          </motion.span>
        </div>
      </div>
      {showLabel && (
        <motion.span 
          className={`mt-1 font-semibold ${s.label} ${colors.text}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {colors.label}
        </motion.span>
      )}
    </div>
  );
}
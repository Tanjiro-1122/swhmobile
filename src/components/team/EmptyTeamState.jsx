import { Shield, Search } from "lucide-react";
import { motion } from "framer-motion";

export default function EmptyTeamState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-16"
    >
      <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
        <Shield className="w-12 h-12 text-green-600" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">No Teams Analyzed Yet</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        Search for any team to see their season stats, last 5 games, key players, injuries, and next game prediction
      </p>
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
        <Search className="w-4 h-4" />
        <span>Try searching for your favorite teams</span>
      </div>
    </motion.div>
  );
}
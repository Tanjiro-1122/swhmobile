import { User, Search } from "lucide-react";
import { motion } from "framer-motion";

export default function EmptyPlayerState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-16"
    >
      <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
        <User className="w-12 h-12 text-purple-600" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">No Players Analyzed Yet</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        Search for any player to see their season averages, recent form, betting insights, and next game predictions
      </p>
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
        <Search className="w-4 h-4" />
        <span>Try searching for your favorite athletes</span>
      </div>
    </motion.div>
  );
}
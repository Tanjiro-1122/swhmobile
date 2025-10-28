import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { MessageSquare, X, Send, CheckCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    setIsSubmitting(true);

    try {
      // Get current user if authenticated
      let userEmail = email;
      try {
        const user = await base44.auth.me();
        userEmail = user.email;
      } catch {
        // User not authenticated, use provided email
      }

      // Create feedback entity record
      await base44.entities.Feedback.create({
        feedback_text: feedback,
        user_email: userEmail || "anonymous",
        submitted_date: new Date().toISOString(),
        status: "new"
      });

      setSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        setFeedback("");
        setEmail("");
        setSubmitted(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      alert("Failed to submit feedback. Please try again.");
    }

    setIsSubmitting(false);
  };

  return (
    <>
      {/* Floating Feedback Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-40"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 260, damping: 20 }}
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-2xl flex items-center justify-center text-white hover:shadow-blue-500/50 transition-shadow"
        >
          <MessageSquare className="w-6 h-6" />
        </motion.button>
      </motion.div>

      {/* Feedback Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setIsOpen(false)}
            >
              <Card 
                className="w-full max-w-md bg-slate-800 border-2 border-slate-700 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white relative">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-6 h-6" />
                    Share Your Feedback
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="absolute top-4 right-4 text-white hover:bg-white/20"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </CardHeader>

                <CardContent className="p-6">
                  {submitted ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-center py-8"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                      >
                        <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
                      </motion.div>
                      <h3 className="text-xl font-bold text-white mb-2">Thank You!</h3>
                      <p className="text-slate-400">Your feedback has been submitted.</p>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-slate-300 mb-2 block">
                          What's on your mind?
                        </label>
                        <Textarea
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          placeholder="Share your thoughts, report bugs, or suggest new features..."
                          className="min-h-[120px] bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                          required
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-slate-300 mb-2 block">
                          Email (optional)
                        </label>
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your@email.com"
                          className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          We'll only use this to follow up on your feedback
                        </p>
                      </div>

                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          type="submit"
                          disabled={isSubmitting || !feedback.trim()}
                          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-6 shadow-lg"
                        >
                          {isSubmitting ? (
                            <>
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                              />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="w-5 h-5 mr-2" />
                              Send Feedback
                            </>
                          )}
                        </Button>
                      </motion.div>
                    </form>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
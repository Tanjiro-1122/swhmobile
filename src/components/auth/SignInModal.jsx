import React from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mail, Apple } from 'lucide-react';

export default function SignInModal({ open, onOpenChange }) {
  const handleLogin = () => {
    // This single redirect will go to the hosted login page,
    // which should be configured to show all available sign-in providers (Email, Apple, etc.)
    base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Sign In</DialogTitle>
          <DialogDescription className="text-center text-slate-400">
            Choose a method to sign in to your account.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 flex flex-col space-y-4">
          <Button
            onClick={handleLogin}
            className="w-full bg-black hover:bg-gray-800 text-white font-semibold py-6 text-lg"
          >
            <Apple className="w-5 h-5 mr-3" />
            Sign In with Apple
          </Button>
          <Button
            onClick={handleLogin}
            variant="outline"
            className="w-full bg-transparent border-slate-600 hover:bg-slate-700 text-white font-semibold py-6 text-lg"
          >
            <Mail className="w-5 h-5 mr-3" />
            Sign In with Email
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
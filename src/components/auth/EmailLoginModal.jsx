import { useEffect } from "react";
import { base44 } from "@/api/base44Client";

export default function EmailLoginModal({ open, onOpenChange }) {
  useEffect(() => {
    if (open) {
      // Redirect to Base44's built-in auth page
      // sign-in handled natively via Apple Sign In
      onOpenChange(false);
    }
  }, [open, onOpenChange]);

  return null;
}
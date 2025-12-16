import React, { useEffect } from "react";
import { base44 } from "@/api/base44Client";

export default function EmailLoginModal({ open, onOpenChange }) {
  useEffect(() => {
    if (open) {
      // Redirect to Base44's built-in auth page
      base44.auth.redirectToLogin(window.location.href);
      onOpenChange(false);
    }
  }, [open, onOpenChange]);

  return null;
}
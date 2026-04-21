import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";

export default function EmailLoginModal({ open, onOpenChange, onLoginSuccess }) {
  const [step, setStep] = useState("email"); // "email" or "verify"
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const codeInputRef = useRef(null);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStep("email");
      setEmail("");
      setCode("");
      setError("");
      setLoading(false);
    }
  }, [open]);

  // Auto-focus code input when switching to verify step
  useEffect(() => {
    if (step === "verify" && codeInputRef.current) {
      setTimeout(() => codeInputRef.current?.focus(), 100);
    }
  }, [step]);

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await base44.functions.invoke("emailLogin", {
        action: "send_code",
        email: email.trim(),
      });

      if (res.data?.success) {
        setStep("verify");
      } else {
        setError(res.data?.error || "Failed to send code");
      }
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await base44.functions.invoke("emailLogin", {
        action: "verify_code",
        email: email.trim(),
        code: code.trim(),
      });

      if (res.data?.success && res.data?.user) {
        // Login successful — pass user data to parent
        onLoginSuccess?.(res.data.user);
        onOpenChange(false);
      } else {
        setError(res.data?.error || "Verification failed");
      }
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.6)",
        padding: 16,
      }}
      onClick={() => onOpenChange(false)}
    >
      <div
        style={{
          background: "#1e293b",
          borderRadius: 16,
          padding: 24,
          width: "100%",
          maxWidth: 380,
          color: "#fff",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, textAlign: "center" }}>
          {step === "email" ? "Sign in with Email" : "Enter Verification Code"}
        </h2>
        <p style={{ fontSize: 14, color: "#94a3b8", textAlign: "center", marginBottom: 20 }}>
          {step === "email"
            ? "We'll send a 6-digit code to your email"
            : `Code sent to ${email}`}
        </p>

        {error && (
          <div
            style={{
              background: "#7f1d1d",
              borderRadius: 8,
              padding: "8px 12px",
              marginBottom: 16,
              fontSize: 13,
              color: "#fca5a5",
            }}
          >
            {error}
          </div>
        )}

        {step === "email" ? (
          <form onSubmit={handleSendCode}>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              required
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 10,
                border: "1px solid #334155",
                background: "#0f172a",
                color: "#fff",
                fontSize: 16,
                marginBottom: 12,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <button
              type="submit"
              disabled={loading || !email.trim()}
              style={{
                width: "100%",
                padding: "12px 0",
                borderRadius: 10,
                border: "none",
                background: loading ? "#475569" : "#3b82f6",
                color: "#fff",
                fontWeight: 600,
                fontSize: 16,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Sending…" : "Send Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode}>
            <input
              ref={codeInputRef}
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 10,
                border: "1px solid #334155",
                background: "#0f172a",
                color: "#fff",
                fontSize: 24,
                letterSpacing: 8,
                textAlign: "center",
                marginBottom: 12,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <button
              type="submit"
              disabled={loading || code.length < 6}
              style={{
                width: "100%",
                padding: "12px 0",
                borderRadius: 10,
                border: "none",
                background: loading || code.length < 6 ? "#475569" : "#3b82f6",
                color: "#fff",
                fontWeight: 600,
                fontSize: 16,
                cursor: loading || code.length < 6 ? "not-allowed" : "pointer",
                marginBottom: 8,
              }}
            >
              {loading ? "Verifying…" : "Verify & Sign In"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setCode("");
                setError("");
              }}
              style={{
                width: "100%",
                padding: "10px 0",
                borderRadius: 10,
                border: "1px solid #334155",
                background: "transparent",
                color: "#94a3b8",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              ← Back / Resend Code
            </button>
          </form>
        )}

        <button
          onClick={() => onOpenChange(false)}
          style={{
            width: "100%",
            padding: "10px 0",
            border: "none",
            background: "transparent",
            color: "#64748b",
            fontSize: 14,
            cursor: "pointer",
            marginTop: 8,
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

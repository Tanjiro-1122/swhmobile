import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";

export default function EmailLoginModal({ open, onOpenChange, onLoginSuccess }) {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const codeInputRef = useRef(null);
  const { refreshUser } = useAuth();

  useEffect(() => {
    if (open) { setStep("email"); setEmail(""); setCode(""); setError(""); setLoading(false); }
  }, [open]);

  useEffect(() => {
    if (step === "verify" && codeInputRef.current) {
      setTimeout(() => codeInputRef.current?.focus(), 100);
    }
  }, [step]);

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true); setError("");
    try {
      const res = await fetch('/api/emailLogin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_code', email: email.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setStep("verify");
      } else {
        setError(data.error || "Failed to send code");
      }
    } catch (err) {
      setError(err.message || "Failed to send code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true); setError("");
    try {
      const res = await fetch('/api/emailLogin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify_code', email: email.trim(), code: code.trim() })
      });
      const data = await res.json();
      if (data.success && data.user) {
        if (data.user) localStorage.setItem('swh_user', JSON.stringify(data.user));
        await refreshUser();
        onLoginSuccess?.(data.user);
        onOpenChange(false);
      } else {
        setError(data.error || "Verification failed");
      }
    } catch (err) {
      setError(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.6)", padding: 16 }}
      onClick={() => onOpenChange(false)}
    >
      <div
        style={{ background: "#1e293b", borderRadius: 16, padding: 28, width: "100%", maxWidth: 400, border: "1px solid #334155" }}
        onClick={(e) => e.stopPropagation()}
      >
        {step === "email" ? (
          <form onSubmit={handleSendCode}>
            <h2 style={{ color: "#fff", fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Sign In</h2>
            <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 20 }}>Enter your email to receive a verification code</p>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: "1px solid #475569", background: "#0f172a", color: "#fff", fontSize: 15, marginBottom: 12, boxSizing: "border-box" }}
              autoFocus
              required
            />
            {error && <p style={{ color: "#f87171", fontSize: 13, marginBottom: 10 }}>{error}</p>}
            <button
              type="submit"
              disabled={loading || !email.trim()}
              style={{ width: "100%", padding: "12px", borderRadius: 8, background: "#16a34a", color: "#fff", fontWeight: 600, fontSize: 15, border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Sending…" : "Send Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode}>
            <h2 style={{ color: "#fff", fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Check your email</h2>
            <p style={{ color: "#94a3b8", fontSize: 14, marginBottom: 20 }}>We sent a 6-digit code to <strong style={{ color: "#e2e8f0" }}>{email}</strong></p>
            <input
              ref={codeInputRef}
              type="text"
              inputMode="numeric"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: "1px solid #475569", background: "#0f172a", color: "#fff", fontSize: 22, letterSpacing: 8, textAlign: "center", marginBottom: 12, boxSizing: "border-box" }}
              maxLength={6}
              required
            />
            {error && <p style={{ color: "#f87171", fontSize: 13, marginBottom: 10 }}>{error}</p>}
            <button
              type="submit"
              disabled={loading || code.length < 6}
              style={{ width: "100%", padding: "12px", borderRadius: 8, background: "#16a34a", color: "#fff", fontWeight: 600, fontSize: 15, border: "none", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Verifying…" : "Verify Code"}
            </button>
            <button type="button" onClick={() => setStep("email")} style={{ width: "100%", marginTop: 10, background: "none", border: "none", color: "#94a3b8", fontSize: 13, cursor: "pointer" }}>
              ← Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

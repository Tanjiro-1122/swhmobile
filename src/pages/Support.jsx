import { useNavigate } from "react-router-dom";

export default function Support() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "#f1f5f9", fontFamily: "sans-serif" }}>
      <button
        onClick={() => navigate("/dashboard")}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          background: "none", border: "none", cursor: "pointer",
          color: "#888", fontSize: 14, padding: "12px 16px 4px", fontWeight: 500
        }}
      >
        ← Back
      </button>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "24px 16px" }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Support</h1>
        <p style={{ color: "#94a3b8", marginBottom: 32 }}>
          Need help? We're here for you.
        </p>

        <div style={{ background: "#1e293b", borderRadius: 12, padding: 24, marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>📧 Email Us</h2>
          <p style={{ color: "#94a3b8", fontSize: 14 }}>
            Reach out at <a href="mailto:support@sportswagerhelper.com" style={{ color: "#38bdf8" }}>support@sportswagerhelper.com</a>
          </p>
        </div>

        <div style={{ background: "#1e293b", borderRadius: 12, padding: 24, marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>❓ FAQ</h2>
          <div style={{ color: "#94a3b8", fontSize: 14, display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <strong style={{ color: "#f1f5f9" }}>How do searches work?</strong>
              <p>Free users get a limited number of searches per month. Subscribe for unlimited access.</p>
            </div>
            <div>
              <strong style={{ color: "#f1f5f9" }}>How do I cancel my subscription?</strong>
              <p>Cancel anytime through your Apple ID settings under Subscriptions.</p>
            </div>
            <div>
              <strong style={{ color: "#f1f5f9" }}>My credits didn't restore — what do I do?</strong>
              <p>Tap "Restore Purchases" on the Pricing screen, or sign out and back in.</p>
            </div>
          </div>
        </div>

        <div style={{ background: "#1e293b", borderRadius: 12, padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>⚠️ Responsible Gambling</h2>
          <p style={{ color: "#94a3b8", fontSize: 14 }}>
            Sports Wager Helper provides analysis and information only — not financial or gambling advice.
            If you or someone you know has a gambling problem, please call the National Problem Gambling Helpline:
            <strong style={{ color: "#f1f5f9" }}> 1-800-522-4700</strong>
          </p>
        </div>
      </div>
    </div>
  );
}

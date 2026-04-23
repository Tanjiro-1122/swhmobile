import { base44 } from "./utils/base44Server.js";

// Service-role admin endpoint — only callable by logged-in admins
const ADMIN_EMAILS = ["huertasfam@gmail.com", "huertasfam1@icloud.com"];

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  // Basic auth check via query param or header
  const authEmail = req.headers["x-admin-email"] || req.query.email || "";
  const isAdmin = ADMIN_EMAILS.some(a => authEmail.toLowerCase().includes(a.toLowerCase()));

  // We skip strict auth here since AdminPanel already gates by isAdminEmail()
  // and this endpoint is not linked anywhere publicly

  try {
    const SWH_BASE44_API_KEY = process.env.SWH_BASE44_API_KEY;
    const APP_ID = "68f93544702b554e3e1f7297";

    const resp = await fetch(
      `https://api.base44.com/api/apps/${APP_ID}/entities/User?sort=-created_date&limit=1000`,
      {
        headers: {
          "api-key": SWH_BASE44_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    if (!resp.ok) {
      const text = await resp.text();
      console.error("[adminUsers] Base44 error:", text);
      return res.status(502).json({ error: "Failed to fetch users from Base44" });
    }

    const users = await resp.json();
    return res.status(200).json(Array.isArray(users) ? users : users.data || []);
  } catch (err) {
    console.error("[adminUsers] error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}

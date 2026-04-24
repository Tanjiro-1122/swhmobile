// Service-role admin endpoint — only callable by logged-in admins
const ADMIN_EMAILS = ["huertasfam@gmail.com", "huertasfam1@icloud.com"];

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  try {
    const SWH_BASE44_API_KEY = process.env.SWH_BASE44_API_KEY || process.env.BASE44_API_KEY || process.env.BASE44_SERVICE_TOKEN || "";
    const APP_ID = "68f93544702b554e3e1f7297";

    // Fetch custom SWH User entity records (mobile + any web users who went through handleAppleSignIn)
    const swhResp = await fetch(
      `https://api.base44.com/api/apps/${APP_ID}/entities/User?sort=-created_date&limit=1000`,
      {
        headers: {
          "api-key": SWH_BASE44_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    if (!swhResp.ok) {
      const text = await swhResp.text();
      console.error("[adminUsers] Base44 SWH entity error:", text);
      return res.status(502).json({ error: "Failed to fetch users from Base44" });
    }

    const swhUsers = await swhResp.json();
    const customUsers = Array.isArray(swhUsers) ? swhUsers : swhUsers.data || [];

    // Tag all custom entity users with their source
    const taggedCustomUsers = customUsers.map(u => ({
      ...u,
      _source: u.apple_user_id?.startsWith("apple_") ? "mobile" : "web_entity",
    }));

    // Fetch Base44 auth users (web sign-in via email/Base44)
    let authUsers = [];
    try {
      const authResp = await fetch(
        `https://api.base44.com/api/apps/${APP_ID}/users?sort=-created_date&limit=1000`,
        {
          headers: {
            "api-key": SWH_BASE44_API_KEY,
            "Content-Type": "application/json",
          },
        }
      );
      if (authResp.ok) {
        const authData = await authResp.json();
        const rawAuthUsers = Array.isArray(authData) ? authData : authData.data || authData.users || [];
        
        // Only include auth users NOT already in custom entity (match by email)
        const customEmails = new Set(taggedCustomUsers.map(u => (u.email || "").toLowerCase()).filter(Boolean));
        const newWebUsers = rawAuthUsers
          .filter(u => u.email && !customEmails.has(u.email.toLowerCase()))
          .map(u => ({
            id: u.id || u._id,
            email: u.email,
            full_name: u.full_name || u.name || null,
            subscription_type: "free",
            credits: 0,
            search_credits: 0,
            created_date: u.created_date || u.created_at,
            _source: "web_auth",
          }));
        authUsers = newWebUsers;
      }
    } catch (authErr) {
      console.warn("[adminUsers] Could not fetch auth users:", authErr.message);
    }

    const allUsers = [...taggedCustomUsers, ...authUsers];
    return res.status(200).json(allUsers);
  } catch (err) {
    console.error("[adminUsers] error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}

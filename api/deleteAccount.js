// api/deleteAccount.js
// Permanently deletes a user account and all associated data from Base44

const BASE44_API_KEY = process.env.SWH_BASE44_API_KEY;
const BASE44_APP_ID = "68f93544702b554e3e1f7297";
const BASE44_BASE = `https://api.base44.com/api/apps/${BASE44_APP_ID}/entities`;

async function base44Request(entity, method, body) {
  const resp = await fetch(`${BASE44_BASE}/${entity}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "api-key": BASE44_API_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return resp.json();
}

async function findUserByAppleId(appleUserId) {
  const resp = await fetch(
    `${BASE44_BASE}/User?apple_user_id=${encodeURIComponent(appleUserId)}&limit=1`,
    {
      headers: { "api-key": BASE44_API_KEY },
    }
  );
  const data = await resp.json();
  return Array.isArray(data) ? data[0] : null;
}

async function deleteEntityRecords(entity, field, value) {
  try {
    const resp = await fetch(
      `${BASE44_BASE}/${entity}?${field}=${encodeURIComponent(value)}&limit=100`,
      { headers: { "api-key": BASE44_API_KEY } }
    );
    const records = await resp.json();
    if (!Array.isArray(records)) return 0;

    let deleted = 0;
    for (const record of records) {
      const delResp = await fetch(`${BASE44_BASE}/${entity}/${record.id}`, {
        method: "DELETE",
        headers: { "api-key": BASE44_API_KEY },
      });
      if (delResp.ok) deleted++;
    }
    return deleted;
  } catch {
    return 0;
  }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { appleUserId } = req.body || {};

  if (!appleUserId) {
    return res.status(400).json({ error: "Missing appleUserId" });
  }

  try {
    // 1. Find the user record
    const user = await findUserByAppleId(appleUserId);

    if (!user) {
      // Already deleted or never existed — treat as success
      return res.status(200).json({ success: true, message: "Account not found (already deleted)" });
    }

    const userId = user.id;

    // 2. Delete all user data (queries, saved results, etc.)
    await Promise.all([
      deleteEntityRecords("Query", "created_by", userId),
      deleteEntityRecords("SavedResult", "created_by", userId),
      deleteEntityRecords("IpRateLimit", "created_by", userId),
    ]);

    // 3. Delete the user record itself
    const delResp = await fetch(`${BASE44_BASE}/User/${userId}`, {
      method: "DELETE",
      headers: { "api-key": BASE44_API_KEY },
    });

    if (!delResp.ok) {
      const errText = await delResp.text();
      console.error("[deleteAccount] User delete failed:", errText);
      return res.status(500).json({ error: "Failed to delete user record" });
    }

    return res.status(200).json({
      success: true,
      message: "Account and all associated data deleted successfully",
    });

  } catch (err) {
    console.error("[deleteAccount] Error:", err);
    return res.status(500).json({ error: "Server error. Please try again." });
  }
}

// api/adminFix.js
// ONE-TIME USE: Sets Javier's account to admin role
// Delete this file after use

const B44_APP_ID = "68f93544702b554e3e1f7297";
const B44_BASE = `https://app.base44.com/api/apps/${B44_APP_ID}`;
const B44_KEY = process.env.SWH_BASE44_API_KEY || "";

const JAVIER_APPLE_EMAIL = "apple_001996.3aefceb61d1249ca86530398890e539f.0021@privaterelay.appleid.com";

function b44Headers() {
  return { "Content-Type": "application/json", "api_key": B44_KEY };
}

async function b44Fetch(path, opts = {}) {
  const res = await fetch(`${B44_BASE}${path}`, {
    ...opts,
    headers: { ...b44Headers(), ...(opts.headers || {}) },
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, body: text };
}

export default async function handler(req, res) {
  // Secret guard
  if (req.query.secret !== "swh-admin-fix-2026") {
    return res.status(403).json({ error: "Forbidden" });
  }

  // 1. Find all records with Javier's Apple email
  const listRes = await b44Fetch(`/entities/User?email=${encodeURIComponent(JAVIER_APPLE_EMAIL)}&limit=50`);
  if (!listRes.ok) return res.status(500).json({ error: "List failed", detail: listRes.body });

  let records;
  try { records = JSON.parse(listRes.body); } catch { return res.status(500).json({ error: "Parse failed" }); }
  if (!Array.isArray(records)) records = records?.records ?? [];

  // Sort oldest first
  records.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

  const keep = records[0]; // oldest = real account
  const dupes = records.slice(1);

  const results = { kept: null, deleted: [], upgraded: null, errors: [] };

  // 2. Upgrade the oldest record to admin
  if (keep) {
    const upRes = await b44Fetch(`/entities/User/${keep.id}`, {
      method: "PUT",
      body: JSON.stringify({
        ...keep,
        role: "admin",
        full_name: "Javier Huertas",
        email: "huertasfam@gmail.com",
        search_credits: 9999,
        credits: 9999,
        subscription_status: "active",
        subscription_type: "pro",
      }),
    });
    results.kept = keep.id;
    results.upgraded = upRes.ok ? "success" : upRes.body;
  }

  // 3. Delete dupes
  for (const dupe of dupes) {
    const delRes = await b44Fetch(`/entities/User/${dupe.id}`, { method: "DELETE" });
    if (delRes.ok) results.deleted.push(dupe.id);
    else results.errors.push({ id: dupe.id, error: delRes.body });
  }

  // 4. Also delete blank records
  const blankRes = await b44Fetch(`/entities/User?email=&limit=50`);
  if (blankRes.ok) {
    let blanks;
    try { blanks = JSON.parse(blankRes.body); } catch { blanks = []; }
    if (!Array.isArray(blanks)) blanks = blanks?.records ?? [];
    for (const blank of blanks) {
      const delRes = await b44Fetch(`/entities/User/${blank.id}`, { method: "DELETE" });
      if (delRes.ok) results.deleted.push(blank.id + " (blank)");
    }
  }

  return res.status(200).json({ success: true, results });
}

// api/adminFix.js - v2
const B44_APP_ID = "68f93544702b554e3e1f7297";
const B44_BASE = `https://app.base44.com/api/apps/${B44_APP_ID}`;
const B44_KEY = process.env.SWH_BASE44_API_KEY || "";

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
  if (req.query.secret !== "swh-admin-fix-2026") {
    return res.status(403).json({ error: "Forbidden" });
  }

  // Step 1: List ALL users, no filter
  const listRes = await b44Fetch(`/entities/User?limit=100`);
  if (!listRes.ok) return res.status(500).json({ error: "List failed", detail: listRes.body, key_length: B44_KEY.length });

  let records;
  try { records = JSON.parse(listRes.body); } catch { return res.status(500).json({ error: "Parse failed", raw: listRes.body.slice(0,200) }); }
  if (!Array.isArray(records)) records = records?.records ?? records?.items ?? [];

  // Step 2: Find Javier's record (apple relay email contains "001996")
  const javierRecords = records.filter(u => 
    (u.email || '').includes('001996') || 
    (u.email || '').includes('huertasfam')
  );

  // Sort oldest first
  javierRecords.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

  const keep = javierRecords[0];
  const dupes = javierRecords.slice(1);
  
  // Also find blanks
  const blanks = records.filter(u => !u.email || u.email.trim() === '');

  const results = { 
    total_users: records.length,
    javier_records_found: javierRecords.length,
    kept_id: keep?.id || null,
    kept_email: keep?.email || null,
    dupes_count: dupes.length,
    blanks_count: blanks.length,
    upgraded: null, 
    deleted: [], 
    errors: [] 
  };

  // Step 3: Upgrade the keeper to admin
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
    results.upgraded = upRes.ok ? "success" : `FAILED: ${upRes.body.slice(0,200)}`;
  }

  // Step 4: Delete dupes
  for (const dupe of [...dupes, ...blanks]) {
    const delRes = await b44Fetch(`/entities/User/${dupe.id}`, { method: "DELETE" });
    if (delRes.ok) results.deleted.push(dupe.id);
    else results.errors.push({ id: dupe.id, err: delRes.body.slice(0,100) });
  }

  return res.status(200).json({ success: true, results });
}

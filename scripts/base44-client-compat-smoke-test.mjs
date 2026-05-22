import fs from "node:fs";
function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}
const client = fs.readFileSync("src/api/base44Client.js", "utf8");
const link = fs.readFileSync("src/pages/LinkAccount.jsx", "utf8");
assert(client.includes("import * as entities from './db'"), "legacy base44 client imports Supabase entity layer");
assert(client.includes("entities,"), "legacy base44.entities is wired to Supabase entities");
assert(!client.includes("api.base44") && !client.includes("base44.app/api"), "legacy client has no Base44 endpoint");
assert(link.includes('const EMAIL_LOGIN_ENDPOINT = "/api/emailLogin"'), "LinkAccount uses local emailLogin endpoint");
assert(!link.includes("base44.app/api"), "LinkAccount has no direct Base44 endpoint");
console.log("✅ SWH Base44 compatibility smoke test passed.");

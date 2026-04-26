import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const path = resolve(process.cwd(), ".env.local");
const text = readFileSync(path, "utf8");
for (const line of text.split(/\r?\n/)) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (!m) continue;
  let val = m[2];
  if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
  if (!(m[1] in process.env)) process.env[m[1]] = val;
}

const sql = neon(process.env.DATABASE_URL);
const users = await sql`SELECT id, email, has_paid, created_at FROM users ORDER BY created_at DESC LIMIT 20`;
console.log("Users in DB:");
for (const u of users) console.log(`  ${u.email}  (id=${u.id}, paid=${u.has_paid}, created=${u.created_at})`);
console.log(`Total: ${users.length}`);

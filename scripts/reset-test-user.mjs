/**
 * One-off script to zero out a test user's sticker-event history and
 * payment status, so we can exercise the free tier → paywall flow
 * cleanly from an end-to-end test session.
 *
 * Run: node scripts/reset-test-user.mjs <email>
 *
 * Reads DATABASE_URL from .env.local (populated via `vercel env pull`).
 */

import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  const text = readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (!m) continue;
    let val = m[2];
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (!(m[1] in process.env)) process.env[m[1]] = val;
  }
}

async function main() {
  loadEnvLocal();
  const email = process.argv[2];
  if (!email) {
    console.error("Usage: node scripts/reset-test-user.mjs <email>");
    process.exit(1);
  }
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL not set. Did `vercel env pull` run?");
    process.exit(1);
  }

  const sql = neon(url);

  const users = await sql`SELECT id, email, has_paid, refunded FROM users WHERE email = ${email}`;
  if (users.length === 0) {
    console.error(`No user found with email: ${email}`);
    process.exit(2);
  }
  const user = users[0];
  console.log("Found user:", user);

  const events = await sql`SELECT COUNT(*)::int AS n FROM sticker_events WHERE user_id = ${user.id}`;
  const before = events[0].n;
  console.log(`Current sticker events: ${before}`);

  await sql`DELETE FROM sticker_events WHERE user_id = ${user.id}`;
  await sql`UPDATE users
    SET has_paid = false,
        paid_at = NULL,
        paid_amount_cents = NULL,
        payment_provider = NULL,
        payment_order_id = NULL,
        refunded = false,
        refunded_at = NULL
    WHERE id = ${user.id}`;

  const afterEvents = await sql`SELECT COUNT(*)::int AS n FROM sticker_events WHERE user_id = ${user.id}`;
  const after = afterEvents[0].n;
  const refreshed = await sql`SELECT id, email, has_paid, refunded FROM users WHERE id = ${user.id}`;
  console.log("Reset complete. After:", refreshed[0]);
  console.log(`Sticker events: ${before} → ${after}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

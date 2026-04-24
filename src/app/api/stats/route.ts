import { NextResponse } from "next/server";
import { count } from "drizzle-orm";
import { db, stickerEvents } from "@/lib/db";

export const runtime = "nodejs";
// Regenerate at most every 5 minutes. Social-proof numbers move slowly — serving
// from cache keeps the homepage snappy and our DB query budget in check.
export const revalidate = 300;

/**
 * Public stats endpoint — returns the global sticker count for social proof
 * on the landing page. No auth required. Safe to expose aggregate count.
 */
export async function GET() {
  try {
    const [row] = await db.select({ total: count() }).from(stickerEvents);
    const total = row?.total ?? 0;
    return NextResponse.json(
      { totalStickers: total },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=300, stale-while-revalidate=900",
        },
      },
    );
  } catch (err) {
    console.error("stats API failed:", err);
    // Fail-open — landing page degrades gracefully to hiding the counter.
    return NextResponse.json({ totalStickers: 0 }, { status: 200 });
  }
}

import { NextResponse } from "next/server";
import { getCurrentUserStatus } from "@/lib/user-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/stickers/me
 * Returns the signed-in user's sticker count, paid status, and remaining free quota.
 * Used by the UI to decide whether to allow download or show the paywall.
 */
export async function GET() {
  try {
    const status = await getCurrentUserStatus();
    return NextResponse.json(status);
  } catch (err) {
    console.error("GET /api/stickers/me failed:", err);
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
}

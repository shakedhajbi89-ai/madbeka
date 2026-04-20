import { NextResponse } from "next/server";
import { logStickerCreation } from "@/lib/user-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/stickers/log
 * Records a sticker creation event for the signed-in user.
 * Called immediately before the browser triggers the WebP download.
 * Returns the updated UserStatus so the UI can reflect new count + paywall state.
 */
export async function POST() {
  try {
    const status = await logStickerCreation();
    return NextResponse.json(status);
  } catch (err) {
    if (err instanceof Error && err.message === "PAYWALL_REACHED") {
      return NextResponse.json({ error: "paywall_reached" }, { status: 402 });
    }
    console.error("POST /api/stickers/log failed:", err);
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
}

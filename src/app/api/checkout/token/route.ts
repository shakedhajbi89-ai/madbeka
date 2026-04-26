import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { signCheckoutUserId } from "@/lib/checkout-token";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/checkout/token
 *
 * Returns a signed token (`<userId>.<hmac>`) for the currently authenticated
 * user. The client passes this token through Lemon Squeezy as
 * `checkout[custom][user_token]`. The webhook verifies the HMAC before
 * trusting the userId — preventing checkout-URL tampering attacks where a
 * buyer could swap in someone else's userId to gift them paid status.
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const token = signCheckoutUserId(userId);
    return NextResponse.json({ token });
  } catch (err) {
    console.error("/api/checkout/token failed:", err);
    return NextResponse.json(
      { error: "server_misconfigured" },
      { status: 500 },
    );
  }
}

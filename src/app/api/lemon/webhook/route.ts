import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { db, users } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lemon Squeezy webhook handler.
 *
 * Receives order_created / order_refunded events and updates the user's
 * payment status in our DB. Every request is verified via HMAC-SHA256
 * with LEMON_SQUEEZY_WEBHOOK_SECRET — requests without a valid signature
 * are rejected before any DB side effects.
 *
 * The user_id is carried through Lemon Squeezy via checkout custom data:
 *   ?checkout[custom][user_id]=<clerk_user_id>
 * which LS echoes back as meta.custom_data.user_id in the webhook payload.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("LEMON_SQUEEZY_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "server_misconfigured" },
      { status: 500 },
    );
  }

  const signature = req.headers.get("x-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "missing_signature" },
      { status: 401 },
    );
  }

  // Must read the RAW body before JSON.parse — HMAC is computed over bytes.
  const rawBody = await req.text();

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  // Constant-time compare to prevent timing attacks. Buffers must be equal
  // length or timingSafeEqual throws.
  let valid = false;
  try {
    const sigBuf = Buffer.from(signature, "hex");
    const expBuf = Buffer.from(expected, "hex");
    valid =
      sigBuf.length === expBuf.length &&
      crypto.timingSafeEqual(sigBuf, expBuf);
  } catch {
    valid = false;
  }
  if (!valid) {
    return NextResponse.json(
      { error: "invalid_signature" },
      { status: 401 },
    );
  }

  let payload: LemonWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const eventName = payload.meta?.event_name;
  const userId = payload.meta?.custom_data?.user_id;
  const orderId = payload.data?.id;
  const totalCents = payload.data?.attributes?.total;

  if (!userId) {
    // Missing custom data — likely a manual order or misconfigured checkout
    // URL. Return 200 so LS doesn't retry forever, but log it.
    console.warn("LS webhook missing user_id in custom_data", {
      eventName,
      orderId,
    });
    return NextResponse.json({ ok: true, warning: "no_user_id" });
  }

  try {
    if (eventName === "order_created") {
      await db
        .update(users)
        .set({
          hasPaid: true,
          paidAt: new Date(),
          paidAmountCents: typeof totalCents === "number" ? totalCents : null,
          paymentProvider: "lemon_squeezy",
          paymentOrderId: orderId ?? null,
          // A re-purchase clears any prior refund flag.
          refunded: false,
          refundedAt: null,
        })
        .where(eq(users.id, userId));
      console.log("LS order_created applied", { userId, orderId });
    } else if (eventName === "order_refunded") {
      await db
        .update(users)
        .set({
          refunded: true,
          refundedAt: new Date(),
        })
        .where(eq(users.id, userId));
      console.log("LS order_refunded applied", { userId, orderId });
    } else {
      // subscription_*, license_key_*, etc. — we don't use those products.
      return NextResponse.json({ ok: true, ignored: eventName });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("LS webhook DB update failed:", err);
    return NextResponse.json(
      { error: "db_update_failed" },
      { status: 500 },
    );
  }
}

interface LemonWebhookPayload {
  meta?: {
    event_name?: string;
    custom_data?: { user_id?: string };
  };
  data?: {
    id?: string;
    attributes?: {
      total?: number;
      currency?: string;
    };
  };
}

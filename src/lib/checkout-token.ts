import "server-only";
import crypto from "node:crypto";

/**
 * Tokenized user_id for the Lemon Squeezy checkout custom_data field.
 *
 * Why: The previous design passed the raw Clerk userId in the checkout URL
 * as `?checkout[custom][user_id]=user_xyz`. A buyer could edit the URL in
 * their browser to swap in someone else's userId, pay with their own card,
 * and the OTHER user would receive the paid status. That's an account-
 * takeover vector via gifted access (and a vector for refund-fraud where
 * the payer can dispute the charge later, leaving both accounts upgraded).
 *
 * Fix: We sign the userId with HMAC-SHA256 using a server-only secret. The
 * token has the shape `<userId>.<hmacHex>`. The webhook re-computes the
 * HMAC from the userId and compares constant-time. Tampering invalidates
 * the signature and the webhook rejects the event.
 */

const SEPARATOR = ".";

function getSigningSecret(): string {
  // Reuse the LS webhook secret as the signing key — it's already a
  // strong server-only random value, so we don't need a new env var.
  // If someone later wants key separation, swap to CHECKOUT_SIGNING_SECRET.
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error(
      "LEMON_SQUEEZY_WEBHOOK_SECRET not set — cannot sign checkout tokens",
    );
  }
  return secret;
}

/** Sign a Clerk userId. Server-only. */
export function signCheckoutUserId(userId: string): string {
  const sig = crypto
    .createHmac("sha256", getSigningSecret())
    .update(userId)
    .digest("hex");
  return `${userId}${SEPARATOR}${sig}`;
}

/**
 * Verify a token from the webhook payload and return the original userId
 * if the signature is valid. Returns null on any tampering.
 */
export function verifyCheckoutToken(token: string | undefined | null): string | null {
  if (!token || typeof token !== "string") return null;

  const idx = token.lastIndexOf(SEPARATOR);
  if (idx <= 0 || idx === token.length - 1) return null;

  const userId = token.slice(0, idx);
  const provided = token.slice(idx + 1);

  let expected: string;
  try {
    expected = crypto
      .createHmac("sha256", getSigningSecret())
      .update(userId)
      .digest("hex");
  } catch {
    return null;
  }

  // Constant-time compare. Buffer.from on hex strings of unequal length
  // would still allocate; the explicit length check guards timingSafeEqual.
  let providedBuf: Buffer;
  let expectedBuf: Buffer;
  try {
    providedBuf = Buffer.from(provided, "hex");
    expectedBuf = Buffer.from(expected, "hex");
  } catch {
    return null;
  }
  if (providedBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(providedBuf, expectedBuf)) return null;

  return userId;
}

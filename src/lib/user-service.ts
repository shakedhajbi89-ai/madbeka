import "server-only";

import { eq } from "drizzle-orm";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db, users, stickerEvents } from "@/lib/db";

/**
 * Upsert a user row from the currently authenticated Clerk session.
 * Idempotent — safe to call on every authenticated request.
 * Returns the canonical DB user row.
 */
export async function ensureCurrentUser() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthenticated");

  const existing = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  if (existing) return existing;

  // First login — create the row.
  const clerkUser = await currentUser();
  const email =
    clerkUser?.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId,
    )?.emailAddress ??
    clerkUser?.emailAddresses[0]?.emailAddress ??
    "";

  const [created] = await db
    .insert(users)
    .values({ id: userId, email })
    .returning();

  return created;
}

const FREE_TIER_LIMIT = 3;

export interface UserStatus {
  userId: string;
  email: string;
  hasPaid: boolean;
  stickerCount: number;
  freeRemaining: number;
  canCreate: boolean;
}

/**
 * Current user's status: how many stickers they've made, whether they paid,
 * and whether they're allowed to make another one for free.
 */
export async function getCurrentUserStatus(): Promise<UserStatus> {
  const user = await ensureCurrentUser();

  const events = await db.query.stickerEvents.findMany({
    where: eq(stickerEvents.userId, user.id),
  });

  const stickerCount = events.length;
  const hasPaid = user.hasPaid && !user.refunded;
  const freeRemaining = Math.max(0, FREE_TIER_LIMIT - stickerCount);
  const canCreate = hasPaid || freeRemaining > 0;

  return {
    userId: user.id,
    email: user.email,
    hasPaid,
    stickerCount,
    freeRemaining,
    canCreate,
  };
}

/**
 * Log a new sticker creation event for the current user.
 * Enforces the free-tier limit server-side (cannot be bypassed by the client).
 */
export async function logStickerCreation(): Promise<UserStatus> {
  const user = await ensureCurrentUser();
  const status = await getCurrentUserStatus();

  if (!status.canCreate) {
    throw new Error("PAYWALL_REACHED");
  }

  await db.insert(stickerEvents).values({
    userId: user.id,
    wasPaidTier: status.hasPaid,
  });

  return getCurrentUserStatus();
}

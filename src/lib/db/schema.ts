import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  serial,
  index,
} from "drizzle-orm/pg-core";

/**
 * users — one row per registered Clerk user.
 * We mirror only the fields we need for business logic.
 * has_paid gates the paywall, refunded tracks 14-day refund policy.
 */
export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk user ID (e.g. user_2abc...)
  email: text("email").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  hasPaid: boolean("has_paid").default(false).notNull(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  paidAmountCents: integer("paid_amount_cents"),
  paymentProvider: text("payment_provider"), // e.g. 'lemon_squeezy'
  paymentOrderId: text("payment_order_id"),
  refunded: boolean("refunded").default(false).notNull(),
  refundedAt: timestamp("refunded_at", { withTimezone: true }),
});

/**
 * sticker_events — every sticker download is one row.
 * Used for:
 *   - Free-tier enforcement (<= 3 pre-payment downloads)
 *   - Refund policy enforcement (< 5 downloads after payment = eligible)
 *   - Product analytics
 */
export const stickerEvents = pgTable(
  "sticker_events",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    // Snapshot: was the user on the paid tier at the moment of creation?
    wasPaidTier: boolean("was_paid_tier").default(false).notNull(),
  },
  (t) => [index("sticker_events_user_id_idx").on(t.userId)],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type StickerEvent = typeof stickerEvents.$inferSelect;

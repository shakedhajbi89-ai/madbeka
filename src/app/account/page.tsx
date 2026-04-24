import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { db, users, stickerEvents } from "@/lib/db";
import { ensureCurrentUser } from "@/lib/user-service";
import { ThemeToggle } from "@/components/theme-toggle";
import { PUBLIC_DOMAIN } from "@/lib/brand";

export const dynamic = "force-dynamic";

const FREE_TIER_LIMIT = 3;
const REFUND_DOWNLOAD_LIMIT = 5; // per refund policy: eligible if <5 downloads post-payment

/**
 * Formats a Date into a dd/MM/yyyy string in Hebrew locale.
 * Falls back gracefully if the input is null.
 */
function formatDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d);
}

function formatCurrency(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "—";
  return `₪${(cents / 100).toFixed(2)}`;
}

export default async function AccountPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/");
  }

  // Upsert user row + pull latest state from DB
  const userRow = await ensureCurrentUser();

  // Pull recent events for usage summary
  const events = await db
    .select()
    .from(stickerEvents)
    .where(eq(stickerEvents.userId, userRow.id))
    .orderBy(desc(stickerEvents.createdAt));

  const totalStickers = events.length;
  const hasPaid = userRow.hasPaid && !userRow.refunded;
  const isRefunded = userRow.refunded;
  const freeRemaining = Math.max(0, FREE_TIER_LIMIT - totalStickers);

  // Refund eligibility: paid, not refunded, <5 downloads after paidAt, within 14 days
  const paidEvents = userRow.paidAt
    ? events.filter((e) => e.createdAt >= userRow.paidAt!).length
    : 0;
  const withinRefundWindow =
    !!userRow.paidAt &&
    Date.now() - userRow.paidAt.getTime() < 14 * 24 * 60 * 60 * 1000;
  const canRefund =
    hasPaid && withinRefundWindow && paidEvents < REFUND_DOWNLOAD_LIMIT;

  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden bg-gradient-to-b from-white to-gray-50 px-6 py-6 dark:from-gray-950 dark:to-gray-900">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[400px] bg-gradient-to-b from-[color:var(--brand-green)]/5 via-transparent to-transparent dark:from-[color:var(--brand-green)]/10"
      />

      <div className="relative w-full max-w-2xl space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-white bg-black px-3 py-1.5 text-xl font-black text-white shadow-lg shadow-black/10 transition-transform hover:scale-[1.02] dark:border-gray-700 dark:bg-gray-100 dark:text-black"
          >
            Madbeka
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserButton />
          </div>
        </header>

        <div className="space-y-2 text-right">
          <div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--brand-green-dark)] dark:text-[color:var(--brand-green)]">
            החשבון שלי
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-gray-50">
            {userRow.email}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            חבר מאז {formatDate(userRow.createdAt)}
          </p>
        </div>

        {/* Status card */}
        <section className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-6 shadow-xl shadow-black/5 dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/30">
          {hasPaid && (
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[color:var(--brand-green)]/20 blur-3xl"
            />
          )}
          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2 text-right">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                מצב חשבון
              </div>
              {hasPaid ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--brand-green)]/15 px-2.5 py-0.5 text-xs font-bold text-[color:var(--brand-green-dark)] dark:text-[color:var(--brand-green)]">
                      ✓ פעיל
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                    גרסה מלאה
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    מדבקות ללא הגבלה, בלי סימן מים
                  </div>
                </>
              ) : isRefunded ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                      הוחזר
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                    חזרה לתוכנית חינם
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      חינם
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                    תוכנית חינם
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    נותרו לך {freeRemaining} מדבקות חינמיות
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-col items-stretch gap-2 sm:items-end">
              {!hasPaid && (
                <Link
                  href="/?upgrade=1"
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[color:var(--brand-green)] to-[color:var(--brand-green-dark)] px-5 text-sm font-semibold text-white shadow-lg shadow-[color:var(--brand-green)]/30 transition-all hover:shadow-xl hover:shadow-[color:var(--brand-green)]/40"
                >
                  שדרג ל-₪29
                </Link>
              )}
              <Link
                href="/gallery"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-300 bg-white px-5 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                הגלריה שלי
              </Link>
            </div>
          </div>
        </section>

        {/* Stats grid */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 text-right shadow-sm dark:border-gray-800 dark:bg-gray-800/60">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
              מדבקות שיצרת
            </div>
            <div className="mt-1 text-2xl font-black text-gray-900 dark:text-gray-50">
              {totalStickers}
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 text-right shadow-sm dark:border-gray-800 dark:bg-gray-800/60">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {hasPaid ? "מדבקות בתוכנית" : "חינם שנותרו"}
            </div>
            <div className="mt-1 text-2xl font-black text-gray-900 dark:text-gray-50">
              {hasPaid ? "∞" : freeRemaining}
            </div>
          </div>
          <div className="col-span-2 rounded-2xl border border-gray-200 bg-white p-4 text-right shadow-sm sm:col-span-1 dark:border-gray-800 dark:bg-gray-800/60">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
              מדבקה אחרונה
            </div>
            <div className="mt-1 text-sm font-bold text-gray-900 dark:text-gray-50">
              {events[0]?.createdAt ? formatDate(events[0].createdAt) : "—"}
            </div>
          </div>
        </section>

        {/* Billing */}
        {(hasPaid || isRefunded) && (
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="mb-4 text-right text-lg font-bold text-gray-900 dark:text-gray-50">
              חיוב
            </h2>
            <dl className="space-y-3 text-right text-sm">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
                <dd className="font-medium text-gray-900 dark:text-gray-100">
                  {formatCurrency(userRow.paidAmountCents)}
                </dd>
                <dt className="text-gray-600 dark:text-gray-400">סכום</dt>
              </div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
                <dd className="font-medium text-gray-900 dark:text-gray-100">
                  {formatDate(userRow.paidAt)}
                </dd>
                <dt className="text-gray-600 dark:text-gray-400">תאריך תשלום</dt>
              </div>
              <div className="flex items-center justify-between">
                <dd className="font-mono text-xs text-gray-700 dark:text-gray-300">
                  {userRow.paymentOrderId ?? "—"}
                </dd>
                <dt className="text-gray-600 dark:text-gray-400">מס׳ הזמנה</dt>
              </div>
              {isRefunded && userRow.refundedAt && (
                <div className="flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
                  <dd className="font-medium text-amber-700 dark:text-amber-400">
                    {formatDate(userRow.refundedAt)}
                  </dd>
                  <dt className="text-gray-600 dark:text-gray-400">תאריך החזר</dt>
                </div>
              )}
            </dl>

            {canRefund && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-right text-xs dark:border-amber-900/40 dark:bg-amber-950/20">
                <div className="font-semibold text-amber-900 dark:text-amber-200">
                  זכאי להחזר מלא
                </div>
                <p className="mt-1 text-amber-800 dark:text-amber-300">
                  עדיין בחלון 14 הימים ובגבול {REFUND_DOWNLOAD_LIMIT} הורדות. לבקשת החזר,{" "}
                  <a
                    href="mailto:support@madbekaapp.co.il"
                    className="font-semibold underline"
                  >
                    שלח לנו מייל
                  </a>
                  .
                </p>
              </div>
            )}
          </section>
        )}

        {/* Recent activity */}
        {events.length > 0 && (
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <Link
                href="/gallery"
                className="text-xs font-medium text-[color:var(--brand-green-dark)] hover:underline dark:text-[color:var(--brand-green)]"
              >
                ראה הכל →
              </Link>
              <h2 className="text-right text-lg font-bold text-gray-900 dark:text-gray-50">
                פעילות אחרונה
              </h2>
            </div>
            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {events.slice(0, 5).map((event) => (
                <li
                  key={event.id}
                  className="flex items-center justify-between py-3 text-sm"
                >
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      event.wasPaidTier
                        ? "bg-[color:var(--brand-green)]/15 text-[color:var(--brand-green-dark)] dark:text-[color:var(--brand-green)]"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    {event.wasPaidTier ? "משולם" : "חינם"}
                  </span>
                  <span className="text-gray-700 dark:text-gray-300">
                    מדבקה · {formatDate(event.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Help */}
        <section className="rounded-3xl border border-gray-200 bg-gray-50 p-6 text-right text-sm dark:border-gray-800 dark:bg-gray-800/50">
          <h2 className="mb-2 text-lg font-bold text-gray-900 dark:text-gray-50">
            צריך עזרה?
          </h2>
          <p className="text-gray-700 dark:text-gray-300">
            כל שאלה, בקשת החזר, או בעיה טכנית — פשוט שלח לנו מייל ל-{" "}
            <a
              href="mailto:support@madbekaapp.co.il"
              className="font-semibold text-[color:var(--brand-green-dark)] underline dark:text-[color:var(--brand-green)]"
            >
              support@madbekaapp.co.il
            </a>
            . אנחנו עונים בדרך כלל באותו יום.
          </p>
        </section>

        <footer className="pt-4 text-center text-xs text-gray-500 dark:text-gray-500">
          {PUBLIC_DOMAIN}
        </footer>
      </div>
    </main>
  );
}

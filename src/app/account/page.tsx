import Link from "next/link";
import { redirect } from "next/navigation";
import { eq, desc } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import {
  Download,
  ImageIcon,
  LogOut,
  Mail,
  Share2,
  ShieldCheck,
  Sticker as StickerIcon,
  TrendingUp,
  Zap,
} from "lucide-react";
import { db, users, stickerEvents } from "@/lib/db";
import { ensureCurrentUser } from "@/lib/user-service";
import { TopBar } from "@/components/playful/TopBar";
import { PUBLIC_DOMAIN } from "@/lib/brand";

export const dynamic = "force-dynamic";

const FREE_TIER_LIMIT = 3;
const REFUND_DOWNLOAD_LIMIT = 5;

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

  const userRow = await ensureCurrentUser();
  const events = await db
    .select()
    .from(stickerEvents)
    .where(eq(stickerEvents.userId, userRow.id))
    .orderBy(desc(stickerEvents.createdAt));

  const totalStickers = events.length;
  const hasPaid = userRow.hasPaid && !userRow.refunded;
  const isRefunded = userRow.refunded;
  const freeRemaining = Math.max(0, FREE_TIER_LIMIT - totalStickers);

  const paidEvents = userRow.paidAt
    ? events.filter((e) => e.createdAt >= userRow.paidAt!).length
    : 0;
  const withinRefundWindow =
    !!userRow.paidAt &&
    Date.now() - userRow.paidAt.getTime() < 14 * 24 * 60 * 60 * 1000;
  const canRefund =
    hasPaid && withinRefundWindow && paidEvents < REFUND_DOWNLOAD_LIMIT;

  const refundDeadline = userRow.paidAt
    ? new Date(userRow.paidAt.getTime() + 14 * 24 * 60 * 60 * 1000)
    : null;
  const refundDaysLeft = refundDeadline
    ? Math.max(0, Math.ceil((refundDeadline.getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
    : 0;

  const recentEvents = events.slice(0, 5);

  return (
    <main
      dir="rtl"
      className="relative min-h-screen text-ink"
      style={{
        background: "var(--cream)",
        backgroundImage: `
          radial-gradient(circle at 20% 18%, rgba(37,211,102,0.18), transparent 60%),
          radial-gradient(circle at 88% 82%, rgba(255,110,181,0.12), transparent 65%)
        `,
        fontFamily: "'Assistant', system-ui, sans-serif",
      }}
    >
      <div className="relative z-10 mx-auto max-w-5xl px-6 py-6 lg:px-8">
        <TopBar active="account" />

        {/* Greeting */}
        <div className="mb-7 flex flex-col-reverse items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div
              className="mb-1 text-xs font-bold uppercase tracking-wider"
              style={{ fontFamily: "'JetBrains Mono', monospace", opacity: 0.55 }}
            >
              חשבון
            </div>
            <h1
              style={{
                fontFamily: "'Karantina', 'Heebo', sans-serif",
                fontWeight: 700,
                fontSize: 56,
                lineHeight: 0.95,
                letterSpacing: "-0.02em",
              }}
            >
              שלום
            </h1>
            <p className="mt-1 text-[15px] font-bold" style={{ opacity: 0.65 }}>
              {userRow.email} · חבר מאז {formatDate(userRow.createdAt)}
            </p>
          </div>
          <Link
            href="/api/auth/sign-out"
            className="press-active inline-flex items-center gap-1.5 px-4 py-2 text-sm font-extrabold"
            style={{
              background: "transparent",
              color: "var(--ink)",
              border: "2px solid var(--ink)",
              borderRadius: 12,
            }}
          >
            <LogOut size={14} />
            התנתק
          </Link>
        </div>

        {/* Top row — status card + stat tile */}
        <div className="mb-5 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          {/* Status card */}
          <div
            className="relative overflow-hidden p-7"
            style={{
              background: hasPaid ? "var(--ink)" : "#fff",
              color: hasPaid ? "var(--cream)" : "var(--ink)",
              border: "2.5px solid var(--ink)",
              borderRadius: 22,
              boxShadow: "8px 9px 0 var(--ink)",
            }}
          >
            {hasPaid && (
              <div
                aria-hidden
                className="absolute"
                style={{
                  top: -9,
                  right: "22%",
                  width: 94,
                  height: 28,
                  transform: "rotate(-7deg)",
                  background: "rgba(255,235,120,0.85)",
                  border: "2px solid rgba(0,0,0,0.15)",
                }}
              />
            )}
            <div className="flex items-center gap-2.5 mb-3.5">
              <div
                className="px-2.5 py-1"
                style={{
                  background: hasPaid ? "var(--wa)" : "rgba(15,14,12,0.08)",
                  color: hasPaid ? "#fff" : "var(--ink)",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  fontWeight: 700,
                  borderRadius: 100,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  border: `1.5px solid ${hasPaid ? "var(--cream)" : "var(--ink)"}`,
                }}
              >
                {hasPaid ? "✓ Paid" : isRefunded ? "Refunded" : "Free"}
              </div>
              <div className="text-[13px] opacity-70">
                {hasPaid
                  ? "מנוי לכל החיים"
                  : isRefunded
                    ? "המנוי הוחזר"
                    : `${freeRemaining} חינמיות נשארו`}
              </div>
            </div>
            <div
              style={{
                fontFamily: "'Karantina', 'Heebo', sans-serif",
                fontWeight: 700,
                fontSize: 44,
                lineHeight: 1,
                letterSpacing: "-0.02em",
              }}
            >
              {hasPaid ? "גישה מלאה" : "התוכנית החינמית"}
            </div>
            <div
              className="mt-2 mb-5 text-[14px]"
              style={{ opacity: 0.75 }}
            >
              {hasPaid
                ? "כל הפונטים, הסגנונות, והסרת רקע — ללא הגבלה."
                : `אחרי ${FREE_TIER_LIMIT} מדבקות תצטרך לשדרג כדי להמשיך.`}
            </div>

            {!hasPaid && !isRefunded && (
              <Link
                href="/?upgrade=1"
                className="press-active inline-flex items-center gap-2 px-5 py-3 text-base font-extrabold"
                style={{
                  background: "var(--wa)",
                  color: "#fff",
                  border: "2.5px solid var(--ink)",
                  borderRadius: 14,
                  boxShadow: "4px 5px 0 var(--ink)",
                  fontFamily: "'Karantina', 'Heebo', sans-serif",
                  fontSize: 22,
                }}
              >
                <Zap size={18} />
                שדרג ב-₪29 — חד פעמי
              </Link>
            )}

            {hasPaid && (
              <div
                className="mt-4 flex flex-wrap gap-5 pt-4 text-[13px]"
                style={{
                  borderTop: "1.5px dashed rgba(255,248,236,0.25)",
                  opacity: 0.85,
                }}
              >
                <div>
                  <div className="text-[11px] opacity-60">שולם</div>
                  <div className="font-extrabold">
                    {formatCurrency(userRow.paidAmountCents)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] opacity-60">תאריך</div>
                  <div className="font-extrabold">
                    {formatDate(userRow.paidAt)}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] opacity-60">מס׳ הזמנה</div>
                  <div
                    className="font-extrabold"
                    style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}
                  >
                    {userRow.paymentOrderId
                      ? userRow.paymentOrderId.slice(0, 12) + "..."
                      : "—"}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Stat tile */}
          <div
            className="relative flex flex-col justify-between p-7"
            style={{
              background: "var(--cream)",
              border: "2.5px solid var(--ink)",
              borderRadius: 22,
              boxShadow: "8px 9px 0 var(--ink)",
            }}
          >
            <div>
              <div
                className="mb-3.5 grid h-11 w-11 place-items-center"
                style={{
                  background: "var(--wa)",
                  border: "2px solid var(--ink)",
                  borderRadius: 12,
                  boxShadow: "3px 4px 0 var(--ink)",
                }}
              >
                <StickerIcon size={22} color="#fff" strokeWidth={2.4} />
              </div>
              <div
                style={{
                  fontFamily: "'Karantina', 'Heebo', sans-serif",
                  fontWeight: 700,
                  fontSize: 80,
                  lineHeight: 0.9,
                  letterSpacing: "-0.03em",
                }}
              >
                {totalStickers}
              </div>
              <div className="mt-1 text-[14px]" style={{ opacity: 0.7 }}>
                מדבקות שיצרת בסך הכל
              </div>
            </div>
            {totalStickers > 0 && (
              <div
                className="mt-3.5 inline-flex items-center gap-1.5 text-[12px] font-extrabold"
                style={{ color: "var(--wa-dark)" }}
              >
                <TrendingUp size={13} />
                {hasPaid ? "ללא הגבלה" : `${freeRemaining} בחינמיות`}
              </div>
            )}
          </div>
        </div>

        {/* Refund banner */}
        {canRefund && refundDeadline && (
          <div
            className="mb-6 flex items-center gap-3.5 px-5 py-3.5"
            style={{
              background: "var(--paper)",
              border: "2px dashed var(--ink)",
              borderRadius: 16,
            }}
          >
            <ShieldCheck size={20} color="var(--wa-dark)" strokeWidth={2.4} />
            <div className="flex-1">
              <div className="text-[14px] font-extrabold">
                זכאי להחזר עד {formatDate(refundDeadline)} ({refundDaysLeft} ימים נשארו)
              </div>
              <div className="mt-0.5 text-[12px]" style={{ opacity: 0.65 }}>
                החזר מלא, ללא שאלות. נשלח חזרה לאמצעי התשלום המקורי תוך 5-7 ימי עסקים.
              </div>
            </div>
            <a
              href="mailto:support@madbekaapp.co.il?subject=Refund%20request"
              className="press-active px-3.5 py-2 text-[13px] font-extrabold"
              style={{
                background: "transparent",
                border: "1.5px solid var(--ink)",
                borderRadius: 10,
                opacity: 0.85,
              }}
            >
              בקש החזר
            </a>
          </div>
        )}

        {/* Downloads section */}
        <div className="mb-5 flex items-center justify-between">
          <h2
            style={{
              fontFamily: "'Karantina', 'Heebo', sans-serif",
              fontWeight: 700,
              fontSize: 36,
              letterSpacing: "-0.01em",
            }}
          >
            היסטוריית הורדות
          </h2>
          <Link
            href="/gallery"
            className="text-sm font-extrabold"
            style={{ color: "var(--wa-dark)" }}
          >
            ראה הכל בגלריה →
          </Link>
        </div>

        {recentEvents.length === 0 ? (
          <div
            className="p-12 text-center"
            style={{
              background: "#fff",
              border: "2.5px dashed var(--ink)",
              borderRadius: 18,
            }}
          >
            <ImageIcon
              size={36}
              className="mx-auto mb-3"
              style={{ opacity: 0.4 }}
            />
            <div className="text-base font-extrabold">עוד אין הורדות</div>
            <p className="mt-1 text-sm" style={{ opacity: 0.65 }}>
              צור מדבקה ראשונה ב-
              <Link href="/templates" className="font-extrabold underline">
                עורך
              </Link>
              .
            </p>
          </div>
        ) : (
          <div
            className="overflow-hidden"
            style={{
              background: "#fff",
              border: "2.5px solid var(--ink)",
              borderRadius: 18,
              boxShadow: "6px 7px 0 var(--ink)",
            }}
          >
            {/* Header row */}
            <div
              className="hidden gap-4 px-5 py-3 text-[12px] font-extrabold sm:grid"
              style={{
                gridTemplateColumns: "60px 1fr 1.2fr 1fr 80px",
                background: "var(--paper)",
                borderBottom: "2px solid var(--ink)",
                opacity: 0.75,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              <div></div>
              <div>טקסט</div>
              <div>תאריך</div>
              <div>תוכנית</div>
              <div></div>
            </div>
            {recentEvents.map((event, i) => (
              <div
                key={event.id}
                className="grid items-center gap-4 px-5 py-3.5 sm:grid-cols-[60px_1fr_1.2fr_1fr_80px]"
                style={{
                  borderBottom:
                    i < recentEvents.length - 1
                      ? "1.5px dashed var(--ink)"
                      : "none",
                  fontSize: 14,
                }}
              >
                <div
                  className="grid h-11 w-11 place-items-center"
                  style={{
                    background: "var(--cream)",
                    border: "1.5px solid var(--ink)",
                    borderRadius: 10,
                    fontFamily: "'Karantina', 'Heebo', sans-serif",
                    fontWeight: 700,
                    fontSize: 16,
                    color: "var(--wa-dark)",
                    transform: "rotate(-3deg)",
                  }}
                >
                  ✓
                </div>
                <div
                  className="font-extrabold"
                  style={{
                    fontFamily: "'Karantina', 'Heebo', sans-serif",
                    fontSize: 22,
                  }}
                >
                  מדבקה
                </div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 12,
                    opacity: 0.7,
                  }}
                >
                  {formatDate(event.createdAt)}
                </div>
                <div className="text-[13px]" style={{ opacity: 0.75 }}>
                  {event.wasPaidTier ? "Paid" : "Free"}
                </div>
                <div className="hidden justify-end gap-1.5 sm:flex">
                  <button
                    title="הורד"
                    className="grid h-8 w-8 place-items-center"
                    style={{
                      background: "transparent",
                      border: "1.5px solid var(--ink)",
                      borderRadius: 8,
                    }}
                  >
                    <Download size={13} />
                  </button>
                  <button
                    title="שתף"
                    className="grid h-8 w-8 place-items-center"
                    style={{
                      background: "transparent",
                      border: "1.5px solid var(--ink)",
                      borderRadius: 8,
                    }}
                  >
                    <Share2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Help footer */}
        <div
          className="mt-10 flex flex-wrap items-center gap-5 pt-5 text-[13px]"
          style={{
            borderTop: "1.5px dashed var(--ink)",
            opacity: 0.7,
          }}
        >
          <a
            href="mailto:support@madbekaapp.co.il"
            className="inline-flex items-center gap-1.5"
          >
            <Mail size={14} />
            support@madbekaapp.co.il
          </a>
          <Link href="/terms" className="inline-flex items-center gap-1.5">
            תקנון
          </Link>
          <Link href="/privacy" className="inline-flex items-center gap-1.5">
            פרטיות
          </Link>
          <Link href="/refund" className="inline-flex items-center gap-1.5">
            החזרים
          </Link>
          <span
            className="ms-auto"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              opacity: 0.6,
            }}
          >
            v1.0.0 · {PUBLIC_DOMAIN}
          </span>
        </div>
      </div>
    </main>
  );
}

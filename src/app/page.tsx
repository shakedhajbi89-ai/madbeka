import Link from "next/link";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Hand,
  ImageIcon,
  Send,
  Sparkles,
  Sticker as StickerIcon,
  Wand2,
} from "lucide-react";
import { StickerMaker } from "@/components/sticker-maker";
import { StickerCounter } from "@/components/sticker-counter";
import { ThemeToggle } from "@/components/theme-toggle";
import { PUBLIC_DOMAIN } from "@/lib/brand";

/* ─────────────────────────────────────────────────────────────
   Sample sticker — uses CSS to fake the same `paint-order: stroke fill`
   recipe the real canvas renders. Used decoratively on the hero so
   visitors instantly grok what the product produces.
   ───────────────────────────────────────────────────────────── */
function HeroSticker({
  text,
  fill,
  stroke,
  rotate,
  size = 76,
  className,
}: {
  text: string;
  fill: string;
  stroke: string;
  rotate: number;
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`pointer-events-none absolute select-none ${className ?? ""}`}
      style={{ transform: `rotate(${rotate}deg)` }}
      aria-hidden
    >
      <div
        style={{
          background: "#fff",
          border: "3px solid var(--ink)",
          borderRadius: 22,
          padding: "12px 22px",
          boxShadow: "7px 9px 0 var(--ink)",
        }}
      >
        <span
          style={{
            fontFamily: "'Karantina', 'Heebo', sans-serif",
            fontWeight: 700,
            fontSize: size,
            color: fill,
            WebkitTextStroke: `4px ${stroke}`,
            paintOrder: "stroke fill",
            textShadow: `0 5px 0 ${stroke}`,
            letterSpacing: "-0.02em",
            lineHeight: 1,
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
}

/* Reusable section heading — paper kicker pill + Karantina title. */
function SectionHeading({
  kicker,
  title,
  subtitle,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-8 text-center">
      {kicker && (
        <div
          className="mb-3 inline-block px-3 py-1"
          style={{
            background: "var(--paper)",
            border: "2px solid var(--ink)",
            borderRadius: 100,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11,
            fontWeight: 700,
            color: "var(--ink)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            boxShadow: "2px 3px 0 var(--ink)",
          }}
        >
          {kicker}
        </div>
      )}
      <h2
        style={{
          fontFamily: "'Karantina', 'Heebo', sans-serif",
          fontWeight: 700,
          fontSize: 48,
          lineHeight: 1.05,
          letterSpacing: "-0.015em",
          color: "var(--ink)",
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className="mx-auto mt-3 max-w-2xl text-base"
          style={{ color: "var(--ink)", opacity: 0.7 }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

export default async function Home() {
  const { userId } = await auth();
  const isSignedIn = Boolean(userId);

  return (
    <main
      dir="rtl"
      className="relative min-h-screen text-ink"
      style={{
        background: "var(--cream)",
        backgroundImage: `
          radial-gradient(circle at 18% 20%, #ffd9ec 0, transparent 22%),
          radial-gradient(circle at 82% 18%, #c8f5dd 0, transparent 22%),
          radial-gradient(circle at 88% 82%, #c5e6ff 0, transparent 22%),
          radial-gradient(circle at 12% 80%, #ffe0c2 0, transparent 22%)
        `,
        fontFamily: "'Assistant', system-ui, sans-serif",
      }}
    >
      {/* decorative squiggles */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 h-full w-full"
        style={{ opacity: 0.18 }}
      >
        <path
          d="M -50 320 Q 200 270, 400 340 T 800 320"
          stroke="var(--ink)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 900 1100 Q 1080 1040, 1240 1100 T 1500 1080"
          stroke="var(--ink)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      </svg>

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-6 lg:px-8">
        {/* ───────── TOP NAV ───────── */}
        <header className="mb-12 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3.5">
            <div
              className="grid h-12 w-12 place-items-center rounded-[15px] text-cream"
              style={{
                background: "var(--ink)",
                transform: "rotate(-6deg)",
                boxShadow: "0 5px 0 var(--wa), 0 10px 20px rgba(0,0,0,0.18)",
              }}
            >
              <StickerIcon size={24} strokeWidth={2.4} />
            </div>
            <div
              className="text-3xl leading-none"
              style={{
                fontFamily: "'Karantina', 'Heebo', sans-serif",
                fontWeight: 700,
                letterSpacing: "-0.02em",
              }}
            >
              Madbeka
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {isSignedIn ? (
              <>
                <Link
                  href="/account"
                  className="hidden text-sm font-extrabold sm:inline"
                >
                  החשבון שלי
                </Link>
                <UserButton />
              </>
            ) : (
              <SignInButton mode="modal">
                <button className="text-sm font-extrabold">התחברות</button>
              </SignInButton>
            )}
            <Link
              href="/templates"
              className="press-active inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-extrabold"
              style={{
                background: "var(--wa)",
                color: "#fff",
                border: "3px solid var(--ink)",
                borderRadius: 16,
                boxShadow: "4px 5px 0 var(--ink)",
              }}
            >
              <Wand2 size={15} />
              התחל ליצור
            </Link>
          </div>
        </header>

        {/* ───────── HERO ───────── */}
        <section className="relative pb-16 pt-6 text-center">
          {/* floating sample stickers — visible on lg+ only */}
          <div className="hidden lg:block">
            <HeroSticker
              text="יאללה"
              fill="#25D366"
              stroke="#06352b"
              rotate={-8}
              size={68}
              className="left-2 top-12"
            />
            <HeroSticker
              text="חחחח"
              fill="#FF6EB5"
              stroke="#5b1b73"
              rotate={6}
              size={64}
              className="right-4 top-20"
            />
            <HeroSticker
              text="סבבה"
              fill="#F4C430"
              stroke="#0F0E0C"
              rotate={-4}
              size={56}
              className="bottom-12 left-12"
            />
            <HeroSticker
              text="אחי"
              fill="#7C3AED"
              stroke="#1a063b"
              rotate={10}
              size={60}
              className="bottom-8 right-16"
            />
          </div>

          <div className="relative">
            <StickerCounter />
            <h1
              className="mx-auto mt-5 max-w-3xl"
              style={{
                fontFamily: "'Karantina', 'Heebo', sans-serif",
                fontWeight: 700,
                fontSize: "clamp(56px, 9vw, 110px)",
                lineHeight: 0.92,
                letterSpacing: "-0.025em",
                color: "var(--ink)",
              }}
            >
              מדבקות וואטסאפ{" "}
              <span
                className="inline-block"
                style={{
                  color: "var(--wa)",
                  WebkitTextStroke: "5px var(--ink)",
                  paintOrder: "stroke fill",
                  textShadow: "0 7px 0 var(--ink)",
                }}
              >
                בעברית
              </span>
              ,
              <br />
              תוך 10 שניות
            </h1>
            <p
              className="mx-auto mt-6 max-w-xl text-lg sm:text-xl"
              style={{ color: "var(--ink)", opacity: 0.72, lineHeight: 1.5 }}
            >
              הקלד מילה. עצב אותה. שלח לוואטסאפ. בלי הרשמה, בלי שרת — הכל קורה
              במחשב שלך.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/templates"
                className="press-active inline-flex items-center gap-2 px-6 py-4 text-lg font-extrabold"
                style={{
                  background: "var(--wa)",
                  color: "#fff",
                  border: "3px solid var(--ink)",
                  borderRadius: 18,
                  boxShadow: "5px 6px 0 var(--ink)",
                  fontFamily: "'Karantina', 'Heebo', sans-serif",
                  fontSize: 24,
                }}
              >
                <Wand2 size={20} />
                התחל ליצור — חינם
              </Link>
              <a
                href="#how"
                className="press-active inline-flex items-center gap-2 px-5 py-3.5 text-base font-extrabold"
                style={{
                  background: "#fff",
                  color: "var(--ink)",
                  border: "2.5px solid var(--ink)",
                  borderRadius: 16,
                  boxShadow: "4px 5px 0 var(--ink)",
                }}
              >
                איך זה עובד?
                <ArrowLeft size={16} />
              </a>
            </div>

            <p
              className="mt-5 text-sm font-bold"
              style={{ color: "#5a4252", opacity: 0.85 }}
            >
              3 מדבקות חינם · ₪29 חד-פעמי לכל החיים · 14 יום החזר מלא
            </p>
          </div>
        </section>

        {/* ───────── HOW IT WORKS ───────── */}
        <section id="how" className="py-16">
          <SectionHeading
            kicker="איך זה עובד"
            title="3 צעדים, ופחות מדקה"
            subtitle="העורך עובד ב-100% בדפדפן שלך — אף תמונה לא נשלחת לשרת."
          />
          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                num: "01",
                Icon: Hand,
                title: "כתוב מילה",
                body: "יאללה, חלאס, סבבה, או כל מילה שתרצה. בעברית, באנגלית, או גם עם אימוג'י.",
              },
              {
                num: "02",
                Icon: Sparkles,
                title: "עצב אותה",
                body: "10 סגנונות צבע — מקלאסי לבן עד גרפיטי וניאון. 13 פונטים עבריים. גרור איפה שתרצה.",
              },
              {
                num: "03",
                Icon: Send,
                title: "שלח לוואטסאפ",
                body: "כפתור אחד פותח שיתוף ישר לוואטסאפ. לחיצה ארוכה בצ'אט → 'הוסף למדבקות'. זהו.",
              },
            ].map((step) => (
              <div
                key={step.num}
                className="p-7"
                style={{
                  background: "#fff",
                  border: "3px solid var(--ink)",
                  borderRadius: 22,
                  boxShadow: "6px 7px 0 var(--ink)",
                }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <span
                    className="inline-block px-3 py-1"
                    style={{
                      background: "var(--paper)",
                      border: "2px solid var(--ink)",
                      borderRadius: 8,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 13,
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                      boxShadow: "2px 3px 0 var(--ink)",
                    }}
                  >
                    {step.num}
                  </span>
                  <div
                    className="grid h-12 w-12 place-items-center"
                    style={{
                      background: "var(--wa)",
                      color: "#fff",
                      border: "2.5px solid var(--ink)",
                      borderRadius: 14,
                      boxShadow: "3px 4px 0 var(--ink)",
                    }}
                  >
                    <step.Icon size={22} strokeWidth={2.4} />
                  </div>
                </div>
                <h3
                  style={{
                    fontFamily: "'Karantina', 'Heebo', sans-serif",
                    fontWeight: 700,
                    fontSize: 32,
                    lineHeight: 1.1,
                    letterSpacing: "-0.01em",
                    marginBottom: 6,
                  }}
                >
                  {step.title}
                </h3>
                <p
                  className="text-[15px] leading-relaxed"
                  style={{ color: "var(--ink)", opacity: 0.75 }}
                >
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ───────── PHOTO → STICKER (the existing flow, in a Playful card) ───────── */}
        <section className="py-16">
          <SectionHeading
            kicker="או — תמונה למדבקה"
            title="העלה תמונה, נקבל מדבקה"
            subtitle="הסרת רקע אוטומטית, ב-10 שניות, בלי הרשמה."
          />
          <div className="flex justify-center">
            <div
              className="w-full max-w-md p-2"
              style={{
                background: "#fff",
                border: "3px solid var(--ink)",
                borderRadius: 24,
                boxShadow: "8px 9px 0 var(--ink)",
              }}
            >
              <StickerMaker />
            </div>
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link
              href="/templates"
              className="press-active inline-flex items-center gap-1.5 px-4 py-2 text-sm font-extrabold"
              style={{
                background: "#fff",
                border: "2.5px solid var(--ink)",
                borderRadius: 12,
                boxShadow: "3px 4px 0 var(--ink)",
              }}
            >
              <ImageIcon size={14} />
              עורך מדבקות טקסט →
            </Link>
            {isSignedIn && (
              <Link
                href="/gallery"
                className="press-active inline-flex items-center gap-1.5 px-4 py-2 text-sm font-extrabold"
                style={{
                  background: "#fff",
                  border: "2.5px solid var(--ink)",
                  borderRadius: 12,
                  boxShadow: "3px 4px 0 var(--ink)",
                }}
              >
                <Camera size={14} />
                הגלריה שלי →
              </Link>
            )}
          </div>
        </section>

        {/* ───────── HOW IT BECOMES A WHATSAPP STICKER ───────── */}
        <section className="py-16">
          <div
            className="mx-auto max-w-3xl p-7 text-right"
            style={{
              background: "var(--paper)",
              border: "2.5px solid var(--ink)",
              borderRadius: 22,
              boxShadow: "5px 6px 0 var(--ink)",
              position: "relative",
            }}
          >
            <span
              className="absolute right-6 top-[-12px] inline-block px-3 py-1"
              style={{
                background: "var(--wa)",
                color: "#fff",
                border: "2px solid var(--ink)",
                borderRadius: 8,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              💡 חשוב לדעת
            </span>
            <h3
              style={{
                fontFamily: "'Karantina', 'Heebo', sans-serif",
                fontWeight: 700,
                fontSize: 32,
                lineHeight: 1.1,
                letterSpacing: "-0.01em",
                marginBottom: 12,
              }}
            >
              איך המדבקה נוספת למגש של וואטסאפ?
            </h3>
            <p
              className="mb-4 text-base leading-relaxed"
              style={{ color: "var(--ink)", opacity: 0.85 }}
            >
              וואטסאפ חוסמת אתרי אינטרנט מהוספה ישירה למגש המדבקות שלך. אין API
              ציבורי. הזרימה היא חד-פעמית כזו:
            </p>
            <ol className="space-y-3">
              {[
                "המדבקה נשלחת לוואטסאפ כתמונה (webp 512×512, שקופה)",
                "לחיצה ארוכה עליה בצ'אט → 'הוסף למדבקות' (אנדרואיד) / 'הוסף למועדפות' (iOS)",
                "מעכשיו היא במגש הקבוע שלך, לכל החיים",
              ].map((line, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3"
                  style={{ color: "var(--ink)" }}
                >
                  <span
                    className="grid h-6 w-6 flex-none place-items-center text-xs font-extrabold"
                    style={{
                      background: "var(--wa)",
                      color: "#fff",
                      border: "1.5px solid var(--ink)",
                      borderRadius: 7,
                    }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-[15px] leading-relaxed">{line}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ───────── PRICING ───────── */}
        <section id="pricing" className="py-16">
          <SectionHeading
            kicker="תמחור"
            title="פעם אחת, לכל החיים"
            subtitle="3 מדבקות בחינם כדי לבדוק. רוצה ללא הגבלה ובלי סימן מים — ₪29 חד-פעמי."
          />
          <div className="mx-auto max-w-md">
            <div
              className="p-8"
              style={{
                background: "#fff",
                border: "3px solid var(--ink)",
                borderRadius: 26,
                boxShadow: "8px 9px 0 var(--ink)",
              }}
            >
              <div className="flex items-center justify-between">
                <div
                  className="inline-block px-3 py-1"
                  style={{
                    background: "var(--paper)",
                    border: "2px solid var(--ink)",
                    borderRadius: 100,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  Pro · חד פעמי
                </div>
                <div
                  className="text-left"
                  style={{
                    fontFamily: "'Karantina', 'Heebo', sans-serif",
                    fontWeight: 700,
                  }}
                >
                  <div
                    style={{
                      fontSize: 64,
                      lineHeight: 0.9,
                      letterSpacing: "-0.02em",
                      color: "var(--wa-dark)",
                    }}
                  >
                    ₪29
                  </div>
                  <div
                    className="text-xs font-extrabold"
                    style={{ color: "#5a4252" }}
                  >
                    פעם אחת. לתמיד.
                  </div>
                </div>
              </div>

              <ul className="mt-6 space-y-3">
                {[
                  "מדבקות ללא הגבלה",
                  "ללא סימן מים",
                  "גלריה אישית + היסטוריה",
                  "כל הסגנונות והפונטים",
                  "14 יום החזר מלא, ללא שאלות",
                ].map((perk, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2
                      size={20}
                      style={{ color: "var(--wa-dark)" }}
                      strokeWidth={2.4}
                    />
                    <span className="text-[15px] font-bold">{perk}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/templates?upgrade=1"
                className="press-active mt-7 flex w-full items-center justify-center gap-2 px-5 py-4 text-lg font-extrabold"
                style={{
                  background: "var(--wa)",
                  color: "#fff",
                  border: "2.5px solid var(--ink)",
                  borderRadius: 16,
                  boxShadow: "5px 6px 0 var(--ink)",
                  fontFamily: "'Karantina', 'Heebo', sans-serif",
                  fontSize: 22,
                }}
              >
                התחל ליצור ללא הגבלה
              </Link>
              <p
                className="mt-3 text-center text-xs font-bold"
                style={{ color: "#5a4252" }}
              >
                התשלום מאובטח דרך LemonSqueezy. ביטול 14 יום, החזר מלא.
              </p>
            </div>
          </div>
        </section>

        {/* ───────── FAQ ───────── */}
        <section className="py-16">
          <SectionHeading
            kicker="FAQ"
            title="שאלות שואלים אותנו"
          />
          <div className="mx-auto max-w-3xl space-y-3">
            {[
              {
                q: "האם זה באמת חינם?",
                a: "כן, 3 מדבקות חינם, בלי כרטיס אשראי. אחרי 3 — שדרוג חד-פעמי של ₪29 פותח גישה ללא הגבלה לכל החיים.",
              },
              {
                q: "התמונות שלי נשמרות בשרת שלכם?",
                a: "לא. הסרת הרקע והעיבוד קורים 100% במחשב שלך. שום תמונה לא יוצאת מהדפדפן שלך אל השרת שלנו.",
              },
              {
                q: "איך המדבקה נוספת לוואטסאפ?",
                a: "אנחנו שולחים את המדבקה ל-וואטסאפ כתמונה, ואתה לוחץ עליה לחיצה ארוכה ובוחר 'הוסף למדבקות'. זה החוק של וואטסאפ — אין API ציבורי שמאפשר הוספה ישירה.",
              },
              {
                q: "אפשר לקבל החזר?",
                a: "כן. תוך 14 יום מהתשלום — החזר מלא, ללא שאלות. כפתור 'בקש החזר' זמין באזור החשבון שלך.",
              },
              {
                q: "האם יש אפליקציית מובייל?",
                a: "האתר עובד מצויין במובייל ואפשר להוסיף אותו למסך הבית כ-PWA. אפליקציה ילידית בקנה לעתיד.",
              },
            ].map((item, i) => (
              <details
                key={i}
                className="group p-5"
                style={{
                  background: "#fff",
                  border: "2.5px solid var(--ink)",
                  borderRadius: 16,
                  boxShadow: "4px 5px 0 var(--ink)",
                }}
              >
                <summary
                  className="flex cursor-pointer items-center justify-between text-[17px] font-extrabold"
                  style={{ fontFamily: "'Karantina', 'Heebo', sans-serif" }}
                >
                  <span style={{ fontSize: 22, letterSpacing: "-0.01em" }}>
                    {item.q}
                  </span>
                  <span
                    className="text-2xl transition-transform group-open:rotate-45"
                    style={{ color: "var(--wa-dark)" }}
                  >
                    +
                  </span>
                </summary>
                <p
                  className="mt-3 text-[15px] leading-relaxed"
                  style={{ color: "var(--ink)", opacity: 0.8 }}
                >
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* ───────── FOOTER ───────── */}
        <footer
          className="mt-12 pt-8 pb-6"
          style={{
            borderTop: "2px dashed var(--ink)",
          }}
        >
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div className="text-center md:text-right">
              <div className="flex items-center justify-center gap-3 md:justify-start">
                <div
                  className="grid h-10 w-10 place-items-center rounded-[12px]"
                  style={{
                    background: "var(--ink)",
                    color: "var(--cream)",
                    transform: "rotate(-6deg)",
                    boxShadow: "3px 4px 0 var(--wa)",
                  }}
                >
                  <StickerIcon size={20} strokeWidth={2.4} />
                </div>
                <div
                  className="text-2xl"
                  style={{
                    fontFamily: "'Karantina', 'Heebo', sans-serif",
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                  }}
                >
                  Madbeka
                </div>
              </div>
              <p
                className="mt-2 text-sm font-bold"
                style={{ color: "#5a4252" }}
              >
                {PUBLIC_DOMAIN} · 3 מדבקות חינם · ₪29 לגישה מלאה
              </p>
            </div>

            <nav
              className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm font-extrabold"
              aria-label="קישורים"
            >
              <Link
                href="/templates"
                style={{ color: "var(--ink)" }}
                className="hover:underline"
              >
                עורך
              </Link>
              {isSignedIn && (
                <>
                  <Link
                    href="/gallery"
                    style={{ color: "var(--ink)" }}
                    className="hover:underline"
                  >
                    גלריה
                  </Link>
                  <Link
                    href="/account"
                    style={{ color: "var(--ink)" }}
                    className="hover:underline"
                  >
                    חשבון
                  </Link>
                </>
              )}
              <Link
                href="/terms"
                style={{ color: "var(--ink)", opacity: 0.7 }}
                className="hover:underline"
              >
                תנאי שימוש
              </Link>
              <Link
                href="/privacy"
                style={{ color: "var(--ink)", opacity: 0.7 }}
                className="hover:underline"
              >
                פרטיות
              </Link>
              <Link
                href="/refund"
                style={{ color: "var(--ink)", opacity: 0.7 }}
                className="hover:underline"
              >
                החזרים
              </Link>
            </nav>
          </div>
        </footer>
      </div>
    </main>
  );
}

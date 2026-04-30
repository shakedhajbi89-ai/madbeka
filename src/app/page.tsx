import Link from "next/link";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import {
  Check,
  FileText,
  Play,
  Send,
  Shield,
  Sparkles,
  TrendingUp,
  Type,
  Wand2,
} from "lucide-react";
import { StickerMaker } from "@/components/sticker-maker";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BrutalButton } from "@/components/BrutalButton";
import { StickerTile } from "@/components/StickerTile";
import { Eyebrow, YellowTape } from "@/components/Decorative";
import { StickerCounter } from "@/components/sticker-counter";

export default async function Home() {
  const { userId } = await auth();
  const isSignedIn = Boolean(userId);

  const authControls = isSignedIn ? (
    <UserButton />
  ) : (
    <SignInButton mode="modal">
      <button className="text-sm font-extrabold text-[var(--ink)]">
        התחברות
      </button>
    </SignInButton>
  );

  return (
    <div className="relative min-h-screen text-ink" style={{ background: "var(--cream)" }}>
      {/* ── Sticky Header ── */}
      <Header variant="full" authControls={authControls} />

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

      <main dir="rtl">
        {/* ───────── HERO ───────── */}
        <section className="glow-bg relative pt-12 pb-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">

              {/* Text side */}
              <div className="order-2 lg:order-1 lg:pe-8">
                <Eyebrow className="mb-6">חדש · עכשיו ביטא</Eyebrow>
                <h1
                  className="mb-6 leading-[1.05]"
                  style={{
                    fontFamily: "'Karantina', 'Heebo', sans-serif",
                    fontWeight: 700,
                    fontSize: "clamp(52px, 8vw, 96px)",
                    letterSpacing: "-0.025em",
                    color: "var(--ink)",
                  }}
                >
                  מדבקות וואטסאפ{" "}
                  <span className="underline-brand">בעברית</span> — תוך 60 שניות.
                </h1>
                <p className="text-lg mb-8 max-w-lg leading-relaxed" style={{ color: "var(--ink)", opacity: 0.72 }}>
                  הקלד מילה. בחר סגנון. שלח לוואטסאפ. בלי אפליקציה, בלי הרשמה, בלי כאב ראש.
                </p>
                <div className="flex flex-wrap gap-3 mb-6">
                  <Link href="/templates">
                    <BrutalButton variant="primary" size="lg" iconLeft={<FileText className="w-5 h-5" />}>
                      צור מדבקה ראשונה
                    </BrutalButton>
                  </Link>
                  <a href="#how">
                    <BrutalButton variant="secondary" size="lg" iconLeft={<Play className="w-4 h-4" />}>
                      צפה בדוגמה
                    </BrutalButton>
                  </a>
                </div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-bold" style={{ color: "#5a4252" }}>
                  {["ללא הרשמה", "100% בעברית", "יצוא ישיר ל-WA"].map((t) => (
                    <span key={t} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: "hsl(var(--primary))" }} />
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Visual side — floating StickerTiles */}
              <div className="order-1 lg:order-2 relative h-[380px] lg:h-[500px]">
                <div className="absolute top-8 right-8">
                  <StickerTile word="יאללה" color="green" rotation={-12} size="lg" withTape float />
                </div>
                <div className="absolute bottom-12 right-32 z-10">
                  <StickerTile word="חלאס" color="pink" rotation={8} size="lg" withTape float />
                </div>
                <div className="absolute top-32 left-8">
                  <StickerTile word="חחחח" color="magenta" rotation={-6} size="md" float />
                </div>
                <div className="absolute bottom-4 left-16">
                  <StickerTile word="סבבה" color="orange" rotation={10} size="md" withTape float />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ───────── HOW IT WORKS ───────── */}
        <section id="how" className="py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <Eyebrow className="mb-4">שלושה צעדים בלבד</Eyebrow>
              <h2
                style={{
                  fontFamily: "'Karantina', 'Heebo', sans-serif",
                  fontWeight: 700,
                  fontSize: "clamp(36px, 5vw, 56px)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.015em",
                  color: "var(--ink)",
                }}
              >
                ככה זה עובד
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  n: 1,
                  Icon: Type,
                  colorCls: "bg-sticker-pink/15 text-sticker-pink",
                  title: "הקלד מילה",
                  desc: "הקלד את הביטוי האהוב — 'יאללה', 'חלאס', שם של חבר. עברית מלאה, RTL מהקלדה הראשונה.",
                },
                {
                  n: 2,
                  Icon: Sparkles,
                  colorCls: "bg-primary-soft text-primary-deep",
                  title: "בחר סגנון",
                  desc: "50 סגנונות מוכנים — קלאסי, גרפיטי, נאון, 8-בית. גם וינטג' עם סלידר.",
                },
                {
                  n: 3,
                  Icon: Send,
                  colorCls: "bg-info-bg text-info",
                  title: "שלח לוואטסאפ",
                  desc: "קליק על 'שלח לוואטסאפ' והוא נפתח עם הסטיקר. WebP 512×512 שקוף, מוכן להדבקה.",
                },
              ].map((step) => (
                <div
                  key={step.n}
                  className="brutal-card-hover p-6 relative"
                  style={{
                    background: "#fff",
                    border: "2.5px solid var(--ink)",
                    borderRadius: "var(--radius)",
                    boxShadow: "6px 7px 0 var(--ink)",
                  }}
                >
                  <div
                    className="absolute -top-3 right-6 w-9 h-9 rounded-full bg-ink text-cream flex items-center justify-center font-bold text-sm"
                    style={{ border: "2.5px solid var(--ink)" }}
                  >
                    {step.n}
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${step.colorCls}`}>
                    <step.Icon className="w-6 h-6" />
                  </div>
                  <h3
                    className="mb-2"
                    style={{
                      fontFamily: "'Karantina', 'Heebo', sans-serif",
                      fontWeight: 700,
                      fontSize: 28,
                      lineHeight: 1.1,
                    }}
                  >
                    {step.title}
                  </h3>
                  <p className="text-[15px] leading-relaxed" style={{ color: "var(--ink)", opacity: 0.72 }}>
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───────── PHOTO → STICKER ───────── */}
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 text-center">
              <div
                className="mb-3 inline-block px-3 py-1"
                style={{
                  background: "var(--paper)",
                  border: "2px solid var(--ink)",
                  borderRadius: 100,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  boxShadow: "2px 3px 0 var(--ink)",
                }}
              >
                או — תמונה למדבקה
              </div>
              <h2
                style={{
                  fontFamily: "'Karantina', 'Heebo', sans-serif",
                  fontWeight: 700,
                  fontSize: "clamp(32px, 5vw, 48px)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.015em",
                  color: "var(--ink)",
                }}
              >
                העלה תמונה, נקבל מדבקה
              </h2>
            </div>
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
                <Wand2 size={14} />
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
                  הגלריה שלי →
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* ───────── COUNTER STRIP ───────── */}
        <section className="pb-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div
              className="brutal-card p-6 md:p-8 flex flex-wrap md:flex-nowrap items-center justify-between gap-6"
            >
              {/* Left (RTL: visual left) — avatars */}
              <div className="flex items-center gap-4 order-2 md:order-1">
                <div className="flex -space-x-2 rtl:space-x-reverse">
                  {["🔥", "💚", "✨", "🎉", "💛"].map((e, i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full border-2 border-card bg-cream flex items-center justify-center text-lg"
                    >
                      {e}
                    </div>
                  ))}
                </div>
                <p className="text-sm font-bold">הצטרפו לקהילה</p>
              </div>
              {/* Right (RTL: visual right) — live counter */}
              <div className="flex items-center gap-4 order-1 md:order-2">
                <div className="text-end">
                  <StickerCounter />
                  <p className="text-xs mt-1" style={{ color: "var(--ink)", opacity: 0.6 }}>
                    מדבקות נוצרו עד היום
                  </p>
                </div>
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: "hsl(var(--primary))",
                    color: "#fff",
                    border: "2.5px solid var(--ink)",
                    boxShadow: "var(--shadow-brutal-sm)",
                  }}
                >
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ───────── WHATSAPP SETUP INFO ───────── */}
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
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
              <p className="mb-4 text-base leading-relaxed" style={{ color: "var(--ink)", opacity: 0.85 }}>
                וואטסאפ חוסמת אתרי אינטרנט מהוספה ישירה למגש המדבקות. הזרימה היא:
              </p>
              <ol className="space-y-3">
                {[
                  "המדבקה נשלחת לוואטסאפ כתמונה (webp 512×512, שקופה)",
                  "לחיצה ארוכה עליה בצ'אט → 'הוסף למדבקות' (אנדרואיד) / 'הוסף למועדפות' (iOS)",
                  "מעכשיו היא במגש הקבוע שלך, לכל החיים",
                ].map((line, i) => (
                  <li key={i} className="flex items-start gap-3" style={{ color: "var(--ink)" }}>
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
          </div>
        </section>

        {/* ───────── PRICING ───────── */}
        <section id="pricing" className="py-20" style={{ background: "rgba(251,243,220,0.5)" }}>
          <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <p className="font-bold text-sm tracking-wide mb-3">
                <span style={{ color: "hsl(var(--sticker-orange))" }}>פשוט</span>
                <span className="mx-2" style={{ opacity: 0.4 }}>·</span>
                <span style={{ color: "hsl(var(--primary))" }}>הוגן</span>
                <span className="mx-2" style={{ opacity: 0.4 }}>·</span>
                <span style={{ color: "hsl(var(--sticker-pink))" }}>חד-פעמי</span>
              </p>
              <h2
                style={{
                  fontFamily: "'Karantina', 'Heebo', sans-serif",
                  fontWeight: 700,
                  fontSize: "clamp(36px, 5vw, 56px)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.015em",
                  color: "var(--ink)",
                }}
              >
                מחיר אחד. לתמיד.
              </h2>
            </div>

            <div
              className="p-8 relative"
              style={{
                background: "#fff",
                border: "3px solid var(--ink)",
                borderRadius: 26,
                boxShadow: "8px 9px 0 var(--ink)",
              }}
            >
              <YellowTape className="-top-3 right-1/2 translate-x-1/2" />

              <div className="flex items-baseline gap-3 mb-2">
                <span
                  style={{
                    fontFamily: "'Karantina', 'Heebo', sans-serif",
                    fontWeight: 700,
                    fontSize: 72,
                    lineHeight: 0.9,
                    letterSpacing: "-0.02em",
                    color: "var(--wa-dark)",
                  }}
                >
                  ₪29
                </span>
                <span
                  className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{
                    background: "var(--ink)",
                    color: "var(--cream)",
                  }}
                >
                  חד-פעמי
                </span>
              </div>

              <p className="mb-6 text-[15px]" style={{ color: "var(--ink)", opacity: 0.72 }}>
                לא מנוי. לא תיתפס בהפתעה. תשלום אחד וזהו.
              </p>

              <ul className="space-y-3 mb-7">
                {[
                  "יצירה ועריכה ללא הגבלה",
                  "8 פונטים עבריים + 10 סגנונות צבע",
                  "יצוא ישיר לוואטסאפ (WebP 512×512)",
                  "ללא חתימת מים, ללא פרסומות",
                  "עדכוני סגנונות חדשים לכל החיים",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3 text-[15px]">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: "hsl(var(--primary))",
                        color: "#fff",
                      }}
                    >
                      <Check className="w-3 h-3" strokeWidth={3} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <Link href="/templates?upgrade=1" className="block">
                <BrutalButton variant="primary" size="lg" fullWidth iconLeft={<FileText className="w-5 h-5" />}>
                  קח אותי לעורך
                </BrutalButton>
              </Link>

              <p
                className="text-center text-xs mt-4 flex items-center justify-center gap-1.5 font-bold"
                style={{ color: "#5a4252" }}
              >
                <Shield className="w-3.5 h-3.5" />
                החזר כספי תוך 14 ימים — בלי שאלות
              </p>
            </div>
          </div>
        </section>

        {/* ───────── FAQ ───────── */}
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 text-center">
              <div
                className="mb-3 inline-block px-3 py-1"
                style={{
                  background: "var(--paper)",
                  border: "2px solid var(--ink)",
                  borderRadius: 100,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  boxShadow: "2px 3px 0 var(--ink)",
                }}
              >
                FAQ
              </div>
              <h2
                style={{
                  fontFamily: "'Karantina', 'Heebo', sans-serif",
                  fontWeight: 700,
                  fontSize: "clamp(32px, 5vw, 48px)",
                  lineHeight: 1.05,
                  letterSpacing: "-0.015em",
                  color: "var(--ink)",
                }}
              >
                שאלות שואלים אותנו
              </h2>
            </div>
            <div className="mx-auto max-w-3xl space-y-3">
              {[
                {
                  q: "האם זה באמת חינם?",
                  a: "כן, 3 מדבקות חינם, בלי כרטיס אשראי. אחרי 3 — שדרוג חד-פעמי של ₪29 פותח גישה ללא הגבלה לכל החיים.",
                },
                {
                  q: "התמונות שלי נשמרות בשרת שלכם?",
                  a: "לא. הסרת הרקע והעיבוד קורים 100% על המכשיר שלך — בטלפון, בטאבלט או במחשב. שום תמונה לא יוצאת מהדפדפן שלך אל השרת שלנו.",
                },
                {
                  q: "איך המדבקה נוספת לוואטסאפ?",
                  a: "אנחנו שולחים את המדבקה לוואטסאפ כתמונה, ואתה לוחץ עליה לחיצה ארוכה ובוחר 'הוסף למדבקות'. זה החוק של וואטסאפ — אין API ציבורי שמאפשר הוספה ישירה.",
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
                    <span style={{ fontSize: 22, letterSpacing: "-0.01em" }}>{item.q}</span>
                    <span
                      className="text-2xl transition-transform group-open:rotate-45"
                      style={{ color: "var(--wa-dark)" }}
                    >
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-[15px] leading-relaxed" style={{ color: "var(--ink)", opacity: 0.8 }}>
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer variant="full" />
    </div>
  );
}

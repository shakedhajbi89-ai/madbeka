import Link from "next/link";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { StickerMaker } from "@/components/sticker-maker";
import { StickerCounter } from "@/components/sticker-counter";
import { ThemeToggle } from "@/components/theme-toggle";
import { PUBLIC_DOMAIN } from "@/lib/brand";

export default async function Home() {
  const { userId } = await auth();
  const isSignedIn = Boolean(userId);

  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden bg-gradient-to-b from-white via-white to-gray-50 px-6 py-6 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900">
      {/* Decorative background glow — subtle brand tint that keeps the page
          feeling intentional rather than flat white. Pointer-events:none so
          it never blocks a click. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[500px] bg-gradient-to-b from-[color:var(--brand-green)]/5 via-transparent to-transparent dark:from-[color:var(--brand-green)]/10"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 top-32 h-96 w-96 rounded-full bg-[color:var(--brand-green)]/10 blur-3xl dark:bg-[color:var(--brand-green)]/5"
      />

      <div className="relative w-full max-w-xl space-y-10">
        {/* Top bar: brand + theme + auth */}
        <header className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-white bg-black px-3 py-1.5 text-xl font-black text-white shadow-lg shadow-black/10 transition-transform hover:scale-[1.02] dark:border-gray-700 dark:bg-gray-100 dark:text-black"
          >
            Madbeka
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isSignedIn ? (
              <>
                <Link
                  href="/account"
                  className="hidden text-sm font-medium text-gray-700 hover:text-black sm:inline dark:text-gray-300 dark:hover:text-white"
                >
                  החשבון שלי
                </Link>
                <UserButton />
              </>
            ) : (
              <SignInButton mode="modal">
                <button className="text-sm font-medium text-gray-700 hover:text-black dark:text-gray-300 dark:hover:text-white">
                  התחברות
                </button>
              </SignInButton>
            )}
          </div>
        </header>

        <div className="space-y-10 text-center">
          {/* Hero */}
          <div className="space-y-4 pt-4">
            <StickerCounter />
            <h1 className="text-4xl font-black leading-tight tracking-tight text-gray-900 sm:text-5xl dark:text-gray-50">
              מתמונה למדבקה
              <br />
              תוך{" "}
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-[color:var(--brand-green)] to-[color:var(--brand-green-dark)] bg-clip-text text-transparent">
                  10 שניות
                </span>
                <span
                  aria-hidden
                  className="absolute -bottom-1 left-0 right-0 h-2 rounded-full bg-[color:var(--brand-green)]/20 dark:bg-[color:var(--brand-green)]/30"
                />
              </span>
            </h1>
            <p className="mx-auto max-w-md text-base text-gray-600 sm:text-lg dark:text-gray-400">
              מחולל המדבקות הישראלי הכי מהיר לוואטסאפ.
              <br className="hidden sm:block" />
              חינם, בעברית, בלי חיכוך.
            </p>
          </div>

          {/* Trust signals */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 shadow-sm dark:border-gray-800 dark:bg-gray-800/80">
              <span className="text-sm">🔒</span> פרטי לגמרי
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 shadow-sm dark:border-gray-800 dark:bg-gray-800/80">
              <span className="text-sm">⚡</span> ללא שרת
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3.5 py-1.5 shadow-sm dark:border-gray-800 dark:bg-gray-800/80">
              <span className="text-sm">📱</span> מובייל וגם דסקטופ
            </span>
          </div>

          {/* The actual app */}
          <div className="flex justify-center pt-2">
            <StickerMaker />
          </div>

          {/* Quick links to templates + gallery */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <Link
              href="/templates"
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-800 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[color:var(--brand-green)]/40 hover:shadow-md dark:border-gray-800 dark:bg-gray-800/80 dark:text-gray-200"
            >
              <span className="text-sm">✏️</span> תבניות טקסט ישראליות
            </Link>
            {isSignedIn && (
              <Link
                href="/gallery"
                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-800 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[color:var(--brand-green)]/40 hover:shadow-md dark:border-gray-800 dark:bg-gray-800/80 dark:text-gray-200"
              >
                <span className="text-sm">🖼️</span> הגלריה שלי
              </Link>
            )}
          </div>

          {/* How it works */}
          <section className="space-y-4 pt-8 text-right">
            <h2 className="text-center text-2xl font-bold text-gray-900 dark:text-gray-50">
              איך זה עובד?
            </h2>
            <ol className="space-y-3">
              {[
                { step: 1, text: "העלה תמונה או צלם עכשיו", emoji: "📸" },
                {
                  step: 2,
                  text: "הרקע יוסר אוטומטית — הכל קורה במכשיר שלך",
                  emoji: "✨",
                },
                {
                  step: 3,
                  text: "שלח או הורד לוואטסאפ — הופך למדבקה ב-3 שניות",
                  emoji: "💬",
                },
              ].map((item) => (
                <li
                  key={item.step}
                  className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-[color:var(--brand-green)]/40 hover:shadow-md dark:border-gray-800 dark:bg-gray-800/60 dark:hover:border-[color:var(--brand-green)]/60"
                >
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-[color:var(--brand-green)] to-[color:var(--brand-green-dark)] text-sm font-bold text-white shadow-md shadow-[color:var(--brand-green)]/30">
                    {item.step}
                  </span>
                  <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200">
                    {item.text}
                  </span>
                  <span className="flex-none text-xl opacity-60">
                    {item.emoji}
                  </span>
                </li>
              ))}
            </ol>
          </section>

          {/* How it becomes a sticker — critical UX clarity section.
              WhatsApp doesn't accept stickers via any public web API, so
              every image arrives as a regular attachment. Users think this
              is broken unless we tell them upfront that the 1-tap "save as
              sticker" step is by design and has to happen in WhatsApp. */}
          <section className="space-y-3 pt-4 text-right">
            <div className="relative overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6 shadow-sm dark:border-amber-900/40 dark:from-amber-950/20 dark:to-gray-900">
              <div className="mb-3 flex items-center gap-2">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-lg dark:bg-amber-900/40">
                  💡
                </span>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-50">
                  איך זה הופך למדבקה במגש הוואטסאפ?
                </h2>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                וואטסאפ חוסם אתרי אינטרנט מלהוסיף מדבקות ישר למגש שלך — אין
                API ציבורי לזה. לכן הזרימה היא פעם אחת כזאת:
              </p>
              <ol className="mt-3 space-y-2 text-sm text-gray-800 dark:text-gray-200">
                <li className="flex items-start gap-2">
                  <span className="flex h-6 w-6 flex-none items-center justify-center rounded-lg bg-[color:var(--brand-green)] text-xs font-bold text-white">
                    1
                  </span>
                  <span>מדבקה נשלחת לוואטסאפ כתמונה (webp 512×512)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-6 w-6 flex-none items-center justify-center rounded-lg bg-[color:var(--brand-green)] text-xs font-bold text-white">
                    2
                  </span>
                  <span>לחיצה ארוכה עליה בצ'אט → &quot;הוסף למדבקות&quot; (אנדרואיד) / &quot;הוסף למועדפות&quot; (iOS)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-6 w-6 flex-none items-center justify-center rounded-lg bg-[color:var(--brand-green)] text-xs font-bold text-white">
                    3
                  </span>
                  <span>מעכשיו היא במגש הקבוע שלך, לכל החיים</span>
                </li>
              </ol>
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-500">
                כל כלי אחר לייצר מדבקות מהרשת עובד כך. מי שמוסיף ישר למגש הם
                אפליקציות אנדרואיד/iOS ילידיות (כמו Sticker.ly).
              </p>
            </div>
          </section>

          {/* Testimonial-style social proof */}
          <section className="space-y-3 pt-4 text-right">
            <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-6 shadow-sm dark:border-gray-800 dark:from-gray-800/60 dark:to-gray-900/60">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-4 -top-4 text-7xl font-black text-[color:var(--brand-green)]/10 dark:text-[color:var(--brand-green)]/20"
              >
                &ldquo;
              </div>
              <p className="relative text-sm leading-relaxed text-gray-800 dark:text-gray-200">
                הדבר הכי מהיר שיצא לי להשתמש בו. לקח פחות מעשר שניות להפוך
                סלפי של החבר למדבקה, והשליחה ישר לוואטסאפ.
              </p>
              <p className="relative mt-3 text-xs font-semibold text-gray-600 dark:text-gray-400">
                — משתמש אמיתי מתל אביב
              </p>
            </div>
          </section>

          {/* Pricing teaser */}
          <section className="relative overflow-hidden rounded-3xl border-2 border-[color:var(--brand-green)]/20 bg-gradient-to-br from-white via-white to-[color:var(--brand-green)]/5 p-6 text-right shadow-xl shadow-black/5 dark:border-[color:var(--brand-green)]/30 dark:from-gray-800/80 dark:via-gray-800/60 dark:to-[color:var(--brand-green)]/10 dark:shadow-black/30">
            <div
              aria-hidden
              className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-[color:var(--brand-green)]/20 blur-2xl"
            />
            <div className="relative flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-[color:var(--brand-green)]/15 px-2.5 py-0.5 text-[10px] font-bold text-[color:var(--brand-green-dark)] dark:text-[color:var(--brand-green)]">
                  גרסה מלאה
                </div>
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-50">
                  פעם אחת, ללא חידוש
                </h3>
                <ul className="mt-3 space-y-1.5 text-xs text-gray-700 dark:text-gray-300">
                  <li className="flex items-center gap-1.5">
                    <span className="text-[color:var(--brand-green)]">✓</span>
                    מדבקות ללא הגבלה
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-[color:var(--brand-green)]">✓</span>
                    בלי סימן מים
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-[color:var(--brand-green)]">✓</span>
                    גלריה אישית וגישה להיסטוריה
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-[color:var(--brand-green)]">✓</span>
                    14 יום החזר מלא
                  </li>
                </ul>
              </div>
              <div className="flex-none text-left">
                <div className="text-3xl font-black leading-none text-[color:var(--brand-green-dark)] dark:text-[color:var(--brand-green)]">
                  ₪35
                </div>
                <div className="mt-1 text-[10px] text-gray-500 dark:text-gray-400">
                  חד-פעמי
                </div>
              </div>
            </div>
          </section>

          <footer className="space-y-3 pt-8 text-xs text-gray-500 dark:text-gray-500">
            <div className="font-medium">
              {PUBLIC_DOMAIN} · 3 מדבקות חינם · ₪35 לגישה מלאה
            </div>
            <nav
              className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-gray-600 dark:text-gray-400"
              aria-label="מסמכים משפטיים"
            >
              <Link
                href="/terms"
                className="hover:text-black hover:underline dark:hover:text-white"
              >
                תנאי שימוש
              </Link>
              <span aria-hidden="true">·</span>
              <Link
                href="/privacy"
                className="hover:text-black hover:underline dark:hover:text-white"
              >
                מדיניות פרטיות
              </Link>
              <span aria-hidden="true">·</span>
              <Link
                href="/refund"
                className="hover:text-black hover:underline dark:hover:text-white"
              >
                מדיניות החזרים
              </Link>
              <span aria-hidden="true">·</span>
              <Link
                href="/templates"
                className="hover:text-black hover:underline dark:hover:text-white"
              >
                תבניות
              </Link>
              {isSignedIn && (
                <>
                  <span aria-hidden="true">·</span>
                  <Link
                    href="/account"
                    className="hover:text-black hover:underline dark:hover:text-white"
                  >
                    החשבון שלי
                  </Link>
                  <span aria-hidden="true">·</span>
                  <Link
                    href="/gallery"
                    className="hover:text-black hover:underline dark:hover:text-white"
                  >
                    הגלריה שלי
                  </Link>
                </>
              )}
            </nav>
          </footer>
        </div>
      </div>
    </main>
  );
}

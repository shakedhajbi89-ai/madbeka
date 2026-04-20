import Link from "next/link";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { StickerMaker } from "@/components/sticker-maker";
import { PUBLIC_DOMAIN } from "@/lib/brand";

export default async function Home() {
  const { userId } = await auth();
  const isSignedIn = Boolean(userId);

  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-white to-gray-50 px-6 py-6">
      <div className="w-full max-w-xl space-y-8">
        {/* Top bar: brand + auth */}
        <header className="flex items-center justify-between">
          <div className="inline-block rounded-xl border-2 border-white bg-black px-3 py-1 text-xl font-black text-white shadow-md">
            Madbeka
          </div>
          <div>
            {isSignedIn ? (
              <UserButton />
            ) : (
              <SignInButton mode="modal">
                <button className="text-sm font-medium text-gray-700 hover:text-black">
                  התחברות
                </button>
              </SignInButton>
            )}
          </div>
        </header>

        <div className="space-y-8 text-center">
          {/* Hero */}
          <div className="space-y-2 pt-2">
            <h1 className="text-2xl font-bold leading-tight text-gray-900 sm:text-3xl">
              מתמונה למדבקה — תוך 10 שניות
            </h1>
            <p className="text-base text-gray-600">
              מחולל המדבקות הישראלי הכי מהיר לוואטסאפ
            </p>
          </div>

          {/* The actual app */}
          <div className="flex justify-center pt-2">
            <StickerMaker />
          </div>

          {/* How it works */}
          <section className="space-y-3 pt-6 text-right">
            <h2 className="text-center text-lg font-bold text-gray-900">
              איך זה עובד?
            </h2>
            <ol className="space-y-3">
              <li className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 text-sm">
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[color:var(--brand-green)] font-bold text-white">
                  1
                </span>
                <span className="text-gray-800">
                  העלה תמונה או צלם עכשיו
                </span>
              </li>
              <li className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 text-sm">
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[color:var(--brand-green)] font-bold text-white">
                  2
                </span>
                <span className="text-gray-800">
                  הרקע יוסר אוטומטית — הכל קורה במכשיר שלך
                </span>
              </li>
              <li className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 text-sm">
                <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[color:var(--brand-green)] font-bold text-white">
                  3
                </span>
                <span className="text-gray-800">
                  הורד את המדבקה ושלח בוואטסאפ
                </span>
              </li>
            </ol>
          </section>

          <footer className="space-y-2 pt-6 text-xs text-gray-500">
            <div>{PUBLIC_DOMAIN} · 3 מדבקות חינם, ₪35 לגישה מלאה</div>
            <nav
              className="flex items-center justify-center gap-3 text-gray-600"
              aria-label="מסמכים משפטיים"
            >
              <Link href="/terms" className="hover:text-black hover:underline">
                תנאי שימוש
              </Link>
              <span aria-hidden="true">·</span>
              <Link href="/privacy" className="hover:text-black hover:underline">
                מדיניות פרטיות
              </Link>
              <span aria-hidden="true">·</span>
              <Link href="/refund" className="hover:text-black hover:underline">
                מדיניות החזרים
              </Link>
            </nav>
          </footer>
        </div>
      </div>
    </main>
  );
}

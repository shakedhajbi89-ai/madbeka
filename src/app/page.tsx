import { StickerMaker } from "@/components/sticker-maker";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-white to-gray-50 px-6 py-10">
      <div className="w-full max-w-xl space-y-8 text-center">
        {/* Brand */}
        <div className="inline-block rounded-2xl border-4 border-white bg-black px-5 py-2 text-3xl font-black text-white shadow-xl sm:text-4xl">
          Madbeka
        </div>

        {/* Hero */}
        <div className="space-y-2">
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

        <footer className="pt-6 text-xs text-gray-500">
          madbeka.co.il · בקרוב עם ביטויים ישראליים, פונטים, וטקסט חופשי
        </footer>
      </div>
    </main>
  );
}

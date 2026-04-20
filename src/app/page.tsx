export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
      <div className="max-w-xl space-y-6">
        <div className="inline-block rounded-2xl border-4 border-white bg-black px-6 py-3 text-4xl font-black text-white shadow-2xl sm:text-5xl">
          Madbeka
        </div>

        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
          מתמונה למדבקה — תוך 10 שניות
        </h1>

        <p className="text-lg text-gray-600">
          מחולל המדבקות הישראלי הכי מהיר לוואטסאפ.
          <br />
          בקרוב כאן.
        </p>

        <div className="pt-4">
          <span className="inline-block rounded-full bg-[color:var(--brand-green)] px-5 py-2 text-sm font-semibold text-white">
            בבנייה 🚧
          </span>
        </div>
      </div>
    </main>
  );
}

import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Shared shell for the 3 legal pages (/terms, /privacy, /refund).
 *
 * All three docs share the same chrome (back link, brand chip, title,
 * last-updated stamp) — keeping it in one place so a policy update touches
 * one file, and so the three pages feel like one document set.
 *
 * `lastUpdated` is a free-form Hebrew string (e.g. "20 באפריל 2026") because
 * legal-facing users recognise formatted dates faster than ISO strings.
 */
export function LegalPage({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-white to-gray-50 px-6 py-6">
      <div className="w-full max-w-2xl space-y-6">
        <header className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-block rounded-xl border-2 border-white bg-black px-3 py-1 text-xl font-black text-white shadow-md"
          >
            Madbeka
          </Link>
          <Link
            href="/"
            className="text-sm font-medium text-gray-700 hover:text-black"
          >
            חזרה לדף הבית
          </Link>
        </header>

        <div className="space-y-2 pt-2 text-right">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            {title}
          </h1>
          <p className="text-xs text-gray-500">עדכון אחרון: {lastUpdated}</p>
        </div>

        <article
          className="
            space-y-5 rounded-2xl border border-gray-200 bg-white p-6 text-right text-sm leading-7 text-gray-800
            [&_h2]:mt-6 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-gray-900
            [&_h2:first-child]:mt-0
            [&_p]:text-gray-700
            [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pr-5 [&_ul]:text-gray-700
            [&_a]:text-[color:var(--brand-green)] [&_a]:underline
          "
        >
          {children}
        </article>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("[Madbeka] unhandled error:", error);
  }, [error]);

  return (
    <div
      className="relative min-h-screen text-ink"
      style={{ background: "var(--cream)" }}
    >
      <Header variant="minimal" />
      <main
        dir="rtl"
        className="grid place-items-center py-16"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 22%, rgba(232,76,43,0.12), transparent 60%),
            radial-gradient(circle at 80% 78%, rgba(37,211,102,0.14), transparent 60%)
          `,
        }}
      >
        <div className="relative px-6 text-center">
          {/* Decorative emoji scatter */}
          {[
            { e: "😵", top: 40, right: 60, rot: -15 },
            { e: "🔧", top: 220, left: 40, rot: 12 },
            { e: "💥", bottom: 160, right: 80, rot: 8 },
            { e: "🙈", bottom: 80, left: 60, rot: -20 },
          ].map((d, i) => (
            <span
              key={i}
              aria-hidden
              className="pointer-events-none absolute select-none text-4xl"
              style={{
                top: d.top,
                left: d.left,
                right: d.right,
                bottom: d.bottom,
                transform: `rotate(${d.rot}deg)`,
                opacity: 0.55,
              }}
            >
              {d.e}
            </span>
          ))}

          {/* Big tilted "500" sticker */}
          <div
            className="relative mx-auto mb-8 inline-block px-8 py-7"
            style={{
              background: "#fff",
              border: "3px solid var(--ink)",
              borderRadius: 28,
              boxShadow: "10px 11px 0 var(--ink)",
              transform: "rotate(-3deg)",
            }}
          >
            {/* Yellow tape */}
            <span
              aria-hidden
              className="absolute"
              style={{
                top: -14,
                right: "60%",
                width: 110,
                height: 30,
                transform: "rotate(-12deg)",
                background: "rgba(255,235,120,0.85)",
                border: "2px solid rgba(0,0,0,0.15)",
              }}
            />
            <div
              style={{
                fontFamily: "'Karantina', 'Heebo', sans-serif",
                fontWeight: 700,
                fontSize: 160,
                lineHeight: 0.85,
                letterSpacing: "-0.04em",
                color: "var(--accent-red)",
                WebkitTextStroke: "7px var(--ink)",
                paintOrder: "stroke fill",
                textShadow: "0 8px 0 var(--ink)",
              }}
            >
              500
            </div>
          </div>

          <h1
            className="mx-auto max-w-md"
            style={{
              fontFamily: "'Karantina', 'Heebo', sans-serif",
              fontWeight: 700,
              fontSize: 56,
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}
          >
            משהו השתבש אצלנו
          </h1>
          <p
            className="mx-auto mt-3 max-w-md text-[16px] font-bold"
            style={{ opacity: 0.7, lineHeight: 1.5 }}
          >
            ניסינו ולא הצלחנו. נסה לרענן, ואם זה ממשיך — דבר איתנו ב-
            <a
              href="mailto:hello@madbekaapp.co.il"
              className="underline"
              style={{ color: "var(--wa-dark)" }}
            >
              hello@madbekaapp.co.il
            </a>
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={reset}
              className="press-active inline-flex items-center gap-2 px-5 py-3.5 text-base font-extrabold"
              style={{
                background: "var(--wa)",
                color: "#fff",
                border: "2.5px solid var(--ink)",
                borderRadius: 16,
                boxShadow: "5px 6px 0 var(--ink)",
                fontFamily: "'Karantina', 'Heebo', sans-serif",
                fontSize: 22,
                cursor: "pointer",
              }}
            >
              ↻ נסה שוב
            </button>
            <Link
              href="/"
              className="press-active inline-flex items-center gap-2 px-5 py-3 text-sm font-extrabold"
              style={{
                background: "#fff",
                color: "var(--ink)",
                border: "2.5px solid var(--ink)",
                borderRadius: 14,
                boxShadow: "4px 5px 0 var(--ink)",
              }}
            >
              🏠 דף הבית
            </Link>
          </div>
        </div>
      </main>
      <Footer variant="minimal" />
    </div>
  );
}

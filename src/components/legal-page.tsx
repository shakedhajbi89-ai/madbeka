import { Clock } from "lucide-react";
import type { ReactNode } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

/**
 * Shared shell for the 3 legal pages (/terms, /privacy, /refund).
 *
 * All three docs share the same chrome — Playful header, kicker pill,
 * Karantina H1, "last updated" stamp — keeping policy updates a single-
 * file change. Body content is styled via descendant selectors so each
 * page can stay pure prose (h2/p/ul/a tags only).
 *
 * `kicker` is the English label that sits in a paper pill above the title
 * (e.g. "Privacy Policy" / "Terms of Service" / "Refund Policy").
 * `lastUpdated` is a free-form Hebrew string (e.g. "20 באפריל 2026")
 * because legal-facing users recognise formatted dates faster than ISO.
 */
export function LegalPage({
  title,
  kicker,
  lastUpdated,
  children,
}: {
  title: string;
  kicker?: string;
  lastUpdated: string;
  children: ReactNode;
}) {
  return (
    <div
      className="relative min-h-screen text-ink"
      style={{ background: "var(--cream)" }}
    >
      <Header variant="minimal" />
      <main dir="rtl">
      <div className="mx-auto max-w-3xl px-6 py-6 lg:px-8">

        {/* Doc heading */}
        <div className="mb-8">
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
          <h1
            style={{
              fontFamily: "'Karantina', 'Heebo', sans-serif",
              fontWeight: 700,
              fontSize: 64,
              lineHeight: 0.92,
              letterSpacing: "-0.025em",
              color: "var(--ink)",
            }}
          >
            {title}
          </h1>
          <div
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              opacity: 0.55,
            }}
          >
            <Clock size={13} />
            עודכן {lastUpdated}
          </div>
        </div>

        {/* Body */}
        <article
          className="space-y-5 p-7 text-right text-[16px] leading-[1.7]"
          style={{
            background: "#fff",
            border: "2.5px solid var(--ink)",
            borderRadius: 18,
            boxShadow: "5px 6px 0 var(--ink)",
          }}
        >
          <div
            className="
              [&_h2]:mb-3 [&_h2]:mt-6 [&_h2:first-child]:mt-0
              [&_p]:my-0 [&_p+p]:mt-3
              [&_ul]:my-2 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pr-5
              [&_a]:font-extrabold [&_a]:underline
            "
            style={
              {
                color: "var(--ink)",
                "--legal-h2-color": "var(--ink)",
              } as React.CSSProperties
            }
          >
            <style>
              {`
                article h2 {
                  font-family: 'Karantina', 'Heebo', sans-serif;
                  font-weight: 700;
                  font-size: 28px;
                  letter-spacing: -0.01em;
                  line-height: 1.1;
                  color: var(--ink);
                }
                article a {
                  color: var(--wa-dark);
                  text-decoration-style: dashed;
                }
                article a:hover {
                  color: var(--wa);
                }
              `}
            </style>
            {children}
          </div>
        </article>

      </div>
      </main>
      <Footer variant="minimal" />
    </div>
  );
}

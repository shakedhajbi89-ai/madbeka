import Link from "next/link";
import { Logo } from "@/components/Logo";
import { SUPPORT_EMAIL } from "@/lib/brand";

interface FooterProps {
  /** full = dark 4-column (Landing only). minimal = single-line (all other pages). */
  variant?: "full" | "minimal";
}

/**
 * Unified footer — replaces all inline footers across the app.
 * variant="full"    → bg ink, 4 columns, accordion on mobile.
 * variant="minimal" → single line, logo + 3 legal links + copyright.
 */
export function Footer({ variant = "minimal" }: FooterProps) {
  if (variant === "minimal") {
    return (
      <footer className="mt-12 border-t border-[hsl(var(--border-soft))] py-5 px-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 text-xs font-bold text-[var(--ink)]">
          <div className="flex items-center gap-2">
            <Logo size="sm" />
            <span className="opacity-70">© מדבקה 2026</span>
          </div>
          <nav className="flex items-center gap-4 opacity-70" aria-label="קישורים משפטיים">
            <Link href="/help" className="hover:opacity-100 transition-opacity">עזרה</Link>
            <Link href="/privacy" className="hover:opacity-100 transition-opacity">פרטיות</Link>
            <Link href="/terms" className="hover:opacity-100 transition-opacity">תנאי שימוש</Link>
            <Link href="/refund" className="hover:opacity-100 transition-opacity">החזרים</Link>
          </nav>
        </div>
      </footer>
    );
  }

  /* ── Full variant (Landing page) ── */
  return (
    <footer
      className="mt-24"
      style={{ background: "var(--ink)", color: "var(--cream)" }}
    >
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">

          {/* Column 1 — Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4 flex items-center gap-2.5">
              <Logo size="sm" />
              <span
                className="text-lg font-black"
                style={{ fontFamily: "var(--font-heebo, 'Heebo', sans-serif)" }}
              >
                מדבקה
              </span>
            </div>
            <p className="text-sm leading-relaxed opacity-70">
              עורך מדבקות הוואטסאפ הראשון שמדבר עברית כמו שצריך.
            </p>
          </div>

          {/* Columns 2-4 — Links */}
          {[
            {
              title: "שירות",
              links: [
                ["עורך", "/templates"],
                ["גלריה", "/gallery"],
                ["עזרה", "/help"],
              ],
            },
            {
              title: "משפטי",
              links: [
                ["תנאי שימוש", "/terms"],
                ["פרטיות", "/privacy"],
                ["החזרים", "/refund"],
              ],
            },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 font-bold" style={{ color: "var(--cream)" }}>
                {col.title}
              </h4>
              <ul className="space-y-2.5 text-sm" style={{ color: "rgba(251,243,220,0.7)" }}>
                {col.links.map(([label, href]) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="transition-colors hover:text-primary"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* חברה column — needs mailto so handled separately */}
          <div>
            <h4 className="mb-4 font-bold" style={{ color: "var(--cream)" }}>חברה</h4>
            <ul className="space-y-2.5 text-sm" style={{ color: "rgba(251,243,220,0.7)" }}>
              <li>
                <Link href="/help" className="transition-colors hover:text-primary">אודות</Link>
              </li>
              <li>
                <a href={`mailto:${SUPPORT_EMAIL}`} className="transition-colors hover:text-primary">יצירת קשר</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom row */}
        <div
          className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-6 text-xs md:flex-row"
          style={{
            borderColor: "rgba(251,243,220,0.1)",
            color: "rgba(251,243,220,0.6)",
          }}
        >
          <p>© Madbeka 2026 · נוצר באהבה בישראל 🇮🇱</p>
          <div className="flex items-center gap-2" style={{ fontFamily: "var(--font-mono, monospace)" }}>
            <span
              className="h-2 w-2 rounded-full animate-pulse"
              style={{ background: "hsl(var(--primary))" }}
            />
            v1.0.0 · ביטא
          </div>
        </div>
      </div>
    </footer>
  );
}

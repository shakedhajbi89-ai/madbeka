import Link from "next/link";
import { Logo } from "@/components/Logo";

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
            <p className="mb-5 text-sm leading-relaxed opacity-70">
              עורך מדבקות הוואטסאפ הראשון שמדבר עברית כמו שצריך.
            </p>
            {/* Social links — placeholder hrefs, no icons to avoid Lucide version conflicts */}
            <div className="flex gap-2">
              {["X", "Instagram", "Github"].map((name) => (
                <a
                  key={name}
                  href="#"
                  aria-label={name}
                  className="flex h-9 w-9 items-center justify-center rounded-md border text-xs font-bold transition-colors"
                  style={{ borderColor: "rgba(251,243,220,0.2)", color: "rgba(251,243,220,0.6)" }}
                >
                  {name[0]}
                </a>
              ))}
            </div>
          </div>

          {/* Columns 2-4 — Links */}
          {[
            {
              title: "שירות",
              links: [
                ["עורך", "/templates"],
                ["גלריה", "/gallery"],
                ["חידושים", "/terms"],
              ],
            },
            {
              title: "חברה",
              links: [
                ["אודות", "#"],
                ["יצירת קשר", "#"],
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

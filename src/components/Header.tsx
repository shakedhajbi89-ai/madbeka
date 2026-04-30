"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { User, Menu, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { BrutalButton } from "@/components/BrutalButton";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "איך זה עובד", href: "/#how" },
  { label: "מחיר", href: "/#pricing" },
];

interface HeaderProps {
  /** "editor" = active tab highlight for /templates */
  active?: "editor" | "gallery" | "account" | null;
  /** Pass JSX auth controls from server component (UserButton / SignInButton) */
  authControls?: React.ReactNode;
  /** If true, shows full nav. If false — logo + auth only (minimal) */
  variant?: "full" | "minimal";
}

/**
 * Unified sticky header — replaces TopBar, inline headers on Landing, account, gallery.
 * Adds border-bottom + backdrop on scroll.
 * RTL-aware (dir=rtl on <html> — no left/right hardcoded).
 */
export function Header({ active = null, authControls, variant = "full" }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-10 h-16 w-full transition-all duration-200",
        scrolled
          ? "bg-[var(--cream)]/85 backdrop-blur-[8px] border-b border-[hsl(var(--border-soft))]"
          : "bg-[var(--cream)]"
      )}
    >
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

        {/* ── Logo + wordmark (RTL: visually on the right) ── */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0" aria-label="מדבקה — דף בית">
          <Logo size="sm" />
          <span
            className="text-[22px] leading-none font-black tracking-tight text-[var(--ink)]"
            style={{ fontFamily: "var(--font-heebo, 'Heebo', sans-serif)" }}
          >
            מדבקה
          </span>
        </Link>

        {/* ── Desktop nav ── */}
        {variant === "full" && (
          <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-[var(--ink)]" aria-label="ניווט ראשי">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition-colors hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        )}

        {/* ── Actions (RTL: visually on the left) ── */}
        <div className="flex items-center gap-2">
          {/* Gallery CTA — shown only in full header */}
          {variant === "full" && (
            <Link href="/gallery" className="hidden sm:block">
              <BrutalButton variant="primary" size="sm">
                הגלריה שלי
              </BrutalButton>
            </Link>
          )}

          {/* Auth controls — UserButton or SignInButton passed from server */}
          {authControls}

          {/* Account icon link (desktop, full only) */}
          {variant === "full" && (
            <Link
              href="/account"
              aria-label="חשבון"
              className={cn(
                "hidden sm:flex h-10 w-10 items-center justify-center rounded-full border-2",
                "border-[var(--ink)] bg-white text-[var(--ink)] brutal-sm",
                "hover:-translate-x-[2px] hover:-translate-y-[2px] hover:brutal-md",
                "transition-all duration-150",
                active === "account" && "bg-[var(--ink)] text-[var(--cream)]"
              )}
            >
              <User size={18} />
            </Link>
          )}

          {/* Hamburger (mobile) */}
          <button
            className="flex md:hidden h-10 w-10 items-center justify-center rounded-full border-2 border-[var(--ink)] bg-white brutal-sm"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "סגור תפריט" : "פתח תפריט"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* ── Mobile drawer ── */}
      {menuOpen && (
        <div
          className="md:hidden absolute inset-x-0 top-16 border-b border-[hsl(var(--border-soft))] bg-[var(--cream)] px-4 pb-4 pt-2 anim-slide-down"
        >
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2.5 text-sm font-bold text-[var(--ink)] hover:bg-[var(--paper)]"
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/gallery"
              className="rounded-lg px-3 py-2.5 text-sm font-bold text-[var(--ink)] hover:bg-[var(--paper)]"
              onClick={() => setMenuOpen(false)}
            >
              הגלריה שלי
            </Link>
            <Link
              href="/account"
              className="rounded-lg px-3 py-2.5 text-sm font-bold text-[var(--ink)] hover:bg-[var(--paper)]"
              onClick={() => setMenuOpen(false)}
            >
              חשבון
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

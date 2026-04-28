"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Image as ImageIcon, Sticker as StickerIcon, User, Wand2 } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * Shared top bar for the app's authenticated surfaces (/account, /gallery).
 * Mirrors the homepage header in spirit but adds the three nav items —
 * עורך / הגלריה שלי / חשבון — with the active item rendered ink-on-cream.
 *
 * `signedIn` controls whether the gallery/account links + UserButton render.
 * For pages that gate at the route level (where unsigned visitors are
 * redirected before this even renders) you can leave it true.
 */
export function TopBar({
  active,
  signedIn = true,
}: {
  active: "editor" | "gallery" | "account" | null;
  signedIn?: boolean;
}) {
  const items: { id: "editor" | "gallery" | "account"; label: string; href: string; Icon: typeof Wand2 }[] = [
    { id: "editor", label: "עורך", href: "/templates", Icon: Wand2 },
    { id: "gallery", label: "הגלריה שלי", href: "/gallery", Icon: ImageIcon },
    { id: "account", label: "חשבון", href: "/account", Icon: User },
  ];

  return (
    <header className="mb-8 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-3.5">
        <div
          className="grid h-12 w-12 place-items-center rounded-[15px] text-cream"
          style={{
            background: "var(--ink)",
            transform: "rotate(-6deg)",
            boxShadow: "0 5px 0 var(--wa), 0 10px 20px rgba(0,0,0,0.18)",
          }}
        >
          <StickerIcon size={24} strokeWidth={2.4} />
        </div>
        <div
          className="text-3xl leading-none"
          style={{
            fontFamily: "'Karantina', 'Heebo', sans-serif",
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          Madbeka
        </div>
      </Link>

      <div className="flex items-center gap-2.5">
        <nav className="hidden items-center gap-1 sm:flex">
          {items.map((it) => {
            const isActive = active === it.id;
            return (
              <Link
                key={it.id}
                href={it.href}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-extrabold transition-colors"
                style={{
                  background: isActive ? "var(--ink)" : "transparent",
                  color: isActive ? "var(--cream)" : "var(--ink)",
                  border: isActive ? "2px solid var(--ink)" : "2px solid transparent",
                  borderRadius: 11,
                }}
              >
                <it.Icon size={15} strokeWidth={2.2} />
                {it.label}
              </Link>
            );
          })}
        </nav>
        <ThemeToggle />
        {signedIn && <UserButton />}
      </div>
    </header>
  );
}

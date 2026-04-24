"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { UserButton, useAuth } from "@clerk/nextjs";
import {
  deleteFromGallery,
  listGallery,
  type GalleryEntry,
} from "@/lib/sticker-gallery";
import {
  downloadBlob,
  shareStickerToWhatsApp,
} from "@/lib/sticker-utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { PUBLIC_DOMAIN } from "@/lib/brand";

interface GalleryItemUI extends GalleryEntry {
  url: string;
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "עכשיו";
  const min = Math.floor(sec / 60);
  if (min < 60) return `לפני ${min} דק׳`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `לפני ${hr} שעות`;
  const days = Math.floor(hr / 24);
  if (days < 30) return `לפני ${days} ימים`;
  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(ts));
}

export default function GalleryPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const [items, setItems] = useState<GalleryItemUI[] | null>(null);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [shareNotice, setShareNotice] = useState<string>("");

  const load = useCallback(async () => {
    const entries = await listGallery();
    const withUrls = entries.map((e) => ({
      ...e,
      url: URL.createObjectURL(e.blob),
    }));
    setItems(withUrls);
  }, []);

  useEffect(() => {
    void load();
    return () => {
      setItems((prev) => {
        prev?.forEach((p) => URL.revokeObjectURL(p.url));
        return prev;
      });
    };
  }, [load]);

  const onDelete = useCallback(
    async (id: string) => {
      if (!confirm("למחוק את המדבקה הזאת מהגלריה?")) return;
      await deleteFromGallery(id);
      setItems((prev) => {
        const item = prev?.find((p) => p.id === id);
        if (item) URL.revokeObjectURL(item.url);
        return prev?.filter((p) => p.id !== id) ?? [];
      });
    },
    [],
  );

  const onDownload = useCallback((item: GalleryItemUI) => {
    downloadBlob(item.blob, `madbeka-sticker-${item.id.slice(0, 8)}.webp`);
  }, []);

  const onShare = useCallback(async (item: GalleryItemUI) => {
    setSharingId(item.id);
    setShareNotice("");
    try {
      const result = await shareStickerToWhatsApp(item.blob);
      if (result === "fallback") {
        setShareNotice("פתחנו לך וואטסאפ. הורד קודם את המדבקה ואז שלח מהנייד.");
      } else if (result === "unsupported") {
        setShareNotice("הדפדפן לא תומך בשיתוף ישיר. הורד והעלה ידנית.");
      }
    } catch {
      setShareNotice("השיתוף נכשל. נסה שוב או הורד ושתף ידנית.");
    } finally {
      setSharingId(null);
    }
  }, []);

  return (
    <main className="relative flex min-h-screen flex-col items-center overflow-hidden bg-gradient-to-b from-white to-gray-50 px-6 py-6 dark:from-gray-950 dark:to-gray-900">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[400px] bg-gradient-to-b from-[color:var(--brand-green)]/5 via-transparent to-transparent dark:from-[color:var(--brand-green)]/10"
      />

      <div className="relative w-full max-w-4xl space-y-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-white bg-black px-3 py-1.5 text-xl font-black text-white shadow-lg shadow-black/10 transition-transform hover:scale-[1.02] dark:border-gray-700 dark:bg-gray-100 dark:text-black"
          >
            Madbeka
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isLoaded && isSignedIn ? (
              <>
                <Link
                  href="/account"
                  className="hidden text-sm font-medium text-gray-700 hover:text-black sm:inline dark:text-gray-300 dark:hover:text-white"
                >
                  החשבון שלי
                </Link>
                <UserButton />
              </>
            ) : null}
          </div>
        </header>

        <div className="space-y-2 text-right">
          <div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--brand-green-dark)] dark:text-[color:var(--brand-green)]">
            הגלריה שלי
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-gray-50">
            המדבקות שיצרת
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            כל המדבקות נשמרות <strong>רק במכשיר שלך</strong>. כלום לא עולה
            לאף שרת — זאת הסיבה שהגלריה לא תופיע במכשיר אחר.
          </p>
        </div>

        {shareNotice && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-right text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
            {shareNotice}
          </div>
        )}

        {items === null ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square animate-pulse rounded-2xl bg-gray-200 dark:bg-gray-800"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-gray-300 bg-white p-12 text-center shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[color:var(--brand-green)]/10 to-[color:var(--brand-green)]/20 text-3xl dark:from-[color:var(--brand-green)]/20 dark:to-[color:var(--brand-green)]/30">
              🖼️
            </div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-50">
              הגלריה ריקה
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              כל מדבקה שתיצור תופיע כאן אוטומטית.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-gradient-to-r from-[color:var(--brand-green)] to-[color:var(--brand-green-dark)] px-5 text-sm font-semibold text-white shadow-lg shadow-[color:var(--brand-green)]/30"
            >
              צור מדבקה ראשונה
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <Link
                href="/"
                className="font-medium text-[color:var(--brand-green-dark)] hover:underline dark:text-[color:var(--brand-green)]"
              >
                + צור מדבקה חדשה
              </Link>
              <span>{items.length} מדבקות</span>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="checkerboard relative aspect-square">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt="מדבקה"
                      className="h-full w-full object-contain p-3"
                    />
                    {/* Hover overlay with actions */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/0 opacity-0 transition-all group-hover:bg-black/50 group-hover:opacity-100">
                      <button
                        onClick={() => onShare(item)}
                        disabled={sharingId === item.id}
                        className="h-9 w-28 rounded-lg bg-[#25D366] text-xs font-semibold text-white shadow-md hover:bg-[#128C7E]"
                      >
                        {sharingId === item.id ? "..." : "שלח לוואטסאפ"}
                      </button>
                      <button
                        onClick={() => onDownload(item)}
                        className="h-9 w-28 rounded-lg bg-white text-xs font-semibold text-gray-900 shadow-md hover:bg-gray-100"
                      >
                        הורד
                      </button>
                      <button
                        onClick={() => onDelete(item.id)}
                        className="h-9 w-28 rounded-lg bg-red-500 text-xs font-semibold text-white shadow-md hover:bg-red-600"
                      >
                        מחק
                      </button>
                    </div>
                  </div>
                  <div className="border-t border-gray-100 px-3 py-2 text-right text-[11px] text-gray-500 dark:border-gray-800 dark:text-gray-400">
                    {formatRelative(item.createdAt)}
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile-friendly hint — hover actions aren't obvious on touch */}
            <p className="pt-2 text-center text-xs text-gray-500 dark:text-gray-500 sm:hidden">
              לחץ על מדבקה לפעולות
            </p>
          </>
        )}

        <footer className="pt-8 text-center text-xs text-gray-500 dark:text-gray-500">
          {PUBLIC_DOMAIN} · הגלריה נשמרת במכשיר שלך בלבד
        </footer>
      </div>
    </main>
  );
}

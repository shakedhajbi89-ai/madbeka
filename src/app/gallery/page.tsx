"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Download, ImageIcon, Plus, Send, Trash2 } from "lucide-react";
import {
  deleteFromGallery,
  listGallery,
  type GalleryEntry,
} from "@/lib/sticker-gallery";
import {
  downloadBlob,
  shareStickerToWhatsApp,
} from "@/lib/sticker-utils";
import { TopBar } from "@/components/playful/TopBar";
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

  const onDelete = useCallback(async (id: string) => {
    if (!confirm("למחוק את המדבקה הזאת מהגלריה?")) return;
    await deleteFromGallery(id);
    setItems((prev) => {
      const item = prev?.find((p) => p.id === id);
      if (item) URL.revokeObjectURL(item.url);
      return prev?.filter((p) => p.id !== id) ?? [];
    });
  }, []);

  const onDownload = useCallback((item: GalleryItemUI) => {
    downloadBlob(item.blob, `madbeka-sticker-${item.id.slice(0, 8)}.webp`);
  }, []);

  const onShare = useCallback(async (item: GalleryItemUI) => {
    setSharingId(item.id);
    setShareNotice("");
    try {
      const result = await shareStickerToWhatsApp(item.blob);
      if (result === "fallback") {
        setShareNotice(
          "פתחנו לך וואטסאפ. הורד קודם את המדבקה ואז שלח מהנייד.",
        );
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
    <main
      dir="rtl"
      className="relative min-h-screen text-ink"
      style={{
        background: "var(--cream)",
        backgroundImage: `
          radial-gradient(circle at 18% 18%, rgba(255,110,181,0.14), transparent 60%),
          radial-gradient(circle at 88% 82%, rgba(37,211,102,0.16), transparent 65%)
        `,
        fontFamily: "'Assistant', system-ui, sans-serif",
      }}
    >
      <div className="relative z-10 mx-auto max-w-6xl px-6 py-6 lg:px-8">
        <TopBar active="gallery" signedIn={isLoaded && !!isSignedIn} />

        {/* Header */}
        <div className="mb-7 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div
              className="mb-1 text-xs font-bold uppercase tracking-wider"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                opacity: 0.55,
              }}
            >
              הגלריה שלי
            </div>
            <h1
              style={{
                fontFamily: "'Karantina', 'Heebo', sans-serif",
                fontWeight: 700,
                fontSize: 56,
                lineHeight: 0.95,
                letterSpacing: "-0.02em",
              }}
            >
              {items === null
                ? "טוען..."
                : items.length === 0
                  ? "מתחילים?"
                  : "המדבקות שלי"}
            </h1>
            <p
              className="mt-1 max-w-xl text-[15px] font-bold"
              style={{ opacity: 0.65 }}
            >
              {items === null
                ? ""
                : items.length === 0
                  ? "עוד אין כלום פה — בואו נשנה את זה."
                  : `${items.length} מדבקות, ממוינות מהחדשה לישנה. נשמרות במכשיר שלך בלבד.`}
            </p>
          </div>
          <Link
            href="/templates"
            className="press-active inline-flex items-center gap-2 px-5 py-3 text-base font-extrabold"
            style={{
              background: "var(--wa)",
              color: "#fff",
              border: "2.5px solid var(--ink)",
              borderRadius: 16,
              boxShadow: "5px 6px 0 var(--ink)",
              fontFamily: "'Karantina', 'Heebo', sans-serif",
              fontSize: 22,
            }}
          >
            <Plus size={18} />
            מדבקה חדשה
          </Link>
        </div>

        {shareNotice && (
          <div
            className="mb-5 rounded-2xl px-5 py-3.5 text-right text-sm font-bold"
            style={{
              background: "var(--paper)",
              border: "2px dashed var(--ink)",
            }}
          >
            {shareNotice}
          </div>
        )}

        {/* Grid */}
        {items === null ? (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square animate-pulse"
                style={{
                  background: "rgba(15,14,12,0.06)",
                  border: "2.5px solid var(--ink)",
                  borderRadius: 20,
                  boxShadow: "5px 6px 0 var(--ink)",
                }}
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          /* Empty state — dashed grid + CTA */
          <div
            className="grid place-items-center px-6 py-20 text-center"
            style={{
              background: "#fff",
              border: "3px dashed var(--ink)",
              borderRadius: 24,
              boxShadow: "6px 7px 0 var(--ink)",
            }}
          >
            <div
              className="mb-5 grid h-20 w-20 place-items-center"
              style={{
                background: "var(--paper)",
                border: "2.5px solid var(--ink)",
                borderRadius: 22,
                boxShadow: "4px 5px 0 var(--ink)",
                transform: "rotate(-4deg)",
              }}
            >
              <ImageIcon size={32} strokeWidth={2.4} />
            </div>
            <h2
              style={{
                fontFamily: "'Karantina', 'Heebo', sans-serif",
                fontWeight: 700,
                fontSize: 44,
                lineHeight: 1,
                letterSpacing: "-0.01em",
              }}
            >
              עוד אין מדבקות
            </h2>
            <p
              className="mb-7 mt-2 max-w-md text-[15px] font-bold"
              style={{ opacity: 0.7 }}
            >
              כל מדבקה שתיצור תופיע כאן אוטומטית — ישר במכשיר שלך, בלי שרת.
            </p>
            <Link
              href="/templates"
              className="press-active inline-flex items-center gap-2 px-6 py-3.5 text-lg font-extrabold"
              style={{
                background: "var(--wa)",
                color: "#fff",
                border: "2.5px solid var(--ink)",
                borderRadius: 16,
                boxShadow: "5px 6px 0 var(--ink)",
                fontFamily: "'Karantina', 'Heebo', sans-serif",
                fontSize: 22,
              }}
            >
              <Plus size={20} />
              צור מדבקה ראשונה
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item, i) => {
              const tilt = ((i % 5) - 2) * 1.5;
              return (
                <div
                  key={item.id}
                  className="group flex flex-col overflow-hidden"
                  style={{
                    background: "#fff",
                    border: "2.5px solid var(--ink)",
                    borderRadius: 20,
                    boxShadow: "6px 7px 0 var(--ink)",
                  }}
                >
                  {/* Preview */}
                  <div
                    className="checker relative aspect-square"
                    style={{
                      borderBottom: "2px solid var(--ink)",
                    }}
                  >
                    <span
                      className="absolute inset-0"
                      style={{ transform: `rotate(${tilt}deg)` }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.url}
                        alt="מדבקה"
                        className="h-full w-full object-contain p-3"
                      />
                    </span>
                    {/* Hover/tap actions */}
                    <div
                      className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                      style={{
                        background: "rgba(15,14,12,0.7)",
                        backdropFilter: "blur(2px)",
                      }}
                    >
                      <button
                        onClick={() => onShare(item)}
                        disabled={sharingId === item.id}
                        className="press-active inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold disabled:opacity-50"
                        style={{
                          background: "var(--wa)",
                          color: "#fff",
                          border: "2px solid var(--ink)",
                          borderRadius: 11,
                          boxShadow: "3px 4px 0 var(--ink)",
                        }}
                      >
                        <Send size={13} />
                        {sharingId === item.id ? "מכין..." : "שתף"}
                      </button>
                      <button
                        onClick={() => onDownload(item)}
                        className="press-active inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold"
                        style={{
                          background: "#fff",
                          color: "var(--ink)",
                          border: "2px solid var(--ink)",
                          borderRadius: 11,
                          boxShadow: "3px 4px 0 var(--ink)",
                        }}
                      >
                        <Download size={13} />
                        הורד
                      </button>
                      <button
                        onClick={() => onDelete(item.id)}
                        className="press-active inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold"
                        style={{
                          background: "var(--accent-red)",
                          color: "#fff",
                          border: "2px solid var(--ink)",
                          borderRadius: 11,
                          boxShadow: "3px 4px 0 var(--ink)",
                        }}
                      >
                        <Trash2 size={13} />
                        מחק
                      </button>
                    </div>
                  </div>
                  {/* Card footer */}
                  <div className="flex items-center justify-between bg-white px-3 py-2">
                    <div
                      className="text-[11px]"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        opacity: 0.6,
                      }}
                    >
                      {formatRelative(item.createdAt)}
                    </div>
                    <div className="flex gap-1 sm:hidden">
                      <button
                        onClick={() => onShare(item)}
                        title="שתף"
                        className="grid h-8 w-8 place-items-center"
                        style={{
                          background: "transparent",
                          border: "1.5px solid var(--ink)",
                          borderRadius: 8,
                        }}
                      >
                        <Send size={13} />
                      </button>
                      <button
                        onClick={() => onDownload(item)}
                        title="הורד"
                        className="grid h-8 w-8 place-items-center"
                        style={{
                          background: "transparent",
                          border: "1.5px solid var(--ink)",
                          borderRadius: 8,
                        }}
                      >
                        <Download size={13} />
                      </button>
                      <button
                        onClick={() => onDelete(item.id)}
                        title="מחק"
                        className="grid h-8 w-8 place-items-center"
                        style={{
                          background: "transparent",
                          border: "1.5px solid var(--ink)",
                          borderRadius: 8,
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <footer
          className="mt-10 pt-6 text-center text-xs font-bold"
          style={{
            color: "#5a4252",
            borderTop: "1.5px dashed var(--ink)",
          }}
        >
          {PUBLIC_DOMAIN} · הגלריה נשמרת במכשיר שלך בלבד
        </footer>
      </div>
    </main>
  );
}

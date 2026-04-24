"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { UserButton, useAuth, SignUpButton } from "@clerk/nextjs";
import {
  EMOJI_CATEGORIES,
  FONT_OPTIONS,
  fontStack,
  generateTextSticker,
  paintPreview,
  TEMPLATES,
  type EmojiPosition,
  type TemplateDef,
  type TextStickerAlign,
  type TextStickerFont,
  type TextStickerStyle,
} from "@/lib/text-sticker";
import { downloadBlob, shareStickerToWhatsApp } from "@/lib/sticker-utils";
import { saveToGallery } from "@/lib/sticker-gallery";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { PUBLIC_DOMAIN } from "@/lib/brand";

interface UserStatus {
  hasPaid: boolean;
  canCreate: boolean;
  freeRemaining: number;
}

const STYLE_OPTIONS: { id: TextStickerStyle; label: string; swatch: string }[] = [
  { id: "classic", label: "קלאסי", swatch: "#FFFFFF" },
  { id: "black", label: "שחור", swatch: "#000000" },
  { id: "green", label: "ירוק", swatch: "#25D366" },
  { id: "sunset", label: "שקיעה", swatch: "#FF6B3D" },
  { id: "night", label: "לילה", swatch: "#7C3AED" },
  { id: "bubble", label: "בועה", swatch: "#FF4FA3" },
  { id: "graffiti", label: "גרפיטי", swatch: "#FF2D95" },
  { id: "neon", label: "נאון", swatch: "#00F5FF" },
];

const ALIGN_OPTIONS: { id: TextStickerAlign; label: string; icon: string }[] = [
  { id: "right", label: "ימין", icon: "⇥" },
  { id: "center", label: "מרכז", icon: "⇔" },
  { id: "left", label: "שמאל", icon: "⇤" },
];

// Where the emoji sits relative to the word. Each icon is a mini visual
// diagram so the user gets it at a glance, no reading required.
const EMOJI_POS_OPTIONS: { id: EmojiPosition; label: string; icon: string }[] = [
  { id: "inline", label: "ליד", icon: "😀א" },
  { id: "above", label: "מעל", icon: "😀\nא" },
  { id: "below", label: "מתחת", icon: "א\n😀" },
  { id: "flip", label: "צד נגדי", icon: "א😀" },
];

export default function TemplatesPage() {
  const { isSignedIn, isLoaded } = useAuth();

  // Editor state
  const [text, setText] = useState("יאללה");
  // Emoji is tracked separately from the word so the user can position it
  // relative to the word (above / below / opposite side) — not just append
  // it into the text string. See EmojiPosition in @/lib/text-sticker.
  const [emoji, setEmoji] = useState("");
  const [emojiPos, setEmojiPos] = useState<EmojiPosition>("inline");
  const [style, setStyle] = useState<TextStickerStyle>("classic");
  const [font, setFont] = useState<TextStickerFont>("marker");
  const [size, setSize] = useState(160);
  const [rotation, setRotation] = useState(0);
  const [align, setAlign] = useState<TextStickerAlign>("center");
  // User-drag offset inside the 512×512 canvas. (0,0) = centered.
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const previewRef = useRef<HTMLCanvasElement | null>(null);
  const zoomRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<UserStatus | null>(null);
  const [working, setWorking] = useState<"download" | "share" | null>(null);
  const [notice, setNotice] = useState("");
  const [zoomed, setZoomed] = useState(false);
  // Which emoji category is currently expanded in the picker panel. null =
  // nothing open yet (clean UI), string = id of the open category.
  const [openEmojiCat, setOpenEmojiCat] = useState<string | null>(null);

  // Repaint both preview canvases whenever any editor input changes.
  // The zoom modal's canvas mirrors the main one so when you open zoom,
  // you see exactly the current state big.
  useEffect(() => {
    const shouldWatermark = !(status?.hasPaid === true);
    const opts = {
      text: text || " ",
      emoji,
      emojiPos,
      style,
      font,
      size,
      rotation,
      align,
      offsetX: offset.x,
      offsetY: offset.y,
      watermark: shouldWatermark,
    };
    if (previewRef.current) paintPreview(previewRef.current, opts);
    if (zoomRef.current) paintPreview(zoomRef.current, opts);
  }, [text, emoji, emojiPos, style, font, size, rotation, align, offset.x, offset.y, status?.hasPaid, zoomed]);

  // Close zoom with Escape
  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setZoomed(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomed]);

  // Load user status
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isSignedIn) {
        if (!cancelled) setStatus(null);
        return;
      }
      try {
        const res = await fetch("/api/stickers/me");
        if (!res.ok) return;
        const data = (await res.json()) as UserStatus;
        if (!cancelled) setStatus(data);
      } catch {
        /* silent */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  const renderCurrent = useCallback(async () => {
    const shouldWatermark = !(status?.hasPaid === true);
    return generateTextSticker({
      text: text || " ",
      emoji,
      emojiPos,
      style,
      font,
      size,
      rotation,
      align,
      offsetX: offset.x,
      offsetY: offset.y,
      watermark: shouldWatermark,
    });
  }, [text, emoji, emojiPos, style, font, size, rotation, align, offset.x, offset.y, status?.hasPaid]);

  const onDownload = useCallback(async () => {
    if (!isSignedIn) {
      setNotice("הירשם כדי להוריד מדבקה.");
      return;
    }
    setWorking("download");
    setNotice("");
    try {
      const res = await fetch("/api/stickers/log", { method: "POST" });
      if (res.status === 402) {
        setNotice("סיימת את המדבקות החינמיות. שדרג ב-₪35.");
        return;
      }
      if (!res.ok) throw new Error("שגיאה ברישום");
      try {
        const data = (await res.json()) as UserStatus;
        setStatus(data);
      } catch {
        /* ignore */
      }
      const blob = await renderCurrent();
      downloadBlob(blob, `madbeka-${text || "text"}.webp`);
      void saveToGallery(blob, text);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "משהו השתבש בהורדה.");
    } finally {
      setWorking(null);
    }
  }, [isSignedIn, renderCurrent, text]);

  const onShare = useCallback(async () => {
    setWorking("share");
    setNotice("");
    try {
      const blob = await renderCurrent();
      void saveToGallery(blob, text);
      const result = await shareStickerToWhatsApp(blob);
      if (result === "shared") {
        setNotice(
          "נשלח! בצ'אט וואטסאפ: לחץ לחיצה ארוכה על התמונה → \"הוסף למדבקות\" (אנדרואיד) / \"הוסף למועדפות\" (iOS).",
        );
      } else if (result === "fallback") {
        setNotice("פתחנו לך וואטסאפ Web. הורד ושתף מהנייד.");
      } else if (result === "unsupported") {
        setNotice("הדפדפן לא תומך בשיתוף ישיר. הורד ושתף ידנית.");
      }
    } catch {
      setNotice("השיתוף נכשל. נסה שוב.");
    } finally {
      setWorking(null);
    }
  }, [renderCurrent, text]);

  /** Load a preset into the editor — keeps user's current text choices tidy. */
  const applyTemplate = useCallback((t: TemplateDef) => {
    setText(t.text);
    setEmoji("");
    setEmojiPos("inline");
    setStyle(t.style);
    setFont(t.font);
    setRotation(t.rotation ?? 0);
    setAlign("center");
    setSize(160);
    setOffset({ x: 0, y: 0 });
    setNotice("");
  }, []);

  // Drag-to-move on the preview canvas. Pointer events unify mouse + touch
  // so iPhone and desktop both work with the same handlers. We track the
  // initial click point relative to the current offset, then apply each
  // subsequent move as offset = startOffset + (pointer - startPointer),
  // scaled up from CSS px to the canvas's internal 512px coordinate space.
  const dragStart = useRef<{
    pointerX: number;
    pointerY: number;
    offsetX: number;
    offsetY: number;
    scale: number;
  } | null>(null);

  const onPointerDownCanvas = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      // CSS pixel → internal 512px scale factor. Canvas is rendered at
      // rect.width CSS pixels, but its coordinate space is 512px.
      const scale = rect.width > 0 ? 512 / rect.width : 1;
      dragStart.current = {
        pointerX: e.clientX,
        pointerY: e.clientY,
        offsetX: offset.x,
        offsetY: offset.y,
        scale,
      };
      el.setPointerCapture(e.pointerId);
    },
    [offset.x, offset.y],
  );

  const onPointerMoveCanvas = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const start = dragStart.current;
      if (!start) return;
      const dx = (e.clientX - start.pointerX) * start.scale;
      const dy = (e.clientY - start.pointerY) * start.scale;
      // Clamp so user can't drag the sticker entirely out of frame.
      const clamp = (v: number) => Math.max(-256, Math.min(256, v));
      setOffset({
        x: clamp(start.offsetX + dx),
        y: clamp(start.offsetY + dy),
      });
    },
    [],
  );

  const onPointerEndCanvas = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      dragStart.current = null;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* pointer may have already been released */
      }
    },
    [],
  );

  // Font picker renders each option in its own font so the user sees what
  // they're picking before picking it. Memoize the style object so React
  // doesn't rebuild it every re-render.
  const fontButtonStyle = useMemo(
    () =>
      Object.fromEntries(
        FONT_OPTIONS.map((f) => [f.id, { fontFamily: fontStack(f.id) }]),
      ) as Record<TextStickerFont, React.CSSProperties>,
    [],
  );

  return (
    <main className="relative flex min-h-screen flex-col items-center bg-gradient-to-b from-white to-gray-50 px-6 py-6 dark:from-gray-950 dark:to-gray-900 lg:h-screen lg:min-h-0 lg:overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[400px] bg-gradient-to-b from-[color:var(--brand-green)]/5 via-transparent to-transparent dark:from-[color:var(--brand-green)]/10"
      />

      <div className="relative w-full max-w-6xl space-y-6 lg:flex lg:h-full lg:flex-col lg:space-y-4">
        <header className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-white bg-black px-3 py-1.5 text-xl font-black text-white shadow-lg shadow-black/10 transition-transform hover:scale-[1.02] dark:border-gray-700 dark:bg-gray-100 dark:text-black"
          >
            Madbeka
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isLoaded && isSignedIn && <UserButton />}
          </div>
        </header>

        <div className="space-y-1 text-right">
          <div className="text-xs font-semibold uppercase tracking-wide text-[color:var(--brand-green-dark)] dark:text-[color:var(--brand-green)]">
            עורך מדבקות טקסט
          </div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-gray-50">
            צור מדבקה בעברית — הכל בשליטתך
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            כתוב, בחר פונט, צבע, גודל, יישור וזווית. התצוגה מתעדכנת חי.
          </p>
        </div>

        {/* Editor grid in RTL: first column renders on the RIGHT edge.
            Order: [rail · preview · controls] — rail on far right so user's
            thumb (on mobile) or eye (on desktop) lands on presets first,
            preview dominates the middle, controls sit on the left. */}
        {/* Desktop: grid fills all remaining vertical space in the viewport.
            Columns stretch to grid row height (default align-items: stretch)
            so their lg:overflow-y-auto actually produces scrollbars when
            content exceeds the column height. main is h-screen overflow-hidden
            so the page itself can't scroll — all scrolling happens inside the
            columns, preview stays put.
            Mobile: columns stack, page flows normally. */}
        <div className="grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-rows-1 lg:grid-cols-[96px_minmax(0,640px)_minmax(280px,1fr)] lg:overflow-hidden">
          {/* Preset rail — moved to the far-right column (first in DOM in
              RTL context). Vertical strip on desktop, horizontal scroll on
              mobile. One tap loads a preset into the editor. */}
          <aside className="lg:flex lg:h-full lg:flex-col">
            <div className="mb-2 text-center text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              מוכנים
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 lg:flex-1 lg:flex-col lg:overflow-x-visible lg:overflow-y-auto lg:pb-0">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => applyTemplate(t)}
                  style={{ fontFamily: fontStack(t.font) }}
                  className="flex min-w-[80px] flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white px-2 py-3 text-lg font-bold text-gray-900 shadow-sm transition-all hover:-translate-y-0.5 hover:border-[color:var(--brand-green)]/50 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:text-gray-50 lg:min-w-0 lg:w-full"
                >
                  {t.text}
                </button>
              ))}
            </div>
          </aside>

          {/* Live preview — fits inside the viewport-capped grid on desktop.
              The canvas is aspect-square so it shrinks to match available
              width/height. Buttons stay below it, all naturally visible. */}
          <div className="mx-auto w-full max-w-[640px] space-y-3 lg:flex lg:h-full lg:flex-col lg:overflow-y-auto">
            <div className="checkerboard relative overflow-hidden rounded-3xl border border-gray-200 shadow-xl shadow-black/5 dark:border-gray-800 dark:shadow-black/30">
              <canvas
                ref={previewRef}
                width={512}
                height={512}
                onPointerDown={onPointerDownCanvas}
                onPointerMove={onPointerMoveCanvas}
                onPointerUp={onPointerEndCanvas}
                onPointerCancel={onPointerEndCanvas}
                className="block aspect-square w-full cursor-grab touch-none select-none active:cursor-grabbing"
              />
              {/* Zoom button — opens a full-screen view to inspect details */}
              <button
                onClick={() => setZoomed(true)}
                aria-label="הגדל תצוגה"
                className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-lg shadow-md backdrop-blur transition hover:scale-105 hover:bg-white dark:bg-gray-900/90 dark:hover:bg-gray-900"
              >
                🔍
              </button>
              {/* Reset-position button — only appears once the user has
                  actually dragged the sticker, so the UI stays clean. */}
              {(offset.x !== 0 || offset.y !== 0) && (
                <button
                  onClick={() => setOffset({ x: 0, y: 0 })}
                  aria-label="איפוס מיקום"
                  className="absolute right-3 top-3 flex h-10 items-center justify-center gap-1.5 rounded-full bg-white/90 px-3 text-xs font-semibold text-gray-800 shadow-md backdrop-blur transition hover:scale-105 hover:bg-white dark:bg-gray-900/90 dark:text-gray-100 dark:hover:bg-gray-900"
                >
                  <span>🎯</span>
                  <span>מרכז</span>
                </button>
              )}
            </div>
            <p className="text-center text-xs text-gray-500 dark:text-gray-400">
              גרור את המילה לאן שתרצה. הרקע המשובץ שקוף — בוואטסאפ תופיע רק המילה.
            </p>

            {/* Action buttons */}
            <div className="flex flex-col gap-2">
              <Button
                onClick={onShare}
                disabled={working !== null || !text.trim()}
                className="h-12 w-full bg-[#25D366] text-base font-semibold text-white shadow-md hover:bg-[#128C7E]"
              >
                {working === "share" ? "מכין..." : "שלח לוואטסאפ 💬"}
              </Button>
              {isSignedIn ? (
                <Button
                  onClick={onDownload}
                  disabled={working !== null || !text.trim()}
                  className="h-12 w-full bg-gradient-to-r from-[color:var(--brand-green)] to-[color:var(--brand-green-dark)] text-base font-semibold text-white shadow-lg shadow-[color:var(--brand-green)]/25 hover:shadow-xl"
                >
                  {working === "download" ? "מוריד..." : "הורד מדבקה"}
                </Button>
              ) : (
                <SignUpButton mode="modal">
                  <Button className="h-12 w-full bg-gradient-to-r from-[color:var(--brand-green)] to-[color:var(--brand-green-dark)] text-base font-semibold text-white shadow-lg shadow-[color:var(--brand-green)]/25">
                    הירשם והורד
                  </Button>
                </SignUpButton>
              )}
            </div>

            {notice && (
              <div className="rounded-2xl border border-[color:var(--brand-green)]/30 bg-[color:var(--brand-green)]/5 px-4 py-3 text-right text-xs text-gray-700 dark:border-[color:var(--brand-green)]/40 dark:bg-[color:var(--brand-green)]/10 dark:text-gray-300">
                {notice}
              </div>
            )}
          </div>

          {/* Controls — scroll internally on desktop so the preview column
              stays in view while the user pages through all editor sections. */}
          <div className="space-y-4 lg:h-full lg:overflow-y-auto lg:pl-1">
            {/* Text input */}
            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <label className="mb-2 block text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                טקסט
              </label>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={30}
                placeholder="למשל: יום הולדת שמח"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-right text-base font-medium text-gray-900 focus:border-[color:var(--brand-green)] focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-green)]/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50"
                dir="rtl"
              />
              <div className="mt-1 text-left text-[10px] text-gray-400">
                {text.length}/30
              </div>
            </section>

            {/* Emoji picker — categories shown as chips with a sample emoji.
                Click a category to expand its grid. Picked emojis live in
                a dedicated `emoji` state and can be positioned independently
                of the word (above / below / opposite side / inline). */}
            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-3 flex items-center justify-between">
                {/* Selected emoji(s) + delete button. Only shown when the user
                    has actually picked something, so the UI stays clean. */}
                {emoji ? (
                  <button
                    onClick={() => {
                      setEmoji("");
                      setEmojiPos("inline");
                    }}
                    className="flex items-center gap-2 rounded-xl border border-gray-300 bg-gray-50 px-3 py-1.5 text-sm font-semibold text-gray-700 transition hover:border-red-400 hover:bg-red-50 hover:text-red-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-red-500 dark:hover:bg-red-950/40"
                    title="הסר אימוג'י"
                  >
                    <span className="text-lg leading-none">{emoji}</span>
                    <span className="text-xs">✕ הסר</span>
                  </button>
                ) : (
                  <span />
                )}
                <label className="text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  אימוג׳י
                </label>
              </div>

              {/* Position selector — only makes sense once there's an emoji.
                  Appears above the category chips so the user can change
                  placement right after picking. */}
              {emoji && (
                <div className="mb-3">
                  <div className="mb-1.5 text-right text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                    מיקום האימוג׳י
                  </div>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {EMOJI_POS_OPTIONS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setEmojiPos(p.id)}
                        className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                          emojiPos === p.id
                            ? "border-[color:var(--brand-green)] bg-[color:var(--brand-green)]/10 text-[color:var(--brand-green-dark)] shadow-sm dark:text-[color:var(--brand-green)]"
                            : "border-gray-300 bg-white text-gray-800 hover:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap justify-end gap-2">
                {EMOJI_CATEGORIES.map((cat) => {
                  const isOpen = openEmojiCat === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() =>
                        setOpenEmojiCat(isOpen ? null : cat.id)
                      }
                      className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition-all ${
                        isOpen
                          ? "border-[color:var(--brand-green)] bg-[color:var(--brand-green)]/10 text-[color:var(--brand-green-dark)] shadow-sm dark:text-[color:var(--brand-green)]"
                          : "border-gray-300 bg-white text-gray-800 hover:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                      }`}
                    >
                      <span className="text-lg leading-none">{cat.sample}</span>
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>

              {openEmojiCat && (
                <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-800">
                  <div className="grid grid-cols-8 gap-2">
                    {EMOJI_CATEGORIES.find((c) => c.id === openEmojiCat)?.emojis.map(
                      (e, i) => (
                        <button
                          key={`${openEmojiCat}-${i}`}
                          onClick={() => {
                            // Append to the dedicated emoji state (not text).
                            // Cap at 8 emojis — plenty for any sticker, avoids
                            // overflow inside the canvas.
                            setEmoji((prev) => {
                              const combined = prev + e;
                              // Rough cap via JS string length (emojis are
                              // ~2 UTF-16 chars each).
                              return combined.length > 16
                                ? combined.slice(0, 16)
                                : combined;
                            });
                          }}
                          className="flex aspect-square items-center justify-center rounded-xl border border-gray-200 bg-white text-2xl transition-all hover:-translate-y-0.5 hover:border-[color:var(--brand-green)]/50 hover:shadow-md dark:border-gray-800 dark:bg-gray-800"
                        >
                          {e}
                        </button>
                      ),
                    )}
                  </div>
                  <p className="mt-3 text-right text-[10px] text-gray-400">
                    הקלקה מוסיפה אימוג׳י — ניתן למקם אותו מעל/מתחת/בצד
                  </p>
                </div>
              )}
            </section>

            {/* Font picker */}
            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <label className="mb-3 block text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                פונט
              </label>
              <div className="flex flex-wrap justify-end gap-2">
                {FONT_OPTIONS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFont(f.id)}
                    style={fontButtonStyle[f.id]}
                    className={`rounded-xl border px-4 py-2.5 text-base font-bold transition-all ${
                      font === f.id
                        ? "border-[color:var(--brand-green)] bg-[color:var(--brand-green)]/10 text-[color:var(--brand-green-dark)] shadow-sm dark:text-[color:var(--brand-green)]"
                        : "border-gray-300 bg-white text-gray-800 hover:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Style (color) picker */}
            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <label className="mb-3 block text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                צבע
              </label>
              <div className="flex flex-wrap justify-end gap-2">
                {STYLE_OPTIONS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.id)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-all ${
                      style === s.id
                        ? "border-[color:var(--brand-green)] bg-[color:var(--brand-green)]/10 text-[color:var(--brand-green-dark)] dark:text-[color:var(--brand-green)]"
                        : "border-gray-300 bg-white text-gray-800 hover:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                    }`}
                  >
                    <span
                      aria-hidden
                      className="inline-block h-4 w-4 rounded-full border border-gray-300 dark:border-gray-600"
                      style={{ backgroundColor: s.swatch }}
                    />
                    {s.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Size + rotation sliders */}
            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="space-y-4">
                {/* Size */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                      {size}px
                    </span>
                    <label className="text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      גודל
                    </label>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="280"
                    step="4"
                    value={size}
                    onChange={(e) => setSize(Number(e.target.value))}
                    dir="rtl"
                    className="w-full accent-[color:var(--brand-green)]"
                  />
                </div>

                {/* Rotation */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                      {rotation}°
                    </span>
                    <label className="text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      זווית
                    </label>
                  </div>
                  <input
                    type="range"
                    min="-45"
                    max="45"
                    step="1"
                    value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                    dir="rtl"
                    className="w-full accent-[color:var(--brand-green)]"
                  />
                  <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                    <span>-45°</span>
                    <button
                      onClick={() => setRotation(0)}
                      className="text-[color:var(--brand-green-dark)] hover:underline dark:text-[color:var(--brand-green)]"
                    >
                      איפוס
                    </button>
                    <span>+45°</span>
                  </div>
                </div>

                {/* Alignment */}
                <div>
                  <label className="mb-2 block text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    יישור
                  </label>
                  <div className="flex justify-end gap-2">
                    {ALIGN_OPTIONS.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => setAlign(a.id)}
                        className={`flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
                          align === a.id
                            ? "border-[color:var(--brand-green)] bg-[color:var(--brand-green)]/10 text-[color:var(--brand-green-dark)] dark:text-[color:var(--brand-green)]"
                            : "border-gray-300 bg-white text-gray-800 hover:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                        }`}
                      >
                        <span className="text-base">{a.icon}</span>
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Full-screen zoom modal — click the 🔍 on the preview to open, click
            anywhere outside / press Escape to close. The canvas inside stays
            in sync with the editor via the shared useEffect above. */}
        {zoomed && (
          <div
            onClick={() => setZoomed(false)}
            className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="checkerboard relative cursor-default overflow-hidden rounded-3xl shadow-2xl"
              style={{ width: "min(90vw, 90vh)", height: "min(90vw, 90vh)" }}
            >
              <canvas
                ref={zoomRef}
                width={512}
                height={512}
                className="block h-full w-full"
              />
              <button
                onClick={() => setZoomed(false)}
                aria-label="סגור"
                className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl text-black shadow-lg transition hover:scale-110"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <footer className="pt-6 text-center text-xs text-gray-500 dark:text-gray-500">
          {PUBLIC_DOMAIN}
        </footer>
      </div>
    </main>
  );
}

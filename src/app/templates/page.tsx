"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { UserButton, useAuth, SignUpButton } from "@clerk/nextjs";
import {
  defaultEmojiSize,
  EMOJI_CATEGORIES,
  FONT_OPTIONS,
  fontStack,
  generateTextSticker,
  paintPreview,
  SKIN_TONE_EMOJIS,
  SKIN_TONE_OPTIONS,
  STYLE_PREFERRED_FONT,
  TEMPLATES,
  wordLayerHalfExtent,
  type EmojiLayer,
  type StickerLayer,
  type TemplateDef,
  type TextStickerAlign,
  type TextStickerFont,
  type TextStickerStyle,
  type WordLayer,
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
  { id: "bubble", label: "בועה 3D", swatch: "#FF6EB5" },
  { id: "graffiti", label: "גרפיטי", swatch: "#FF2D95" },
  { id: "neon", label: "נאון", swatch: "#00F5FF" },
  { id: "pastel", label: "פסטל", swatch: "#FFC5E3" },
  { id: "handwriting", label: "כתב יד", swatch: "#1E293B" },
];

const ALIGN_OPTIONS: { id: TextStickerAlign; label: string; icon: string }[] = [
  { id: "right", label: "ימין", icon: "⇥" },
  { id: "center", label: "מרכז", icon: "⇔" },
  { id: "left", label: "שמאל", icon: "⇤" },
];

const DEFAULT_WORD_SIZE = 160;
const DEFAULT_EMOJI_OFFSET_Y = -130;

// Stable ID generator. Using crypto.randomUUID when available (all modern
// browsers + node), fallback to a counter for SSR robustness.
let idCounter = 0;
function uid(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  idCounter += 1;
  return `${prefix}-${idCounter}-${Date.now()}`;
}

function makeWordLayer(props?: Partial<WordLayer>): WordLayer {
  return {
    id: props?.id ?? uid("w"),
    type: "word",
    text: props?.text ?? "יאללה",
    font: props?.font ?? "marker",
    style: props?.style ?? "classic",
    size: props?.size ?? DEFAULT_WORD_SIZE,
    rotation: props?.rotation ?? 0,
    align: props?.align ?? "center",
    offsetX: props?.offsetX ?? 0,
    offsetY: props?.offsetY ?? 0,
  };
}

function makeEmojiLayer(base: string, refWordSize: number): EmojiLayer {
  return {
    id: uid("e"),
    type: "emoji",
    base,
    skin: "",
    size: defaultEmojiSize(refWordSize),
    rotation: 0,
    offsetX: 0,
    offsetY: DEFAULT_EMOJI_OFFSET_Y,
  };
}

function layerPreview(layer: StickerLayer): string {
  if (layer.type === "emoji") {
    return layer.skin && SKIN_TONE_EMOJIS.has(layer.base)
      ? layer.base + layer.skin
      : layer.base;
  }
  return layer.text || "טקסט";
}

export default function TemplatesPage() {
  const { isSignedIn, isLoaded } = useAuth();

  // Layer state — the canvas is composed of zero-or-more layers, each fully
  // self-contained. Initial stack: one word layer "יאללה" ready for the
  // user to start from. The array order is the DRAW order: index 0 = back,
  // last index = front (on top).
  const [layers, setLayers] = useState<StickerLayer[]>(() => [makeWordLayer()]);
  const [selectedId, setSelectedId] = useState<string | null>(() => null);

  const [status, setStatus] = useState<UserStatus | null>(null);
  const [working, setWorking] = useState<"download" | "share" | null>(null);
  const [notice, setNotice] = useState("");
  const [zoomed, setZoomed] = useState(false);
  const [openEmojiCat, setOpenEmojiCat] = useState<string | null>(null);

  const previewRef = useRef<HTMLCanvasElement | null>(null);
  const zoomRef = useRef<HTMLCanvasElement | null>(null);

  // Keep selectedId valid. If current selection disappears (layer deleted),
  // fall back to the top-most layer. If nothing is selected yet, pick the
  // last layer so the controls have something to drive.
  useEffect(() => {
    if (!layers.length) return;
    if (!selectedId || !layers.some((l) => l.id === selectedId)) {
      setSelectedId(layers[layers.length - 1].id);
    }
  }, [layers, selectedId]);

  // Derived: the currently selected layer and its type-narrowed views.
  const selected = useMemo(
    () => layers.find((l) => l.id === selectedId) ?? null,
    [layers, selectedId],
  );
  const selectedWord = selected?.type === "word" ? selected : null;
  const selectedEmoji = selected?.type === "emoji" ? selected : null;
  const selectedEmojiSupportsSkin =
    !!selectedEmoji && SKIN_TONE_EMOJIS.has(selectedEmoji.base);

  // Reference word size for default emoji scale on new pick. Use the first
  // word in the stack if there is one; otherwise the default constant.
  const referenceWordSize =
    layers.find((l) => l.type === "word")?.size ?? DEFAULT_WORD_SIZE;

  // Repaint the preview canvas(es) whenever any layer changes.
  useEffect(() => {
    const shouldWatermark = !(status?.hasPaid === true);
    const opts = { layers, watermark: shouldWatermark };
    if (previewRef.current) paintPreview(previewRef.current, opts);
    if (zoomRef.current) paintPreview(zoomRef.current, opts);
  }, [layers, status?.hasPaid, zoomed]);

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

  // ---------- Layer mutation helpers ----------
  const updateLayer = useCallback(
    (id: string, patch: Partial<WordLayer> & Partial<EmojiLayer>) => {
      setLayers((prev) =>
        prev.map((l) => (l.id === id ? ({ ...l, ...patch } as StickerLayer) : l)),
      );
    },
    [],
  );

  const patchSelected = useCallback(
    (patch: Partial<WordLayer> & Partial<EmojiLayer>) => {
      if (!selectedId) return;
      updateLayer(selectedId, patch);
    },
    [selectedId, updateLayer],
  );

  const deleteLayer = useCallback((id: string) => {
    setLayers((prev) => {
      const next = prev.filter((l) => l.id !== id);
      // Keep at least one layer — empty canvas is a dead end.
      return next.length ? next : [makeWordLayer({ text: "טקסט" })];
    });
  }, []);

  const moveLayer = useCallback((id: string, direction: "front" | "back") => {
    setLayers((prev) => {
      const i = prev.findIndex((l) => l.id === id);
      if (i < 0) return prev;
      const j = direction === "front" ? i + 1 : i - 1;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }, []);

  const addEmojiLayer = useCallback(
    (base: string) => {
      const newLayer = makeEmojiLayer(base, referenceWordSize);
      setLayers((prev) => [...prev, newLayer]);
      setSelectedId(newLayer.id);
    },
    [referenceWordSize],
  );

  const addWordLayer = useCallback(() => {
    const newLayer = makeWordLayer({
      text: "טקסט חדש",
      offsetY: 100,
      style: selectedWord?.style ?? "classic",
      font: selectedWord?.font ?? "marker",
    });
    setLayers((prev) => [...prev, newLayer]);
    setSelectedId(newLayer.id);
  }, [selectedWord?.style, selectedWord?.font]);

  // Preset click — replaces the entire stack with a single word layer from
  // the preset. This matches the prior behavior where a preset "reset" the
  // editor, but now explicitly means: wipe and start from this preset.
  const applyTemplate = useCallback((t: TemplateDef) => {
    const newLayer = makeWordLayer({
      text: t.text,
      style: t.style,
      font: t.font,
      rotation: t.rotation ?? 0,
    });
    setLayers([newLayer]);
    setSelectedId(newLayer.id);
    setNotice("");
  }, []);

  // ---------- Render pipeline (for download + share) ----------
  const renderCurrent = useCallback(async () => {
    const shouldWatermark = !(status?.hasPaid === true);
    return generateTextSticker({ layers, watermark: shouldWatermark });
  }, [layers, status?.hasPaid]);

  // Filename and gallery label — use the first word layer's text if any,
  // else the first emoji's preview, else a safe fallback.
  const primaryLabel = useMemo(() => {
    const w = layers.find((l) => l.type === "word");
    if (w && w.text.trim()) return w.text.trim();
    const e = layers.find((l) => l.type === "emoji");
    if (e) return e.base;
    return "sticker";
  }, [layers]);

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
      downloadBlob(blob, `madbeka-${primaryLabel}.webp`);
      void saveToGallery(blob, primaryLabel);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "משהו השתבש בהורדה.");
    } finally {
      setWorking(null);
    }
  }, [isSignedIn, renderCurrent, primaryLabel]);

  const onShare = useCallback(async () => {
    setWorking("share");
    setNotice("");
    try {
      const blob = await renderCurrent();
      void saveToGallery(blob, primaryLabel);
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
  }, [renderCurrent, primaryLabel]);

  // ---------- Drag handlers (hit test + drag offset per layer) ----------
  const dragStart = useRef<{
    id: string;
    pointerX: number;
    pointerY: number;
    startX: number;
    startY: number;
    scale: number;
  } | null>(null);

  const onPointerDownCanvas = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      const scale = rect.width > 0 ? 512 / rect.width : 1;
      // Pointer coords in canvas 512-space with origin at CENTER.
      const cx = (e.clientX - rect.left) * scale - 256;
      const cy = (e.clientY - rect.top) * scale - 256;

      // Hit-test TOP-DOWN (last array index = visually on top = wins first).
      for (let i = layers.length - 1; i >= 0; i--) {
        const l = layers[i];
        const dx = cx - l.offsetX;
        const dy = cy - l.offsetY;
        let hit = false;
        if (l.type === "emoji") {
          const half = l.size / 2 + 8;
          hit = Math.abs(dx) <= half && Math.abs(dy) <= half;
        } else {
          const { halfW, halfH } = wordLayerHalfExtent(l);
          hit = Math.abs(dx) <= halfW && Math.abs(dy) <= halfH;
        }
        if (hit) {
          setSelectedId(l.id);
          dragStart.current = {
            id: l.id,
            pointerX: e.clientX,
            pointerY: e.clientY,
            startX: l.offsetX,
            startY: l.offsetY,
            scale,
          };
          el.setPointerCapture(e.pointerId);
          return;
        }
      }
      // Empty-space click: do nothing. Keeps current selection, no drag.
    },
    [layers],
  );

  const onPointerMoveCanvas = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const start = dragStart.current;
      if (!start) return;
      const dx = (e.clientX - start.pointerX) * start.scale;
      const dy = (e.clientY - start.pointerY) * start.scale;
      const clamp = (v: number) => Math.max(-256, Math.min(256, v));
      updateLayer(start.id, {
        offsetX: clamp(start.startX + dx),
        offsetY: clamp(start.startY + dy),
      });
    },
    [updateLayer],
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

  // Font picker button style memo (shows each option in its own typeface).
  const fontButtonStyle = useMemo(
    () =>
      Object.fromEntries(
        FONT_OPTIONS.map((f) => [f.id, { fontFamily: fontStack(f.id) }]),
      ) as Record<TextStickerFont, React.CSSProperties>,
    [],
  );

  const sizeSliderMin = selectedEmoji ? 40 : 40;
  const sizeSliderMax = selectedEmoji ? 400 : 280;
  const rotSliderMin = selectedEmoji ? -180 : -45;
  const rotSliderMax = selectedEmoji ? 180 : 45;

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
            הוסף מילים ואימוג'ים, גרור כל אחד לבד, שנה גודל, זווית וצבע. שכבות בשליטה מלאה.
          </p>
        </div>

        <div className="grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-rows-1 lg:grid-cols-[96px_minmax(0,640px)_minmax(280px,1fr)] lg:overflow-hidden">
          {/* Preset rail */}
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

          {/* Live preview */}
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
              <button
                onClick={() => setZoomed(true)}
                aria-label="הגדל תצוגה"
                className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-lg shadow-md backdrop-blur transition hover:scale-105 hover:bg-white dark:bg-gray-900/90 dark:hover:bg-gray-900"
              >
                🔍
              </button>
              {selected &&
                (selected.offsetX !== 0 || selected.offsetY !== 0) && (
                  <button
                    onClick={() =>
                      patchSelected({ offsetX: 0, offsetY: 0 })
                    }
                    aria-label="מרכז את השכבה הנבחרת"
                    className="absolute right-3 top-3 flex h-10 items-center justify-center gap-1.5 rounded-full bg-white/90 px-3 text-xs font-semibold text-gray-800 shadow-md backdrop-blur transition hover:scale-105 hover:bg-white dark:bg-gray-900/90 dark:text-gray-100 dark:hover:bg-gray-900"
                  >
                    <span>🎯</span>
                    <span>מרכז נבחר</span>
                  </button>
                )}
            </div>
            <p className="text-center text-xs text-gray-500 dark:text-gray-400">
              קליק על אובייקט בתצוגה כדי לבחור אותו. גרור אותו למיקום חופשי.
            </p>

            <div className="flex flex-col gap-2">
              <Button
                onClick={onShare}
                disabled={working !== null}
                className="h-12 w-full bg-[#25D366] text-base font-semibold text-white shadow-md hover:bg-[#128C7E]"
              >
                {working === "share" ? "מכין..." : "שלח לוואטסאפ 💬"}
              </Button>
              {isSignedIn ? (
                <Button
                  onClick={onDownload}
                  disabled={working !== null}
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

          {/* Controls */}
          <div className="space-y-4 lg:h-full lg:overflow-y-auto lg:pl-1">
            {/* Layer list — shows every layer in draw order (top of list =
                front on canvas). Click to select, arrows to reorder,
                ✕ to delete. "+ מילה חדשה" adds a new word layer. */}
            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-3 flex items-center justify-between">
                <button
                  onClick={addWordLayer}
                  className="rounded-xl bg-[color:var(--brand-green)]/10 px-3 py-1.5 text-xs font-semibold text-[color:var(--brand-green-dark)] transition hover:bg-[color:var(--brand-green)]/20 dark:text-[color:var(--brand-green)]"
                >
                  + מילה חדשה
                </button>
                <label className="text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  שכבות ({layers.length})
                </label>
              </div>
              {/* Render layers TOP-FIRST (visually top = front = last array
                  index). Makes the list feel like a Photoshop layer stack. */}
              <div className="space-y-1.5">
                {[...layers]
                  .map((l, idx) => ({ l, idx }))
                  .reverse()
                  .map(({ l, idx }) => {
                    const isSelected = l.id === selectedId;
                    const atFront = idx === layers.length - 1;
                    const atBack = idx === 0;
                    return (
                      <div
                        key={l.id}
                        className={`flex items-center gap-1.5 rounded-xl border p-1.5 transition ${
                          isSelected
                            ? "border-[color:var(--brand-green)] bg-[color:var(--brand-green)]/10"
                            : "border-gray-200 bg-gray-50 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800"
                        }`}
                      >
                        <button
                          onClick={() => deleteLayer(l.id)}
                          title="מחק שכבה"
                          aria-label="מחק שכבה"
                          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-xs text-gray-500 transition hover:border-red-400 hover:bg-red-50 hover:text-red-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"
                        >
                          ✕
                        </button>
                        <button
                          onClick={() => moveLayer(l.id, "back")}
                          disabled={atBack}
                          title="הזז אחורה"
                          aria-label="הזז אחורה"
                          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-xs text-gray-600 transition hover:border-gray-400 disabled:cursor-not-allowed disabled:opacity-30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => moveLayer(l.id, "front")}
                          disabled={atFront}
                          title="הבא קדימה"
                          aria-label="הבא קדימה"
                          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-xs text-gray-600 transition hover:border-gray-400 disabled:cursor-not-allowed disabled:opacity-30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => setSelectedId(l.id)}
                          className="flex min-w-0 flex-1 items-center justify-end gap-2 overflow-hidden rounded-lg px-2 py-1 text-right"
                        >
                          <span
                            className="truncate text-sm font-semibold text-gray-800 dark:text-gray-100"
                            style={
                              l.type === "word"
                                ? { fontFamily: fontStack(l.font) }
                                : undefined
                            }
                          >
                            {layerPreview(l)}
                          </span>
                          <span className="flex-shrink-0 text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                            {l.type === "word" ? "מילה" : "אימוג'י"}
                          </span>
                        </button>
                      </div>
                    );
                  })}
              </div>
            </section>

            {/* Selected WORD controls */}
            {selectedWord && (
              <>
                <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                  <label className="mb-2 block text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    טקסט של המילה הנבחרת
                  </label>
                  <input
                    value={selectedWord.text}
                    onChange={(e) => patchSelected({ text: e.target.value })}
                    maxLength={30}
                    placeholder="למשל: יום הולדת שמח"
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-right text-base font-medium text-gray-900 focus:border-[color:var(--brand-green)] focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-green)]/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-50"
                    dir="rtl"
                  />
                  <div className="mt-1 text-left text-[10px] text-gray-400">
                    {selectedWord.text.length}/30
                  </div>
                </section>

                <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                  <label className="mb-3 block text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    פונט
                  </label>
                  <div className="flex flex-wrap justify-end gap-2">
                    {FONT_OPTIONS.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => patchSelected({ font: f.id })}
                        style={fontButtonStyle[f.id]}
                        className={`rounded-xl border px-4 py-2.5 text-base font-bold transition-all ${
                          selectedWord.font === f.id
                            ? "border-[color:var(--brand-green)] bg-[color:var(--brand-green)]/10 text-[color:var(--brand-green-dark)] shadow-sm dark:text-[color:var(--brand-green)]"
                            : "border-gray-300 bg-white text-gray-800 hover:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </section>

                <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                  <label className="mb-3 block text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    צבע
                  </label>
                  <div className="flex flex-wrap justify-end gap-2">
                    {STYLE_OPTIONS.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          // Styles with strong personality (graffiti,
                          // bubble, pastel, handwriting) also need a
                          // matching typeface to feel authentic. Auto-
                          // switch the font when the style prefers one.
                          // The user can still override afterwards via
                          // the font picker.
                          const prefFont = STYLE_PREFERRED_FONT[s.id];
                          if (prefFont && prefFont !== selectedWord.font) {
                            patchSelected({ style: s.id, font: prefFont });
                          } else {
                            patchSelected({ style: s.id });
                          }
                        }}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-all ${
                          selectedWord.style === s.id
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
              </>
            )}

            {/* Selected EMOJI controls — skin tone palette when supported */}
            {selectedEmoji && (
              <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-2xl leading-none">
                    {layerPreview(selectedEmoji)}
                  </div>
                  <label className="text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    אימוג׳י נבחר
                  </label>
                </div>
                {selectedEmojiSupportsSkin ? (
                  <div className="flex items-center justify-end gap-2">
                    <div className="flex gap-1.5 rounded-xl border border-gray-200 bg-gray-50 p-1.5 dark:border-gray-700 dark:bg-gray-800">
                      {SKIN_TONE_OPTIONS.map((opt) => (
                        <button
                          key={opt.id || "default"}
                          onClick={() => patchSelected({ skin: opt.id })}
                          title={opt.label}
                          aria-label={opt.label}
                          className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-110 ${
                            selectedEmoji.skin === opt.id
                              ? "border-[color:var(--brand-green)] ring-2 ring-[color:var(--brand-green)]/30 scale-110"
                              : "border-white dark:border-gray-600"
                          }`}
                          style={{ backgroundColor: opt.swatch }}
                        />
                      ))}
                    </div>
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                      גוון עור
                    </label>
                  </div>
                ) : (
                  <p className="text-right text-[11px] text-gray-400">
                    לאימוג'י זה אין אפשרות לשנות גוון עור.
                  </p>
                )}
              </section>
            )}

            {/* Size + rotation for the SELECTED layer. Ranges depend on
                layer type. Also alignment when the selection is a word. */}
            {selected && (
              <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                        {selected.size}px
                      </span>
                      <label className="text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        גודל {selected.type === "word" ? "המילה" : "האימוג׳י"}
                      </label>
                    </div>
                    <input
                      type="range"
                      min={sizeSliderMin}
                      max={sizeSliderMax}
                      step="4"
                      value={selected.size}
                      onChange={(e) =>
                        patchSelected({ size: Number(e.target.value) })
                      }
                      dir="rtl"
                      className="w-full accent-[color:var(--brand-green)]"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                        {selected.rotation}°
                      </span>
                      <label className="text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        זווית {selected.type === "word" ? "המילה" : "האימוג׳י"}
                      </label>
                    </div>
                    <input
                      type="range"
                      min={rotSliderMin}
                      max={rotSliderMax}
                      step="1"
                      value={selected.rotation}
                      onChange={(e) =>
                        patchSelected({ rotation: Number(e.target.value) })
                      }
                      dir="rtl"
                      className="w-full accent-[color:var(--brand-green)]"
                    />
                    <div className="mt-1 flex justify-between text-[10px] text-gray-400">
                      <span>{rotSliderMin}°</span>
                      <button
                        onClick={() => patchSelected({ rotation: 0 })}
                        className="text-[color:var(--brand-green-dark)] hover:underline dark:text-[color:var(--brand-green)]"
                      >
                        איפוס
                      </button>
                      <span>+{rotSliderMax}°</span>
                    </div>
                  </div>

                  {selectedWord && (
                    <div>
                      <label className="mb-2 block text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                        יישור
                      </label>
                      <div className="flex justify-end gap-2">
                        {ALIGN_OPTIONS.map((a) => (
                          <button
                            key={a.id}
                            onClick={() => patchSelected({ align: a.id })}
                            className={`flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
                              selectedWord.align === a.id
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
                  )}
                </div>
              </section>
            )}

            {/* Emoji picker — ADDS a new emoji layer on click. Always
                visible so user can keep stacking more emojis. */}
            <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <label className="mb-3 block text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                הוסף אימוג׳י
              </label>
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
                          onClick={() => addEmojiLayer(e)}
                          className="flex aspect-square items-center justify-center rounded-xl border border-gray-200 bg-white text-2xl transition-all hover:-translate-y-0.5 hover:border-[color:var(--brand-green)]/50 hover:shadow-md dark:border-gray-800 dark:bg-gray-800"
                        >
                          {e}
                        </button>
                      ),
                    )}
                  </div>
                  <p className="mt-3 text-right text-[10px] text-gray-400">
                    הקלקה מוסיפה שכבת אימוג׳י חדשה — אפשר להוסיף כמה שתרצה
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* Full-screen zoom modal */}
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

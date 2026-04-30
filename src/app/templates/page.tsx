"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { UserButton, useAuth, SignUpButton } from "@clerk/nextjs";
import {
  ArrowRight,
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  Hand,
  Image as ImageIcon,
  Layers,
  Maximize2,
  Palette,
  Pencil,
  Plus,
  Redo2,
  RotateCw,
  Ruler,
  Send,
  Smile,
  Sparkles,
  Sticker as StickerIcon,
  Trash2,
  Type as TypeIcon,
  Undo2,
  X,
} from "lucide-react";
import { Header } from "@/components/Header";
import { BrutalButton } from "@/components/BrutalButton";
import {
  defaultEmojiSize,
  EMOJI_CATEGORIES,
  FONT_OPTIONS,
  fontStack,
  generateTextSticker,
  imageLayerDimensions,
  paintPreview,
  SKIN_TONE_EMOJIS,
  SKIN_TONE_OPTIONS,
  STYLE_PREFERRED_FONT,
  TEMPLATES,
  wordLayerHalfExtent,
  type EmojiLayer,
  type ImageLayer,
  type StickerLayer,
  type TemplateDef,
  type TextStickerAlign,
  type TextStickerFont,
  type TextStickerStyle,
  type WordLayer,
} from "@/lib/text-sticker";
import { downloadBlob, shareStickerToWhatsApp } from "@/lib/sticker-utils";
import { saveToGallery } from "@/lib/sticker-gallery";
import { isNativeAndroid, addPackToWhatsApp } from "@/lib/native";
import {
  buildPackFromGallery,
  stickersNeededForPack,
} from "@/lib/whatsapp-pack";
import { PaywallModal } from "@/components/PaywallModal";
import { PaymentSuccessModal } from "@/components/PaymentSuccessModal";
import { BgRemovalLoadingModal, type BgRemovalStage } from "@/components/BgRemovalLoadingModal";
import { useToast } from "@/components/Toast";

interface UserStatus {
  hasPaid: boolean;
  canCreate: boolean;
  freeRemaining: number;
}

const STYLE_OPTIONS: {
  id: TextStickerStyle;
  label: string;
  swatch: string;
}[] = [
  { id: "classic", label: "קלאסי", swatch: "#FFFFFF" },
  { id: "black", label: "שחור", swatch: "#0F0E0C" },
  { id: "green", label: "ירוק", swatch: "#25D366" },
  { id: "sunset", label: "שקיעה", swatch: "#FF6B3D" },
  { id: "night", label: "לילה", swatch: "#7C3AED" },
  { id: "bubble", label: "בועה 3D", swatch: "#FF6EB5" },
  { id: "graffiti", label: "גרפיטי", swatch: "#FF2D95" },
  { id: "neon", label: "נאון", swatch: "#00F5FF" },
  { id: "pastel", label: "פסטל", swatch: "#FFC5E3" },
  { id: "handwriting", label: "כתב יד", swatch: "#1E293B" },
];

const ALIGN_OPTIONS: { id: TextStickerAlign; label: string }[] = [
  { id: "right", label: "ימין" },
  { id: "center", label: "מרכז" },
  { id: "left", label: "שמאל" },
];

const DEFAULT_WORD_SIZE = 160;
const DEFAULT_EMOJI_OFFSET_Y = -130;
const CANVAS_TILT = -1.5; // degrees — gives the canvas its "stuck on the wall" feel
const SHADOW_DEPTH = 8;   // px — the signature hard offset shadow on the canvas

// Stable ID generator. Using crypto.randomUUID when available, fallback to a
// counter for SSR robustness.
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

function makeImageLayer(
  src: string,
  naturalWidth: number,
  naturalHeight: number,
): ImageLayer {
  return {
    id: uid("img"),
    type: "image",
    src,
    aspectRatio: naturalWidth / Math.max(1, naturalHeight),
    size: 320,
    rotation: 0,
    offsetX: 0,
    offsetY: 0,
  };
}

function layerPreview(layer: StickerLayer): string {
  if (layer.type === "emoji") {
    return layer.skin && SKIN_TONE_EMOJIS.has(layer.base)
      ? layer.base + layer.skin
      : layer.base;
  }
  if (layer.type === "image") {
    return "🖼️";
  }
  return layer.text || "טקסט";
}

function layerTypeLabel(layer: StickerLayer): string {
  if (layer.type === "emoji") return "אימוג'י";
  if (layer.type === "image") return "תמונה";
  return "מילה";
}

export default function TemplatesPage() {
  const { isSignedIn, isLoaded } = useAuth();

  // ---------- State ----------
  const [layers, setLayers] = useState<StickerLayer[]>(() => [makeWordLayer()]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [status, setStatus] = useState<UserStatus | null>(null);
  const [working, setWorking] = useState<"download" | "share" | null>(null);
  const [notice, setNotice] = useState("");
  const [zoomed, setZoomed] = useState(false);
  const [openEmojiCat, setOpenEmojiCat] = useState<string | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [bgRemovalStage, setBgRemovalStage] = useState<BgRemovalStage | null>(null);
  const { success: toastSuccess, error: toastError, info: toastInfo, warning: toastWarning } = useToast();

  // Post-share / post-download instructions modal. WhatsApp doesn't expose
  // a "send as sticker" web intent, so we always end up sending a .webp
  // attachment which the user has to long-press → "Add to Stickers". The
  // modal walks through the platform-specific steps so it doesn't feel like
  // an "ואז ואז ואז" experience.
  const [postActionModal, setPostActionModal] = useState<
    | { kind: "shared" }
    | { kind: "fallback" }
    | { kind: "downloaded" }
    | { kind: "added-to-pack" }
    | { kind: "needs-more"; missing: number }
    | null
  >(null);

  // Native (Capacitor / Android) feature gate. Detected on mount so SSR
  // produces the same HTML as the first client render — Capacitor
  // injects its globals before our React bundle hydrates.
  const [isNative, setIsNative] = useState(false);
  useEffect(() => {
    setIsNative(isNativeAndroid());
  }, []);

  const previewRef = useRef<HTMLCanvasElement | null>(null);
  const zoomRef = useRef<HTMLCanvasElement | null>(null);
  const imageCache = useRef<Map<string, HTMLImageElement>>(new Map());
  const [imageTick, setImageTick] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Keep selectedId valid.
  useEffect(() => {
    if (!layers.length) return;
    if (!selectedId || !layers.some((l) => l.id === selectedId)) {
      setSelectedId(layers[layers.length - 1].id);
    }
  }, [layers, selectedId]);

  const selected = useMemo(
    () => layers.find((l) => l.id === selectedId) ?? null,
    [layers, selectedId],
  );
  const selectedWord = selected?.type === "word" ? selected : null;
  const selectedEmoji = selected?.type === "emoji" ? selected : null;
  const selectedImage = selected?.type === "image" ? selected : null;
  const selectedEmojiSupportsSkin =
    !!selectedEmoji && SKIN_TONE_EMOJIS.has(selectedEmoji.base);

  const referenceWordSize =
    layers.find((l) => l.type === "word")?.size ?? DEFAULT_WORD_SIZE;

  // Repaint preview canvas(es) whenever any layer changes.
  useEffect(() => {
    const shouldWatermark = !(status?.hasPaid === true);
    const opts = {
      layers,
      watermark: shouldWatermark,
      imageCache: imageCache.current,
    };
    if (previewRef.current) paintPreview(previewRef.current, opts);
    if (zoomRef.current) paintPreview(zoomRef.current, opts);
  }, [layers, status?.hasPaid, zoomed, imageTick]);

  // Close zoom with Escape.
  useEffect(() => {
    if (!zoomed) return;
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && setZoomed(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zoomed]);

  // Detect ?paid=1 from Lemon Squeezy success_url redirect.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("paid") === "1") {
      setShowPaymentSuccess(true);
      // Refresh user status so watermark disappears immediately
      if (isSignedIn) {
        fetch("/api/stickers/me").then(async (r) => {
          if (r.ok) {
            const data = await r.json() as UserStatus;
            setStatus(data);
          }
        }).catch(() => {});
      }
    }
  }, [isSignedIn]);

  // Load user status.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!isSignedIn) {
        if (!cancelled) setStatus(null);
        return;
      }
      try {
        const res = await fetch("/api/stickers/me");
        // 401 (signed-out) is the steady-state for anonymous visitors —
        // not an error worth logging. Other failures (5xx, network) are.
        if (res.status === 401) return;
        if (!res.ok) {
          console.warn("[stickers/me] non-OK response:", res.status);
          return;
        }
        const data = (await res.json()) as UserStatus;
        if (!cancelled) setStatus(data);
      } catch (err) {
        console.warn("[stickers/me] fetch failed:", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  // ---------- Layer mutations ----------
  type LayerPatch = Partial<WordLayer> &
    Partial<EmojiLayer> &
    Partial<ImageLayer>;

  const updateLayer = useCallback((id: string, patch: LayerPatch) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? ({ ...l, ...patch } as StickerLayer) : l)),
    );
  }, []);

  const patchSelected = useCallback(
    (patch: LayerPatch) => {
      if (!selectedId) return;
      updateLayer(selectedId, patch);
    },
    [selectedId, updateLayer],
  );

  const deleteLayer = useCallback((id: string) => {
    setLayers((prev) => {
      const next = prev.filter((l) => l.id !== id);
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

  // ---------- Image input ----------
  const openImagePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const ingestImageFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setNotice("הקובץ חייב להיות תמונה.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toastWarning("תמונה גדולה מדי — מקסימום 10MB", "נסה תמונה קטנה יותר.");
      setNotice("התמונה גדולה מדי. מקסימום 10MB.");
      return;
    }
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(reader.error);
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.readAsDataURL(file);
      });

      const img = new (window.Image as typeof window.Image)();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("image decode failed"));
        img.src = dataUrl;
      });

      const newLayer = makeImageLayer(
        dataUrl,
        img.naturalWidth,
        img.naturalHeight,
      );
      imageCache.current.set(newLayer.id, img);
      setLayers((prev) => [newLayer, ...prev]);
      setSelectedId(newLayer.id);
      setImageTick((t) => t + 1);
      setNotice("");
    } catch (err) {
      console.error("[image-ingest] failed:", err);
      setNotice("לא הצלחנו לטעון את התמונה. נסה תמונה אחרת.");
    }
  }, [toastWarning]);

  const handleImageFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (file) await ingestImageFile(file);
    },
    [ingestImageFile],
  );

  // Drag-drop on the canvas preview.
  const [isDragging, setIsDragging] = useState(false);
  const onDragEnterCanvas = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes("Files")) {
      e.preventDefault();
      setIsDragging(true);
    }
  }, []);
  const onDragOverCanvas = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes("Files")) {
      e.preventDefault();
    }
  }, []);
  const onDragLeaveCanvas = useCallback((e: React.DragEvent) => {
    if (e.currentTarget === e.target) setIsDragging(false);
  }, []);
  const onDropCanvas = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = Array.from(e.dataTransfer.files).find((f) =>
        f.type.startsWith("image/"),
      );
      if (file) await ingestImageFile(file);
    },
    [ingestImageFile],
  );

  // Clipboard paste.
  useEffect(() => {
    const onPaste = async (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA")
      ) {
        return;
      }
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            await ingestImageFile(file);
            return;
          }
        }
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [ingestImageFile]);

  // Background removal (browser-side WASM, no server).
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const removeBackgroundFromSelected = useCallback(async () => {
    // Resolve the target image: prefer the currently selected layer,
    // fall back to the topmost image layer in the stack. This makes the
    // "Remove background" action forgiving — users instinctively click it
    // after uploading without first selecting the layer in the sidebar.
    let target = selectedImage;
    if (!target) {
      const fallback = [...layers]
        .reverse()
        .find((l): l is ImageLayer => l.type === "image");
      if (fallback) {
        target = fallback;
        setSelectedId(fallback.id);
      }
    }
    console.log("[bg-removal] click", {
      hasSelectedImage: !!selectedImage,
      resolvedTarget: target?.id ?? null,
      layerCount: layers.length,
    });
    if (!target) {
      setNotice("אין תמונה. העלה תמונה קודם, ואז לחץ על 'הסר רקע'.");
      return;
    }
    setIsRemovingBg(true);
    setBgRemovalStage(1);
    setNotice("");
    try {
      console.log("[bg-removal] importing @imgly/background-removal...");
      setBgRemovalStage(2);
      const { removeBackground } = await import("@imgly/background-removal");
      // Decode data: URLs locally instead of round-tripping through fetch().
      // CSP `connect-src` doesn't allow `data:` (and we don't want to add
      // it — it'd defeat the protection), so a fetch() call on a base64
      // data URL throws "Refused to connect". This branch handles both
      // data: URLs (post-paste / post-bg-removal layers) and blob: URLs
      // (fresh uploads via createObjectURL) without ever touching fetch.
      console.log("[bg-removal] preparing blob from", target.src.slice(0, 30));
      let inputBlob: Blob;
      if (target.src.startsWith("data:")) {
        const commaIdx = target.src.indexOf(",");
        const header = target.src.slice(5, commaIdx); // strip "data:"
        const isBase64 = header.endsWith(";base64");
        const mime = isBase64 ? header.slice(0, -7) : header;
        const payload = target.src.slice(commaIdx + 1);
        if (isBase64) {
          const binary = atob(payload);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          inputBlob = new Blob([bytes], { type: mime || "image/png" });
        } else {
          inputBlob = new Blob([decodeURIComponent(payload)], {
            type: mime || "text/plain",
          });
        }
      } else {
        // blob:/http(s) URLs — fetch is allowed and necessary.
        inputBlob = await (await fetch(target.src)).blob();
      }
      console.log("[bg-removal] running model on blob size", inputBlob.size);
      setBgRemovalStage(3);
      const resultBlob = await removeBackground(inputBlob);
      console.log("[bg-removal] success, output size", resultBlob.size);
      setBgRemovalStage(4);

      const newDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(reader.error);
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.readAsDataURL(resultBlob);
      });

      const newImg = new (window.Image as typeof window.Image)();
      await new Promise<void>((resolve, reject) => {
        newImg.onload = () => resolve();
        newImg.onerror = () => reject(new Error("decode failed"));
        newImg.src = newDataUrl;
      });

      imageCache.current.set(target.id, newImg);
      updateLayer(target.id, { src: newDataUrl });
      setImageTick((t) => t + 1);
      toastSuccess("הרקע הוסר בהצלחה!");
      setNotice("");
    } catch (err) {
      // Surface the underlying error in DevTools — the user-facing notice
      // is intentionally generic, but without this log we have no way to
      // tell whether it's CSP, network, WASM, or a model-format issue.
      console.error("[bg-removal] failed:", err);
      toastError("לא הצלחנו להסיר את הרקע.", "נסה תמונה אחרת.");
      setNotice("לא הצלחנו להסיר את הרקע. נסה תמונה אחרת.");
    } finally {
      setIsRemovingBg(false);
      setBgRemovalStage(null);
    }
  }, [selectedImage, selectedId, layers.length, updateLayer, toastSuccess, toastError]);

  // Preset click — wipes the stack and seeds with one word layer.
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

  // ---------- Render pipeline ----------
  const renderCurrent = useCallback(async () => {
    const shouldWatermark = !(status?.hasPaid === true);
    return generateTextSticker({
      layers,
      watermark: shouldWatermark,
      imageCache: imageCache.current,
    });
  }, [layers, status?.hasPaid]);

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
        setWorking(null);
        toastInfo("סיימת את 3 החינמיים", "שדרג להמשיך · ₪29 חד פעמי.");
        setShowPaywall(true);
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
      setPostActionModal({ kind: "downloaded" });
    } catch (err) {
      console.error("[download] failed:", err);
      toastError("ההורדה נכשלה", err instanceof Error ? err.message : "נסה שוב.");
      setNotice(err instanceof Error ? err.message : "משהו השתבש בהורדה.");
    } finally {
      setWorking(null);
    }
  }, [isSignedIn, renderCurrent, primaryLabel, toastInfo, toastError]);

  /**
   * Native-only: bundle the user's gallery into a WhatsApp sticker pack
   * and ask WhatsApp to add it. Hidden behind {@link isNative} — on the
   * web this code path is unreachable and the JS tree-shakes cleanly.
   *
   * The current sticker (whatever's on the canvas) is saved to gallery
   * first so it ends up in the pack we're about to ship.
   */
  const onAddToWhatsAppPack = useCallback(async () => {
    setWorking("share");
    setNotice("");
    try {
      // Make sure the in-progress sticker is actually in the gallery
      // before we count — otherwise users hit "needs more" right after
      // creating their third one.
      const blob = await renderCurrent();
      await saveToGallery(blob, primaryLabel);

      const missing = await stickersNeededForPack();
      if (missing > 0) {
        setPostActionModal({ kind: "needs-more", missing });
        return;
      }

      const pack = await buildPackFromGallery({
        // One pack per device for now. The id has to be stable across
        // re-adds so WhatsApp updates the existing pack rather than
        // creating duplicates.
        packId: "madbeka-default",
        packName: "המדבקות שלי",
      });
      if (!pack) {
        setPostActionModal({ kind: "needs-more", missing: 1 });
        return;
      }

      const result = await addPackToWhatsApp(pack);
      if (result.status === "added") {
        setPostActionModal({ kind: "added-to-pack" });
      } else if (result.status === "cancelled") {
        // user dismissed WhatsApp's confirmation dialog — stay quiet.
      } else {
        console.error("[whatsapp-pack] add failed:", result.message);
        setNotice(result.message || "ההוספה ל-WhatsApp נכשלה. נסה שוב.");
      }
    } catch (err) {
      console.error("[whatsapp-pack] failed:", err);
      setNotice("ההוספה ל-WhatsApp נכשלה. נסה שוב.");
    } finally {
      setWorking(null);
    }
  }, [renderCurrent, primaryLabel]);

  const onShare = useCallback(async () => {
    setWorking("share");
    setNotice("");
    try {
      const blob = await renderCurrent();
      void saveToGallery(blob, primaryLabel);
      const result = await shareStickerToWhatsApp(blob);
      if (result === "shared") {
        toastSuccess("המדבקה מוכנה!", "עכשיו פתח ב-WhatsApp ושמור אותה כמדבקה.");
        setPostActionModal({ kind: "shared" });
      } else if (result === "fallback") {
        setPostActionModal({ kind: "fallback" });
      } else if (result === "unsupported") {
        toastError("שיתוף נכשל — נסה שוב או הורד את הקובץ ישירות.", undefined);
        setNotice("הדפדפן לא תומך בשיתוף ישיר. נסה להוריד ולשתף ידנית.");
      }
      // "cancelled" → user dismissed share sheet; stay quiet, no modal.
    } catch (err) {
      console.error("[share] failed:", err);
      toastError("שיתוף נכשל — נסה שוב או הורד את הקובץ ישירות.");
      setNotice("השיתוף נכשל. נסה שוב.");
    } finally {
      setWorking(null);
    }
  }, [renderCurrent, primaryLabel, toastSuccess, toastError]);

  // ---------- Drag handlers (canvas hit-test → drag layer) ----------
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
      const cx = (e.clientX - rect.left) * scale - 256;
      const cy = (e.clientY - rect.top) * scale - 256;

      for (let i = layers.length - 1; i >= 0; i--) {
        const l = layers[i];
        const dx = cx - l.offsetX;
        const dy = cy - l.offsetY;
        let hit = false;
        if (l.type === "emoji") {
          const half = l.size / 2 + 8;
          hit = Math.abs(dx) <= half && Math.abs(dy) <= half;
        } else if (l.type === "image") {
          const { width, height } = imageLayerDimensions(l);
          hit =
            Math.abs(dx) <= width / 2 + 4 && Math.abs(dy) <= height / 2 + 4;
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
        /* already released */
      }
    },
    [],
  );

  // Per-type slider ranges.
  const sizeSliderMin = selectedImage ? 80 : 40;
  const sizeSliderMax = selectedImage ? 500 : selectedEmoji ? 400 : 280;
  const rotSliderMin = selectedWord ? -45 : -180;
  const rotSliderMax = selectedWord ? 45 : 180;

  const HARD_SHADOW = `${SHADOW_DEPTH}px ${SHADOW_DEPTH + 1}px 0 var(--ink)`;
  const SHADOW_4 = "4px 5px 0 var(--ink)";
  const SHADOW_3 = "3px 4px 0 var(--ink)";
  const SHADOW_2 = "2px 3px 0 var(--ink)";

  const fontButtonStyle = useMemo(
    () =>
      Object.fromEntries(
        FONT_OPTIONS.map((f) => [f.id, { fontFamily: fontStack(f.id) }]),
      ) as Record<TextStickerFont, React.CSSProperties>,
    [],
  );

  return (
    <div
      dir="rtl"
      className="relative min-h-screen text-ink"
      style={{
        background: "var(--cream)",
        backgroundImage: `
          radial-gradient(circle at 18% 20%, #ffd9ec 0, transparent 22%),
          radial-gradient(circle at 82% 18%, #c8f5dd 0, transparent 22%),
          radial-gradient(circle at 88% 82%, #c5e6ff 0, transparent 22%),
          radial-gradient(circle at 12% 80%, #ffe0c2 0, transparent 22%)
        `,
        fontFamily: "'Assistant', system-ui, sans-serif",
      }}
    >
      {/* Unified sticky header — logo + auth */}
      <Header variant="minimal" />

      {/* Editor toolbar — back nav + action buttons */}
      <div
        className="sticky top-16 z-10 border-b"
        style={{
          background: "var(--cream)",
          borderColor: "hsl(var(--border-soft))",
        }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between h-14 px-4 sm:px-6 lg:px-8">
          {/* Back */}
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-bold press-active"
            style={{ color: "var(--ink)" }}
          >
            <ArrowRight size={16} />
            חזור
          </Link>

          {/* Center nav */}
          <div className="hidden md:flex items-center gap-5 text-sm font-bold" style={{ color: "var(--ink)", opacity: 0.65 }}>
            <Link href="/#how" className="hover:opacity-100 transition-opacity">איך זה עובד</Link>
            <Link href="/#pricing" className="hover:opacity-100 transition-opacity">מחיר</Link>
          </div>

          {/* Right: undo / redo + download + share + user */}
          <div className="flex items-center gap-2">
            <Chip aria-label="ביטול" disabled>
              <Undo2 size={16} />
            </Chip>
            <Chip aria-label="ביצוע מחדש" disabled>
              <Redo2 size={16} />
            </Chip>
            {isSignedIn ? (
              <PlayfulBtn
                onClick={onDownload}
                disabled={working !== null}
                kind="ghost"
                icon={<Download size={15} />}
              >
                {working === "download" ? "מוריד..." : "הורד"}
              </PlayfulBtn>
            ) : (
              <SignUpButton mode="modal">
                <PlayfulBtn kind="ghost" icon={<Download size={15} />}>
                  הירשם והורד
                </PlayfulBtn>
              </SignUpButton>
            )}
            {isNative ? (
              <PlayfulBtn
                onClick={onAddToWhatsAppPack}
                disabled={working !== null}
                kind="primary"
                icon={<StickerIcon size={15} />}
              >
                {working === "share" ? "מוסיף..." : "הוסף למדבקות"}
              </PlayfulBtn>
            ) : (
              <PlayfulBtn
                onClick={onShare}
                disabled={working !== null}
                kind="primary"
                icon={<Send size={15} />}
              >
                {working === "share" ? "מכין..." : "שלח לוואטסאפ"}
              </PlayfulBtn>
            )}
            {isLoaded && isSignedIn && (
              <div className="ms-1">
                <UserButton />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* hand-drawn squiggles, decorative only */}
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 h-full w-full"
        style={{ opacity: 0.22 }}
      >
        <path
          d="M -50 200 Q 100 150, 220 220 T 470 200"
          stroke="var(--ink)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 800 640 Q 920 580, 1060 640 T 1330 620"
          stroke="var(--ink)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
      </svg>

      <main className="relative z-10 mx-auto max-w-7xl overflow-x-clip px-6 py-6 lg:px-8">

        {/* MAIN GRID */}
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          {/* LEFT COLUMN — canvas + controls + presets */}
          <div className="flex min-w-0 flex-col gap-4">
            {/* CANVAS */}
            <div className="grid place-items-center pt-3 pb-1">
              {/* w-full ensures the rotated wrapper never shrink-fits below
                  the column width on mobile. Without it, transform creates a
                  new containing block that is only 540px wide, so the inner
                  maxWidth:"100%" resolves to 540px instead of the viewport. */}
              <div
                className="relative w-full"
                style={{ transform: `rotate(${CANVAS_TILT}deg)` }}
              >
                <div
                  onDragEnter={onDragEnterCanvas}
                  onDragOver={onDragOverCanvas}
                  onDragLeave={onDragLeaveCanvas}
                  onDrop={onDropCanvas}
                  className="checker relative mx-auto grid place-items-center"
                  style={{
                    width: 540,
                    height: 540,
                    maxWidth: "calc(100% - 8px)",
                    maxHeight: "100vw",
                    border: "4px solid var(--ink)",
                    borderRadius: 28,
                    boxShadow: HARD_SHADOW,
                  }}
                >
                  <canvas
                    ref={previewRef}
                    width={512}
                    height={512}
                    onPointerDown={onPointerDownCanvas}
                    onPointerMove={onPointerMoveCanvas}
                    onPointerUp={onPointerEndCanvas}
                    onPointerCancel={onPointerEndCanvas}
                    className="absolute inset-0 h-full w-full cursor-grab touch-none select-none active:cursor-grabbing"
                  />
                  {isDragging && (
                    <div
                      className="pointer-events-none absolute inset-0 grid place-items-center"
                      style={{
                        background: "rgba(37, 211, 102, 0.18)",
                        backdropFilter: "blur(6px)",
                      }}
                    >
                      <div
                        className="rounded-2xl bg-white px-5 py-3 text-base font-extrabold text-ink"
                        style={{
                          border: "3px solid var(--ink)",
                          boxShadow: SHADOW_4,
                        }}
                      >
                        📥 שחרר תמונה כאן
                      </div>
                    </div>
                  )}

                  {/* tape strip on top of the canvas */}
                  <div
                    aria-hidden
                    className="absolute"
                    style={{
                      top: -18,
                      left: "50%",
                      width: 130,
                      height: 36,
                      transform: "translateX(-50%) rotate(-4deg)",
                      background: "rgba(255, 235, 120, 0.85)",
                      border: "2px solid rgba(0,0,0,0.15)",
                      boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                      zIndex: 4,
                    }}
                  />

                  {/* 512×512 badge */}
                  <div
                    className="absolute"
                    style={{
                      top: 14,
                      left: 14,
                      background: "#fff",
                      border: "2.5px solid var(--ink)",
                      borderRadius: 10,
                      padding: "4px 9px",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                      fontWeight: 800,
                      boxShadow: SHADOW_2,
                    }}
                  >
                    512×512
                  </div>

                  {/* Maximize / zoom button */}
                  <button
                    onClick={() => setZoomed(true)}
                    aria-label="הגדל תצוגה"
                    className="press-active absolute grid h-[38px] w-[38px] place-items-center"
                    style={{
                      top: 14,
                      right: 14,
                      background: "#fff",
                      border: "2.5px solid var(--ink)",
                      borderRadius: 12,
                      boxShadow: SHADOW_2,
                    }}
                  >
                    <Maximize2 size={16} />
                  </button>

                  {/* Recenter selected layer button */}
                  {selected &&
                    (selected.offsetX !== 0 || selected.offsetY !== 0) && (
                      <button
                        onClick={() =>
                          patchSelected({ offsetX: 0, offsetY: 0 })
                        }
                        aria-label="מרכז את השכבה הנבחרת"
                        className="press-active absolute flex items-center gap-1.5 px-3 text-xs font-extrabold"
                        style={{
                          bottom: 14,
                          right: 14,
                          height: 36,
                          background: "#fff",
                          border: "2.5px solid var(--ink)",
                          borderRadius: 12,
                          boxShadow: SHADOW_2,
                        }}
                      >
                        🎯 <span>מרכז נבחר</span>
                      </button>
                    )}
                </div>
              </div>
            </div>

            {/* CANVAS HINT */}
            <div
              className="flex items-center justify-center gap-2 text-[13px] font-bold"
              style={{ color: "#5a4252" }}
            >
              <Hand size={14} /> גרור כל אובייקט · ↕ שנה סדר · ✕ מחק
            </div>

            {/* CONTROLS STRIP */}
            <div
              className="grid items-center gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4"
              style={{
                background: "#fff",
                border: "3px solid var(--ink)",
                borderRadius: 22,
                boxShadow: SHADOW_4,
              }}
            >
              {selected ? (
                <>
                  <RangeRow
                    icon={<Ruler size={13} />}
                    label={
                      selected.type === "word"
                        ? "גודל המילה"
                        : selected.type === "image"
                          ? "גודל התמונה"
                          : "גודל אימוג'י"
                    }
                    value={selected.size}
                    onChange={(v) => patchSelected({ size: v })}
                    min={sizeSliderMin}
                    max={sizeSliderMax}
                    unit="px"
                  />
                  <RangeRow
                    icon={<RotateCw size={13} />}
                    label={
                      selected.type === "word"
                        ? "זווית המילה"
                        : selected.type === "image"
                          ? "זווית התמונה"
                          : "זווית אימוג'י"
                    }
                    value={selected.rotation}
                    onChange={(v) => patchSelected({ rotation: v })}
                    min={rotSliderMin}
                    max={rotSliderMax}
                    unit="°"
                  />
                </>
              ) : (
                <div className="col-span-full text-center text-sm font-bold opacity-60">
                  בחר שכבה כדי לערוך גודל וזווית
                </div>
              )}

              <ChipsRow>
                <ActionChip
                  icon={<ImageIcon size={13} />}
                  label="העלאה"
                  onClick={openImagePicker}
                />
                <ActionChip
                  icon={<Camera size={13} />}
                  label="צלם"
                  onClick={openImagePicker}
                />
              </ChipsRow>
              <ChipsRow>
                <ActionChip
                  icon={<Smile size={13} />}
                  label="אימוג׳י"
                  onClick={() => {
                    const sec = document.getElementById("emoji-picker-section");
                    sec?.scrollIntoView({ behavior: "smooth", block: "start" });
                    setOpenEmojiCat((prev) => prev ?? "faces");
                  }}
                />
                <ActionChip
                  icon={<Sparkles size={13} />}
                  label={isRemovingBg ? "מסיר..." : "הסר רקע"}
                  // Enabled if there's ANY image layer in the stack — the
                  // handler falls back to the topmost image when nothing
                  // is currently selected, so we shouldn't gate on the
                  // user remembering to click the layer first.
                  disabled={!layers.some((l) => l.type === "image") || isRemovingBg}
                  onClick={removeBackgroundFromSelected}
                />
              </ChipsRow>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageFile}
                className="hidden"
              />
            </div>

            {/* PRESETS RAIL */}
            <div>
              <div
                className="mb-2.5 flex items-center gap-2 px-1 text-[14px] font-extrabold"
                style={{ letterSpacing: "-0.01em" }}
              >
                <Sparkles size={16} />
                מילים מוכנות
                <span className="text-xs font-bold" style={{ color: "#5a4252" }}>
                  · הקלק להעתקה לקנבס
                </span>
              </div>
              {/* Horizontal rail. Wrapping in a relative container with a
                  fade gradient on the trailing edge gives users a visual
                  hint that there's more content. We also keep a thin native
                  scrollbar — invisible scrollbars made the rail look like a
                  cropped row instead of a scrollable carousel. */}
              <div className="relative">
                <div
                  className="templates-rail flex gap-3 overflow-x-auto pb-3 pt-1"
                  style={{ scrollbarColor: "var(--ink) transparent" }}
                >
                  {TEMPLATES.map((t, i) => {
                  const tilt = ((i % 3) - 1) * 2.5;
                  return (
                    <button
                      key={t.id}
                      onClick={() => applyTemplate(t)}
                      className="grid flex-none place-items-center transition-transform"
                      style={{
                        width: 116,
                        height: 116,
                        background: "#fff",
                        border: "3px solid var(--ink)",
                        borderRadius: 22,
                        boxShadow: SHADOW_4,
                        transform: `rotate(${tilt}deg)`,
                        fontFamily: fontStack(t.font),
                        fontSize: 24,
                        fontWeight: 800,
                        color: "var(--ink)",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.transform = `rotate(${tilt}deg) translate(-2px, -2px)`)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.transform = `rotate(${tilt}deg)`)
                      }
                    >
                      {t.text}
                    </button>
                  );
                })}
                </div>
                {/* Fade gradient on the leading edge (LTR-right / RTL-left
                    after dir=rtl flip) — subtle visual cue that the rail
                    extends past the visible area. pointer-events-none keeps
                    cards under it clickable. */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute bottom-0 top-0 w-12"
                  style={{
                    insetInlineStart: 0,
                    background:
                      "linear-gradient(to left, transparent, var(--cream) 80%)",
                  }}
                />
              </div>
            </div>

            {notice && (
              <div
                className="rounded-2xl px-4 py-3 text-right text-xs font-bold"
                style={{
                  background: "var(--paper)",
                  border: "2.5px dashed var(--ink)",
                  color: "var(--ink)",
                }}
              >
                {notice}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN — control panel */}
          <aside
            className="flex flex-col gap-4 self-start p-5 lg:sticky lg:top-6"
            style={{
              background: "#fff",
              border: "3px solid var(--ink)",
              borderRadius: 28,
              boxShadow: HARD_SHADOW,
            }}
          >
            {/* TEXT INPUT — only when a word is selected */}
            {selectedWord && (
              <Section icon={<Pencil size={14} />} label="כתוב">
                <div
                  className="px-4 py-3.5"
                  style={{
                    background: "var(--cream)",
                    border: "2.5px solid var(--ink)",
                    borderRadius: 18,
                    boxShadow: "inset 0 -3px 0 rgba(0,0,0,0.06)",
                  }}
                >
                  <input
                    dir="rtl"
                    value={selectedWord.text}
                    maxLength={30}
                    onChange={(e) =>
                      patchSelected({ text: e.target.value })
                    }
                    placeholder="כתוב מילה..."
                    className="w-full bg-transparent text-right outline-none"
                    style={{
                      fontFamily: fontStack(selectedWord.font),
                      fontSize: 26,
                      fontWeight: 800,
                      color: "var(--ink)",
                      lineHeight: 1.2,
                    }}
                  />
                </div>
                <div
                  className="mt-1.5 flex justify-between"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    color: "#5a4252",
                  }}
                >
                  <span>{selectedWord.text.length}/30</span>
                  <span>שכבה {layers.indexOf(selectedWord) + 1} · word</span>
                </div>
              </Section>
            )}

            {/* FONT — word only */}
            {selectedWord && (
              <Section icon={<TypeIcon size={14} />} label="פונט">
                <div className="grid grid-cols-3 gap-2">
                  {FONT_OPTIONS.map((f) => {
                    const active = selectedWord.font === f.id;
                    return (
                      <button
                        key={f.id}
                        onClick={() => patchSelected({ font: f.id })}
                        className="press-active py-3 transition-colors"
                        style={{
                          background: active ? "var(--ink)" : "#fff",
                          color: active ? "#fff" : "var(--ink)",
                          border: "2.5px solid var(--ink)",
                          borderRadius: 14,
                          boxShadow: active ? "none" : SHADOW_2,
                          transform: active ? "translate(2px, 2px)" : "none",
                        }}
                      >
                        <div
                          style={{
                            ...fontButtonStyle[f.id],
                            fontSize: 22,
                            fontWeight: 800,
                            lineHeight: 1,
                          }}
                        >
                          {f.sample}
                        </div>
                        <div
                          className="mt-1 text-[10px] font-extrabold"
                          style={{ color: active ? "#fff" : "var(--ink)" }}
                        >
                          {f.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Section>
            )}

            {/* COLOR — word only */}
            {selectedWord && (
              <Section icon={<Palette size={14} />} label="צבע">
                <div className="grid grid-cols-5 gap-1.5">
                  {STYLE_OPTIONS.map((s) => {
                    const active = selectedWord.style === s.id;
                    const lightSwatch = ["classic", "pastel", "neon"].includes(
                      s.id,
                    );
                    return (
                      <button
                        key={s.id}
                        title={s.label}
                        onClick={() => {
                          const prefFont = STYLE_PREFERRED_FONT[s.id];
                          if (prefFont && prefFont !== selectedWord.font) {
                            patchSelected({ style: s.id, font: prefFont });
                          } else {
                            patchSelected({ style: s.id });
                          }
                        }}
                        className="relative aspect-square"
                        style={{
                          background: s.swatch,
                          border: "2.5px solid var(--ink)",
                          borderRadius: 12,
                          boxShadow: active ? "none" : SHADOW_2,
                          transform: active ? "translate(2px, 2px)" : "none",
                        }}
                      >
                        {active && (
                          <span
                            className="absolute inset-0 grid place-items-center"
                            style={{ color: lightSwatch ? "#000" : "#fff" }}
                          >
                            <Check size={14} strokeWidth={3} />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {/* alignment under colors so words stay grouped */}
                <div className="mt-3.5">
                  <div
                    className="mb-1.5 text-[11px] font-extrabold uppercase"
                    style={{ color: "#5a4252", letterSpacing: "0.04em" }}
                  >
                    יישור
                  </div>
                  <div className="flex justify-end gap-2">
                    {ALIGN_OPTIONS.map((a) => {
                      const active = selectedWord.align === a.id;
                      return (
                        <button
                          key={a.id}
                          onClick={() => patchSelected({ align: a.id })}
                          className="press-active px-4 py-2 text-sm font-extrabold"
                          style={{
                            background: active ? "var(--ink)" : "#fff",
                            color: active ? "#fff" : "var(--ink)",
                            border: "2.5px solid var(--ink)",
                            borderRadius: 12,
                            boxShadow: active ? "none" : SHADOW_2,
                            transform: active
                              ? "translate(2px, 2px)"
                              : "none",
                          }}
                        >
                          {a.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Section>
            )}

            {/* SKIN TONE — emoji only when capable */}
            {selectedEmoji && (
              <Section
                icon={<span className="text-base leading-none">😀</span>}
                label="אימוג׳י נבחר"
              >
                <div className="mb-2 text-2xl leading-none">
                  {layerPreview(selectedEmoji)}
                </div>
                {selectedEmojiSupportsSkin ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {SKIN_TONE_OPTIONS.map((opt) => {
                      const active = selectedEmoji.skin === opt.id;
                      return (
                        <button
                          key={opt.id || "default"}
                          onClick={() => patchSelected({ skin: opt.id })}
                          title={opt.label}
                          aria-label={opt.label}
                          className="h-7 w-7 rounded-full transition-transform hover:scale-110"
                          style={{
                            background: opt.swatch,
                            border: active
                              ? "3px solid var(--ink)"
                              : "1.5px solid var(--ink)",
                            boxShadow: active
                              ? "0 0 0 2px #fff, 0 0 0 4px var(--ink)"
                              : "none",
                            transform: active ? "scale(1.1)" : "none",
                          }}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] opacity-60">
                    לאימוג'י זה אין אפשרות לשנות גוון עור.
                  </p>
                )}
              </Section>
            )}

            {/* IMAGE — bg removal */}
            {selectedImage && (
              <Section icon={<ImageIcon size={14} />} label="תמונה נבחרת">
                <button
                  onClick={removeBackgroundFromSelected}
                  disabled={isRemovingBg}
                  className="press-active flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-extrabold"
                  style={{
                    background: "var(--wa)",
                    color: "#fff",
                    border: "2.5px solid var(--ink)",
                    borderRadius: 14,
                    boxShadow: SHADOW_4,
                    opacity: isRemovingBg ? 0.6 : 1,
                  }}
                >
                  <Sparkles size={16} />
                  {isRemovingBg ? "מסיר רקע..." : "הסר רקע אוטומטית"}
                </button>
                <p
                  className="mt-2 text-right text-[10px]"
                  style={{ color: "#5a4252" }}
                >
                  רץ במכשיר שלך — לא בענן
                </p>
              </Section>
            )}

            {/* LAYERS */}
            <Section icon={<Layers size={14} />} label={`שכבות (${layers.length})`}>
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
                        className="flex items-center gap-1.5 px-2 py-2"
                        style={{
                          background: isSelected ? "var(--cream)" : "#fff",
                          border: `2.5px solid ${isSelected ? "var(--ink)" : "#e0d6c2"}`,
                          borderRadius: 14,
                          boxShadow: isSelected ? SHADOW_2 : "none",
                        }}
                      >
                        <MiniBtn
                          aria-label="מחק שכבה"
                          onClick={() => deleteLayer(l.id)}
                        >
                          <Trash2 size={12} />
                        </MiniBtn>
                        <MiniBtn
                          aria-label="הזז אחורה"
                          disabled={atBack}
                          onClick={() => moveLayer(l.id, "back")}
                        >
                          <ChevronDown size={12} />
                        </MiniBtn>
                        <MiniBtn
                          aria-label="הבא קדימה"
                          disabled={atFront}
                          onClick={() => moveLayer(l.id, "front")}
                        >
                          <ChevronUp size={12} />
                        </MiniBtn>
                        <button
                          onClick={() => setSelectedId(l.id)}
                          className="flex min-w-0 flex-1 items-center justify-end gap-2 overflow-hidden px-2 text-right"
                        >
                          <span
                            className="truncate text-sm font-extrabold"
                            style={
                              l.type === "word"
                                ? { fontFamily: fontStack(l.font) }
                                : undefined
                            }
                          >
                            {layerPreview(l)}
                          </span>
                          <span
                            className="flex-shrink-0 text-[10px] font-extrabold uppercase"
                            style={{
                              color: "#5a4252",
                              letterSpacing: "0.04em",
                            }}
                          >
                            {layerTypeLabel(l)}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={addWordLayer}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-extrabold"
                    style={{
                      background: "var(--cream)",
                      border: "2.5px dashed var(--ink)",
                      borderRadius: 14,
                      color: "var(--ink)",
                    }}
                  >
                    <Plus size={14} /> מילה חדשה
                  </button>
                  <button
                    onClick={openImagePicker}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-extrabold"
                    style={{
                      background: "var(--cream)",
                      border: "2.5px dashed var(--ink)",
                      borderRadius: 14,
                      color: "var(--ink)",
                    }}
                  >
                    <Camera size={14} /> תמונה
                  </button>
                </div>
              </div>
            </Section>

            {/* EMOJI PICKER — adds new emoji layers */}
            <Section
              icon={<Smile size={14} />}
              label="הוסף אימוג׳י"
              id="emoji-picker-section"
            >
              <div className="flex flex-wrap justify-end gap-1.5">
                {EMOJI_CATEGORIES.map((cat) => {
                  const isOpen = openEmojiCat === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() =>
                        setOpenEmojiCat(isOpen ? null : cat.id)
                      }
                      className="press-active flex items-center gap-1 px-2.5 py-1.5 text-xs font-extrabold"
                      style={{
                        background: isOpen ? "var(--ink)" : "#fff",
                        color: isOpen ? "#fff" : "var(--ink)",
                        border: "2.5px solid var(--ink)",
                        borderRadius: 12,
                        boxShadow: isOpen ? "none" : SHADOW_2,
                        transform: isOpen ? "translate(2px, 2px)" : "none",
                      }}
                    >
                      <span className="text-base leading-none">
                        {cat.sample}
                      </span>
                      <span>{cat.label}</span>
                    </button>
                  );
                })}
              </div>
              {openEmojiCat && (
                <div
                  className="mt-3 grid grid-cols-7 gap-1.5 pt-3"
                  style={{ borderTop: "1.5px dashed var(--ink)" }}
                >
                  {EMOJI_CATEGORIES.find(
                    (c) => c.id === openEmojiCat,
                  )?.emojis.map((e, i) => (
                    <button
                      key={`${openEmojiCat}-${i}`}
                      onClick={() => addEmojiLayer(e)}
                      className="grid aspect-square place-items-center text-xl transition-transform hover:scale-110"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              )}
            </Section>
          </aside>
        </div>

        {/* ZOOM MODAL */}
        {zoomed && (
          <div
            onClick={() => setZoomed(false)}
            className="fixed inset-0 z-50 grid cursor-zoom-out place-items-center p-4"
            style={{
              background: "rgba(15,14,12,0.92)",
              backdropFilter: "blur(8px)",
            }}
            role="dialog"
            aria-modal="true"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="checker relative cursor-default overflow-hidden"
              style={{
                width: "min(90vw, 90vh)",
                height: "min(90vw, 90vh)",
                border: "3px solid var(--ink)",
                borderRadius: 28,
                boxShadow:
                  "10px 11px 0 var(--ink), 0 30px 60px rgba(0,0,0,0.5)",
              }}
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
                className="press-active absolute grid h-11 w-11 place-items-center"
                style={{
                  top: 16,
                  left: 16,
                  background: "#fff",
                  border: "2.5px solid var(--ink)",
                  borderRadius: 12,
                  boxShadow: SHADOW_3,
                }}
              >
                <X size={20} />
              </button>
            </div>
          </div>
        )}

        {/* POST-ACTION MODAL — instructions for turning the .webp file
            into an actual WhatsApp sticker, since the platform doesn't
            expose a "send as sticker" intent on the web. */}
        {postActionModal && (
          <PostActionModal
            kind={postActionModal.kind}
            missing={
              postActionModal.kind === "needs-more"
                ? postActionModal.missing
                : undefined
            }
            onClose={() => setPostActionModal(null)}
            onDownload={() => {
              setPostActionModal(null);
              void onDownload();
            }}
          />
        )}

        {/* PAYWALL MODAL */}
        {showPaywall && (
          <PaywallModal onClose={() => setShowPaywall(false)} />
        )}

        {/* PAYMENT SUCCESS MODAL */}
        {showPaymentSuccess && (
          <PaymentSuccessModal onClose={() => setShowPaymentSuccess(false)} />
        )}

        {/* BG REMOVAL LOADING MODAL */}
        {bgRemovalStage !== null && (
          <BgRemovalLoadingModal
            stage={bgRemovalStage}
            onCancel={() => {
              // We can't cancel the WASM process, but we hide the modal.
              // The process continues in background and will resolve on its own.
              setBgRemovalStage(null);
            }}
          />
        )}

        <footer
          className="mt-8 pt-6 text-center text-[11px] font-bold"
          style={{
            color: "#5a4252",
            borderTop: "1.5px dashed var(--ink)",
          }}
        >
          MadbekaApp.co.il
        </footer>
      </main>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Platform detection — used by the post-action modal to show
   iOS-vs-Android-vs-desktop instructions. Browser-only; defaults to
   "desktop" on the server.
   ──────────────────────────────────────────────────────────────── */

type Platform = "ios" | "android" | "desktop";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent || "";
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

/* ────────────────────────────────────────────────────────────────
   PostActionModal — shown after share / download.
   WhatsApp doesn't accept stickers via Web Share, so a .webp file
   ends up as an image attachment that the user has to convert in
   the WhatsApp UI. This modal walks them through the steps with
   platform-specific copy.
   ──────────────────────────────────────────────────────────────── */

function PostActionModal({
  kind,
  missing,
  onClose,
  onDownload,
}: {
  kind: "shared" | "fallback" | "downloaded" | "added-to-pack" | "needs-more";
  /** For kind === "needs-more" only — how many stickers the user is short. */
  missing?: number;
  onClose: () => void;
  onDownload: () => void;
}) {
  const [platform, setPlatform] = useState<Platform>("desktop");
  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  const headline = (() => {
    switch (kind) {
      case "shared":
        return "המדבקה נשלחה!";
      case "fallback":
        return "שולחים מהדסקטופ?";
      case "downloaded":
        return "המדבקה נשמרה במכשיר!";
      case "added-to-pack":
        return "המדבקה במאגר!";
      case "needs-more":
        return "כמעט שם!";
    }
  })();

  const subhead = (() => {
    switch (kind) {
      case "fallback":
        return "ל-WhatsApp Web אין אפשרות לשלוח מדבקות ישירות. שני פתרונות:";
      case "added-to-pack":
        return "החבילה 'המדבקות שלי' נוספה ל-WhatsApp — תיכנס לכל צ'אט, תלחץ על אייקון המדבקות, והיא שם.";
      case "needs-more":
        return `WhatsApp דורש לפחות 3 מדבקות בכל חבילה. תיצור עוד ${missing} ואז תוכל להוסיף הכל בלחיצה אחת.`;
      default:
        return "כדי שתופיע כמדבקה (ולא כתמונה רגילה) ב-WhatsApp:";
    }
  })();

  // Steps depend on both kind + platform.
  const steps: string[] = (() => {
    // Native happy paths — no instructions needed, the deed is done /
    // the user just needs to keep creating.
    if (kind === "added-to-pack" || kind === "needs-more") return [];
    if (kind === "fallback") {
      return [
        "תוריד את הקובץ ('הורד' למעלה) ושלח אותו לעצמך בוואטסאפ.",
        "במובייל, פתח את הצ'אט שאליו שלחת את הקובץ.",
        "לחץ לחיצה ארוכה על המדבקה.",
        platform === "ios"
          ? "בחר 'הוסף למועדפות' — היא תופיע במאגר המדבקות שלך."
          : "בחר 'הוסף למדבקות' — היא תופיע במאגר המדבקות שלך.",
      ];
    }
    if (kind === "downloaded") {
      if (platform === "desktop") {
        // We don't know which mobile OS the user will end up on, so the
        // last step covers both add-to-stickers vocabularies.
        return [
          "הקובץ נשמר בתיקיית ההורדות.",
          "תעביר אותו למובייל (WhatsApp Web / Drive / מייל לעצמך).",
          "במובייל: שלח את הקובץ לחבר או לעצמך בוואטסאפ.",
          "לחץ לחיצה ארוכה על המדבקה ב-WhatsApp.",
          "בחר 'הוסף למדבקות' (אנדרואיד) או 'הוסף למועדפות' (iPhone).",
        ];
      }
      return [
        "פתח WhatsApp → צ'אט → 📎 → גלריה.",
        "בחר את הקובץ madbeka-sticker.webp ושלח.",
        "לחץ לחיצה ארוכה על המדבקה ששלחת.",
        platform === "ios"
          ? "בחר 'הוסף למועדפות'."
          : "בחר 'הוסף למדבקות'.",
      ];
    }
    // kind === "shared"
    return [
      "פתח את הצ'אט שאליו שלחת את המדבקה.",
      "לחץ לחיצה ארוכה על המדבקה שקיבלת.",
      platform === "ios"
        ? "בחר 'הוסף למועדפות' — היא תיכנס למאגר המדבקות שלך."
        : "בחר 'הוסף למדבקות' — היא תיכנס למאגר המדבקות שלך.",
    ];
  })();

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 grid place-items-center p-4"
      style={{
        background: "rgba(15,14,12,0.55)",
        backdropFilter: "blur(6px)",
      }}
      role="dialog"
      aria-modal="true"
      dir="rtl"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md p-6 sm:p-7"
        style={{
          background: "var(--cream)",
          border: "3px solid var(--ink)",
          borderRadius: 26,
          boxShadow: "10px 11px 0 var(--ink)",
        }}
      >
        {/* Yellow tape strip */}
        <span
          aria-hidden
          className="absolute"
          style={{
            top: -14,
            right: "20%",
            width: 90,
            height: 24,
            transform: "rotate(-6deg)",
            background: "rgba(255,235,120,0.9)",
            border: "2px solid rgba(0,0,0,0.15)",
          }}
        />

        <button
          onClick={onClose}
          aria-label="סגור"
          className="press-active absolute grid h-9 w-9 place-items-center"
          style={{
            top: 14,
            left: 14,
            background: "#fff",
            border: "2px solid var(--ink)",
            borderRadius: 10,
            boxShadow: "3px 4px 0 var(--ink)",
          }}
        >
          <X size={16} />
        </button>

        <div
          className="mb-1 text-right"
          style={{
            fontFamily: "'Karantina', 'Heebo', sans-serif",
            fontWeight: 700,
            fontSize: 38,
            lineHeight: 1,
            letterSpacing: "-0.02em",
            color: "var(--ink)",
          }}
        >
          {headline}
        </div>
        <div
          className="mb-5 text-right text-[14px] font-bold"
          style={{ color: "#5a4252", lineHeight: 1.5 }}
        >
          {subhead}
        </div>

        <ol className="space-y-2.5 text-right">
          {steps.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span
                className="grid flex-none place-items-center text-[12px] font-extrabold"
                style={{
                  width: 26,
                  height: 26,
                  background: "var(--wa)",
                  color: "#fff",
                  border: "2px solid var(--ink)",
                  borderRadius: 8,
                  fontFamily: "'JetBrains Mono', monospace",
                  marginTop: 1,
                }}
              >
                {i + 1}
              </span>
              <span
                className="text-[14px] font-bold leading-snug"
                style={{ color: "var(--ink)" }}
              >
                {step}
              </span>
            </li>
          ))}
        </ol>

        <div className="mt-6 flex flex-wrap gap-2.5">
          {kind === "fallback" && (
            <button
              onClick={onDownload}
              className="press-active inline-flex flex-1 items-center justify-center gap-2 px-5 py-3 text-base font-extrabold"
              style={{
                background: "var(--wa)",
                color: "#fff",
                border: "2.5px solid var(--ink)",
                borderRadius: 14,
                boxShadow: "5px 6px 0 var(--ink)",
                fontFamily: "'Karantina', 'Heebo', sans-serif",
                fontSize: 22,
                minWidth: 140,
              }}
            >
              <Download size={16} />
              תורד עכשיו
            </button>
          )}
          <button
            onClick={onClose}
            className="press-active inline-flex flex-1 items-center justify-center px-5 py-3 text-sm font-extrabold"
            style={{
              background: "#fff",
              color: "var(--ink)",
              border: "2.5px solid var(--ink)",
              borderRadius: 14,
              boxShadow: "4px 5px 0 var(--ink)",
              minWidth: 120,
            }}
          >
            הבנתי
          </button>
        </div>
      </div>
    </div>
  );
}

function PlayfulBtn({
  children,
  icon,
  kind = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: React.ReactNode;
  kind?: "primary" | "ghost";
}) {
  const isPrimary = kind === "primary";
  return (
    <button
      {...props}
      className={`press-active inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-extrabold ${props.className ?? ""}`}
      style={{
        background: isPrimary ? "var(--wa)" : "#fff",
        color: isPrimary ? "#fff" : "var(--ink)",
        border: "3px solid var(--ink)",
        borderRadius: 16,
        boxShadow: "4px 5px 0 var(--ink)",
        opacity: props.disabled ? 0.5 : 1,
        cursor: props.disabled ? "not-allowed" : "pointer",
      }}
    >
      {icon}
      {children}
    </button>
  );
}

function Chip({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="press-active grid h-11 w-11 place-items-center"
      style={{
        background: "#fff",
        border: "3px solid var(--ink)",
        borderRadius: 14,
        boxShadow: "3px 4px 0 var(--ink)",
        color: "var(--ink)",
        opacity: props.disabled ? 0.4 : 1,
        cursor: props.disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

function ActionChip({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="press-active flex flex-1 items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-extrabold"
      style={{
        background: "var(--cream)",
        color: "var(--ink)",
        border: "2.5px solid var(--ink)",
        borderRadius: 14,
        boxShadow: "3px 4px 0 var(--ink)",
        opacity: disabled ? 0.45 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function ChipsRow({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-1.5">{children}</div>;
}

function MiniBtn({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="grid h-7 w-7 flex-shrink-0 place-items-center transition-colors disabled:cursor-not-allowed disabled:opacity-30"
      style={{
        background: "#fff",
        border: "1.5px solid var(--ink)",
        borderRadius: 7,
        color: "var(--ink)",
      }}
    >
      {children}
    </button>
  );
}

function Section({
  icon,
  label,
  children,
  id,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section id={id}>
      <div className="mb-2.5 flex items-center gap-1.5 text-[13px] font-extrabold">
        {icon} {label}
      </div>
      {children}
    </section>
  );
}

function RangeRow({
  icon,
  label,
  value,
  onChange,
  min,
  max,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  unit: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs font-extrabold">
        <span className="inline-flex items-center gap-1">
          {icon} {label}
        </span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          {value}
          {unit}
        </span>
      </div>
      <div className="relative h-3">
        <div
          className="absolute inset-x-0 top-1 h-1 rounded-full"
          style={{
            background: "var(--cream)",
            border: "1.5px solid var(--ink)",
          }}
        />
        <div
          className="absolute top-1 h-1 rounded-full"
          style={{
            insetInlineStart: 0,
            width: `${pct}%`,
            background: "var(--wa)",
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          style={{ direction: "ltr" }}
        />
        <div
          className="pointer-events-none absolute h-4 w-4 rounded-full"
          style={{
            insetInlineStart: `calc(${pct}% - 8px)`,
            top: -1,
            background: "#fff",
            border: "2.5px solid var(--ink)",
          }}
        />
      </div>
    </div>
  );
}

// Hide horizontal scrollbar inside the presets rail.
// (Inline because Tailwind v4 doesn't ship a built-in `no-scrollbar`.)
declare module "react" {
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }
}

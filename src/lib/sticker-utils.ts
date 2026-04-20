/**
 * Utilities for producing a WhatsApp-compliant sticker from a transparent-background image.
 *
 * WhatsApp sticker spec:
 *  - 512 x 512 WebP
 *  - Transparent background
 *  - < 100 KB per sticker
 */

import { PUBLIC_DOMAIN } from "./brand";

const STICKER_SIZE = 512;
const WEBP_QUALITY = 0.92;
// Small breathing room around the subject so it doesn't kiss the sticker edges.
const EDGE_PADDING_PX = 16;
// Alpha floor for deciding what counts as "subject" when finding the bbox.
const BBOX_ALPHA_THRESHOLD = 20;

export interface StickerOptions {
  /**
   * When true, burn a domain watermark into the bottom-right corner.
   * Applied to every free-tier sticker; removed once the user has paid.
   */
  watermark: boolean;
}

/**
 * Take a Blob produced by @imgly/background-removal (transparent PNG/WebP)
 * and return a 512x512 WebP Blob sized for WhatsApp stickers.
 * The subject is centered and scaled to fit with transparent padding.
 */
export async function toWhatsAppSticker(
  source: Blob,
  options: StickerOptions = { watermark: true },
): Promise<Blob> {
  const bitmap = await createImageBitmap(source);

  // Locate the subject's true bounding box in the matted image. Without this
  // the sticker has wasted transparent padding matching the original photo's
  // aspect ratio — the subject ends up small inside the 512 canvas.
  const bbox = findSubjectBBox(bitmap);

  const canvas = document.createElement("canvas");
  canvas.width = STICKER_SIZE;
  canvas.height = STICKER_SIZE;

  // alpha: true is default, but we set it explicitly because a transparent
  // background is critical for WhatsApp stickers.
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) throw new Error("לא ניתן לגשת ל-canvas בדפדפן הזה");

  // Scale the bbox (not the whole bitmap) into the usable area, preserving
  // aspect ratio and reserving a small margin so the subject doesn't kiss
  // the sticker edges.
  const usable = STICKER_SIZE - EDGE_PADDING_PX * 2;
  const scale = Math.min(usable / bbox.w, usable / bbox.h);
  const targetW = bbox.w * scale;
  const targetH = bbox.h * scale;
  const offsetX = (STICKER_SIZE - targetW) / 2;
  const offsetY = (STICKER_SIZE - targetH) / 2;

  ctx.clearRect(0, 0, STICKER_SIZE, STICKER_SIZE);
  // drawImage 9-arg form: crop source rect (bbox) and draw into target rect.
  ctx.drawImage(
    bitmap,
    bbox.x,
    bbox.y,
    bbox.w,
    bbox.h,
    offsetX,
    offsetY,
    targetW,
    targetH,
  );

  bitmap.close();

  // The isnet model returns a soft alpha mask — subject pixels sometimes come
  // out at 180-220 instead of fully opaque. Stretch the alpha curve so the
  // subject is solid while edges stay anti-aliased.
  sharpenAlphaMask(ctx, STICKER_SIZE);

  if (options.watermark) {
    drawWatermark(ctx, STICKER_SIZE);
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("ייצוא המדבקה נכשל"));
      },
      "image/webp",
      WEBP_QUALITY,
    );
  });
}

/**
 * Find the tight bounding box of non-transparent pixels in a matted bitmap.
 * Scans the alpha channel and records the min/max x/y of pixels above a small
 * threshold (to ignore faint background remnants). If the bitmap has no
 * subject (all transparent), falls back to the full frame.
 */
function findSubjectBBox(bitmap: ImageBitmap): {
  x: number;
  y: number;
  w: number;
  h: number;
} {
  const { width, height } = bitmap;
  const tmp = document.createElement("canvas");
  tmp.width = width;
  tmp.height = height;
  const tmpCtx = tmp.getContext("2d", { alpha: true });
  if (!tmpCtx) return { x: 0, y: 0, w: width, h: height };
  tmpCtx.drawImage(bitmap, 0, 0);
  const data = tmpCtx.getImageData(0, 0, width, height).data;

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const a = data[(y * width + x) * 4 + 3];
      if (a > BBOX_ALPHA_THRESHOLD) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < 0 || maxY < 0) {
    // No subject pixels found — fall back to the whole frame.
    return { x: 0, y: 0, w: width, h: height };
  }

  return {
    x: minX,
    y: minY,
    w: maxX - minX + 1,
    h: maxY - minY + 1,
  };
}

/**
 * Normalize alpha values so subject pixels become fully opaque while keeping
 * soft anti-aliased edges. Fixes the "translucent sticker" artifact produced
 * by the isnet matting model.
 *   - alpha < 20  → 0   (drop faint background remnants)
 *   - alpha > 220 → 255 (lock subject body to solid)
 *   - 20..220     → linearly stretched to 0..255 for clean edge transitions
 */
function sharpenAlphaMask(ctx: CanvasRenderingContext2D, size: number): void {
  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;
  const lo = 20;
  const hi = 220;
  const range = hi - lo;
  for (let i = 3; i < data.length; i += 4) {
    const a = data[i];
    if (a <= lo) {
      data[i] = 0;
    } else if (a >= hi) {
      data[i] = 255;
    } else {
      data[i] = Math.round(((a - lo) / range) * 255);
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

/**
 * Burn the brand domain into the bottom-right corner inside a semi-transparent
 * black pill, so the watermark is legible on both light and dark WhatsApp chat
 * backgrounds. Designed to survive WhatsApp's downscale to ~120px.
 */
function drawWatermark(ctx: CanvasRenderingContext2D, size: number): void {
  const text = PUBLIC_DOMAIN;
  const fontSize = 20;
  const edgePadding = 12;
  const pillPaddingX = 10;
  const pillPaddingY = 5;

  ctx.save();
  ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";

  const textWidth = ctx.measureText(text).width;
  const pillWidth = textWidth + pillPaddingX * 2;
  const pillHeight = fontSize + pillPaddingY * 2;
  const pillX = size - pillWidth - edgePadding;
  const pillY = size - pillHeight - edgePadding;

  // Pill background — semi-transparent black for contrast on any chat bg.
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = "#000000";
  const radius = pillHeight / 2;
  ctx.beginPath();
  ctx.moveTo(pillX + radius, pillY);
  ctx.arcTo(pillX + pillWidth, pillY, pillX + pillWidth, pillY + pillHeight, radius);
  ctx.arcTo(pillX + pillWidth, pillY + pillHeight, pillX, pillY + pillHeight, radius);
  ctx.arcTo(pillX, pillY + pillHeight, pillX, pillY, radius);
  ctx.arcTo(pillX, pillY, pillX + pillWidth, pillY, radius);
  ctx.closePath();
  ctx.fill();

  // Text — white with subtle black outline, 70% overall opacity per spec.
  ctx.globalAlpha = 0.7;
  const textX = pillX + pillPaddingX;
  const textY = pillY + pillHeight / 2;

  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 1;
  ctx.strokeText(text, textX, textY);

  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(text, textX, textY);

  ctx.restore();
}

/**
 * Map @imgly/background-removal progress keys to Hebrew user-facing stage labels.
 * Keys from the library include things like "fetch:..." for model download and
 * "compute:..." / "inference:..." during processing.
 */
export function progressKeyToHebrewLabel(key: string): string {
  if (key.startsWith("fetch")) return "טוען מודל (פעם ראשונה בלבד)...";
  if (key.includes("compute")) return "מזהה את הנושא בתמונה...";
  if (key.includes("inference")) return "מסיר את הרקע...";
  return "מעבד...";
}

/**
 * Persist the generated sticker blob across navigations (e.g. OAuth sign-up
 * redirects to Google and back) using sessionStorage + base64.
 * Key is scoped to the current tab, cleared on download/reset.
 */
const PENDING_STICKER_KEY = "madbeka:pending-sticker";

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function base64ToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

export async function savePendingSticker(blob: Blob): Promise<void> {
  try {
    const dataUrl = await blobToBase64(blob);
    sessionStorage.setItem(PENDING_STICKER_KEY, dataUrl);
  } catch (err) {
    // Persistence is best-effort; never block the UI on storage errors.
    console.warn("Failed to persist pending sticker:", err);
  }
}

export async function loadPendingSticker(): Promise<Blob | null> {
  try {
    const dataUrl = sessionStorage.getItem(PENDING_STICKER_KEY);
    if (!dataUrl) return null;
    return await base64ToBlob(dataUrl);
  } catch (err) {
    console.warn("Failed to load pending sticker:", err);
    return null;
  }
}

export function clearPendingSticker(): void {
  try {
    sessionStorage.removeItem(PENDING_STICKER_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Trigger a browser download of the given Blob with a friendly filename.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke on next tick so the download kicks off first
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

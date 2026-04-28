/**
 * Packaging helpers — turn a list of GalleryEntry stickers into the
 * base64 payload the native plugin expects.
 *
 * The native side (MadbekaStickerPlugin.java) wants:
 *   - sticker bytes as base64 (no data: prefix)
 *   - a 96×96 tray icon, also base64
 *
 * Everything stays client-side; we never POST sticker bytes anywhere.
 */

import { listGallery, type GalleryEntry } from "./sticker-gallery";
import type { NativeSticker, AddToWhatsAppRequest } from "./native";

/** WhatsApp's hard requirement: a pack must contain at least 3 stickers. */
export const WHATSAPP_MIN_STICKERS = 3;

/** Convert a Blob to a base64 string. Strips the `data:...;base64,` prefix
 *  so the native side can call Base64.decode() directly. */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const commaIdx = result.indexOf(",");
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.readAsDataURL(blob);
  });
}

/** Resize a sticker blob to a 96×96 webp tray icon under 50KB.
 *
 *  WhatsApp displays this icon in the sticker tray. We render it on a
 *  hidden canvas at 96×96 then re-encode at decreasing quality until
 *  the result is under 50KB (most stickers fit at 0.85 first try). */
async function makeTrayIcon(sourceBlob: Blob): Promise<Blob> {
  const url = URL.createObjectURL(sourceBlob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Failed to decode source for tray icon"));
      i.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = 96;
    canvas.height = 96;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No 2D context available for tray icon resize");
    ctx.clearRect(0, 0, 96, 96);
    ctx.drawImage(img, 0, 0, 96, 96);

    const tryEncode = (quality: number) =>
      new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("toBlob returned null"))),
          "image/webp",
          quality,
        );
      });

    for (const q of [0.85, 0.7, 0.55, 0.4, 0.3]) {
      const blob = await tryEncode(q);
      if (blob.size <= 50_000) return blob;
    }
    // Last resort: just return the smallest one we have.
    return tryEncode(0.25);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Heuristic emoji tags for a sticker. WhatsApp requires 1–3 emojis
 *  per sticker so the user can search for them. We try to read the
 *  label (Hebrew word → mood) and fall back to "🔥" if nothing fits. */
function emojisFor(label?: string): string[] {
  if (!label) return ["🔥"];
  const map: Array<[RegExp, string]> = [
    [/אהבה|לב|חמוד/, "❤️"],
    [/חחח|צוחק|מצחיק/, "😂"],
    [/יאללה|בוא/, "💪"],
    [/סבבה|מגניב/, "😎"],
    [/מדהים|וואו/, "🤩"],
    [/חלאס|די/, "🛑"],
    [/בוקר|שלום|היי/, "👋"],
    [/לילה/, "🌙"],
    [/מזל טוב|חג/, "🎉"],
  ];
  for (const [re, e] of map) if (re.test(label)) return [e];
  return ["🔥"];
}

/** Build an AddToWhatsAppRequest from the user's gallery. Returns null
 *  if there aren't enough stickers yet. */
export async function buildPackFromGallery(options: {
  packId: string;
  packName: string;
}): Promise<AddToWhatsAppRequest | null> {
  const items = await listGallery();
  if (items.length < WHATSAPP_MIN_STICKERS) return null;

  // WhatsApp also caps packs at 30 stickers; take the most recent 30.
  const usable = items.slice(0, 30);

  const stickers: NativeSticker[] = await Promise.all(
    usable.map(
      async (item: GalleryEntry): Promise<NativeSticker> => ({
        id: item.id,
        bytes: await blobToBase64(item.blob),
        emoji: emojisFor(item.label),
      }),
    ),
  );

  const trayBlob = await makeTrayIcon(usable[0].blob);
  const trayIconBytes = await blobToBase64(trayBlob);

  return {
    packId: options.packId,
    packName: options.packName,
    stickers,
    trayIconBytes,
  };
}

/** Convenience: how many stickers the user still needs before they can
 *  add a pack to WhatsApp. Returns 0 if they already have enough. */
export async function stickersNeededForPack(): Promise<number> {
  const items = await listGallery();
  return Math.max(0, WHATSAPP_MIN_STICKERS - items.length);
}

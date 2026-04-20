/**
 * Utilities for producing a WhatsApp-compliant sticker from a transparent-background image.
 *
 * WhatsApp sticker spec:
 *  - 512 x 512 WebP
 *  - Transparent background
 *  - < 100 KB per sticker
 */

const STICKER_SIZE = 512;
const WEBP_QUALITY = 0.92;

/**
 * Take a Blob produced by @imgly/background-removal (transparent PNG/WebP)
 * and return a 512x512 WebP Blob sized for WhatsApp stickers.
 * The subject is centered and scaled to fit with transparent padding.
 */
export async function toWhatsAppSticker(source: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(source);

  const canvas = document.createElement("canvas");
  canvas.width = STICKER_SIZE;
  canvas.height = STICKER_SIZE;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("לא ניתן לגשת ל-canvas בדפדפן הזה");

  // Fit preserving aspect ratio, centered
  const scale = Math.min(
    STICKER_SIZE / bitmap.width,
    STICKER_SIZE / bitmap.height,
  );
  const targetW = bitmap.width * scale;
  const targetH = bitmap.height * scale;
  const offsetX = (STICKER_SIZE - targetW) / 2;
  const offsetY = (STICKER_SIZE - targetH) / 2;

  ctx.clearRect(0, 0, STICKER_SIZE, STICKER_SIZE);
  ctx.drawImage(bitmap, offsetX, offsetY, targetW, targetH);

  bitmap.close();

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

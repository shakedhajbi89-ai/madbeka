/**
 * Native (Capacitor) bridge for the Android app.
 *
 * The web app and the Android app run from the *same* JS bundle. When
 * the bundle is loaded by the Android shell, Capacitor injects a
 * `Capacitor` global that lets us call into Kotlin. When the bundle
 * runs in a regular browser, that global is absent and the helpers
 * here gracefully short-circuit.
 *
 * Use `isNativeAndroid()` to gate UI that only makes sense inside the
 * Android shell — primarily the "Add to WhatsApp" sticker-pack button,
 * which depends on the WhatsApp Sticker Pack Intent that the web
 * platform can't reach.
 */

interface CapacitorRuntime {
  isNativePlatform?: () => boolean;
  getPlatform?: () => "web" | "ios" | "android";
  Plugins?: Record<string, unknown>;
}

declare global {
  interface Window {
    Capacitor?: CapacitorRuntime;
  }
}

/**
 * True when the JS bundle is running inside the Capacitor Android shell.
 * Always false on the web (incl. Chrome on Android — that's not the same
 * as our packaged app).
 */
export function isNativeAndroid(): boolean {
  if (typeof window === "undefined") return false;
  const cap = window.Capacitor;
  return (
    cap?.isNativePlatform?.() === true && cap?.getPlatform?.() === "android"
  );
}

/**
 * Sticker exposed across the JS↔Kotlin boundary.
 *
 * `bytes` is the .webp file as a base64 string (NOT a data: URL — just
 * the encoded payload). The native side decodes and writes it to the
 * app's internal storage where WhatsApp can pull it via our
 * StickerContentProvider.
 *
 * `emoji` is the WhatsApp-required emoji tag (1–3 emojis describing
 * the sticker's mood). We default to "🔥" if the user didn't pick one.
 */
export interface NativeSticker {
  /** Stable id; we use the gallery item id. */
  id: string;
  /** Base64-encoded .webp bytes (no `data:image/webp;base64,` prefix). */
  bytes: string;
  /** 1–3 emoji tags. Required by WhatsApp. */
  emoji: string[];
}

export interface AddToWhatsAppRequest {
  /** Identifier for the sticker pack (we use one pack per user). */
  packId: string;
  /** User-facing pack name in the WhatsApp UI. */
  packName: string;
  /** All stickers the user has — WhatsApp requires ≥3 per pack. */
  stickers: NativeSticker[];
  /**
   * Tray icon as base64 webp. Must be 96×96 and ≤50KB. We'll generate
   * this from the user's most recent sticker if not provided.
   */
  trayIconBytes: string;
}

export interface AddToWhatsAppResult {
  /** "added" if WhatsApp confirmed the pack was added, "cancelled" if
   *  the user dismissed the dialog, "error" otherwise. */
  status: "added" | "cancelled" | "error";
  message?: string;
}

/**
 * Ask WhatsApp to register the given sticker pack with the user's
 * library. No-op (returns "error") on the web — the caller should hide
 * the button there via {@link isNativeAndroid}.
 */
export async function addPackToWhatsApp(
  req: AddToWhatsAppRequest,
): Promise<AddToWhatsAppResult> {
  if (!isNativeAndroid()) {
    return {
      status: "error",
      message: "Native bridge unavailable (running in a browser).",
    };
  }
  const plugins = window.Capacitor?.Plugins as
    | { MadbekaSticker?: { addToWhatsApp: typeof addPackToWhatsApp } }
    | undefined;
  const plugin = plugins?.MadbekaSticker;
  if (!plugin) {
    return {
      status: "error",
      message: "MadbekaSticker plugin not registered.",
    };
  }
  return plugin.addToWhatsApp(req);
}

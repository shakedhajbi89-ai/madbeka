"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { preload, removeBackground } from "@imgly/background-removal";
import { SignUpButton, useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  clearPendingSticker,
  downloadBlob,
  loadPendingSticker,
  progressKeyToHebrewLabel,
  savePendingSticker,
  toWhatsAppSticker,
} from "@/lib/sticker-utils";

type Stage =
  | "idle"
  | "processing"
  | "result"
  | "paywall"
  | "paid_success"
  | "error";

interface ProgressState {
  label: string;
  percent: number;
}

interface UserStatus {
  userId: string;
  email: string;
  hasPaid: boolean;
  stickerCount: number;
  freeRemaining: number;
  canCreate: boolean;
}

const INITIAL_PROGRESS: ProgressState = {
  label: "מכין את התמונה...",
  percent: 3,
};

export function StickerMaker() {
  const { isSignedIn, userId } = useAuth();

  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState<ProgressState>(INITIAL_PROGRESS);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [pendingDownload, setPendingDownload] = useState(false);
  const [isLoggingDownload, setIsLoggingDownload] = useState(false);
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const resetToIdle = useCallback(() => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setResultUrl(null);
    setResultBlob(null);
    setErrorMsg("");
    setPendingDownload(false);
    setProgress(INITIAL_PROGRESS);
    setStage("idle");
    clearPendingSticker();
  }, [resultUrl]);

  /**
   * Pull the authenticated user's payment + usage status.
   * Used to decide watermark on/off and gate the paywall.
   * Silently fails when not signed in (401 is expected).
   */
  const refreshUserStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/stickers/me");
      if (!res.ok) {
        setUserStatus(null);
        return;
      }
      const data = (await res.json()) as UserStatus;
      setUserStatus(data);
    } catch {
      setUserStatus(null);
    }
  }, []);

  // Whenever auth state flips to signed-in, refresh status. Wrapped in an
  // async IIFE so all setState calls land in a microtask — satisfies
  // react-hooks/set-state-in-effect.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (isSignedIn) {
        await refreshUserStatus();
      } else {
        await Promise.resolve();
        if (!cancelled) setUserStatus(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, refreshUserStatus]);

  /**
   * Restore a sticker that was generated before the user was redirected away
   * for OAuth sign-up (e.g. Google). Runs once on mount — if nothing is pending,
   * this is a no-op. Also detects the `?paid=1` return from Lemon Squeezy and
   * shows the paid-success screen.
   */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Defer everything below to a microtask so setState calls don't happen
      // synchronously in the effect body (react-hooks/set-state-in-effect).
      await Promise.resolve();
      if (cancelled) return;

      // Handle return from Lemon Squeezy checkout.
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (params.get("paid") === "1") {
          // Strip the query so a refresh doesn't re-trigger the success screen.
          window.history.replaceState({}, "", window.location.pathname);
          // The persisted sticker was generated pre-payment and carries a
          // watermark. Clear it so the user starts fresh on the paid tier.
          clearPendingSticker();
          setStage("paid_success");
          void refreshUserStatus();
          return;
        }
      }

      const blob = await loadPendingSticker();
      if (!blob || cancelled) return;
      const url = URL.createObjectURL(blob);
      setResultBlob(blob);
      setResultUrl(url);
      setStage("result");
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshUserStatus]);

  // Fire-and-forget model preload on mount so the ~90MB isnet_fp16 assets are
  // already in the browser cache by the time the user picks a photo. Without
  // this the first sticker of a session pays the full download cost inline,
  // stretching perceived processing time by several seconds on slow networks.
  useEffect(() => {
    void preload({ model: "isnet_fp16" }).catch(() => {
      // Preload is best-effort. A failure here just means the real
      // removeBackground() call will do the download itself — no UI impact.
    });
  }, []);

  const processFile = useCallback(
    async (file: File) => {
      setErrorMsg("");
      setProgress(INITIAL_PROGRESS);
      setStage("processing");

      try {
        const transparentBlob = await removeBackground(file, {
          // fp16 variant of the isnet model (~90MB). Roughly half the file
          // size and ~2x faster inference than full-precision isnet, with
          // visually equivalent output for the photo types users upload.
          model: "isnet_fp16",
          output: { format: "image/png", quality: 1 },
          progress: (key, current, total) => {
            const label = progressKeyToHebrewLabel(key);
            const pct = total
              ? Math.min(92, Math.max(5, Math.round((current / total) * 90) + 5))
              : 50;
            setProgress({ label, percent: pct });
          },
        });

        setProgress({ label: "מכין את המדבקה לוואטסאפ...", percent: 96 });
        // Paid users get clean stickers. Everyone else (incl. not-yet-signed-in)
        // gets the watermark. Refunded users fall back to watermarked — the
        // server already flips hasPaid to false in that case.
        const shouldWatermark = !(userStatus?.hasPaid === true);
        const stickerBlob = await toWhatsAppSticker(transparentBlob, {
          watermark: shouldWatermark,
        });
        const url = URL.createObjectURL(stickerBlob);

        setResultBlob(stickerBlob);
        setResultUrl(url);
        setProgress({ label: "מוכן!", percent: 100 });
        setStage("result");

        // Persist across potential OAuth redirects so the sticker survives a
        // Google sign-up round-trip.
        void savePendingSticker(stickerBlob);
      } catch (err) {
        console.error("Sticker generation failed:", err);
        const msg =
          err instanceof Error
            ? err.message
            : "משהו השתבש ביצירת המדבקה. נסה שוב עם תמונה אחרת.";
        setErrorMsg(msg);
        setStage("error");
      }
    },
    [userStatus],
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) void processFile(file);
      e.target.value = "";
    },
    [processFile],
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith("image/")) void processFile(file);
    },
    [processFile],
  );

  /**
   * Single entry point for "give me the file".
   * Requires auth. Hits the server to log the event (which enforces free-tier limit).
   * Only triggers the browser download if the server confirms.
   */
  const confirmAndDownload = useCallback(async () => {
    if (!resultBlob) return;

    if (!isSignedIn) {
      // SignedOut branch shows a SignUpButton — we just flag intent.
      setPendingDownload(true);
      return;
    }

    setIsLoggingDownload(true);
    try {
      const res = await fetch("/api/stickers/log", { method: "POST" });
      if (res.status === 402) {
        setStage("paywall");
        return;
      }
      if (!res.ok) throw new Error("שגיאה ברישום המדבקה");

      // Server returns the new UserStatus — cache it so a subsequent generation
      // uses the latest hasPaid / freeRemaining.
      try {
        const data = (await res.json()) as UserStatus;
        setUserStatus(data);
      } catch {
        /* ignore body parse errors — download proceeds regardless */
      }

      downloadBlob(resultBlob, "madbeka-sticker.webp");
      clearPendingSticker();
    } catch (err) {
      console.error(err);
      setErrorMsg(
        err instanceof Error ? err.message : "משהו השתבש בהורדה. נסה שוב.",
      );
      setStage("error");
    } finally {
      setIsLoggingDownload(false);
    }
  }, [isSignedIn, resultBlob]);

  /**
   * Send the user to the Lemon Squeezy checkout with their Clerk user_id
   * threaded through custom data, so our webhook can attribute the payment
   * to the right account. success_url brings them back to /?paid=1 where the
   * UI flips to the paid-success screen and refreshes hasPaid from the server.
   */
  const goToCheckout = useCallback(() => {
    const base = process.env.NEXT_PUBLIC_LEMON_CHECKOUT_URL;
    if (!base || !userId) {
      setErrorMsg("לא ניתן להתחיל את התשלום כרגע. נסה שוב עוד רגע.");
      setStage("error");
      return;
    }
    const url = new URL(base);
    url.searchParams.set("checkout[custom][user_id]", userId);
    url.searchParams.set(
      "checkout[success_url]",
      `${window.location.origin}/?paid=1`,
    );
    // Force the checkout UI to Hebrew regardless of the buyer's browser locale.
    // Without this, LS picks from Accept-Language, which can show fields in
    // Bulgarian/Russian for some locales and confuses Israeli buyers.
    url.searchParams.set("checkout[locale]", "he");
    window.location.href = url.toString();
  }, [userId]);

  // ---------- RENDER ----------

  if (stage === "processing") {
    return (
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="space-y-5 text-center">
          <div className="text-5xl">✨</div>
          <p className="text-lg font-semibold text-gray-900">
            {progress.label}
          </p>
          <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-[color:var(--brand-green)] transition-all duration-300"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <p className="text-sm text-gray-500">
            {progress.percent}% — הכל רץ במכשיר שלך, התמונה לא עוזבת אותו.
          </p>
        </div>
      </div>
    );
  }

  if (stage === "paywall") {
    return (
      <div className="w-full max-w-md space-y-4 rounded-2xl border-2 border-[color:var(--brand-green)] bg-white p-8 text-center shadow-sm">
        <div className="text-4xl">🔓</div>
        <h2 className="text-xl font-bold text-gray-900">
          סיימת את 3 המדבקות החינמיות!
        </h2>
        <p className="text-sm text-gray-700">
          ברכישה חד-פעמית של ₪35 תקבל מדבקות ללא הגבלה, בלי סימון, ועם פיצ&apos;רים
          מתקדמים.
        </p>
        <Button
          onClick={goToCheckout}
          className="h-12 w-full bg-[color:var(--brand-green)] text-base font-semibold text-white hover:bg-[color:var(--brand-green-dark)]"
        >
          שלם ₪35 והסר הגבלה
        </Button>
        <button
          onClick={resetToIdle}
          className="text-sm text-gray-500 underline"
        >
          חזרה
        </button>
      </div>
    );
  }

  if (stage === "paid_success") {
    return (
      <div className="w-full max-w-md space-y-5 rounded-2xl border-2 border-[color:var(--brand-green)] bg-white p-8 text-center shadow-sm">
        <div className="text-5xl">🎉</div>
        <h2 className="text-2xl font-bold text-gray-900">תודה על הרכישה!</h2>
        <p className="text-sm text-gray-700">
          מהרגע הזה כל המדבקות שתיצור יהיו ללא הגבלה וללא סימון.
        </p>
        <Button
          onClick={resetToIdle}
          className="h-12 w-full bg-[color:var(--brand-green)] text-base font-semibold text-white hover:bg-[color:var(--brand-green-dark)]"
        >
          התחל ליצור מדבקות
        </Button>
      </div>
    );
  }

  if (stage === "result" && resultUrl) {
    return (
      <div className="w-full max-w-md space-y-5 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h2 className="text-center text-2xl font-bold text-gray-900">
          המדבקה מוכנה! 🎉
        </h2>

        <div className="checkerboard mx-auto flex h-64 w-64 items-center justify-center rounded-xl border border-gray-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resultUrl}
            alt="המדבקה שלך"
            className="max-h-60 max-w-60 object-contain"
          />
        </div>
        <p className="text-center text-xs text-gray-500">
          הרקע המשובץ מציין שהמדבקה שקופה — בוואטסאפ היא תופיע נקי לגמרי.
        </p>

        <div className="flex flex-col gap-2">
          {isSignedIn ? (
            <Button
              onClick={confirmAndDownload}
              disabled={isLoggingDownload}
              className="h-12 w-full bg-[color:var(--brand-green)] text-base font-semibold text-white hover:bg-[color:var(--brand-green-dark)]"
            >
              {isLoggingDownload ? "מוריד..." : "הורד מדבקה"}
            </Button>
          ) : (
            <>
              <SignUpButton mode="modal">
                <Button className="h-12 w-full bg-[color:var(--brand-green)] text-base font-semibold text-white hover:bg-[color:var(--brand-green-dark)]">
                  הירשם והורד
                </Button>
              </SignUpButton>
              <p className="text-center text-xs text-gray-500">
                רישום מהיר עם Google או אימייל. 3 מדבקות חינם.
              </p>
              {pendingDownload && (
                <p className="text-center text-xs text-[color:var(--brand-green-dark)]">
                  ↑ לחץ כאן כדי להמשיך
                </p>
              )}
            </>
          )}

          <Button
            variant="outline"
            onClick={resetToIdle}
            className="h-12 w-full text-base"
          >
            יצירת מדבקה חדשה
          </Button>
        </div>
      </div>
    );
  }

  if (stage === "error") {
    return (
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-sm">
        <div className="text-4xl">😕</div>
        <h2 className="text-lg font-bold text-gray-900">משהו השתבש</h2>
        <p className="text-sm text-gray-700">{errorMsg}</p>
        <Button onClick={resetToIdle} className="h-11 w-full">
          נסה שוב
        </Button>
      </div>
    );
  }

  // stage === "idle"
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      className={`w-full max-w-md rounded-2xl border-2 border-dashed p-8 transition-colors ${
        isDragging
          ? "border-[color:var(--brand-green)] bg-green-50"
          : "border-gray-300 bg-white"
      }`}
    >
      <div className="space-y-5 text-center">
        <div className="text-5xl">📸</div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            העלה תמונה, קבל מדבקה
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            גרור תמונה לכאן או בחר מהמכשיר
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="h-12 w-full bg-[color:var(--brand-green)] text-base font-semibold text-white hover:bg-[color:var(--brand-green-dark)]"
          >
            בחר תמונה מהמכשיר
          </Button>
          <Button
            variant="outline"
            onClick={() => cameraInputRef.current?.click()}
            className="h-12 w-full text-base"
          >
            צלם עכשיו 📷
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onInputChange}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onInputChange}
          className="hidden"
        />

        <p className="text-xs text-gray-500">
          הסרת הרקע קורית בדפדפן שלך — התמונה לא נשלחת לאף שרת.
        </p>

        {userStatus?.hasPaid && (
          <p className="text-xs font-medium text-[color:var(--brand-green-dark)]">
            ✓ חשבון משולם — מדבקות ללא הגבלה וללא סימון
          </p>
        )}
      </div>
    </div>
  );
}

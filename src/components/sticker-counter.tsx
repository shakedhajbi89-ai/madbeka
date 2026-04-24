"use client";

import { useEffect, useState } from "react";

/**
 * Animated count-up from 0 → target over ~1.2s. Uses requestAnimationFrame so
 * scrolling / input remains smooth. If target changes mid-animation, restarts.
 */
function useAnimatedCount(target: number, durationMs = 1200) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (target <= 0) {
      setValue(0);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const initial = 0;
    const delta = target - initial;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / durationMs);
      // easeOutQuad — starts fast, settles smoothly on final number
      const eased = 1 - (1 - progress) * (1 - progress);
      setValue(Math.round(initial + delta * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);

  return value;
}

/**
 * Fetches the global sticker count from /api/stats and renders a warm
 * social-proof line. Gracefully hides itself if the number is very low
 * (avoid negative signal like "only 3 stickers made so far").
 */
export function StickerCounter() {
  const [total, setTotal] = useState<number | null>(null);
  const animated = useAnimatedCount(total ?? 0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/stats");
        if (!res.ok) return;
        const data = (await res.json()) as { totalStickers?: number };
        if (cancelled) return;
        if (typeof data.totalStickers === "number") {
          setTotal(data.totalStickers);
        }
      } catch {
        /* silent — counter is optional UI */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Hide until we have at least 50 to avoid a weak social signal. Feel free to
  // raise this threshold as momentum builds.
  if (total === null || total < 50) return null;

  const formatted = new Intl.NumberFormat("he-IL").format(animated);

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border border-[color:var(--brand-green)]/30 bg-[color:var(--brand-green)]/10 px-4 py-1.5 text-sm font-medium text-[color:var(--brand-green-dark)] dark:border-[color:var(--brand-green)]/40 dark:bg-[color:var(--brand-green)]/15 dark:text-[color:var(--brand-green)]"
      aria-live="polite"
    >
      <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[color:var(--brand-green)]" />
      <span>
        {formatted}+ מדבקות כבר נוצרו ב-Madbeka
      </span>
    </div>
  );
}

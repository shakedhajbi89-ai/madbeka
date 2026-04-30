"use client";

import { useEffect, useState } from "react";

/**
 * In-app splash screen — branded animation on first page load per session.
 *
 * Animation sequence:
 *   0ms    → Madbeka brand mark fades in with scale 0.92→1 (600ms ease-out)
 *   900ms  → hold
 *   900ms  → fade out (400ms ease-in)
 *   Total visible: ~1.3s
 *
 * Honors prefers-reduced-motion: instant appear/disappear, no scale.
 *
 * Session-scoped: returning from Lemon Squeezy checkout (same tab, same
 * sessionStorage) does NOT re-trigger — nobody wants a 1.3s delay after paying.
 */

const HOLD_MS = 900;        // how long the mark sits still
const FADE_IN_MS = 600;     // entrance duration
const FADE_OUT_MS = 400;    // exit duration
const TOTAL_MS = HOLD_MS + FADE_IN_MS; // ~1500ms until fade-out starts

const SESSION_KEY = "madbeka:splash-shown";

export function SplashScreen() {
  const [mounted, setMounted] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (sessionStorage.getItem(SESSION_KEY)) return;
    sessionStorage.setItem(SESSION_KEY, "1");

    let cancelled = false;
    let fadeTimer: number | null = null;
    let unmountTimer: number | null = null;

    (async () => {
      await Promise.resolve();
      if (cancelled) return;
      setMounted(true);

      if (prefersReduced) {
        // No animation — just show briefly and disappear
        fadeTimer = window.setTimeout(() => { if (!cancelled) setFading(true); }, 800);
        unmountTimer = window.setTimeout(() => { if (!cancelled) setMounted(false); }, 800 + FADE_OUT_MS);
        return;
      }

      fadeTimer = window.setTimeout(() => {
        if (!cancelled) setFading(true);
      }, TOTAL_MS);
      unmountTimer = window.setTimeout(() => {
        if (!cancelled) setMounted(false);
      }, TOTAL_MS + FADE_OUT_MS);
    })();

    return () => {
      cancelled = true;
      if (fadeTimer !== null) window.clearTimeout(fadeTimer);
      if (unmountTimer !== null) window.clearTimeout(unmountTimer);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      aria-hidden="true"
      className={
        "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white " +
        (fading ? "pointer-events-none" : "")
      }
      style={{
        transition: fading
          ? `opacity ${FADE_OUT_MS}ms cubic-bezier(0.4, 0, 1, 1)`
          : "none",
        opacity: fading ? 0 : 1,
      }}
    >
      {/* Brand mark — inline SVG-style composition using divs, same as Logo.tsx */}
      <div
        style={{
          animation: "madbeka-splash-enter 600ms cubic-bezier(0.16, 1, 0.3, 1) both",
        }}
      >
        <SplashMark size={96} />
      </div>

      {/* Wordmark below the mark */}
      <div
        style={{
          marginTop: 16,
          fontFamily: "var(--font-heebo, 'Heebo', system-ui, sans-serif)",
          fontWeight: 900,
          fontSize: 28,
          color: "#0E0E0E",
          letterSpacing: "-0.04em",
          animation: "madbeka-splash-wordmark 500ms cubic-bezier(0.16, 1, 0.3, 1) 350ms both",
          opacity: 0,
        }}
      >
        מדבקה
      </div>

      <style>{`
        @keyframes madbeka-splash-enter {
          0%   { opacity: 0; transform: scale(0.92); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes madbeka-splash-wordmark {
          0%   { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes madbeka-splash-enter {
            0%   { opacity: 0; }
            100% { opacity: 1; }
          }
          @keyframes madbeka-splash-wordmark {
            0%   { opacity: 0; }
            100% { opacity: 1; }
          }
        }
      `}</style>
    </div>
  );
}

/**
 * The brand mark as pure CSS divs — matches Logo.tsx exactly but
 * uses hardcoded values so it works before CSS variables are hydrated.
 */
function SplashMark({ size }: { size: number }) {
  const radius = Math.round(size * 0.22);
  const glowOffset = Math.round(size * 0.09);
  const starSize = Math.round(size * 0.28);
  const starTopOffset = Math.round(size * 0.07);
  const starLeftOffset = Math.round(size * 0.05);

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      {/* Green underglow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: radius,
          background: "#22C55E",
          transform: `translate(${glowOffset}px, ${glowOffset}px)`,
        }}
      />
      {/* Black tile */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: radius,
          background: "#0E0E0E",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-heebo, 'Heebo', system-ui, sans-serif)",
            fontWeight: 900,
            fontSize: Math.round(size * 0.55),
            lineHeight: 1,
            color: "#FFFBF0",
          }}
        >
          מ
        </span>
      </div>
      {/* Yellow ✦ star — top-left corner */}
      <span
        style={{
          position: "absolute",
          top: -starTopOffset,
          left: -starLeftOffset,
          fontSize: starSize,
          color: "#FACC15",
          lineHeight: 1,
          pointerEvents: "none",
          userSelect: "none",
        }}
        aria-hidden
      >
        ✦
      </span>
    </div>
  );
}

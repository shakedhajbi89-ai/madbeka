"use client";

import { useEffect } from "react";

/**
 * Registers the Madbeka service worker on every page load in production.
 *
 * Why this lives as a tiny client component:
 *  - Service worker registration is a browser-only API — must run in a
 *    "use client" boundary.
 *  - Having its own component keeps `layout.tsx` declarative and makes it
 *    obvious (via grep) where SW lifecycle is controlled.
 *
 * Registration is idempotent; calling register() for the same URL after
 * the SW is already installed is a no-op, so React 19 strict-mode double
 * effects in dev do not cause problems.
 */
export function SwRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // Skip in local dev — SWs and Next.js hot-reload don't mix well; you
    // end up with stale JS served from cache even after restarting `next
    // dev`. Production is where this matters (for "Install app" to
    // appear in Chrome's menu on Android).
    if (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ) {
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch((err) => {
      // Non-fatal — app works without SW, user just loses WebAPK install.
      console.warn("Service worker registration failed:", err);
    });
  }, []);

  return null;
}

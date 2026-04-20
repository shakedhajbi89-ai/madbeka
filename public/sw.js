/**
 * Madbeka service worker.
 *
 * Sole purpose right now: exist with a `fetch` listener so Chrome on
 * Android treats the site as installable as a WebAPK (full PWA). Without
 * this, "Add to Home Screen" falls back to a browser-branded shortcut
 * that renders the Chrome logo on top of our icon.
 *
 * We do NOT cache or intercept requests yet. Going offline is not a
 * near-term goal and a misconfigured cache is far worse for a sticker
 * generator than no cache at all (users would see stale JS, old paid-
 * status reads, etc.). The fetch handler is a deliberate pass-through.
 */

self.addEventListener("install", () => {
  // Activate immediately on the next page load instead of waiting for all
  // existing tabs to close first.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Take control of any already-open pages on first activation.
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Pass-through. Chrome's PWA installability check requires a fetch
  // handler to be present on at least one navigation request — it does
  // not require the handler to do anything clever.
  event.respondWith(fetch(event.request));
});

/**
 * Madbeka service worker — v2.
 *
 * Sole purpose: exist with a `fetch` listener so Chrome on Android treats
 * the site as installable as a WebAPK (full PWA). Without this,
 * "Add to Home Screen" falls back to a browser-branded shortcut that
 * renders the Chrome logo on top of our icon.
 *
 * We do NOT cache or intercept requests. Going offline is not a near-term
 * goal and a misconfigured cache is far worse for a sticker generator than
 * no cache at all (users would see stale JS, old paid-status reads, etc.).
 * The fetch handler is a deliberate pass-through.
 *
 * VERSIONING: bump CACHE_NAME when you need to invalidate any future caches
 * (not used today, but required by Chrome's TWA/WebAPK audit checklist).
 */

const CACHE_NAME = "madbeka-v3";

self.addEventListener("install", () => {
  // Activate immediately on the next page load instead of waiting for all
  // existing tabs to close first.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Purge any old versioned caches (safe no-op today since nothing is cached).
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_NAME)
            .map((k) => caches.delete(k)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  // Pass-through. Chrome's PWA installability check requires a fetch
  // handler to be present on at least one navigation request — it does
  // not require the handler to do anything clever.
  event.respondWith(fetch(event.request));
});

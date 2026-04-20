import type { MetadataRoute } from "next";

/**
 * PWA manifest — lets Android Chrome show "Add to Home Screen" and opens
 * the installed app in a full-screen standalone window (no browser chrome).
 *
 * Next.js 16 turns this file into /manifest.webmanifest automatically and
 * injects the <link rel="manifest"> tag into every page.
 *
 * Icons are generated dynamically by the /icons/:purpose/:size route, so
 * we don't commit binary PNGs to the repo.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Madbeka — מתמונה למדבקה תוך 10 שניות",
    short_name: "Madbeka",
    description:
      "מחולל המדבקות הישראלי הכי מהיר. הופכים תמונה למדבקת וואטסאפ תוך 10 שניות.",
    start_url: "/",
    // standalone hides the URL bar — the app feels native once installed.
    display: "standalone",
    // Splash screen background while the app boots. White matches the
    // wordmark-on-white icon; avoids a jarring color flash on launch.
    background_color: "#ffffff",
    // WhatsApp green for the Android status bar tint while inside the PWA.
    theme_color: "#25D366",
    orientation: "portrait",
    lang: "he",
    dir: "rtl",
    categories: ["photo", "social", "utilities"],
    icons: [
      {
        src: "/icons/any/192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/any/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable/192",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/maskable/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

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
    name: "מדבקה — מדבקות וואטסאפ בעברית",
    short_name: "מדבקה",
    description:
      "עורך המדבקות הישראלי הכי מהיר. כתוב בעברית, עצב, ושלח לוואטסאפ תוך שניות.",
    start_url: "/",
    // standalone hides the URL bar — the app feels native once installed.
    display: "standalone",
    // Cream brand background for the Android splash screen.
    background_color: "#FBF3DC",
    // Brand green for the Android status bar tint while inside the PWA.
    theme_color: "#22C55E",
    orientation: "portrait-primary",
    lang: "he",
    dir: "rtl",
    categories: ["productivity", "social", "photo"],
    screenshots: [
      {
        src: "/screenshots/mobile",
        sizes: "390x844",
        type: "image/png",
        form_factor: "narrow",
        label: "מסך עורך מדבקות — נייד",
      },
      {
        src: "/screenshots/wide",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
        label: "מסך עורך מדבקות — דסקטופ",
      },
    ],
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

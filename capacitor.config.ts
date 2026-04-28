import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor configuration for the Madbeka Android app.
 *
 * Strategy: thin native wrapper that loads the live web app from
 * madbekaapp.co.il inside a WebView. Everything (the editor, bg
 * removal, sticker rendering) keeps running as the same browser code
 * the website serves — we don't fork the codebase. The native layer
 * exists only to expose Android intents the web platform can't reach,
 * primarily WhatsApp's Sticker Pack API.
 *
 * webDir contains a tiny redirect page so the build pipeline has
 * something to bundle even though the runtime always navigates to the
 * remote URL.
 */
const config: CapacitorConfig = {
  appId: "il.co.madbekaapp",
  appName: "Madbeka",
  webDir: "capacitor-www",
  server: {
    // Production: load the live web app. Updates ship instantly
    // through Vercel — no Play Store review for content changes.
    url: "https://www.madbekaapp.co.il",
    // Allow the app to talk to its own API + Clerk + LemonSqueezy.
    // androidScheme stays "https" so cookies / localStorage work
    // across the WebView and the live origin without partitioning.
    androidScheme: "https",
    cleartext: false,
  },
  android: {
    // Block back-press from accidentally exiting the app on the
    // editor screen — the WebView's history will take it back instead.
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
};

export default config;

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
    // Allow the WebView to navigate inside these hosts without launching
    // an external browser. Required for:
    //   - Clerk OAuth flows (accounts.clerk.dev + *.clerk.accounts.dev)
    //   - Clerk hosted sign-in on our custom domain
    //   - LemonSqueezy checkout overlay (app.lemonsqueezy.com)
    // Without these entries, Capacitor's launchIntent() intercepts the
    // navigation, opens Chrome, and the MainActivity immediately gets
    // onPause() — causing the "App resumed → App paused" within 600ms
    // that was observed in logcat.
    allowNavigation: [
      "*.madbekaapp.co.il",
      "madbekaapp.co.il",
      "accounts.clerk.dev",
      "*.clerk.accounts.dev",
      "clerk.madbekaapp.co.il",
      "app.lemonsqueezy.com",
    ],
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

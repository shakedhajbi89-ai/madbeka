import type { NextConfig } from "next";

// Clerk requires these domains for auth iframes, JS bundles, and API calls.
// See: https://clerk.com/docs/security/security-headers
const clerkScriptSrc = [
  "https://clerk.com",
  "https://*.clerk.com",
  "https://*.clerk.accounts.dev",
  "https://clerk.dev",
  "https://*.clerk.dev",
  "https://*.lclerk.com",
].join(" ");

const clerkConnectSrc = [
  "https://clerk.com",
  "https://*.clerk.com",
  "https://*.clerk.accounts.dev",
  "https://clerk.dev",
  "https://*.clerk.dev",
  "https://*.lclerk.com",
].join(" ");

const clerkFrameSrc = [
  "https://clerk.com",
  "https://*.clerk.com",
  "https://*.clerk.accounts.dev",
  "https://clerk.dev",
  "https://*.clerk.dev",
  "https://*.lclerk.com",
].join(" ");

// @imgly/background-removal downloads its ONNX model + WASM runtime from
// this CDN at first invocation. Without it, connect-src blocks the fetch
// and bg removal silently fails ("לא הצלחנו להסיר את הרקע").
const imglyConnect = "https://staticimgly.com";

const csp = [
  "default-src 'self'",
  // Scripts: self + Clerk + Google Analytics/Tag Manager.
  // - 'wasm-unsafe-eval' for @imgly's WASM module instantiation.
  // - 'unsafe-eval' because @imgly's ONNX runtime evaluates JS strings
  //   (`new Function(...)`) when bootstrapping the inference backend.
  //   Without it the model load fails with EvalError. We accept this
  //   weakening because (a) bg removal runs entirely client-side on
  //   user-supplied images, (b) we don't fetch user-controlled JS, and
  //   (c) the alternative would be a server-side rewrite that breaks
  //   the privacy promise ("רץ במכשיר שלך — לא בענן").
  // - blob: lets @imgly do `import("blob:...")` on its compiled WASM
  //   worker module — without it the dynamic import is rejected.
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' blob: ${clerkScriptSrc} https://www.googletagmanager.com`,
  // Styles: self + inline (Tailwind/shadcn) + Google Fonts
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Fonts: self + Google Fonts CDN
  "font-src 'self' data: https://fonts.gstatic.com",
  // Images: self + data URIs + blob (canvas export) + GA pixel +
  // Clerk profile pics (img.clerk.com is where uploaded avatars live;
  // *.clerk.com covers OAuth-fetched images from Google/Apple).
  "img-src 'self' data: blob: https://img.clerk.com https://*.clerk.com https://www.google-analytics.com https://www.googletagmanager.com",
  // Connect: self + Clerk API + GA/GTM + imgly model CDN.
  // blob: is required because @imgly fetch()es WASM model chunks it
  // has cached locally as Blob URLs (separate from the dynamic import,
  // which is gated by script-src).
  `connect-src 'self' blob: ${clerkConnectSrc} ${imglyConnect} https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com`,
  // Frames: Clerk auth iframes only (no clickjacking)
  `frame-src ${clerkFrameSrc}`,
  // No embedding this site in iframes (clickjacking protection)
  "frame-ancestors 'none'",
  // Workers: blob for @imgly/background-removal
  "worker-src 'self' blob:",
  // Misc hardening
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  // Remove "X-Powered-By: Next.js" fingerprinting header
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: csp,
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

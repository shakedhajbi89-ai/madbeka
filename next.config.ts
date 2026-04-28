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
  "https://*.lclark.com",
  "https://*.lclerk.com",
].join(" ");

// @imgly/background-removal downloads its ONNX model + WASM runtime from
// this CDN at first invocation. Without it, connect-src blocks the fetch
// and bg removal silently fails ("לא הצלחנו להסיר את הרקע").
const imglyConnect = "https://staticimgly.com";

const csp = [
  "default-src 'self'",
  // Scripts: self + Clerk + Google Analytics/Tag Manager.
  // 'wasm-unsafe-eval' lets @imgly instantiate the bg-removal WASM module
  // without falling back to the legacy 'unsafe-eval' grant.
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' ${clerkScriptSrc} https://www.googletagmanager.com`,
  // Styles: self + inline (Tailwind/shadcn) + Google Fonts
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Fonts: self + Google Fonts CDN
  "font-src 'self' data: https://fonts.gstatic.com",
  // Images: self + data URIs + blob (canvas export) + GA pixel
  "img-src 'self' data: blob: https://www.google-analytics.com https://www.googletagmanager.com",
  // Connect: self + Clerk API + GA/GTM + imgly model CDN
  `connect-src 'self' ${clerkConnectSrc} ${imglyConnect} https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com`,
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

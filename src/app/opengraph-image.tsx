import { ImageResponse } from "next/og";
import fs from "node:fs";
import path from "node:path";
import { BRAND_NAME, PUBLIC_DOMAIN } from "@/lib/brand";

/**
 * Open Graph image served at /opengraph-image. Next.js App Router picks
 * this file up automatically and injects `<meta property="og:image">`
 * into every page. That's the image LinkedIn / WhatsApp / Twitter (X) /
 * Facebook / Slack / Telegram preview when someone shares madbekaapp.co.il.
 *
 * We render it on-demand with the same Hebrew font the product uses
 * (Heebo 900) so the brand voice is consistent. Satori is the rendering
 * engine — it only speaks JSX + a limited CSS subset. Layout built here
 * favors big impact over fine-detail polish.
 */

export const alt = "Madbeka — עורך מדבקות וואטסאפ בעברית";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  // Load Hebrew-capable Heebo weights from the installed @fontsource
  // package. Reading from node_modules at request time keeps us off any
  // external CDN so the OG image works even if CDN DNS blips.
  const heeboBold = fs.readFileSync(
    path.join(
      process.cwd(),
      "node_modules/@fontsource/heebo/files/heebo-hebrew-700-normal.woff",
    ),
  );
  const heeboBlack = fs.readFileSync(
    path.join(
      process.cwd(),
      "node_modules/@fontsource/heebo/files/heebo-hebrew-900-normal.woff",
    ),
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background:
            "linear-gradient(135deg, #25D366 0%, #128C7E 55%, #0F766E 100%)",
          fontFamily: "Heebo",
          color: "white",
          padding: 60,
          position: "relative",
        }}
      >
        {/* Faint background checker to hint at the "transparent sticker" vibe */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.08) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.08) 0%, transparent 40%)",
            display: "flex",
          }}
        />

        {/* Sticker mock — word + emoji side by side, white card, shadow */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 36,
            background: "white",
            padding: "44px 72px",
            borderRadius: 36,
            boxShadow: "0 30px 80px rgba(0,0,0,0.35)",
            marginBottom: 44,
            transform: "rotate(-3deg)",
          }}
        >
          <div
            style={{
              fontSize: 130,
              fontWeight: 900,
              letterSpacing: -2,
              color: "#0F172A",
              direction: "rtl",
            }}
          >
            יאללה
          </div>
          <div style={{ fontSize: 110, lineHeight: 1 }}>🔥</div>
        </div>

        {/* Wordmark */}
        <div
          style={{
            fontSize: 104,
            fontWeight: 900,
            letterSpacing: -4,
            marginTop: 8,
          }}
        >
          {BRAND_NAME}
        </div>

        {/* Hebrew tagline */}
        <div
          style={{
            fontSize: 40,
            fontWeight: 700,
            marginTop: 14,
            direction: "rtl",
            textAlign: "center",
            maxWidth: 1000,
            lineHeight: 1.25,
          }}
        >
          מדבקות וואטסאפ בעברית — צור, גרור, שתף
        </div>

        {/* URL */}
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            marginTop: 26,
            opacity: 0.9,
            letterSpacing: 1,
          }}
        >
          {PUBLIC_DOMAIN}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Heebo", data: heeboBold, weight: 700, style: "normal" },
        { name: "Heebo", data: heeboBlack, weight: 900, style: "normal" },
      ],
    },
  );
}

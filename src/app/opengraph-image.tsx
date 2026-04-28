import { ImageResponse } from "next/og";
import fs from "node:fs";
import path from "node:path";
import { BRAND_NAME } from "@/lib/brand";

/**
 * Satori (the engine behind next/og ImageResponse) doesn't run a real
 * bidi algorithm, so `direction: rtl` doesn't actually flip glyph order
 * for Hebrew. Reverse strings in memory before rendering — Satori then
 * lays the reversed code points out LTR and a Hebrew reader scanning
 * RTL sees the original forward-reading text.
 */
function rtl(s: string): string {
  return Array.from(s).reverse().join("");
}

/**
 * Open Graph image — 1200×630, served at /opengraph-image. Next.js
 * auto-wires this into <meta property="og:image"> on every page.
 *
 * Visual style: Playful Sticker Shop. Cream background with pastel
 * radial corners + sticker mocks scattered around the headline.
 */

export const alt = "Madbeka — עורך מדבקות וואטסאפ בעברית";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#0F0E0C";
const CREAM = "#FFF8EC";
const WA = "#25D366";
const WA_STROKE_DARK = "#06352b";
const PINK = "#FF6EB5";
const PINK_STROKE = "#5b1b73";
const YELLOW = "#F4C430";
const PURPLE = "#7C3AED";
const PURPLE_STROKE = "#1a063b";

export default async function Image() {
  // Heebo from @fontsource — works for Hebrew. Both 700 and 900 weights.
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
          backgroundColor: CREAM,
          backgroundImage: `radial-gradient(circle at 20% 25%, rgba(37,211,102,0.25), transparent 60%), radial-gradient(circle at 80% 75%, rgba(255,110,181,0.18), transparent 60%)`,
          fontFamily: "Heebo",
          color: INK,
          padding: 60,
          position: "relative",
        }}
      >
        {/* Floating sample stickers — split into individual elements so
            we can position each absolutely without dynamic mapping that
            Satori sometimes chokes on. Each is a card with the sticker
            text inside. */}
        <div
          style={{
            position: "absolute",
            top: 70,
            right: 80,
            transform: "rotate(-8deg)",
            backgroundColor: "#fff",
            border: `3px solid ${INK}`,
            borderRadius: 22,
            padding: "12px 22px",
            boxShadow: `7px 9px 0 ${INK}`,
            display: "flex",
            fontSize: 78,
            fontWeight: 900,
            color: WA,
            lineHeight: 1,
          }}
        >
          {rtl("יאללה")}
        </div>
        <div
          style={{
            position: "absolute",
            top: 380,
            right: 110,
            transform: "rotate(6deg)",
            backgroundColor: "#fff",
            border: `3px solid ${INK}`,
            borderRadius: 22,
            padding: "12px 22px",
            boxShadow: `7px 9px 0 ${INK}`,
            display: "flex",
            fontSize: 64,
            fontWeight: 900,
            color: YELLOW,
            lineHeight: 1,
          }}
        >
          {rtl("סבבה")}
        </div>
        <div
          style={{
            position: "absolute",
            top: 70,
            left: 90,
            transform: "rotate(-4deg)",
            backgroundColor: "#fff",
            border: `3px solid ${INK}`,
            borderRadius: 22,
            padding: "12px 22px",
            boxShadow: `7px 9px 0 ${INK}`,
            display: "flex",
            fontSize: 72,
            fontWeight: 900,
            color: PINK,
            lineHeight: 1,
          }}
        >
          {rtl("חחחח")}
        </div>
        <div
          style={{
            position: "absolute",
            top: 410,
            left: 140,
            transform: "rotate(10deg)",
            backgroundColor: "#fff",
            border: `3px solid ${INK}`,
            borderRadius: 22,
            padding: "12px 22px",
            boxShadow: `7px 9px 0 ${INK}`,
            display: "flex",
            fontSize: 58,
            fontWeight: 900,
            color: PURPLE,
            lineHeight: 1,
          }}
        >
          {rtl("אחי")}
        </div>

        {/* Centered logo + headline + URL */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              background: INK,
              color: CREAM,
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 42,
              fontWeight: 900,
              transform: "rotate(-4deg)",
              boxShadow: `4px 5px 0 ${WA}`,
            }}
          >
            {rtl("מ")}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 38,
              fontWeight: 900,
              letterSpacing: -1,
              color: INK,
            }}
          >
            {BRAND_NAME}
          </div>
        </div>

        {/* Big headline — single line on this canvas; the WA-green
            "בעברית" is its own div so we can color it independently. */}
        <div
          style={{
            fontSize: 92,
            fontWeight: 900,
            lineHeight: 0.95,
            letterSpacing: -3,
            color: INK,
            textAlign: "center",
            maxWidth: 1080,
            display: "flex",
            justifyContent: "center",
            alignItems: "baseline",
          }}
        >
          <div style={{ display: "flex" }}>{rtl("מדבקות ואטסאפ ")}</div>
          <div style={{ display: "flex", color: WA, marginRight: 14 }}>
            {rtl("בעברית")}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 56,
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: -2,
            color: INK,
            marginTop: 16,
          }}
        >
          {rtl("בכמה שניות")}
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 28,
            fontWeight: 700,
            marginTop: 28,
            color: INK,
            opacity: 0.7,
            display: "flex",
          }}
        >
          {rtl("הקלד · עצב · שלח · ₪29 לכל החיים")}
        </div>

        {/* URL pill */}
        <div
          style={{
            display: "flex",
            marginTop: 26,
            background: INK,
            color: CREAM,
            padding: "10px 22px",
            borderRadius: 100,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: 1,
            boxShadow: `4px 5px 0 ${WA}`,
          }}
        >
          madbekaapp.co.il
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

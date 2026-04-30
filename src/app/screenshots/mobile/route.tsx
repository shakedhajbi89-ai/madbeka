import { ImageResponse } from "next/og";
import fs from "node:fs";
import path from "node:path";

/**
 * PWA screenshot — mobile (390×844).
 * Referenced in manifest.ts so Android Play Store and Chrome install prompts
 * can show a preview of the app before the user installs.
 */

export const revalidate = 86400;

const INK = "#0F0E0C";
const CREAM = "#FBF3DC";
const WA = "#22C55E";
const PINK = "#FF6EB5";
const YELLOW = "#F4C430";

function rtl(s: string): string {
  return Array.from(s).reverse().join("");
}

export async function GET() {
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
          width: 390,
          height: 844,
          backgroundColor: CREAM,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Heebo",
          color: INK,
          gap: 28,
          padding: "48px 32px",
          backgroundImage: `radial-gradient(circle at 15% 20%, rgba(34,197,94,0.2), transparent 55%), radial-gradient(circle at 85% 80%, rgba(255,110,181,0.15), transparent 55%)`,
        }}
      >
        {/* Logo */}
        <div
          style={{
            width: 72,
            height: 72,
            background: INK,
            color: CREAM,
            borderRadius: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 44,
            fontWeight: 900,
            transform: "rotate(-4deg)",
            boxShadow: `4px 5px 0 ${WA}`,
          }}
        >
          {rtl("מ")}
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 52, fontWeight: 900, lineHeight: 0.95, letterSpacing: -2, display: "flex" }}>
            {rtl("מדבקות וואטסאפ")}
          </div>
          <div style={{ fontSize: 52, fontWeight: 900, lineHeight: 0.95, letterSpacing: -2, color: WA, display: "flex" }}>
            {rtl("בעברית")}
          </div>
        </div>

        {/* Sample stickers */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
          {[
            { text: "יאללה", color: WA },
            { text: "סבבה", color: YELLOW },
            { text: "אחי", color: PINK },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                background: "#fff",
                border: `2.5px solid ${INK}`,
                borderRadius: 18,
                padding: "10px 20px",
                display: "flex",
                fontSize: 46,
                fontWeight: 900,
                color: s.color,
                boxShadow: `5px 6px 0 ${INK}`,
                transform: `rotate(${(i - 1) * 5}deg)`,
              }}
            >
              {rtl(s.text)}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div
          style={{
            background: INK,
            color: CREAM,
            borderRadius: 100,
            padding: "12px 28px",
            fontSize: 16,
            fontWeight: 700,
            display: "flex",
            letterSpacing: 0.5,
            boxShadow: `3px 4px 0 ${WA}`,
          }}
        >
          madbekaapp.co.il
        </div>
      </div>
    ),
    {
      width: 390,
      height: 844,
      fonts: [
        { name: "Heebo", data: heeboBold, weight: 700, style: "normal" },
        { name: "Heebo", data: heeboBlack, weight: 900, style: "normal" },
      ],
    },
  );
}

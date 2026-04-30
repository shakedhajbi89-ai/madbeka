import { ImageResponse } from "next/og";
import fs from "node:fs";
import path from "node:path";

/**
 * PWA screenshot — wide (1280×720).
 * Referenced in manifest.ts for desktop/tablet install prompts.
 */

export const revalidate = 86400;

const INK = "#0F0E0C";
const CREAM = "#FBF3DC";
const WA = "#22C55E";
const PINK = "#FF6EB5";
const YELLOW = "#F4C430";
const PURPLE = "#7C3AED";

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
          width: 1280,
          height: 720,
          backgroundColor: CREAM,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Heebo",
          color: INK,
          gap: 80,
          padding: "60px 80px",
          backgroundImage: `radial-gradient(circle at 15% 25%, rgba(34,197,94,0.2), transparent 55%), radial-gradient(circle at 85% 75%, rgba(255,110,181,0.15), transparent 55%)`,
        }}
      >
        {/* Left: sticker examples */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
            flex: 1,
          }}
        >
          {[
            { text: "יאללה", color: WA, rot: -5 },
            { text: "סבבה", color: YELLOW, rot: 4 },
            { text: "חחחח", color: PINK, rot: -3 },
            { text: "אחי", color: PURPLE, rot: 6 },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                background: "#fff",
                border: `3px solid ${INK}`,
                borderRadius: 22,
                padding: "12px 26px",
                display: "flex",
                fontSize: 72,
                fontWeight: 900,
                color: s.color,
                boxShadow: `7px 8px 0 ${INK}`,
                transform: `rotate(${s.rot}deg)`,
                alignSelf: i % 2 === 0 ? "flex-start" : "flex-end",
              }}
            >
              {rtl(s.text)}
            </div>
          ))}
        </div>

        {/* Right: headline + CTA */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 24,
            flex: 1.2,
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              background: INK,
              color: CREAM,
              borderRadius: 22,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 50,
              fontWeight: 900,
              transform: "rotate(-4deg)",
              boxShadow: `5px 6px 0 ${WA}`,
            }}
          >
            {rtl("מ")}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: 84, fontWeight: 900, lineHeight: 0.9, letterSpacing: -3, display: "flex" }}>
              {rtl("מדבקות")}
            </div>
            <div style={{ fontSize: 84, fontWeight: 900, lineHeight: 0.9, letterSpacing: -3, display: "flex" }}>
              {rtl("וואטסאפ")}
            </div>
            <div style={{ fontSize: 84, fontWeight: 900, lineHeight: 0.9, letterSpacing: -3, color: WA, display: "flex" }}>
              {rtl("בעברית")}
            </div>
          </div>

          <div style={{ fontSize: 24, fontWeight: 700, opacity: 0.65, display: "flex" }}>
            {rtl("הקלד · עצב · שלח לוואטסאפ")}
          </div>

          <div
            style={{
              background: INK,
              color: CREAM,
              borderRadius: 100,
              padding: "14px 32px",
              fontSize: 18,
              fontWeight: 700,
              display: "flex",
              letterSpacing: 1,
              boxShadow: `4px 5px 0 ${WA}`,
            }}
          >
            madbekaapp.co.il
          </div>
        </div>
      </div>
    ),
    {
      width: 1280,
      height: 720,
      fonts: [
        { name: "Heebo", data: heeboBold, weight: 700, style: "normal" },
        { name: "Heebo", data: heeboBlack, weight: 900, style: "normal" },
      ],
    },
  );
}

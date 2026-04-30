/**
 * Shared logo renderer for Next.js icon generation (favicon, apple-icon,
 * PWA manifest icons).
 *
 * Renders the Madbeka brand mark:
 *   - Black square (#0E0E0E) with rounded corners (22% of size)
 *   - White Heebo 900 "מ" centered, font-size ~60% of size
 *   - Green (#22C55E) shadow block behind-and-below the tile (underglow)
 *   - Yellow (#FACC15) ✦ star in the top-left corner
 *
 * Font is fetched at generation time since `next/og` ImageResponse does not
 * have access to the browser font cache or CSS @font-face rules.
 */

export async function loadGoogleFont(
  family: string,
  text: string,
): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=${family}&text=${encodeURIComponent(text)}`;
  const cssRes = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });
  const css = await cssRes.text();
  const match = css.match(
    /src:\s*url\((.+?)\)\s*format\('(truetype|opentype)'\)/,
  );
  if (!match) throw new Error(`font CSS missing truetype src for ${family}`);
  const fontRes = await fetch(match[1]);
  if (!fontRes.ok) throw new Error(`font binary fetch failed: ${fontRes.status}`);
  return fontRes.arrayBuffer();
}

/**
 * Brand mark JSX for next/og ImageResponse.
 *
 * paddingRatio:
 *  - "any" purpose: 0.08  → content fills tile edge-to-edge
 *  - "maskable":    0.18  → safe zone for Android's squircle/circle mask
 */
export function LogoImageJSX({
  size,
  paddingRatio = 0.08,
}: {
  size: number;
  paddingRatio?: number;
}) {
  const pad = Math.round(size * paddingRatio);
  const tileSize = size - pad * 2;
  const radius = Math.round(tileSize * 0.22);
  const glowOffset = Math.round(tileSize * 0.09);
  const mFontSize = Math.round(tileSize * 0.60);
  const starSize = Math.round(tileSize * 0.28);
  const starOffset = Math.round(tileSize * 0.06);

  return (
    // Outer wrapper — full icon square, white background so the star/glow
    // sit on a neutral field. The tile is positioned absolutely inside.
    <div
      style={{
        width: size,
        height: size,
        background: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      {/* Green underglow — offset square behind-and-below the black tile */}
      <div
        style={{
          position: "absolute",
          width: tileSize,
          height: tileSize,
          borderRadius: radius,
          background: "#22C55E",
          left: pad + glowOffset,
          top: pad + glowOffset,
        }}
      />

      {/* Black tile */}
      <div
        style={{
          position: "absolute",
          width: tileSize,
          height: tileSize,
          borderRadius: radius,
          background: "#0E0E0E",
          left: pad,
          top: pad,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* White "מ" — Heebo 900 */}
        <div
          style={{
            fontFamily: "Heebo",
            fontWeight: 900,
            fontSize: mFontSize,
            color: "#FFFFFF",
            lineHeight: 1,
            display: "flex",
          }}
        >
          {"מ"}
        </div>
      </div>

      {/* Yellow ✦ star — top-left corner, overlapping the tile edge */}
      <div
        style={{
          position: "absolute",
          left: pad - starOffset,
          top: pad - starOffset,
          fontSize: starSize,
          color: "#FACC15",
          lineHeight: 1,
          display: "flex",
        }}
      >
        ✦
      </div>
    </div>
  );
}

// Subset text: Hebrew mem + star glyph for the Google Font endpoint.
// Heebo needs just the "מ" glyph — include a few Latin chars as fallback.
export const LOGO_TEXT = "מ";
export const FULL_WORDMARK = "Madbeka";

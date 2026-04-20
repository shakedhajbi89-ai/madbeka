/**
 * Shared logo renderer for Next.js icon generation (favicon, apple-icon,
 * PWA manifest icons). Renders the brand mark in Permanent Marker — a
 * thick graffiti / marker-pen Google Font that reads as a hand-applied
 * sticker, matching the Madbeka voice.
 *
 * Font is fetched at generation time since `next/og` ImageResponse does not
 * have access to the browser font cache or CSS @font-face rules.
 */

/**
 * Fetch a Google Font's binary TTF data for use inside `next/og`
 * ImageResponse. Passing `text` to the CSS endpoint returns a subset TTF
 * containing only the glyphs we need — keeps the fetch tiny.
 */
export async function loadGoogleFont(
  family: string,
  text: string,
): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=${family}&text=${encodeURIComponent(
    text,
  )}`;
  const cssRes = await fetch(url, {
    // Spoof a modern UA so Google serves woff2/truetype CSS we can parse
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
 * JSX block for the Madbeka brush wordmark. Reusable across every icon
 * surface (favicon, apple-icon, manifest icons).
 *
 * `padding` is a fraction of `size`:
 *  - "any" purpose icons: ~0.08 (subject fills the tile edge-to-edge)
 *  - "maskable" icons: ~0.18 (subject stays inside Android's 80% safe zone
 *    so rounded / squircle / teardrop masks don't crop the text)
 */
export function LogoImageJSX({
  size,
  paddingRatio = 0.08,
}: {
  size: number;
  paddingRatio?: number;
}) {
  const pad = size * paddingRatio;
  const availableSide = size * (1 - 2 * paddingRatio);

  // Vertical layout: bold "M" on top, "Madbeka" wordmark below.
  // Permanent Marker is narrower than Rubik Wet Paint was, so we can push
  // the M a touch larger without clipping at the tile edges.
  //
  // height budget inside the tile:
  //   M letter   : 0.70
  //   gap        : 0.04
  //   wordmark   : 0.16
  //   slack      : 0.10  (breathing room top + bottom)
  const mFontSize = availableSide * 0.70;
  const wordFontSize = availableSide * 0.16;
  const gap = availableSide * 0.04;

  return (
    <div
      style={{
        width: size,
        height: size,
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: pad,
        gap,
      }}
    >
      <div
        style={{
          display: "flex",
          fontFamily: "Permanent Marker",
          fontSize: mFontSize,
          color: "#000000",
          lineHeight: 1,
        }}
      >
        M
      </div>
      <div
        style={{
          display: "flex",
          fontFamily: "Permanent Marker",
          fontSize: wordFontSize,
          color: "#000000",
          lineHeight: 1,
          letterSpacing: "-0.01em",
          whiteSpace: "nowrap",
        }}
      >
        Madbeka
      </div>
    </div>
  );
}

// Subset text passed to the Google Font endpoint — needs to cover every
// glyph we render (M + a/d/b/e/k from "Madbeka"). Listing the full word is
// the simplest way to guarantee the subset is complete.
export const LOGO_TEXT = "Madbeka";
export const FULL_WORDMARK = "Madbeka";

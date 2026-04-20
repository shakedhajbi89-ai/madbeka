/**
 * Shared logo renderer for Next.js icon generation (favicon, apple-icon,
 * PWA manifest icons). Renders the "Madbeka" wordmark in Rubik Wet Paint —
 * a brushy/dripping Google Font that matches the hand-painted reference.
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

  // Rubik Wet Paint is a wide display face — each "Madbeka" glyph averages
  // ~0.72em, so the full word is ≈ 5.0em (7 chars × 0.72). We size the font
  // so 5.0em fits inside the available width with a small safety margin,
  // and we account for the -3° rotation which extends the bounding box
  // slightly along the diagonal.
  //
  // availableWidth = size * (1 - 2*paddingRatio)
  // fontSize     ≈ availableWidth / 5.4   (5.0 for glyphs + 0.4 rotation slack)
  const availableWidth = size * (1 - 2 * paddingRatio);
  const fontSize = availableWidth / 5.4;

  return (
    <div
      style={{
        width: size,
        height: size,
        background: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: pad,
      }}
    >
      <div
        style={{
          display: "flex",
          fontFamily: "Rubik Wet Paint",
          fontSize,
          color: "#000000",
          letterSpacing: "-0.01em",
          // Subtle tilt mimics the hand-drawn reference without eating so
          // much horizontal room that the last glyph clips.
          transform: "rotate(-3deg)",
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        Madbeka
      </div>
    </div>
  );
}

export const LOGO_TEXT = "Madbeka";

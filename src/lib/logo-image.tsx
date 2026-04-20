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

  // Single-glyph "M" lets us size the letter huge and keeps it crisp even
  // at 32×32 (favicon). Fills ~90% of the available tile height — the
  // letter is the brand mark, whitespace around it is minimal.
  const availableSide = size * (1 - 2 * paddingRatio);
  const fontSize = availableSide * 0.95;

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
          lineHeight: 1,
          // Nudge the glyph up a hair — Rubik Wet Paint's metrics leave
          // extra descender whitespace, so without this the "M" sits low
          // inside the tile.
          marginTop: -fontSize * 0.04,
        }}
      >
        M
      </div>
    </div>
  );
}

// Only the "M" glyph is needed for the icon, but we keep the wordmark
// available as a constant in case we want to render full "Madbeka" text
// elsewhere (e.g. in-app header, OG social card).
export const LOGO_TEXT = "M";
export const FULL_WORDMARK = "Madbeka";

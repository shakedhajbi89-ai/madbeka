import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { LOGO_TEXT, LogoImageJSX, loadGoogleFont } from "@/lib/logo-image";

/**
 * Dynamic PWA manifest icons.
 *
 * URL shape: /icons/:purpose/:size
 *   purpose ∈ { "any", "maskable" }
 *   size    ∈ { 192, 512 }
 *
 * Using a single route keeps the four-icon matrix declarative in
 * `manifest.ts` without committing four binary PNG files to the repo.
 *
 * Android applies one of several mask shapes (squircle, circle, teardrop)
 * to "maskable" icons and crops anything outside an inner ~80% circle — so
 * the maskable variant uses extra padding to keep the wordmark intact
 * after masking.
 */

const ALLOWED_SIZES = [192, 512] as const;
const ALLOWED_PURPOSES = ["any", "maskable"] as const;
type Purpose = (typeof ALLOWED_PURPOSES)[number];

// Cache the generated PNGs at the edge for a day — the icon is static and
// the Google Font fetch on cold start is the slow part.
export const revalidate = 86400;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ purpose: string; size: string }> },
) {
  const { purpose, size: sizeStr } = await params;

  const size = Number(sizeStr);
  if (!ALLOWED_SIZES.includes(size as (typeof ALLOWED_SIZES)[number])) {
    return new Response("unsupported size", { status: 404 });
  }
  if (!ALLOWED_PURPOSES.includes(purpose as Purpose)) {
    return new Response("unsupported purpose", { status: 404 });
  }

  // Maskable needs a bigger safe zone so Android's mask doesn't crop the
  // wordmark's tails/underline flourish.
  const paddingRatio = purpose === "maskable" ? 0.18 : 0.08;

  try {
    const fontData = await loadGoogleFont("Permanent+Marker", LOGO_TEXT);

    return new ImageResponse(
      <LogoImageJSX size={size} paddingRatio={paddingRatio} />,
      {
        width: size,
        height: size,
        fonts: [
          {
            name: "Permanent Marker",
            data: fontData,
            style: "normal",
            weight: 400,
          },
        ],
      },
    );
  } catch (err) {
    // Rare — would usually mean Google Fonts CSS endpoint changed shape or
    // the edge runtime couldn't reach fonts.gstatic.com. We'd rather a
    // missing icon than a hung request (PWA install will retry).
    console.error("icon generation failed", { purpose, size, err });
    return new Response("icon generation failed", { status: 500 });
  }
}

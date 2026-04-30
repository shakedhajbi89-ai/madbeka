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
 * Renders the Madbeka brand mark: black tile + white "מ" + green underglow +
 * yellow ✦ star. Uses Heebo 900 for the Hebrew glyph.
 */

const ALLOWED_SIZES = [192, 512] as const;
const ALLOWED_PURPOSES = ["any", "maskable"] as const;
type Purpose = (typeof ALLOWED_PURPOSES)[number];

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

  // Maskable needs extra safe zone for Android's mask shapes.
  const paddingRatio = purpose === "maskable" ? 0.18 : 0.08;

  try {
    // Heebo for the "מ" glyph — subset to just the chars we render.
    const fontData = await loadGoogleFont("Heebo:wght@900", LOGO_TEXT);

    return new ImageResponse(
      <LogoImageJSX size={size} paddingRatio={paddingRatio} />,
      {
        width: size,
        height: size,
        fonts: [
          {
            name: "Heebo",
            data: fontData,
            style: "normal",
            weight: 900,
          },
        ],
      },
    );
  } catch (err) {
    console.error("icon generation failed", { purpose, size, err });
    return new Response("icon generation failed", { status: 500 });
  }
}

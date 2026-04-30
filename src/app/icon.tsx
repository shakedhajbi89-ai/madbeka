import { ImageResponse } from "next/og";
import { LOGO_TEXT, LogoImageJSX, loadGoogleFont } from "@/lib/logo-image";

/**
 * Browser favicon — 32×32 tab icon.
 * Renders the Madbeka brand mark (black tile + white "מ" + green underglow + yellow ✦).
 */
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
  const fontData = await loadGoogleFont("Heebo:wght@900", LOGO_TEXT);
  return new ImageResponse(<LogoImageJSX size={32} paddingRatio={0.05} />, {
    ...size,
    fonts: [
      { name: "Heebo", data: fontData, style: "normal", weight: 900 },
    ],
  });
}

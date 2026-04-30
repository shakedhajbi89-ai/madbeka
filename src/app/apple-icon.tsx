import { ImageResponse } from "next/og";
import { LOGO_TEXT, LogoImageJSX, loadGoogleFont } from "@/lib/logo-image";

/**
 * Apple Touch Icon — 180×180, used when an iOS user adds the site to home screen.
 * Renders the Madbeka brand mark (black tile + white "מ" + green underglow + yellow ✦).
 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const fontData = await loadGoogleFont("Heebo:wght@900", LOGO_TEXT);
  return new ImageResponse(<LogoImageJSX size={180} paddingRatio={0.08} />, {
    ...size,
    fonts: [
      { name: "Heebo", data: fontData, style: "normal", weight: 900 },
    ],
  });
}

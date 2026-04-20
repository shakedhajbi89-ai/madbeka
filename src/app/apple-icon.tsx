import { ImageResponse } from "next/og";
import { LOGO_TEXT, LogoImageJSX, loadGoogleFont } from "@/lib/logo-image";

/**
 * Apple Touch Icon — used when an iOS user adds the site to their home
 * screen. iOS does not apply a mask, so we can use the "any" purpose
 * padding and let the full wordmark breathe edge-to-edge.
 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const fontData = await loadGoogleFont("Rubik+Wet+Paint", LOGO_TEXT);
  return new ImageResponse(<LogoImageJSX size={180} paddingRatio={0.08} />, {
    ...size,
    fonts: [
      { name: "Rubik Wet Paint", data: fontData, style: "normal", weight: 400 },
    ],
  });
}

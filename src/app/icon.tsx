import { ImageResponse } from "next/og";
import { LOGO_TEXT, LogoImageJSX, loadGoogleFont } from "@/lib/logo-image";

/**
 * Browser favicon — the tiny 32×32 icon in the tab. At this size the full
 * "Madbeka" wordmark is decorative rather than readable; that's intentional,
 * the brand shape/color is what identifies the tab.
 */
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
  const fontData = await loadGoogleFont("Permanent+Marker", LOGO_TEXT);
  return new ImageResponse(<LogoImageJSX size={32} paddingRatio={0.05} />, {
    ...size,
    fonts: [
      { name: "Permanent Marker", data: fontData, style: "normal", weight: 400 },
    ],
  });
}

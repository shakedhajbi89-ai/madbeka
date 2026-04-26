/**
 * One-off script to create a Windows desktop shortcut that opens
 * madbekaapp.co.il with the Madbeka wordmark as its icon.
 *
 * Fetches the 512×512 PNG logo from the live /icons/any/512 route,
 * wraps it in a minimal ICO header (Vista+ supports PNG-embedded ICO),
 * saves to %LOCALAPPDATA%\Madbeka\Madbeka.ico, and writes the .url
 * shortcut onto the user's Desktop pointing at both the URL and that
 * icon file.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { Buffer } from "node:buffer";

const ICON_URL = "https://madbekaapp.co.il/icons/any/512";
const SITE_URL = "https://madbekaapp.co.il";

// Localized Windows Desktop folder for this user (OneDrive-synced, Hebrew UI)
const DESKTOP = "C:\\Users\\shake\\OneDrive\\שולחן העבודה";
// AppData-local cache for the icon file so the desktop stays clean — user
// only sees the .url shortcut, the .ico is hidden in AppData.
const ICON_DIR = "C:\\Users\\shake\\AppData\\Local\\Madbeka";
const ICON_PATH = resolve(ICON_DIR, "Madbeka.ico");
const SHORTCUT_PATH = resolve(DESKTOP, "Madbeka.url");

async function main() {
  // 1. Fetch the PNG logo from the live site.
  console.log(`Fetching icon PNG from ${ICON_URL}...`);
  const res = await fetch(ICON_URL);
  if (!res.ok) throw new Error(`Icon fetch failed: ${res.status}`);
  const pngBytes = Buffer.from(await res.arrayBuffer());
  console.log(`Got PNG (${pngBytes.length} bytes)`);

  // 2. Wrap PNG in a single-image ICO container.
  //    ICO file = 6-byte header + 16-byte image dir entry + raw PNG data.
  //    Width/height 0 in the entry means "256 px" per the ICO spec; Windows
  //    scales the PNG as needed so the actual 512×512 payload is fine.
  const header = Buffer.alloc(22);
  header.writeUInt16LE(0, 0); // reserved, must be 0
  header.writeUInt16LE(1, 2); // image type: 1 = ICO
  header.writeUInt16LE(1, 4); // number of images

  header.writeUInt8(0, 6); // width (0 = 256)
  header.writeUInt8(0, 7); // height (0 = 256)
  header.writeUInt8(0, 8); // color count (0 for true color)
  header.writeUInt8(0, 9); // reserved
  header.writeUInt16LE(1, 10); // color planes
  header.writeUInt16LE(32, 12); // bits per pixel
  header.writeUInt32LE(pngBytes.length, 14); // image size
  header.writeUInt32LE(22, 18); // image offset (after header + entry)

  const ico = Buffer.concat([header, pngBytes]);

  // 3. Save ICO to AppData.
  mkdirSync(ICON_DIR, { recursive: true });
  writeFileSync(ICON_PATH, ico);
  console.log(`Wrote icon → ${ICON_PATH}`);

  // 4. Create Windows .url Internet Shortcut on desktop.
  //    .url is a plain INI-style file; Windows Explorer reads it natively
  //    and uses IconFile/IconIndex to render the thumbnail. UTF-8 with BOM
  //    is the most compatible encoding for Hebrew-locale Windows.
  const urlContent = [
    "[InternetShortcut]",
    `URL=${SITE_URL}`,
    `IconFile=${ICON_PATH}`,
    "IconIndex=0",
    "",
  ].join("\r\n");

  mkdirSync(dirname(SHORTCUT_PATH), { recursive: true });
  // Prepend UTF-8 BOM so Windows handles any future non-ASCII paths.
  writeFileSync(SHORTCUT_PATH, "\uFEFF" + urlContent, "utf8");
  console.log(`Wrote shortcut → ${SHORTCUT_PATH}`);

  console.log("\nDone. Open your desktop — the Madbeka shortcut is there.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

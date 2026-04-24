/**
 * Generate a pure-text sticker — just Hebrew letters on a 100% transparent
 * canvas. Used by the editor (/templates) so a user can ship "יאללה",
 * "סבבה", "אחי" etc. as a WhatsApp sticker in one tap, no photo needed.
 *
 * Design decision (2026-04): **letters only, no rectangular frame**. Every
 * style here fills/outlines the letters themselves; the canvas background
 * stays fully transparent.
 *
 * The editor lets the user customize: font family, color style, size,
 * horizontal alignment, and rotation. All of those flow through
 * `TextStickerOptions`.
 *
 * Output matches WhatsApp sticker spec: 512×512 WebP, under 100KB, transparent.
 */

import { toWhatsAppSticker } from "@/lib/sticker-utils";

/**
 * Letter color styles. Each one only paints pixels inside the letter glyphs —
 * the rest of the 512×512 canvas is fully transparent.
 */
export type TextStickerStyle =
  | "classic" // white fill, black outline — reads on any chat wallpaper
  | "black" // black fill, white outline — photographic/newspaper feel
  | "green" // green gradient fill (WhatsApp brand), black outline
  | "sunset" // orange→red gradient fill, black outline
  | "night" // blue→purple gradient fill, black outline
  | "bubble" // balloon letters — huge outline makes glyphs look round & 3D
  | "graffiti" // Tel Aviv street-wall spray paint — drips, shadows, gradient
  | "neon"; // bright glow as if the letters are plugged into a wall

/**
 * Hebrew-friendly display faces available in the editor. Each one has a
 * distinct character — from hand-drawn graffiti (marker) to serious
 * newspaper-bold (assistant) to playful round (varela). All are loaded via
 * next/font in layout.tsx and exposed as CSS variables.
 */
export type TextStickerFont =
  | "heebo" // default, clean modern sans
  | "rubik" // rounded, friendly — Google's popular Hebrew default
  | "secular" // heavy condensed Hebrew display
  | "varela" // round & soft, great for casual words
  | "assistant" // newspaper-bold, serious tone
  | "suez" // chunky display, great for single words
  | "marker" // hand-drawn marker, Madbeka brand vibe (Latin only)
  | "karantina" // hand-drawn / graffiti feel for Hebrew
  | "frank-ruhl" // classical elegant Hebrew serif
  | "miriam" // modern Hebrew slab serif
  | "bellefair"; // high-contrast display serif

/** Horizontal anchor point for the text inside the 512×512 canvas. */
export type TextStickerAlign = "center" | "right" | "left";

export interface TextStickerOptions {
  text: string;
  /** Emoji(s) picked from the emoji panel — stored separately from text so
   *  the user can drag it around the canvas independently of the word. */
  emoji?: string;
  /** Emoji position inside the 512×512 canvas. 0,0 = centered.
   *  The user drags the emoji directly on the preview; this is where it
   *  ends up. Default: slightly above center so the emoji starts visible
   *  above the word the moment the user picks it. */
  emojiOffsetX?: number;
  emojiOffsetY?: number;
  /** Emoji render size in px. Independent from the word's font size so the
   *  user can scale emoji and word separately. If not provided, defaults
   *  to 0.9× the word font size for visual balance. */
  emojiSize?: number;
  /** Emoji rotation in degrees. Independent from the word rotation. */
  emojiRotation?: number;
  /** If true, draw the emoji BEHIND the word (the word covers it). Default
   *  false = emoji sits on top of the word. Lets the user produce "sticker
   *  over a background emoji" compositions. */
  emojiBehindText?: boolean;
  style?: TextStickerStyle;
  font?: TextStickerFont;
  /** Max font size in px (auto-shrinks if the word doesn't fit). 40–300. */
  size?: number;
  /** Rotation in degrees. Negative = tilt left, positive = tilt right. */
  rotation?: number;
  /** Horizontal alignment. */
  align?: TextStickerAlign;
  /** Watermark-free output (paid users). */
  watermark?: boolean;
  /** User-dragged offset of the main WORD inside the 512×512 canvas. 0,0 = centered. */
  offsetX?: number;
  offsetY?: number;
}

/**
 * Default emoji size derived from the word font size. Used when the user
 * hasn't explicitly set an emoji size yet — the emoji looks proportional
 * to the word (~90% of it) so first-pick looks nice without tweaking.
 */
export function defaultEmojiSize(fontSize: number): number {
  return Math.round(fontSize * 0.9);
}

const GRADIENTS: Record<
  "green" | "sunset" | "night",
  [string, string]
> = {
  green: ["#25D366", "#128C7E"],
  sunset: ["#FFA94D", "#FF3B3B"],
  night: ["#4F46E5", "#9333EA"],
};

/**
 * Map a TextStickerFont key to a full CSS font stack.
 *
 * IMPORTANT: Canvas 2D's `ctx.font` parser does NOT resolve CSS custom
 * properties (var(--x)). If you pass a stack starting with `var(--...)`,
 * the browser silently rejects the entire string and falls back to the
 * default `10px sans-serif`. That's why the size slider appeared broken
 * for half a year — every canvas paint was silently falling back to
 * default tiny text.
 *
 * next/font also mangles Google font family names into obfuscated locals
 * like `__Permanent_Marker_abc123`, so naming `"Permanent Marker"`
 * literally may or may not match. The only reliable path is to RESOLVE
 * the --font-* CSS variable at runtime via getComputedStyle — that
 * returns the exact mangled family name the browser actually registered.
 *
 * HTML/DOM callers (preset button labels) still get a string with the
 * var() intact for SSR — the CSS engine resolves it correctly in the
 * regular DOM. Canvas callers only run client-side, so runtime resolve
 * is fine.
 */
const FALLBACKS: Record<TextStickerFont, string> = {
  rubik: `"Rubik", "Arial Black", sans-serif`,
  secular: `"Secular One", "Arial Black", sans-serif`,
  varela: `"Varela Round", sans-serif`,
  assistant: `"Assistant", sans-serif`,
  suez: `"Suez One", "Arial Black", serif`,
  marker: `"Permanent Marker", "Arial Black", sans-serif`,
  heebo: `"Heebo", sans-serif`,
  karantina: `"Karantina", "Arial Black", sans-serif`,
  "frank-ruhl": `"Frank Ruhl Libre", "Times New Roman", serif`,
  miriam: `"Miriam Libre", "Georgia", serif`,
  bellefair: `"Bellefair", "Times New Roman", serif`,
};

const CSS_VAR: Record<TextStickerFont, string> = {
  rubik: "--font-rubik",
  secular: "--font-secular",
  varela: "--font-varela",
  assistant: "--font-assistant",
  suez: "--font-suez",
  marker: "--font-permanent-marker",
  heebo: "--font-heebo",
  karantina: "--font-karantina",
  "frank-ruhl": "--font-frank-ruhl",
  miriam: "--font-miriam",
  bellefair: "--font-bellefair",
};

export function fontStack(font: TextStickerFont): string {
  // Client-side: resolve --font-* to the actual (mangled) family name so
  // Canvas 2D accepts it. Fallback chain appended for safety.
  if (typeof window !== "undefined") {
    const resolved = getComputedStyle(document.documentElement)
      .getPropertyValue(CSS_VAR[font])
      .trim();
    if (resolved) {
      return `${resolved}, ${FALLBACKS[font]}`;
    }
  }
  // SSR path: plain names (still gets rendered by CSS engine on HTML).
  return FALLBACKS[font];
}

/**
 * Human-readable label + live sample for each font. Used by the editor UI
 * to render a proper font picker (each option shown in its own typeface).
 */
export const FONT_OPTIONS: {
  id: TextStickerFont;
  label: string;
  sample: string;
}[] = [
  { id: "heebo", label: "חיבו", sample: "אבג" },
  { id: "rubik", label: "רוביק", sample: "אבג" },
  { id: "secular", label: "סקולר", sample: "אבג" },
  { id: "varela", label: "ורלה", sample: "אבג" },
  { id: "assistant", label: "אסיסטנט", sample: "אבג" },
  { id: "suez", label: "סואץ", sample: "אבג" },
  { id: "marker", label: "מרקר", sample: "abc" },
  { id: "karantina", label: "גרפיטי", sample: "אבג" },
  { id: "frank-ruhl", label: "קלאסי", sample: "אבג" },
  { id: "miriam", label: "מרים", sample: "אבג" },
  { id: "bellefair", label: "בלפייר", sample: "abc" },
];

/**
 * Emoji picker data — 8 curated categories, each with a sample emoji for
 * the category button and a list of the most WhatsApp-relevant emojis in
 * that theme. Clicking an emoji appends it to the current sticker text,
 * so users can ship "יאללה 🔥" or pure-emoji stickers like just "💯".
 */
export interface EmojiCategory {
  id: string;
  label: string;
  sample: string;
  emojis: string[];
}

export const EMOJI_CATEGORIES: EmojiCategory[] = [
  // 1. Smileys & Emotion — WhatsApp's first category. All the faces.
  {
    id: "faces",
    label: "פרצופים",
    sample: "😂",
    emojis: [
      "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂",
      "🙂", "🙃", "🫠", "😉", "😊", "😇", "🥰", "😍",
      "🤩", "😘", "😗", "😚", "😙", "🥲", "😋", "😛",
      "😜", "🤪", "😝", "🤑", "🤗", "🤭", "🫢", "🫣",
      "🤫", "🤔", "🫡", "🤐", "🤨", "😐", "😑", "😶",
      "🫥", "😏", "😒", "🙄", "😬", "🤥", "🫨", "😔",
      "😪", "🤤", "😴", "😷", "🤒", "🤕", "🤢", "🤮",
      "🥵", "🥶", "🥴", "😵", "🤯", "🤠", "🥳", "🥸",
      "😎", "🤓", "🧐", "😕", "🫤", "😟", "🙁", "☹️",
      "😮", "😯", "😲", "😳", "🥺", "😦", "😧", "😨",
      "😰", "😥", "😢", "😭", "😱", "😖", "😣", "😞",
      "😓", "😩", "😫", "🥱", "😤", "😡", "😠", "🤬",
      "😈", "👿", "💀", "☠️", "💩", "🤡", "👹", "👺",
      "👻", "👽", "👾", "🤖", "😺", "😸", "😹", "😻",
      "😼", "😽", "🙀", "😿", "😾",
    ],
  },
  // 2. People & Body — hands and gestures. Middle finger lives here.
  {
    id: "hands",
    label: "ידיים",
    sample: "👍",
    emojis: [
      "👋", "🤚", "🖐️", "✋", "🖖", "🫱", "🫲", "🫳",
      "🫴", "👌", "🤌", "🤏", "✌️", "🤞", "🫰", "🤟",
      "🤘", "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️",
      "🫵", "👍", "👎", "✊", "👊", "🤛", "🤜", "👏",
      "🙌", "🫶", "👐", "🤲", "🤝", "🙏", "✍️", "💅",
      "🤳", "💪", "🦾", "🦵", "🦿", "🦶", "👂", "🦻",
      "👃", "🧠", "🫀", "🫁", "🦷", "🦴", "👀", "👁️",
      "👅", "👄", "🫦", "💋", "🩸",
    ],
  },
  // 3. Hearts & love — a dedicated slice for romantic / care stickers.
  {
    id: "love",
    label: "אהבה",
    sample: "❤️",
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍",
      "🤎", "❤️‍🔥", "❤️‍🩹", "💔", "❣️", "💕", "💞", "💓",
      "💗", "💖", "💘", "💝", "💟", "💌", "💋", "🌹",
      "💐", "🫶", "🥰", "😍", "😘", "😻", "💏", "💑",
    ],
  },
  // 4. Animals & Nature — covers creatures + plants + weather.
  {
    id: "animals",
    label: "חיות וטבע",
    sample: "🐶",
    emojis: [
      "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼",
      "🐻‍❄️", "🐨", "🐯", "🦁", "🐮", "🐷", "🐽", "🐸",
      "🐵", "🙈", "🙉", "🙊", "🐒", "🐔", "🐧", "🐦",
      "🐤", "🐣", "🐥", "🦆", "🦅", "🦉", "🦇", "🐺",
      "🐗", "🐴", "🦄", "🐝", "🪱", "🐛", "🦋", "🐌",
      "🐞", "🐜", "🪰", "🪲", "🦗", "🕷️", "🦂", "🐢",
      "🐍", "🦎", "🦖", "🦕", "🐙", "🦑", "🦐", "🦞",
      "🦀", "🐡", "🐠", "🐟", "🐬", "🐳", "🐋", "🦈",
      "🐊", "🐅", "🐆", "🦓", "🦍", "🦧", "🦣", "🐘",
      "🦛", "🦏", "🐪", "🐫", "🦒", "🦘", "🐃", "🐂",
      "🐄", "🐎", "🐖", "🐏", "🐑", "🦙", "🐐", "🦌",
      "🐕", "🐩", "🦮", "🐈", "🐓", "🦃", "🦚", "🦜",
      "🦢", "🦩", "🕊️", "🐇", "🦝", "🦨", "🦡", "🦫",
      "🦦", "🦥", "🐁", "🐀", "🐿️", "🦔", "🐾", "🌵",
      "🎄", "🌲", "🌳", "🌴", "🌱", "🌿", "☘️", "🍀",
      "🎍", "🪴", "🌺", "🌻", "🌹", "🥀", "🌷", "🌼",
      "🌸", "💐", "🍄", "🐚", "🪨", "🌏", "🌎", "🌍",
      "🌕", "🌑", "🌙", "☀️", "⭐", "🌟", "✨", "⚡",
      "☁️", "❄️", "🔥", "🌊", "☔", "🌈", "☃️",
    ],
  },
  // 5. Food & Drink.
  {
    id: "food",
    label: "אוכל",
    sample: "🍕",
    emojis: [
      "🍏", "🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇",
      "🍓", "🫐", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥",
      "🥝", "🍅", "🍆", "🥑", "🥦", "🥬", "🥒", "🌶️",
      "🫑", "🌽", "🥕", "🫒", "🧄", "🧅", "🥔", "🍠",
      "🥐", "🥯", "🍞", "🥖", "🥨", "🧀", "🥚", "🍳",
      "🧈", "🥞", "🧇", "🥓", "🥩", "🍗", "🍖", "🦴",
      "🌭", "🍔", "🍟", "🍕", "🫓", "🥪", "🥙", "🧆",
      "🌮", "🌯", "🫔", "🥗", "🥘", "🫕", "🥫", "🍝",
      "🍜", "🍲", "🍛", "🍣", "🍱", "🥟", "🦪", "🍤",
      "🍙", "🍚", "🍘", "🍥", "🥠", "🥮", "🍢", "🍡",
      "🍧", "🍨", "🍦", "🥧", "🧁", "🍰", "🎂", "🍮",
      "🍭", "🍬", "🍫", "🍿", "🍩", "🍪", "🌰", "🥜",
      "🍯", "🥛", "🍼", "☕", "🫖", "🍵", "🧃", "🥤",
      "🧋", "🍶", "🍺", "🍻", "🥂", "🍷", "🥃", "🍸",
      "🍹", "🧉", "🍾", "🧊", "🥄", "🍴", "🍽️",
    ],
  },
  // 6. Activity — sports, games, celebrations.
  {
    id: "activity",
    label: "פעילות",
    sample: "⚽",
    emojis: [
      "⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉",
      "🥏", "🎱", "🪀", "🏓", "🏸", "🏒", "🏑", "🥍",
      "🏏", "🪃", "🥅", "⛳", "🪁", "🏹", "🎣", "🤿",
      "🥊", "🥋", "🎽", "🛹", "🛼", "🛷", "⛸️", "🥌",
      "🎿", "⛷️", "🏂", "🪂", "🏋️", "🤸", "🤺", "⛹️",
      "🤾", "🏌️", "🏇", "🧘", "🏄", "🏊", "🤽", "🚣",
      "🧗", "🚵", "🚴", "🏆", "🥇", "🥈", "🥉", "🏅",
      "🎖️", "🏵️", "🎗️", "🎫", "🎟️", "🎪", "🤹", "🎭",
      "🩰", "🎨", "🎬", "🎤", "🎧", "🎼", "🎹", "🥁",
      "🎷", "🎺", "🎸", "🪕", "🎻", "🎲", "♟️", "🎯",
      "🎳", "🎮", "🎰", "🧩", "🎉", "🎊", "🎈", "🎁",
      "🎀", "🪅", "🪆", "🎎", "🎐", "🎏", "🎑",
    ],
  },
  // 7. Travel & Places.
  {
    id: "places",
    label: "מקומות",
    sample: "🚗",
    emojis: [
      "🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑",
      "🚒", "🚐", "🛻", "🚚", "🚛", "🚜", "🦯", "🦽",
      "🦼", "🛴", "🚲", "🛵", "🏍️", "🛺", "🚨", "🚔",
      "🚍", "🚘", "🚖", "🚡", "🚠", "🚟", "🚃", "🚋",
      "🚞", "🚝", "🚄", "🚅", "🚈", "🚂", "🚆", "🚇",
      "🚊", "🚉", "✈️", "🛫", "🛬", "🛩️", "💺", "🛰️",
      "🚀", "🛸", "🚁", "🛶", "⛵", "🚤", "🛥️", "🛳️",
      "⛴️", "🚢", "⚓", "⛽", "🚧", "🚦", "🚥", "🗺️",
      "🗿", "🗽", "🗼", "🏰", "🏯", "🏟️", "🎡", "🎢",
      "🎠", "⛲", "⛱️", "🏖️", "🏝️", "🏜️", "🌋", "⛰️",
      "🏔️", "🗻", "🏕️", "⛺", "🏠", "🏡", "🏘️", "🏚️",
      "🏗️", "🏭", "🏢", "🏬", "🏣", "🏤", "🏥", "🏦",
      "🏨", "🏪", "🏫", "🏩", "💒", "🏛️", "⛪", "🕌",
      "🕍", "🛕", "🕋", "⛩️", "🌆", "🌇", "🌃", "🌌",
      "🌉", "🌁",
    ],
  },
  // 8. Objects — tools, tech, stationery.
  {
    id: "objects",
    label: "חפצים",
    sample: "💡",
    emojis: [
      "⌚", "📱", "📲", "💻", "⌨️", "🖥️", "🖨️", "🖱️",
      "🖲️", "🕹️", "🗜️", "💽", "💾", "💿", "📀", "📼",
      "📷", "📸", "📹", "🎥", "📽️", "🎞️", "📞", "☎️",
      "📟", "📠", "📺", "📻", "🎙️", "🎚️", "🎛️", "🧭",
      "⏱️", "⏲️", "⏰", "🕰️", "⌛", "⏳", "📡", "🔋",
      "🪫", "🔌", "💡", "🔦", "🕯️", "🪔", "🧯", "🛢️",
      "💸", "💵", "💴", "💶", "💷", "🪙", "💰", "💳",
      "💎", "⚖️", "🪜", "🧰", "🪛", "🔧", "🔨", "⚒️",
      "🛠️", "⛏️", "🪚", "🔩", "⚙️", "🪤", "🧱", "⛓️",
      "🧲", "🔫", "💣", "🧨", "🪓", "🔪", "🗡️", "⚔️",
      "🛡️", "🚬", "⚰️", "🪦", "⚱️", "🏺", "🔮", "📿",
      "🧿", "💈", "⚗️", "🔭", "🔬", "🕳️", "🩹", "🩺",
      "💊", "💉", "🩸", "🧬", "🦠", "🧫", "🧪", "🌡️",
      "🧹", "🪣", "🧺", "🧻", "🚽", "🚰", "🚿", "🛁",
      "🛀", "🧼", "🪥", "🪒", "🧽", "🪠", "🛎️", "🔑",
      "🗝️", "🚪", "🪑", "🛋️", "🛏️", "🛌", "🧸", "🪆",
      "🖼️", "🪞", "🪟", "🛍️", "🛒", "🎁", "🎈", "🎏",
      "🎀", "🪄", "🪅", "🎊", "🎉", "🎎", "🏮", "🎐",
      "🧧", "✉️", "📩", "📨", "📧", "💌", "📥", "📤",
      "📦", "🏷️", "📪", "📫", "📬", "📭", "📮", "📯",
      "📜", "📃", "📄", "📑", "🧾", "📊", "📈", "📉",
      "🗒️", "🗓️", "📆", "📅", "🗑️", "📇", "🗃️", "🗳️",
      "🗄️", "📋", "📁", "📂", "🗂️", "🗞️", "📰", "📓",
      "📔", "📒", "📕", "📗", "📘", "📙", "📚", "📖",
      "🔖", "🧷", "🔗", "📎", "🖇️", "📐", "📏", "🧮",
      "📌", "📍", "✂️", "🖊️", "🖋️", "✒️", "🖌️", "🖍️",
      "📝", "✏️", "🔍", "🔎", "🔏", "🔐", "🔒", "🔓",
    ],
  },
  // 9. Symbols — the little iconography WhatsApp users love.
  {
    id: "symbols",
    label: "סימנים",
    sample: "💯",
    emojis: [
      "💯", "💢", "💥", "💫", "💦", "💨", "🕳️", "💬",
      "👁️‍🗨️", "🗨️", "🗯️", "💭", "💤", "🌀", "⚠️", "🚸",
      "🔞", "❤️", "🔥", "🎵", "🎶", "♻️", "✅", "❌",
      "❎", "➕", "➖", "➗", "✖️", "🟰", "♾️", "‼️",
      "⁉️", "❓", "❔", "❕", "❗", "〽️", "🔅", "🔆",
      "🔰", "⭕", "✔️", "☑️", "🔘", "🔴", "🟠", "🟡",
      "🟢", "🔵", "🟣", "⚫", "⚪", "🟤", "🔺", "🔻",
      "🔸", "🔹", "🔶", "🔷", "🔳", "🔲", "⬛", "⬜",
      "🟥", "🟧", "🟨", "🟩", "🟦", "🟪", "🟫", "◼️",
      "◻️", "▪️", "▫️", "🏁", "🚩", "🎌", "🏴", "🏳️",
    ],
  },
  // 10. Flags — quick-pick common flags. WhatsApp carries the full set but
  // these are the ones Israeli users actually reach for.
  {
    id: "flags",
    label: "דגלים",
    sample: "🇮🇱",
    emojis: [
      "🇮🇱", "🇺🇸", "🇬🇧", "🇫🇷", "🇩🇪", "🇮🇹", "🇪🇸", "🇵🇹",
      "🇷🇺", "🇺🇦", "🇨🇳", "🇯🇵", "🇰🇷", "🇮🇳", "🇹🇭", "🇻🇳",
      "🇧🇷", "🇲🇽", "🇨🇦", "🇦🇷", "🇦🇺", "🇳🇿", "🇿🇦", "🇪🇬",
      "🇯🇴", "🇸🇦", "🇦🇪", "🇹🇷", "🇬🇷", "🇨🇾", "🇳🇱", "🇨🇭",
      "🇦🇹", "🇧🇪", "🇸🇪", "🇳🇴", "🇩🇰", "🇫🇮", "🇮🇪", "🇵🇱",
      "🇨🇿", "🇭🇺", "🇷🇴", "🇧🇬", "🇭🇷", "🇷🇸", "🇮🇸", "🇪🇺",
    ],
  },
];

/**
 * Render a 512×512 canvas with the given text. Called both for the final
 * exported blob and for the live preview (via an exposed helper below).
 */
function paintCanvas(ctx: CanvasRenderingContext2D, opts: TextStickerOptions) {
  const size = 512;

  // Fully transparent canvas — no background shapes at all.
  ctx.clearRect(0, 0, size, size);

  const style: TextStickerStyle = opts.style ?? "classic";
  const font: TextStickerFont = opts.font ?? "marker";
  const align: TextStickerAlign = opts.align ?? "center";
  const rotation = opts.rotation ?? 0;
  const emoji = opts.emoji ?? "";
  // Text is always JUST the word — emoji is a separate draggable layer now.
  const text = opts.text;
  const stack = fontStack(font);

  // The size slider is the single source of truth — no auto-shrink.
  // Auto-shrink used to silently clamp the font to the canvas width, which
  // broke the slider's upper range (the user would drag it up and see
  // nothing change, because we'd immediately shrink back down to fit).
  // Now the user is in control: crank it up for a chunky sticker, drag down
  // if the word overflows. Overflow is visible in the preview so the user
  // gets immediate feedback.
  const fontSize = Math.min(280, Math.max(40, opts.size ?? 160));
  // Some fonts only have one weight in our next/font config (Secular One,
  // Suez One, Varela Round, Permanent Marker, Bellefair = 400 only). For
  // multi-weight faces we crank to the boldest available for sticker punch.
  const boldFonts: TextStickerFont[] = [
    "rubik",
    "assistant",
    "karantina",
    "frank-ruhl",
    "miriam",
  ];
  const weight = boldFonts.includes(font) ? "700" : "400";
  ctx.font = `${weight} ${fontSize}px ${stack}`;

  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  // Two separate draw passes — word and emoji. Each handles its own
  // save/translate/rotate/restore so they're fully independent. Calling
  // order determines who sits on top: whoever is drawn LAST wins.
  const drawWord = () => {
  ctx.save();
  const offX = opts.offsetX ?? 0;
  const offY = opts.offsetY ?? 0;
  ctx.translate(size / 2 + offX, size / 2 + offY);
  if (rotation !== 0) {
    ctx.rotate((rotation * Math.PI) / 180);
  }

  // Pick horizontal anchor
  let x = 0;
  if (align === "right") {
    ctx.textAlign = "right";
    x = size / 2 - 40;
  } else if (align === "left") {
    ctx.textAlign = "left";
    x = -(size / 2) + 40;
  } else {
    ctx.textAlign = "center";
    x = 0;
  }
  const y = 0;

  // Soft drop shadow so the letters pop off whatever chat background they
  // land on. Tuned low enough to stay under 100KB after WebP compression.
  ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;

  if (style === "classic") {
    // White letters with thick black outline — the classic WhatsApp sticker
    // look. Readable on any wallpaper.
    ctx.lineWidth = 10;
    ctx.strokeStyle = "#000000";
    ctx.strokeText(text, x, y);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(text, x, y);
  } else if (style === "black") {
    // Solid black letters with white outline — editorial / bold feel.
    ctx.lineWidth = 10;
    ctx.strokeStyle = "#FFFFFF";
    ctx.strokeText(text, x, y);
    ctx.fillStyle = "#000000";
    ctx.fillText(text, x, y);
  } else if (style === "bubble") {
    // Balloon letters. Super-thick black outline makes each glyph read as
    // round & 3D even on sans-serif faces. Then a slightly narrower white
    // stroke + a thin inner stroke + a pink gloss fill + a white highlight
    // line for that sticker-on-bubblegum feel.
    ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 6;

    // Outer black balloon outline — very thick, scales with font size so it
    // stays balloon-y at any size.
    ctx.lineWidth = Math.max(16, fontSize * 0.18);
    ctx.strokeStyle = "#000000";
    ctx.strokeText(text, x, y);

    // Pink bubblegum fill.
    ctx.shadowColor = "transparent";
    ctx.fillStyle = "#FF4FA3";
    ctx.fillText(text, x, y);

    // White inner highlight stroke — gives the 3D glossy look.
    ctx.lineWidth = Math.max(3, fontSize * 0.03);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.strokeText(text, x, y - fontSize * 0.04);
  } else if (style === "graffiti") {
    // Tel Aviv street-wall. Spray-paint drips implied by big offset shadow,
    // thick black outline, bright two-tone spray fill. Reads as wall art.
    ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 8;
    ctx.shadowOffsetY = 10;

    // Black wall-backing outline — thick, rough feel.
    ctx.lineWidth = Math.max(12, fontSize * 0.1);
    ctx.strokeStyle = "#000000";
    ctx.strokeText(text, x, y);

    // Thin yellow layer behind the main color — "double spray" trick.
    ctx.shadowColor = "transparent";
    ctx.lineWidth = Math.max(6, fontSize * 0.05);
    ctx.strokeStyle = "#FFE63C";
    ctx.strokeText(text, x, y);

    // Main spray fill — magenta→cyan gradient.
    const metrics = ctx.measureText(text);
    const ascent = metrics.actualBoundingBoxAscent || fontSize * 0.7;
    const descent = metrics.actualBoundingBoxDescent || fontSize * 0.3;
    const grad = ctx.createLinearGradient(0, y - ascent, 0, y + descent);
    grad.addColorStop(0, "#FF2D95");
    grad.addColorStop(0.5, "#FF6B3D");
    grad.addColorStop(1, "#00D8FF");
    ctx.fillStyle = grad;
    ctx.fillText(text, x, y);
  } else if (style === "neon") {
    // Glowing neon sign. Multiple overlapping glows build up a convincing
    // halo, then a bright fill on top. Works best on dark WhatsApp wallpapers
    // but still reads on light because of the solid center fill.
    const glow = "#00F5FF";
    for (const blur of [30, 20, 10]) {
      ctx.shadowColor = glow;
      ctx.shadowBlur = blur;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.lineWidth = 6;
      ctx.strokeStyle = glow;
      ctx.strokeText(text, x, y);
    }
    // Core bright fill — white center gives the "bulb is on" look.
    ctx.shadowBlur = 8;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(text, x, y);
  } else {
    // Gradient-filled letters with black outline — green / sunset / night.
    const [c1, c2] = GRADIENTS[style];
    ctx.lineWidth = 10;
    ctx.strokeStyle = "#000000";
    ctx.strokeText(text, x, y);

    const metrics = ctx.measureText(text);
    const ascent = metrics.actualBoundingBoxAscent || fontSize * 0.7;
    const descent = metrics.actualBoundingBoxDescent || fontSize * 0.3;
    const grad = ctx.createLinearGradient(0, y - ascent, 0, y + descent);
    grad.addColorStop(0, c1);
    grad.addColorStop(1, c2);
    ctx.fillStyle = grad;
    ctx.fillText(text, x, y);
  }

    ctx.restore();
  };

  const drawEmoji = () => {
    if (!emoji) return;
    ctx.save();
    const emojiX = (opts.emojiOffsetX ?? 0) + size / 2;
    const emojiY = (opts.emojiOffsetY ?? 0) + size / 2;
    ctx.translate(emojiX, emojiY);

    const emojiRotation = opts.emojiRotation ?? 0;
    if (emojiRotation !== 0) {
      ctx.rotate((emojiRotation * Math.PI) / 180);
    }

    const emojiSize = Math.max(
      20,
      Math.min(400, opts.emojiSize ?? defaultEmojiSize(fontSize)),
    );
    ctx.font = `${emojiSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = "#000"; // Ignored for color-emoji glyphs.

    ctx.fillText(emoji, 0, 0);
    ctx.restore();
  };

  // Stacking: emojiBehindText=true → emoji first (word on top).
  //           emojiBehindText=false (default) → word first (emoji on top).
  if (opts.emojiBehindText) {
    drawEmoji();
    drawWord();
  } else {
    drawWord();
    drawEmoji();
  }
}

/**
 * Paint the given text into a user-provided canvas — used by the editor's
 * live-preview DOM canvas so resizing / dragging / typing all flow through
 * the exact same renderer that produces the final exported sticker.
 */
export function paintPreview(
  canvas: HTMLCanvasElement,
  opts: TextStickerOptions,
): void {
  if (canvas.width !== 512) canvas.width = 512;
  if (canvas.height !== 512) canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  paintCanvas(ctx, opts);
}

/**
 * Render 512×512 PNG blob with the given Hebrew text, letters-only on fully
 * transparent background. Then route through toWhatsAppSticker so we reuse
 * the same watermark + WebP pipeline as the photo flow.
 */
async function renderTextCanvas(opts: TextStickerOptions): Promise<Blob> {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  paintCanvas(ctx, opts);

  // Snapshot as PNG (preserves transparency), then let the main sticker
  // pipeline enforce 512×512 + WebP + optional watermark.
  const pngBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("canvas.toBlob returned null"))),
      "image/png",
      1,
    );
  });

  return toWhatsAppSticker(pngBlob, { watermark: opts.watermark ?? false });
}

export async function generateTextSticker(
  opts: TextStickerOptions,
): Promise<Blob> {
  return renderTextCanvas(opts);
}

/**
 * Curated Israeli expressions — one-tap presets the editor can load into
 * its current state. Every preset ships as "letters only" — the style
 * controls only how the letters themselves are painted.
 */
export interface TemplateDef {
  id: string;
  text: string;
  style: TextStickerStyle;
  font: TextStickerFont;
  rotation?: number;
  tag: string;
}

export const TEMPLATES: TemplateDef[] = [
  // Classic Israeli expressions — the timeless ones everyone uses.
  { id: "yalla", text: "יאללה", style: "classic", font: "marker", rotation: -4, tag: "קלאסי" },
  { id: "sababa", text: "סבבה", style: "green", font: "rubik", tag: "קלאסי" },
  { id: "wow", text: "וואו", style: "sunset", font: "suez", rotation: -6, tag: "תגובה" },
  { id: "ahi", text: "אחי", style: "classic", font: "marker", tag: "קלאסי" },
  { id: "dai", text: "די", style: "black", font: "assistant", tag: "תגובה" },
  { id: "chalas", text: "חלאס", style: "sunset", font: "secular", rotation: 5, tag: "תגובה" },
  { id: "ok", text: "אוקיי", style: "classic", font: "varela", tag: "צ׳אט" },
  { id: "metoraf", text: "מטורף", style: "night", font: "rubik", rotation: -3, tag: "תגובה" },
  { id: "lo-mavin", text: "לא הבנתי", style: "black", font: "assistant", tag: "צ׳אט" },
  { id: "eize-keif", text: "איזה כיף", style: "sunset", font: "varela", tag: "תגובה" },
  { id: "lila-tov", text: "לילה טוב", style: "night", font: "heebo", tag: "ברכה" },

  // Gen-Z / TikTok slang — the brainrot corner. Kids use these daily on
  // WhatsApp groups; having one-tap presets here is half of why a teen
  // would share Madbeka with their friends.
  { id: "six-seven", text: "67", style: "sunset", font: "suez", rotation: -5, tag: "צעירים" },
  { id: "skibidi", text: "סקיבידי", style: "night", font: "rubik", rotation: -3, tag: "צעירים" },
  { id: "rizz", text: "ריז", style: "green", font: "marker", rotation: 4, tag: "צעירים" },
  { id: "esh", text: "אש", style: "sunset", font: "secular", tag: "צעירים" },
  { id: "korea", text: "קורע", style: "classic", font: "marker", rotation: -6, tag: "צעירים" },
  { id: "sakhtein", text: "סחטיין", style: "black", font: "assistant", rotation: 3, tag: "צעירים" },
  { id: "cap", text: "קאפ", style: "night", font: "varela", tag: "צעירים" },
];

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

/**
 * One word layer on the canvas. Fully self-contained: its own text, font,
 * color style, size, rotation, alignment, and position. Multiple word
 * layers can coexist, each editable independently.
 */
export interface WordLayer {
  id: string;
  type: "word";
  text: string;
  font: TextStickerFont;
  style: TextStickerStyle;
  /** Font size in px. 40–280. */
  size: number;
  /** Rotation in degrees. -45 to +45 (keeps Hebrew readable). */
  rotation: number;
  align: TextStickerAlign;
  /** Offset from canvas center in 512-space coords. */
  offsetX: number;
  offsetY: number;
}

/**
 * One emoji layer on the canvas. Self-contained like WordLayer — its own
 * size, rotation, skin tone, position. Lets the user build stickers with
 * multiple emojis, each tuned independently.
 */
export interface EmojiLayer {
  id: string;
  type: "emoji";
  /** The base emoji character (no skin-tone modifier) the user picked. */
  base: string;
  /** Fitzpatrick skin-tone modifier: '' or one of 🏻🏼🏽🏾🏿. Ignored
   *  for emojis that don't support it (falls through harmlessly). */
  skin: string;
  /** Emoji render size in px. 20–400. */
  size: number;
  /** Rotation in degrees. -180 to +180 (emojis survive any angle). */
  rotation: number;
  offsetX: number;
  offsetY: number;
}

export type StickerLayer = WordLayer | EmojiLayer;

export interface MultiLayerOptions {
  /** Layers in DRAW order — first = back, last = front (on top). */
  layers: StickerLayer[];
  /** Watermark-free output (paid users). */
  watermark?: boolean;
}

/**
 * Default emoji size derived from the word font size. Used when the user
 * hasn't explicitly set an emoji size yet — the emoji looks proportional
 * to the word (~90% of it) so first-pick looks nice without tweaking.
 */
export function defaultEmojiSize(fontSize: number): number {
  return Math.round(fontSize * 0.9);
}

/**
 * Base emojis in our picker that accept a Fitzpatrick skin-tone modifier.
 * Covers hand gestures, body parts, and human-figure activity emojis —
 * anything WhatsApp lets you long-press to recolor. Kept as a literal set
 * because the Unicode spec ranges are scattered and a runtime test is
 * expensive; easier to enumerate the ones we actually ship in the picker.
 */
export const SKIN_TONE_EMOJIS: ReadonlySet<string> = new Set([
  // Hands
  "👋", "🤚", "🖐️", "✋", "🖖", "🫱", "🫲", "🫳", "🫴",
  "👌", "🤌", "🤏", "✌️", "🤞", "🫰", "🤟", "🤘", "🤙",
  "👈", "👉", "👆", "🖕", "👇", "☝️", "🫵",
  "👍", "👎", "✊", "👊", "🤛", "🤜", "👏", "🙌", "🫶",
  "👐", "🤲", "🤝", "🙏", "✍️", "💅", "🤳", "💪",
  // Body parts
  "🦵", "🦶", "👂", "🦻", "👃",
  // Activity emojis with humans
  "🏋️", "🤸", "🤺", "⛹️", "🤾", "🏌️", "🏇", "🧘",
  "🏄", "🏊", "🤽", "🚣", "🧗", "🚵", "🚴", "🤹",
]);

/**
 * The six WhatsApp-style skin tone options. id = the Unicode modifier to
 * append after the base emoji ('' = default yellow, no modifier). swatch
 * is the CSS color used for the picker chip so the user can see what they
 * are selecting before selecting it.
 */
export const SKIN_TONE_OPTIONS: {
  id: string;
  label: string;
  swatch: string;
}[] = [
  { id: "", label: "ברירת מחדל", swatch: "#FCD34D" },
  { id: "🏻", label: "בהיר ביותר", swatch: "#F5CFA0" },
  { id: "🏼", label: "בהיר", swatch: "#E0B088" },
  { id: "🏽", label: "בינוני", swatch: "#C69076" },
  { id: "🏾", label: "כהה", swatch: "#8D5524" },
  { id: "🏿", label: "כהה ביותר", swatch: "#3D2817" },
];

/**
 * Apply a skin tone modifier to every skin-tone-capable emoji in a string.
 * Iterates by grapheme so multi-codepoint emojis (with variation selectors,
 * ZWJ sequences) are handled correctly.
 */
export function applySkinTone(emojiStr: string, skin: string): string {
  if (!emojiStr || !skin) return emojiStr;
  // Intl.Segmenter is available in all modern browsers (and Node 16+).
  // Fallback: naive char-by-char if Segmenter is missing.
  if (typeof Intl !== "undefined" && typeof Intl.Segmenter === "function") {
    const seg = new Intl.Segmenter();
    let out = "";
    for (const { segment } of seg.segment(emojiStr)) {
      out += SKIN_TONE_EMOJIS.has(segment) ? segment + skin : segment;
    }
    return out;
  }
  return emojiStr;
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

const BOLD_FONTS: ReadonlySet<TextStickerFont> = new Set([
  "rubik",
  "assistant",
  "karantina",
  "frank-ruhl",
  "miriam",
]);

/**
 * Draw a single word layer at its (offsetX, offsetY) with its own font,
 * style, rotation, size, alignment. Fully self-contained: calls save/
 * restore so the ctx state is isolated.
 */
function drawWordLayer(
  ctx: CanvasRenderingContext2D,
  layer: WordLayer,
  canvasSize: number,
) {
  ctx.save();
  ctx.translate(canvasSize / 2 + layer.offsetX, canvasSize / 2 + layer.offsetY);
  if (layer.rotation !== 0) {
    ctx.rotate((layer.rotation * Math.PI) / 180);
  }

  const fontSize = Math.min(280, Math.max(40, layer.size));
  const weight = BOLD_FONTS.has(layer.font) ? "700" : "400";
  ctx.font = `${weight} ${fontSize}px ${fontStack(layer.font)}`;
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  // Horizontal anchor from the layer's align setting.
  let x = 0;
  if (layer.align === "right") {
    ctx.textAlign = "right";
    x = canvasSize / 2 - 40;
  } else if (layer.align === "left") {
    ctx.textAlign = "left";
    x = -(canvasSize / 2) + 40;
  } else {
    ctx.textAlign = "center";
    x = 0;
  }
  const y = 0;
  const text = layer.text;

  // Soft drop shadow so the letters pop off whatever chat background they
  // land on. Tuned low enough to stay under 100KB after WebP compression.
  ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;

  const style = layer.style;
  if (style === "classic") {
    ctx.lineWidth = 10;
    ctx.strokeStyle = "#000000";
    ctx.strokeText(text, x, y);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(text, x, y);
  } else if (style === "black") {
    ctx.lineWidth = 10;
    ctx.strokeStyle = "#FFFFFF";
    ctx.strokeText(text, x, y);
    ctx.fillStyle = "#000000";
    ctx.fillText(text, x, y);
  } else if (style === "bubble") {
    ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 6;
    ctx.lineWidth = Math.max(16, fontSize * 0.18);
    ctx.strokeStyle = "#000000";
    ctx.strokeText(text, x, y);
    ctx.shadowColor = "transparent";
    ctx.fillStyle = "#FF4FA3";
    ctx.fillText(text, x, y);
    ctx.lineWidth = Math.max(3, fontSize * 0.03);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.strokeText(text, x, y - fontSize * 0.04);
  } else if (style === "graffiti") {
    ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 8;
    ctx.shadowOffsetY = 10;
    ctx.lineWidth = Math.max(12, fontSize * 0.1);
    ctx.strokeStyle = "#000000";
    ctx.strokeText(text, x, y);
    ctx.shadowColor = "transparent";
    ctx.lineWidth = Math.max(6, fontSize * 0.05);
    ctx.strokeStyle = "#FFE63C";
    ctx.strokeText(text, x, y);
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
    ctx.shadowBlur = 8;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(text, x, y);
  } else {
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
}

/**
 * Draw a single emoji layer. Applies the skin-tone modifier if the base
 * emoji supports one. Otherwise the skin field is ignored.
 */
function drawEmojiLayer(
  ctx: CanvasRenderingContext2D,
  layer: EmojiLayer,
  canvasSize: number,
) {
  if (!layer.base) return;
  ctx.save();
  ctx.translate(
    canvasSize / 2 + layer.offsetX,
    canvasSize / 2 + layer.offsetY,
  );
  if (layer.rotation !== 0) {
    ctx.rotate((layer.rotation * Math.PI) / 180);
  }

  const emojiSize = Math.max(20, Math.min(400, layer.size));
  ctx.font = `${emojiSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = "#000";

  const glyph =
    layer.skin && SKIN_TONE_EMOJIS.has(layer.base)
      ? layer.base + layer.skin
      : layer.base;
  ctx.fillText(glyph, 0, 0);
  ctx.restore();
}

/**
 * Render a 512×512 canvas by drawing each layer in order. First layer in
 * the array ends up in the back, last ends up on top.
 */
function paintCanvas(ctx: CanvasRenderingContext2D, opts: MultiLayerOptions) {
  const size = 512;
  ctx.clearRect(0, 0, size, size);
  for (const layer of opts.layers) {
    if (layer.type === "word") {
      drawWordLayer(ctx, layer, size);
    } else if (layer.type === "emoji") {
      drawEmojiLayer(ctx, layer, size);
    }
  }
}

/**
 * Paint the given layers into a user-provided canvas — used by the editor's
 * live-preview DOM canvas so all state changes flow through the exact same
 * renderer that produces the final exported sticker.
 */
export function paintPreview(
  canvas: HTMLCanvasElement,
  opts: MultiLayerOptions,
): void {
  if (canvas.width !== 512) canvas.width = 512;
  if (canvas.height !== 512) canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  paintCanvas(ctx, opts);
}

/**
 * Render a 512×512 sticker blob from the given layers. Composites every
 * layer (words + emojis) on a transparent background, then routes through
 * toWhatsAppSticker for the final watermark + WebP pipeline.
 */
export async function generateTextSticker(
  opts: MultiLayerOptions,
): Promise<Blob> {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context unavailable");

  paintCanvas(ctx, opts);

  const pngBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("canvas.toBlob returned null"))),
      "image/png",
      1,
    );
  });

  return toWhatsAppSticker(pngBlob, { watermark: opts.watermark ?? false });
}

/**
 * Estimate the bounding box of a word layer — used by the editor's
 * pointer hit-test to figure out which layer the user clicked. We don't
 * have a canvas context handy in the hit-test path so we approximate
 * using an average Hebrew-glyph ratio (~0.55 × fontSize per char).
 */
export function wordLayerHalfExtent(layer: WordLayer): {
  halfW: number;
  halfH: number;
} {
  const fontSize = Math.min(280, Math.max(40, layer.size));
  const chars = Math.max(1, layer.text.length);
  const halfW = (chars * fontSize * 0.55) / 2 + 16;
  const halfH = (fontSize * 1.1) / 2 + 12;
  return { halfW, halfH };
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

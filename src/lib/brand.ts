/**
 * Central brand constants.
 *
 * Everything "about Madbeka" that might change together — the domain, the
 * support email, the legal entity name — lives here so a future rebrand or
 * domain swap is a one-file diff instead of a codebase-wide find-and-replace.
 *
 * A few of these show up in user-facing copy (footer, legal pages) and
 * others feed Next.js metadata / Open Graph generation.
 */

/** The product / mark shown to users. Not the URL. */
export const BRAND_NAME = "Madbeka";

/** The canonical public URL of the app (no trailing slash). */
export const PUBLIC_URL = "https://madbekaapp.co.il";

/** Domain without protocol — for footer copy, watermark-adjacent strings, etc. */
export const PUBLIC_DOMAIN = "MadbekaApp.co.il";

/** Mailbox users contact for support, legal notices, refund requests. */
export const SUPPORT_EMAIL = "madbekaapp@gmail.com";

/**
 * Legal entity name for Terms / Privacy. The owner is a sole proprietor
 * (עוסק פטור) registered under this short name to preserve personal privacy
 * while still identifying the entity that contracts with the user.
 */
export const LEGAL_OWNER_NAME = "שקד ח.";

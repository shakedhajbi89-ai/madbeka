/**
 * Twitter (X) share card — reuses the same image we render for Open Graph.
 * Next.js App Router picks this file up and injects
 * `<meta name="twitter:image">`. By re-exporting from opengraph-image we
 * keep one source of truth for the brand card. If we ever want a
 * Twitter-specific variant (different dimensions, different copy) this
 * file is the place to diverge.
 */
export {
  default,
  alt,
  size,
  contentType,
} from "./opengraph-image";

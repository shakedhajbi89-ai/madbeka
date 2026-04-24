import { clerkMiddleware } from "@clerk/nextjs/server";

/**
 * Next.js 16 renamed middleware → proxy. Clerk Core 3 still ships
 * `clerkMiddleware()` as the factory name but the file + exported function
 * must be `proxy.ts` / `proxy` on Next 16. Without this file, `auth()`
 * throws at runtime and any server component that calls it (like /account)
 * returns a 404 in production.
 */
export const proxy = clerkMiddleware();
export default proxy;

export const config = {
  matcher: [
    // Skip Next.js internals, static assets, and anything that looks like a file.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run on API + tRPC.
    "/(api|trpc)(.*)",
  ],
};

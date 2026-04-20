import Script from "next/script";

/**
 * GA4 tag loaded via Next.js <Script strategy="afterInteractive"> so it does
 * not block First Contentful Paint. Only renders when
 * NEXT_PUBLIC_GA_MEASUREMENT_ID is set — keeps local dev out of the live
 * analytics stream.
 *
 * The tag fires `page_view` automatically on initial load. The app is a
 * single page today; if we add client-side navigation later we'll add a
 * route-change listener here.
 */
export function GoogleAnalytics() {
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!id) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}');
        `}
      </Script>
    </>
  );
}

import type { Metadata, Viewport } from "next";
import { Heebo, Geist, Permanent_Marker } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { heIL } from "@clerk/localizations";
import "./globals.css";
import { cn } from "@/lib/utils";
import { GoogleAnalytics } from "@/components/google-analytics";
import { SplashScreen } from "@/components/splash-screen";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
  display: "swap",
});

// Display face used by the in-app splash screen + the PWA icon. Permanent
// Marker has a thick graffiti / sticker-applied-by-hand feel that matches
// the Madbeka brand voice. Same font on both surfaces keeps the Android
// splash → React splash hand-off visually seamless.
const permanentMarker = Permanent_Marker({
  variable: "--font-permanent-marker",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Madbeka — מתמונה למדבקה תוך 10 שניות",
  description:
    "מחולל המדבקות הישראלי הכי מהיר. הופכים תמונה למדבקת וואטסאפ תוך 10 שניות. עברית מלאה, ביטויים ישראליים, בלי חיכוך.",
  metadataBase: new URL("https://madbeka.co.il"),
  manifest: "/manifest.webmanifest",
  // iOS Safari reads these when the user taps "Add to Home Screen".
  appleWebApp: {
    capable: true,
    title: "Madbeka",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#25D366",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      localization={heIL}
      appearance={{
        variables: {
          colorPrimary: "#25D366",
          fontFamily: "var(--font-heebo), system-ui, sans-serif",
        },
      }}
    >
      <html
        lang="he"
        dir="rtl"
        className={cn(
          "h-full",
          "antialiased",
          heebo.variable,
          "font-sans",
          geist.variable,
          permanentMarker.variable,
        )}
      >
        <body className="min-h-full flex flex-col font-sans">
          <SplashScreen />
          {children}
          <GoogleAnalytics />
        </body>
      </html>
    </ClerkProvider>
  );
}

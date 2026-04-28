import type { Metadata, Viewport } from "next";
import {
  Heebo,
  Geist,
  Permanent_Marker,
  Rubik,
  Secular_One,
  Varela_Round,
  Assistant,
  Suez_One,
  Karantina,
  Frank_Ruhl_Libre,
  Miriam_Libre,
  Bellefair,
  Caveat,
  Rubik_Wet_Paint,
  JetBrains_Mono,
} from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { heIL } from "@clerk/localizations";
import "./globals.css";
import { cn } from "@/lib/utils";
import { GoogleAnalytics } from "@/components/google-analytics";
import { SplashScreen } from "@/components/splash-screen";
import { SwRegistrar } from "@/components/sw-registrar";
import { PUBLIC_URL } from "@/lib/brand";

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

// The sticker editor lets users pick between several Hebrew display faces.
// Each one is wired through next/font with its own CSS variable so the
// canvas renderer can read `getComputedStyle(document.body).getPropertyValue`
// or just use the variable directly in a CSS font stack.
const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["hebrew", "latin"],
  weight: ["400", "700", "900"],
  display: "swap",
});
const secularOne = Secular_One({
  variable: "--font-secular",
  subsets: ["hebrew", "latin"],
  weight: "400",
  display: "swap",
});
const varelaRound = Varela_Round({
  variable: "--font-varela",
  subsets: ["hebrew", "latin"],
  weight: "400",
  display: "swap",
});
const assistant = Assistant({
  variable: "--font-assistant",
  subsets: ["hebrew", "latin"],
  weight: ["400", "700", "800"],
  display: "swap",
});
const suezOne = Suez_One({
  variable: "--font-suez",
  subsets: ["hebrew", "latin"],
  weight: "400",
  display: "swap",
});

// Hand-drawn / graffiti feel for Hebrew. Karantina is the closest Google
// Fonts has to "marker on a wall" energy for Hebrew glyphs — use it when
// you want a sticker to feel rebellious, young, street-art.
const karantina = Karantina({
  variable: "--font-karantina",
  subsets: ["hebrew", "latin"],
  weight: ["400", "700"],
  display: "swap",
});

// Classical, elegant Hebrew serif — for formal / greeting-card vibes
// ("לילה טוב", "מזל טוב", "שנה טובה"). Pairs with dark gradient styles.
const frankRuhl = Frank_Ruhl_Libre({
  variable: "--font-frank-ruhl",
  subsets: ["hebrew", "latin"],
  weight: ["400", "700", "900"],
  display: "swap",
});

// Modern Hebrew serif with a bold slab feel — great for single-word
// punch stickers that still read seriously ("גאון", "מטורף", "אלוף").
const miriamLibre = Miriam_Libre({
  variable: "--font-miriam",
  subsets: ["hebrew", "latin"],
  weight: ["400", "700"],
  display: "swap",
});

// High-contrast elegant serif — display face, thin lines meet thick
// verticals. Latin only, but kids love it for English slang stickers
// ("rizz", "no cap"). If you drop in Hebrew it falls back to Heebo.
const bellefair = Bellefair({
  variable: "--font-bellefair",
  subsets: ["hebrew", "latin"],
  weight: "400",
  display: "swap",
});

// Caveat — Latin handwritten casual script. Used by the "handwriting"
// sticker style for a personal, pen-on-paper vibe. Hebrew isn't in its
// subset so the CSS fallback chain drops through to Karantina for Hebrew
// chars, which keeps the hand-drawn energy even in Hebrew-only stickers.
const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["500", "700"],
  display: "swap",
});

// Rubik Wet Paint — dripping spray-paint look, built on the Rubik family.
// Used by the "graffiti" sticker style for Latin; Hebrew falls back to
// Karantina which covers the same hand-drawn street-art aesthetic.
const rubikWetPaint = Rubik_Wet_Paint({
  variable: "--font-rubik-wet",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

// JetBrains Mono — used for timestamps, kickers, badges, and code-style
// metadata throughout the Playful Sticker Shop UI. Latin only (Hebrew is
// not its lane; we use Assistant for body copy in Hebrew).
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const SITE_TITLE = "Madbeka — מדבקות וואטסאפ בעברית";
const SITE_DESCRIPTION =
  "עורך מדבקות וואטסאפ הישראלי הכי מהיר. כתוב בעברית, הוסף אימוג'ים, גרור כל אחד לבד, שלח לוואטסאפ — בלי אפליקציה, בלי הרשמה.";

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  metadataBase: new URL(PUBLIC_URL),
  manifest: "/manifest.webmanifest",
  // iOS Safari reads these when the user taps "Add to Home Screen".
  appleWebApp: {
    capable: true,
    title: "Madbeka",
    statusBarStyle: "default",
  },
  openGraph: {
    type: "website",
    locale: "he_IL",
    url: PUBLIC_URL,
    siteName: "Madbeka",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    // Image itself comes from src/app/opengraph-image.tsx (Next auto-wires it).
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    // Image comes from src/app/twitter-image.tsx.
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
        suppressHydrationWarning
        className={cn(
          "h-full",
          "antialiased",
          heebo.variable,
          "font-sans",
          geist.variable,
          permanentMarker.variable,
          rubik.variable,
          secularOne.variable,
          varelaRound.variable,
          assistant.variable,
          suezOne.variable,
          karantina.variable,
          frankRuhl.variable,
          miriamLibre.variable,
          bellefair.variable,
          caveat.variable,
          rubikWetPaint.variable,
          jetbrainsMono.variable,
        )}
      >
        <head>
          {/* Pre-hydration theme bootstrap — avoids a flash of light theme for
              users who've picked dark. Runs sync before React renders. */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                try {
                  var t = localStorage.getItem('madbeka:theme');
                  if (t !== 'light' && t !== 'dark') {
                    t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  if (t === 'dark') document.documentElement.classList.add('dark');
                } catch (e) {}
              `,
            }}
          />
        </head>
        <body className="min-h-full flex flex-col font-sans">
          <SplashScreen />
          {children}
          <SwRegistrar />
          <GoogleAnalytics />
        </body>
      </html>
    </ClerkProvider>
  );
}

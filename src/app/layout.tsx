import type { Metadata, Viewport } from "next";
import { Heebo, Geist } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { heIL } from "@clerk/localizations";
import "./globals.css";
import { cn } from "@/lib/utils";
import { GoogleAnalytics } from "@/components/google-analytics";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Madbeka — מתמונה למדבקה תוך 10 שניות",
  description:
    "מחולל המדבקות הישראלי הכי מהיר. הופכים תמונה למדבקת וואטסאפ תוך 10 שניות. עברית מלאה, ביטויים ישראליים, בלי חיכוך.",
  metadataBase: new URL("https://madbeka.co.il"),
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
        )}
      >
        <body className="min-h-full flex flex-col font-sans">
          {children}
          <GoogleAnalytics />
        </body>
      </html>
    </ClerkProvider>
  );
}

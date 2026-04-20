import type { Metadata, Viewport } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";

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
    <html
      lang="he"
      dir="rtl"
      className={`${heebo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}

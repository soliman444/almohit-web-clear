import type { Metadata } from "next";
import { BRAND } from "../lib/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: `${BRAND.name} — Wholesale Fresh Fruits`,
  description:
    "MANGO FRESH FRUITS wholesale catalog. Browse produce first; trade prices after business approval.",
  icons: {
    icon: BRAND.logoSrc,
    apple: BRAND.logoSrc,
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" dir="ltr" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Instrument+Sans:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

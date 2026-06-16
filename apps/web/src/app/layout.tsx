import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

// Premium pairing: Fraunces (a high-contrast "soft" serif) for editorial
// headings, Manrope (a refined geometric sans) for body and UI. Swap here.
const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const sans = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "BazaarX — Shop from thousands of sellers",
  description:
    "A multi-vendor marketplace. Discover products from independent sellers, with fast checkout, returns, and cash on delivery.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

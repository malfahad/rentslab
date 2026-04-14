import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "RentSlab | Property management",
    template: "%s | RentSlab",
  },
  description:
    "Your rent roll under control. One view of every tenant, unit, and shilling owed. For East Africa.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${sourceSerif.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}

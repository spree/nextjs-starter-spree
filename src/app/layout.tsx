import { GoogleTagManager } from "@next/third-parties/google";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { getStoreDescription, getStoreName } from "@/lib/seo";

const gtmId = process.env.GTM_ID;

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const rootStoreName = getStoreName();

export const metadata: Metadata = {
  title: {
    template: `%s | ${rootStoreName}`,
    default: rootStoreName,
  },
  description: getStoreDescription(),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      {gtmId && <GoogleTagManager gtmId={gtmId} />}
      <body
        className={`${geist.variable} antialiased min-h-screen flex flex-col`}
      >
        {children}
      </body>
    </html>
  );
}

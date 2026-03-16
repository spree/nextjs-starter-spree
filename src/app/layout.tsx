import { GoogleTagManager } from "@next/third-parties/google";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Toaster } from "@/components/ui/sonner";
import { CartProvider } from "@/contexts/CartContext";

const gtmId = process.env.GTM_ID;

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const rootStoreName = process.env.NEXT_PUBLIC_STORE_NAME || "Spree Store";

export const metadata: Metadata = {
  title: {
    template: `%s | ${rootStoreName}`,
    default: rootStoreName,
  },
  description:
    process.env.NEXT_PUBLIC_STORE_DESCRIPTION ||
    "A modern e-commerce storefront powered by Spree Commerce and Next.js.",
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
        <Suspense>
          <CartProvider>
            {children}
            <CartDrawer />
            <Toaster />
          </CartProvider>
        </Suspense>
      </body>
    </html>
  );
}

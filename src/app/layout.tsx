import { GoogleTagManager } from "@next/third-parties/google";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import "./globals.css";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { Toaster } from "@/components/ui/sonner";
import { CartProvider } from "@/contexts/CartContext";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = cookieStore.get("spree_locale")?.value || "en";
  const messages = await getMessages();

  return (
    <html lang={locale}>
      {gtmId && <GoogleTagManager gtmId={gtmId} />}
      <body
        className={`${geist.variable} antialiased min-h-screen flex flex-col`}
      >
        <NextIntlClientProvider messages={messages} locale={locale}>
          <CartProvider>
            {children}
            <CartDrawer />
            <Toaster />
          </CartProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

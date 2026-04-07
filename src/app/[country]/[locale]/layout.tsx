import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { JsonLd } from "@/components/seo/JsonLd";
import { AuthProvider } from "@/contexts/AuthContext";
import { StoreProvider } from "@/contexts/StoreContext";
import { getMarkets } from "@/lib/data/markets";
import { generateStoreMetadata } from "@/lib/metadata/store";
import { buildOrganizationJsonLd } from "@/lib/seo";
import deMessages from "../../../../messages/de.json";
import enMessages from "../../../../messages/en.json";
import esMessages from "../../../../messages/es.json";
import frMessages from "../../../../messages/fr.json";
import plMessages from "../../../../messages/pl.json";

const DEFAULT_COUNTRY = process.env.NEXT_PUBLIC_DEFAULT_COUNTRY || "us";
const DEFAULT_LOCALE = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "en";

const messagesMap: Record<string, IntlMessages> = {
  en: enMessages,
  de: deMessages,
  es: esMessages,
  fr: frMessages,
  pl: plMessages,
};

interface CountryLocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    country: string;
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: CountryLocaleLayoutProps): Promise<Metadata> {
  const { locale } = await params;
  return generateStoreMetadata({ locale });
}

export default async function CountryLocaleLayout({
  children,
  params,
}: CountryLocaleLayoutProps) {
  const { country, locale } = await params;

  const markets = await getMarkets({ country, locale })
    .then((res) => res.data)
    .catch(() => []);

  // Validate that the URL country belongs to an available market.
  // If not, redirect server-side to avoid SSR with wrong prices.
  const isValidCountry = markets.some((market) =>
    market.countries?.some(
      (c) => c.iso.toLowerCase() === country.toLowerCase(),
    ),
  );

  if (!isValidCountry) {
    const defaultMarket = markets.find((m) => m.default) ?? markets[0];
    const fallbackCountry =
      defaultMarket?.countries?.[0]?.iso.toLowerCase() ?? DEFAULT_COUNTRY;
    const fallbackLocale = defaultMarket?.default_locale ?? DEFAULT_LOCALE;

    redirect(`/${fallbackCountry}/${fallbackLocale}`);
  }

  // Load messages statically (no runtime data access) to avoid blocking prerender
  const messages = messagesMap[locale] || messagesMap.en;

  return (
    <NextIntlClientProvider
      messages={messages}
      locale={locale as "en" | "de" | "pl"}
    >
      <StoreProvider
        initialCountry={country}
        initialLocale={locale}
        initialMarkets={markets}
      >
        <AuthProvider>
          <JsonLd data={buildOrganizationJsonLd()} />
          {children}
        </AuthProvider>
      </StoreProvider>
    </NextIntlClientProvider>
  );
}

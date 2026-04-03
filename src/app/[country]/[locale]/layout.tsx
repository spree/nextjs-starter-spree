import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { AuthProvider } from "@/contexts/AuthContext";
import { StoreProvider } from "@/contexts/StoreContext";
import { getMarkets } from "@/lib/data/markets";
import { generateStoreMetadata } from "@/lib/metadata/store";
import { buildOrganizationJsonLd } from "@/lib/seo";
import { getDefaultCountry, getDefaultLocale } from "@/lib/store";

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
      defaultMarket?.countries?.[0]?.iso.toLowerCase() ?? getDefaultCountry();
    const fallbackLocale = defaultMarket?.default_locale ?? getDefaultLocale();

    redirect(`/${fallbackCountry}/${fallbackLocale}`);
  }

  return (
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
  );
}

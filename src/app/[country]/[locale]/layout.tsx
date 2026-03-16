import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { AuthProvider } from "@/contexts/AuthContext";
import { StoreProvider } from "@/contexts/StoreContext";
import { getMarkets } from "@/lib/data/markets";
import { generateStoreMetadata } from "@/lib/metadata/store";
import { buildOrganizationJsonLd } from "@/lib/seo";

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

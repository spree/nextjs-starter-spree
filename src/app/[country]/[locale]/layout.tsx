import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { AuthProvider } from "@/contexts/AuthContext";
import { StoreProvider } from "@/contexts/StoreContext";
import { getCachedStore } from "@/lib/data/cached";
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

  let store;
  try {
    store = await getCachedStore({ locale });
  } catch {
    store = null;
  }

  return (
    <StoreProvider initialCountry={country} initialLocale={locale}>
      <AuthProvider>
        {store && <JsonLd data={buildOrganizationJsonLd(store)} />}
        {children}
      </AuthProvider>
    </StoreProvider>
  );
}

import { AuthProvider } from "@/contexts/AuthContext";
import { StoreProvider } from "@/contexts/StoreContext";
import { getMarkets } from "@/lib/data/markets";

interface CountryLocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    country: string;
    locale: string;
  }>;
}

export default async function CountryLocaleLayout({
  children,
  params,
}: CountryLocaleLayoutProps) {
  const { country, locale } = await params;

  const markets = await getMarkets()
    .then((res) => res.data)
    .catch(() => []);

  return (
    <StoreProvider
      initialCountry={country}
      initialLocale={locale}
      initialMarkets={markets}
    >
      <AuthProvider>{children}</AuthProvider>
    </StoreProvider>
  );
}

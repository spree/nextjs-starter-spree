import { MapPin } from "lucide-react";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { AddressManagement } from "@/components/addresses/AddressManagement";
import type { User } from "@/contexts/AuthContext";
import { getAddresses } from "@/lib/data/addresses";
import { getCustomer } from "@/lib/data/customer";
import { getMarketCountries, resolveMarket } from "@/lib/data/markets";

interface AddressesPageProps {
  params: Promise<{ country: string; locale: string }>;
}

export default async function AddressesPage({ params }: AddressesPageProps) {
  await connection();
  const { country: urlCountry, locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "account",
  });
  const [addressResponse, market, customer] = await Promise.all([
    getAddresses(),
    resolveMarket(urlCountry).catch(() => null),
    getCustomer().catch(() => null),
  ]);

  const countriesResponse = market
    ? await getMarketCountries(market.id).catch(() => ({ data: [] }))
    : { data: [] };

  const addresses = addressResponse.data;
  const countries = countriesResponse.data;
  const user: User | undefined = customer
    ? {
        id: customer.id,
        email: customer.email,
        first_name: customer.first_name,
        last_name: customer.last_name,
      }
    : undefined;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("addresses")}</h1>
      </div>

      {addresses.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t("noAddresses")}
          </h3>
          <p className="text-gray-500 mb-6">{t("noAddressesDescription")}</p>
          <AddressManagement
            initialAddresses={addresses}
            countries={countries}
            showAddButton={true}
            emptyState={true}
            user={user}
          />
        </div>
      ) : (
        <AddressManagement
          initialAddresses={addresses}
          countries={countries}
          showAddButton={true}
          emptyState={false}
          user={user}
        />
      )}
    </div>
  );
}

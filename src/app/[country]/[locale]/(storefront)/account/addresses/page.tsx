import { MapPin } from "lucide-react";
import { AddressManagement } from "@/components/addresses/AddressManagement";
import { getAddresses } from "@/lib/data/addresses";
import { getCountries } from "@/lib/data/countries";

export default async function AddressesPage() {
  // Fetch data in parallel on the server
  const [addressResponse, countriesResponse] = await Promise.all([
    getAddresses(),
    getCountries(),
  ]);

  const addresses = addressResponse.data;
  const countries = countriesResponse.data;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Addresses</h1>
      </div>

      {addresses.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No addresses saved
          </h3>
          <p className="text-gray-500 mb-6">
            Add an address for faster checkout.
          </p>
          <AddressManagement
            initialAddresses={addresses}
            countries={countries}
            showAddButton={true}
            emptyState={true}
          />
        </div>
      ) : (
        <AddressManagement
          initialAddresses={addresses}
          countries={countries}
          showAddButton={true}
          emptyState={false}
        />
      )}
    </div>
  );
}

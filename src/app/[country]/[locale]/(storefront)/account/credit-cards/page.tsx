import { CreditCard, Lock } from "lucide-react";
import { CreditCardList } from "@/components/account/CreditCardList";
import { getCreditCards } from "@/lib/data/credit-cards";

export default async function CreditCardsPage() {
  const response = await getCreditCards();
  const cards = response.data;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Payment Methods</h1>

      {cards.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No payment methods saved
          </h3>
          <p className="text-gray-500">
            Payment methods are saved automatically when you make a purchase.
          </p>
        </div>
      ) : (
        <CreditCardList initialCards={cards} />
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded-xl">
        <p className="text-sm text-gray-600">
          <Lock className="w-4 h-4 inline mr-1" />
          Your payment information is securely stored and encrypted. We never
          store your full card number.
        </p>
      </div>
    </div>
  );
}

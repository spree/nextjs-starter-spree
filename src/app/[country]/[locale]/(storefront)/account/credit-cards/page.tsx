import { CreditCard, Lock } from "lucide-react";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { CreditCardList } from "@/components/account/CreditCardList";
import { getCreditCards } from "@/lib/data/credit-cards";

export default async function CreditCardsPage() {
  await connection();
  const t = await getTranslations("creditCards");
  const response = await getCreditCards();
  const cards = response.data;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {t("paymentMethods")}
      </h1>

      {cards.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t("noCards")}
          </h3>
          <p className="text-gray-500">{t("noCardsDescription")}</p>
        </div>
      ) : (
        <CreditCardList initialCards={cards} />
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded-xl">
        <p className="text-sm text-gray-600">
          <Lock className="w-4 h-4 inline mr-1" />
          {t("secureInfo")}
        </p>
      </div>
    </div>
  );
}

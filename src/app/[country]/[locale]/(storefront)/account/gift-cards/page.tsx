import { Gift, Info } from "lucide-react";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { GiftCardList } from "@/components/account/GiftCardList";
import { getGiftCards } from "@/lib/data/gift-cards";

export default async function GiftCardsPage() {
  await connection();
  const t = await getTranslations("giftCards");
  const response = await getGiftCards();
  const cards = response.data;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {t("giftCards")}
      </h1>

      {cards.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t("noGiftCards")}
          </h3>
          <p className="text-gray-500">{t("noGiftCardsDescription")}</p>
        </div>
      ) : (
        <GiftCardList cards={cards} />
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded-xl">
        <p className="text-sm text-gray-600">
          <Info className="w-4 h-4 inline mr-1" />
          {t("giftCardsHelpText")}
        </p>
      </div>
    </div>
  );
}

import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { isWholesaleEnabled } from "@/lib/spree";

interface WholesaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ country: string; locale: string }>;
}

/**
 * Shell for the wholesale portal. The distinct slate trade dress lives here; the
 * per-page <WholesaleGate> owns auth branching and the portal chrome so the
 * public apply page can render without the gate.
 *
 * Wholesale is an opt-in addon: when it's disabled every route in this group
 * 404s here in one place (PLP/PDP/cart/quick-order/apply), so a DTC-only
 * storefront never exposes a broken gate.
 */
export default function WholesaleLayout({ children }: WholesaleLayoutProps) {
  if (!isWholesaleEnabled()) notFound();

  return <div className="min-h-screen bg-slate-50">{children}</div>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "wholesale",
  });
  return {
    title: t("portalTitle"),
    robots: { index: false, follow: false },
  };
}

import { redirect } from "next/navigation";
import { getCustomer } from "@/lib/data/customer";
import { getWholesaleChannel } from "@/lib/data/wholesale";
import { WholesaleSignInWall } from "../_components/WholesaleSignInWall";

interface WholesaleSignInPageProps {
  params: Promise<{ country: string; locale: string }>;
  searchParams: Promise<{ redirect?: string }>;
}

/**
 * Dedicated sign-in destination for the portal. On a `prices_hidden` channel
 * the catalog root renders for guests, so "sign in" affordances can't point
 * there — they'd land right back on the catalog (and, with `?redirect=`
 * re-appended on every click, loop forever). This page always shows the
 * sign-in wall (which also links to the apply form) and honours the same
 * `?redirect=` contract; an already-authenticated buyer is bounced into the
 * portal, where the gate resolves their approval state.
 */
export default async function WholesaleSignInPage({
  params,
  searchParams,
}: WholesaleSignInPageProps) {
  const { country, locale } = await params;
  const { redirect: redirectParam } = await searchParams;
  const basePath = `/${country}/${locale}`;

  const [customer, channel] = await Promise.all([
    getCustomer(),
    getWholesaleChannel(),
  ]);

  if (customer) {
    // Same open-redirect guard as the wall: relative, single-slash paths only.
    const target =
      redirectParam?.startsWith("/") && !redirectParam.startsWith("//")
        ? redirectParam
        : `${basePath}/wholesale`;
    redirect(target);
  }

  return (
    <WholesaleSignInWall
      basePath={basePath}
      storefrontAccess={channel?.storefront_access}
    />
  );
}

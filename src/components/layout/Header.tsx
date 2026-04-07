import type { Category } from "@spree/sdk";
import { User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CartButton } from "@/components/layout/CartButton";
import { CountrySwitcher } from "@/components/layout/CountrySwitcher";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { SearchToggle } from "@/components/layout/SearchToggle";
import { Button } from "@/components/ui/button";

const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Spree Store";

interface HeaderProps {
  rootCategories: Category[];
  basePath: string;
}

export async function Header({ rootCategories, basePath }: HeaderProps) {
  const t = await getTranslations("header");

  return (
    <SearchToggle
      basePath={basePath}
      left={<MobileMenu rootCategories={rootCategories} basePath={basePath} />}
      center={
        <Link href={basePath || "/"} className="flex items-center min-w-0">
          <Image
            src="/spree.png"
            alt={storeName}
            width={90}
            height={32}
            className="h-8 w-auto max-w-full object-contain"
            priority
          />
        </Link>
      }
      rightStart={
        <div className="hidden lg:block">
          <CountrySwitcher />
        </div>
      }
      rightEnd={
        <>
          {/* Account - desktop only */}
          <div className="hidden md:block">
            <Button variant="ghost" size="icon-lg" asChild>
              <Link href={`${basePath}/account`} aria-label={t("account")}>
                <User className="size-5" />
              </Link>
            </Button>
          </div>

          {/* Cart */}
          <CartButton />
        </>
      }
    />
  );
}

import type { Category } from "@spree/sdk";
import { User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CartButton } from "@/components/layout/CartButton";
import { CountrySwitcher } from "@/components/layout/CountrySwitcher";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { SearchToggle } from "@/components/layout/SearchToggle";
import { Button } from "@/components/ui/button";
import { getStoreName } from "@/lib/store";

const storeName = getStoreName();

interface HeaderProps {
  rootCategories: Category[];
  basePath: string;
}

export function Header({ rootCategories, basePath }: HeaderProps) {
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
              <Link href={`${basePath}/account`} aria-label="Account">
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

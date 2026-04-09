import { Suspense } from "react";
import {
  StorefrontFooter,
  StorefrontHeader,
} from "@/components/layout/StorefrontShell";

interface StorefrontLayoutProps {
  children: React.ReactNode;
  params: Promise<{ country: string; locale: string }>;
}

function HeaderSkeleton() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 h-16" />
  );
}

export default async function StorefrontLayout({
  children,
  params,
}: StorefrontLayoutProps) {
  const { country, locale } = await params;
  const basePath = `/${country}/${locale}`;

  return (
    <>
      <Suspense fallback={<HeaderSkeleton />}>
        <StorefrontHeader
          basePath={basePath}
          locale={locale}
          country={country}
        />
      </Suspense>
      <main className="flex-1">{children}</main>
      {/* No fallback needed — footer is below the fold */}
      <Suspense>
        <StorefrontFooter
          basePath={basePath}
          locale={locale}
          country={country}
        />
      </Suspense>
    </>
  );
}

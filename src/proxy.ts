import { createSpreeMiddleware } from "@spree/next/middleware";

const DEFAULT_COUNTRY = process.env.NEXT_PUBLIC_DEFAULT_COUNTRY || "us";
const DEFAULT_LOCALE = process.env.NEXT_PUBLIC_DEFAULT_LOCALE || "en";

export const proxy = createSpreeMiddleware({
  defaultCountry: DEFAULT_COUNTRY,
  defaultLocale: DEFAULT_LOCALE,
});

export const config = {
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico|.*\\..*$).*)"],
};

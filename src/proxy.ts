import { SUPPORTED_LOCALES } from "@/i18n/locales";
import { createSpreeMiddleware } from "@/lib/spree/middleware";
import { getDefaultCountry, getDefaultLocale } from "@/lib/store";

export const proxy = createSpreeMiddleware({
  defaultCountry: getDefaultCountry(),
  defaultLocale: getDefaultLocale(),
  supportedLocales: SUPPORTED_LOCALES,
});

export const config = {
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico|.*\\..*$).*)"],
};

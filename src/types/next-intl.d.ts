import type { SupportedLocale } from "@/i18n/locales";
import type messages from "../../messages/en.json";

type Messages = typeof messages;

declare global {
  type Locale = SupportedLocale;
  interface IntlMessages extends Messages {}
}

declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
  }
}

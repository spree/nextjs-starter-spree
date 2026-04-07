import type messages from "../../messages/en.json";

type Messages = typeof messages;

declare global {
  type Locale = "en" | "de" | "pl";
  interface IntlMessages extends Messages {}
}

declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
  }
}

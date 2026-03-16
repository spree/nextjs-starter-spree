import type messages from "../../messages/en.json";

type Messages = typeof messages;
type Locale = "en" | "de" | "pl";

declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
  }
}

declare global {
  interface IntlMessages extends Messages {}
}

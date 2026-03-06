import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const locale = cookieStore.get("spree_locale")?.value || "en";

  let messages: IntlMessages;
  try {
    messages = (await import(`../../messages/${locale}.json`)).default;
  } catch {
    // Fallback to English if locale file doesn't exist
    messages = (await import("../../messages/en.json")).default;
  }

  return { locale, messages };
});

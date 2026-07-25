import "../globals.css";
import { DocumentShell } from "@/components/layout/DocumentShell";
import { DEFAULT_LOCALE } from "@/i18n/locales";

export default function DevLayout({ children }: { children: React.ReactNode }) {
  return <DocumentShell locale={DEFAULT_LOCALE}>{children}</DocumentShell>;
}

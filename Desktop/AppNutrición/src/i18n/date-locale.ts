import { es } from "date-fns/locale/es";
import { pt } from "date-fns/locale/pt";
import type { Locale as DateLocale } from "date-fns";
import type { Locale } from "./config";

const DATE_LOCALES: Record<Locale, DateLocale> = { es, pt };

export function getDateLocale(locale: Locale): DateLocale {
  return DATE_LOCALES[locale] ?? es;
}

export const locales = ["es", "pt"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "es";

const INTL_TAG: Record<Locale, string> = { es: "es-ES", pt: "pt-BR" };
export function intlTag(locale: Locale): string {
  return INTL_TAG[locale] ?? "es-ES";
}

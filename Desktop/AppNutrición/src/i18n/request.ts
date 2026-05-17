import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { defaultLocale, locales, type Locale } from "./config";

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const raw = cookieStore.get("NEXT_LOCALE")?.value;
  const locale: Locale = locales.includes(raw as Locale)
    ? (raw as Locale)
    : defaultLocale;

  const modules = await Promise.all([
    import(`../messages/${locale}/common.json`),
    import(`../messages/${locale}/auth.json`),
    import(`../messages/${locale}/dashboard.json`),
    import(`../messages/${locale}/patients.json`),
    import(`../messages/${locale}/foods.json`),
    import(`../messages/${locale}/recipes.json`),
    import(`../messages/${locale}/diets.json`),
    import(`../messages/${locale}/agenda.json`),
    import(`../messages/${locale}/chat.json`),
    import(`../messages/${locale}/notifications.json`),
    import(`../messages/${locale}/settings.json`),
    import(`../messages/${locale}/payments.json`),
    import(`../messages/${locale}/reports.json`),
    import(`../messages/${locale}/admin.json`),
    import(`../messages/${locale}/patient-portal.json`),
    import(`../messages/${locale}/landing.json`),
    import(`../messages/${locale}/pricing.json`),
    import(`../messages/${locale}/legal.json`),
    import(`../messages/${locale}/help.json`),
    import(`../messages/${locale}/emails.json`),
    import(`../messages/${locale}/pdf.json`),
    import(`../messages/${locale}/validation.json`),
  ]);

  const namespaces = [
    "common", "auth", "dashboard", "patients", "foods", "recipes", "diets",
    "agenda", "chat", "notifications", "settings", "payments", "reports",
    "admin", "patient-portal", "landing", "pricing", "legal", "help",
    "emails", "pdf", "validation",
  ];

  const messages: Record<string, Record<string, unknown>> = {};
  namespaces.forEach((ns, i) => {
    messages[ns] = modules[i].default;
  });

  return { locale, messages };
});

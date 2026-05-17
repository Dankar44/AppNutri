import Link from "next/link";
import { ArrowLeft, Settings } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getNotifPreferencias } from "@/app/actions/notificaciones";
import { PreferenciasForm } from "./preferencias-form";
import { getTranslations } from "next-intl/server";

export default async function PreferenciasNotificacionesPage() {
  const [prefs, t] = await Promise.all([
    getNotifPreferencias(),
    getTranslations("notifications"),
  ]);

  return (
    <div>
      <div className="mb-3">
        <Link
          href="/notificaciones"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("preferencias.backToNotifications")}
        </Link>
      </div>

      <PageHeader
        icon={Settings}
        title={t("preferencias.pageTitle")}
        subtitle={t("preferencias.subtitle")}
      />

      <PreferenciasForm prefs={prefs} />
    </div>
  );
}

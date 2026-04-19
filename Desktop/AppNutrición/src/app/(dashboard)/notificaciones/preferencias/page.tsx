import Link from "next/link";
import { ArrowLeft, Settings } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getNotifPreferencias } from "@/app/actions/notificaciones";
import { PreferenciasForm } from "./preferencias-form";

export default async function PreferenciasNotificacionesPage() {
  const prefs = await getNotifPreferencias();

  return (
    <div>
      <div className="mb-3">
        <Link
          href="/notificaciones"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a notificaciones
        </Link>
      </div>

      <PageHeader
        icon={Settings}
        title="Preferencias"
        subtitle="Elige qué notificaciones quieres recibir"
      />

      <PreferenciasForm prefs={prefs} />
    </div>
  );
}

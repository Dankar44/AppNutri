import Link from "next/link";
import { Bell, Settings } from "lucide-react";
import { getNotificaciones } from "@/app/actions/notificaciones";
import { NotificacionActions } from "./notificacion-actions";
import { NotificacionItem } from "./notificacion-item";
import { PageHeader } from "@/components/page-header";
import { getTranslations } from "next-intl/server";
import { getLocale } from "@/i18n/locale";

type Notif = Awaited<ReturnType<typeof getNotificaciones>>[number];

function formatLabelDia(d: Date, t: Awaited<ReturnType<typeof getTranslations<"notifications">>>, localeTag: string): string {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const ayer = new Date(hoy);
  ayer.setDate(ayer.getDate() - 1);
  const fecha = new Date(d);
  fecha.setHours(0, 0, 0, 0);

  if (fecha.getTime() === hoy.getTime()) return t("dateLabels.today");
  if (fecha.getTime() === ayer.getTime()) return t("dateLabels.yesterday");

  const diffDias = Math.round((hoy.getTime() - fecha.getTime()) / 86400000);
  if (diffDias > 1 && diffDias <= 6) {
    const wd = fecha.toLocaleDateString(localeTag, { weekday: "long" });
    return wd.charAt(0).toUpperCase() + wd.slice(1);
  }

  const formato = fecha.toLocaleDateString(localeTag, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return formato.charAt(0).toUpperCase() + formato.slice(1);
}

function agruparPorDia(notifs: Notif[], t: Awaited<ReturnType<typeof getTranslations<"notifications">>>, localeTag: string): { label: string; items: Notif[] }[] {
  const grupos: Record<string, Notif[]> = {};
  const ordenes: string[] = [];

  for (const n of notifs) {
    const d = new Date(n.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!grupos[key]) {
      grupos[key] = [];
      ordenes.push(key);
    }
    grupos[key].push(n);
  }

  return ordenes.map((key) => ({
    label: formatLabelDia(new Date(grupos[key][0].createdAt), t, localeTag),
    items: grupos[key],
  }));
}

export default async function NotificacionesPage() {
  const t = await getTranslations("notifications");
  const locale = await getLocale();
  const localeTag = locale === "pt" ? "pt-BR" : "es-ES";
  const notificaciones = await getNotificaciones();
  const noLeidas = notificaciones.filter((n) => !n.leida).length;
  const grupos = agruparPorDia(notificaciones, t, localeTag);

  return (
    <div>
      <PageHeader
        icon={Bell}
        title={t("page.title")}
        subtitle={noLeidas > 0 ? t("page.unreadCount", { count: noLeidas }) : t("page.allRead")}
        action={
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link
              href="/notificaciones/preferencias"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium shrink-0"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">{t("page.preferences")}</span>
            </Link>
            <NotificacionActions
              mostrarMarcarLeidas={noLeidas > 0}
              hayNotificaciones={notificaciones.length > 0}
            />
          </div>
        }
      />

      {notificaciones.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto flex items-center justify-center mb-4">
            <Bell strokeWidth={1.75} className="w-8 h-8 text-primary" />
          </div>
          <h3 className="font-semibold text-lg mb-1">{t("page.emptyTitle")}</h3>
          <p className="text-muted-foreground text-sm">
            {t("page.emptyMessage")}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {grupos.map((grupo, idx) => (
            <section key={idx}>
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  {grupo.label}
                </h2>
                <span className="text-[11px] text-muted-foreground/70 tabular-nums">
                  {t("page.notificationCount", { count: grupo.items.length })}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="bg-card rounded-2xl border border-border overflow-hidden divide-y divide-border">
                {grupo.items.map((n) => (
                  <NotificacionItem key={n.id} notificacion={n} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

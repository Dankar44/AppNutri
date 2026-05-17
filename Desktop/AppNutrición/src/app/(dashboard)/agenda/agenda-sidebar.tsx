import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays, ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getLocale } from "@/i18n/locale";
import { intlTag } from "@/i18n/config";
import { AvatarPaciente } from "@/components/avatar-paciente";
import { GoogleCalendarSidebar } from "./google-calendar-sidebar";

export type ProximaCitaAgenda = {
  id: string;
  fechaHora: string;
  duracion: number;
  paciente: {
    id: string;
    nombre: string;
    apellidos: string;
    fotoUrl: string | null;
  };
};

export async function AgendaSidebar({
  proximaCita,
  esPrimeraConsulta,
  googleConfigured,
  googleIntegracion,
}: {
  proximaCita: ProximaCitaAgenda | null;
  esPrimeraConsulta: boolean;
  googleConfigured: boolean;
  googleIntegracion: { email: string; sincronizar: boolean } | null;
}) {
  const t = await getTranslations("agenda");
  const locale = await getLocale();
  const tag = intlTag(locale);
  return (
    <aside className="w-full xl:w-[min(100%,20rem)] shrink-0 space-y-4 xl:sticky xl:top-6 self-start order-2 mb-6 xl:mb-0">
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="flex items-start justify-between gap-2 mb-4">
          <h2 className="text-base font-semibold">{t("sidebar.nextAppointment")}</h2>
          {proximaCita && (
            <div className="flex flex-wrap items-center justify-end gap-1.5 shrink-0">
              {esPrimeraConsulta && (
                <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/15 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-500/30">
                  1ª
                </span>
              )}
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-100">
                {formatDistanceToNow(new Date(proximaCita.fechaHora), {
                  addSuffix: true,
                  locale: es,
                })}
              </span>
            </div>
          )}
        </div>

        {!proximaCita ? (
          <div className="text-center py-6">
            <CalendarDays className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              {t("sidebar.noAppointments")}
            </p>
            <Link
              href="/agenda/nueva"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              {t("sidebar.newAppointment")}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3 mb-5">
              <AvatarPaciente
                nombre={proximaCita.paciente.nombre}
                apellidos={proximaCita.paciente.apellidos}
                fotoUrl={proximaCita.paciente.fotoUrl}
                size="lg"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">
                  {proximaCita.paciente.nombre} {proximaCita.paciente.apellidos}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {(() => {
                    const inicio = new Date(proximaCita.fechaHora);
                    const fin = new Date(
                      inicio.getTime() + proximaCita.duracion * 60_000
                    );
                    const hoy = new Date();
                    const mismoDia =
                      inicio.getDate() === hoy.getDate() &&
                      inicio.getMonth() === hoy.getMonth() &&
                      inicio.getFullYear() === hoy.getFullYear();
                    const prefijo = mismoDia
                      ? t("sidebar.today")
                      : inicio.toLocaleDateString(tag, {
                          weekday: "long",
                        });
                    const pref =
                      prefijo.charAt(0).toUpperCase() + prefijo.slice(1);
                    const t0 = inicio.toLocaleTimeString(tag, {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    const t1 = fin.toLocaleTimeString(tag, {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    return `${pref} | ${t0} – ${t1}`;
                  })()}
                </p>
              </div>
            </div>
            <Link
              href={`/pacientes/${proximaCita.paciente.id}/consultas/nueva`}
              className="flex w-full items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {t("sidebar.startConsultation")}
            </Link>
          </>
        )}
      </div>

      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2 px-0.5">
          {t("sidebar.configureAvailability")}
        </p>
        <Link
          href="/agenda/horario"
          className="block rounded-xl border border-border bg-card p-5 shadow-sm hover:bg-muted/40 transition-colors"
        >
          <div className="flex gap-4 items-start">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base text-foreground">
                {t("sidebar.workScheduleTitle")}
              </h3>
              <p className="text-sm text-muted-foreground mt-2 leading-snug">
                {t("sidebar.workScheduleDescription")}
              </p>
              <span className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-primary hover:underline">
                {t("sidebar.defineWorkSchedule")}
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
            <div className="shrink-0 rounded-lg bg-primary/10 p-3 text-primary">
              <CalendarDays className="w-10 h-10" strokeWidth={1.5} />
            </div>
          </div>
        </Link>
      </div>

      {googleConfigured && (
        <GoogleCalendarSidebar integracion={googleIntegracion} />
      )}
    </aside>
  );
}

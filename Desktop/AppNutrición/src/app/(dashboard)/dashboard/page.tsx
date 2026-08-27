import {
  CalendarDays,
  Clock,
  ArrowRight,
  UserPlus,
  FileText,
  CalendarPlus,
  ChefHat,
  TrendingUp,
  Hourglass,
  LayoutDashboard,
  Bell,
  Zap,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { getCurrentDietista } from "@/app/actions/auth";
import { getProximasCitas } from "@/app/actions/citas";
import {
  getMetricasDashboard,
  getActividadMensual,
} from "@/app/actions/metricas";
import { generarNotificaciones, getNotificaciones } from "@/app/actions/notificaciones";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DashboardCharts } from "./dashboard-charts";
import { AvatarPaciente } from "@/components/avatar-paciente";
import { getTranslations } from "next-intl/server";
import { getLocale } from "@/i18n/locale";
import { intlTag } from "@/i18n/config";

function getSaludoMadrid(tag: string): { saludoKey: "buenosDias" | "buenasTardes" | "buenasNoches"; fechaLarga: string; horaActual: string } {
  const ahora = new Date();
  const horaMadrid = parseInt(
    ahora.toLocaleString(tag, {
      timeZone: "Europe/Madrid",
      hour: "numeric",
      hour12: false,
    }),
    10,
  );

  let saludoKey: "buenosDias" | "buenasTardes" | "buenasNoches" = "buenosDias";
  if (horaMadrid >= 13 && horaMadrid < 21) saludoKey = "buenasTardes";
  else if (horaMadrid >= 21 || horaMadrid < 6) saludoKey = "buenasNoches";

  const fechaLarga = ahora.toLocaleDateString(tag, {
    timeZone: "Europe/Madrid",
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const horaActual = ahora.toLocaleTimeString(tag, {
    timeZone: "Europe/Madrid",
    hour: "2-digit",
    minute: "2-digit",
  });

  return {
    saludoKey,
    fechaLarga: fechaLarga.charAt(0).toUpperCase() + fechaLarga.slice(1),
    horaActual,
  };
}

const ACCESOS_RAPIDOS = [
  { href: "/pacientes/nuevo", labelKey: "nuevoPaciente" as const, descKey: "nuevoPacienteDesc" as const, icon: UserPlus },
  { href: "/dietas/nuevo", labelKey: "nuevoPlan" as const, descKey: "nuevoPlanDesc" as const, icon: FileText },
  { href: "/agenda/nueva", labelKey: "nuevaCita" as const, descKey: "nuevaCitaDesc" as const, icon: CalendarPlus },
  { href: "/recetas/nueva", labelKey: "nuevaReceta" as const, descKey: "nuevaRecetaDesc" as const, icon: ChefHat },
];

export default async function DashboardPage() {
  const dietista = await getCurrentDietista();
  if (!dietista) redirect("/login");

  const t = await getTranslations("dashboard");
  const locale = await getLocale();
  const tag = intlTag(locale);

  generarNotificaciones().catch(() => {});

  const [metricas, actividad, proximasCitas, notificaciones] = await Promise.all([
    getMetricasDashboard(),
    getActividadMensual(),
    getProximasCitas(8),
    getNotificaciones(),
  ]);

  if (!metricas) redirect("/login");

  const primeraCita = proximasCitas[0];
  const { saludoKey, fechaLarga, horaActual } = getSaludoMadrid(tag);
  const saludo = t(`greeting.${saludoKey}`);

  const ultimaNotificacion = notificaciones[0];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* HERO DE BIENVENIDA */}
      <section>
        <div className="flex items-start gap-3 min-w-0">
          <LayoutDashboard
            strokeWidth={1.75}
            className="w-7 h-7 sm:w-9 sm:h-9 text-foreground shrink-0 mt-1 sm:mt-1.5"
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-3xl font-bold leading-tight line-clamp-2 sm:truncate">
              {t("greeting.title", { saludo, nombre: dietista.nombre })}
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
              {fechaLarga}
              <span className="mx-1.5 text-border">•</span>
              <span className="tabular-nums">{horaActual}</span>
            </p>
          </div>
        </div>

      </section>

      {/* GRID SIMÉTRICO 2 FILAS x 2 COLUMNAS - cada fila se auto-alinea en altura */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FILA 2 - IZQ: Tu actividad (gráfico) */}
        <section
          data-tour="activity-chart"
          className="lg:col-span-2 bg-card rounded-2xl border border-border overflow-hidden flex flex-col min-w-0 order-3"
        >
          <div className="px-5 py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <TrendingUp strokeWidth={1.75} className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold leading-tight">
                  {t("actividad.sectionTitle")}
                </h2>
                <p className="text-[11px] sm:text-xs text-muted-foreground">
                  {t("actividad.sectionSubtitle")}
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 sm:p-5 pb-2 sm:pb-3 flex-1">
            <DashboardCharts data={actividad} />
          </div>
        </section>

        {/* FILA 2 - DER: Accesos rápidos 2x2 */}
        <section data-tour="dashboard-quick-access" className="bg-card rounded-2xl border border-border overflow-hidden flex flex-col min-w-0 order-4">
          <div className="px-5 py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Zap strokeWidth={1.75} className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold leading-tight">
                  {t("quickAccess.sectionTitle")}
                </h2>
                <p className="text-[11px] sm:text-xs text-muted-foreground">
                  {t("quickAccess.sectionSubtitle")}
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 p-4 flex-1 content-center">
            {ACCESOS_RAPIDOS.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="group relative overflow-hidden flex flex-col justify-between gap-3 p-3.5 rounded-xl border border-border bg-gradient-to-br from-transparent to-primary/[0.04] hover:to-primary/10 hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 transition-all aspect-square"
              >
                <a.icon
                  strokeWidth={1.25}
                  className="absolute -bottom-6 -right-6 w-32 h-32 sm:w-36 sm:h-36 text-primary/10 group-hover:text-primary/20 group-hover:scale-110 transition-all pointer-events-none"
                />
                <div className="relative flex items-start justify-between mt-4 sm:mt-6">
                  <div className="w-11 h-11 rounded-lg bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                    <a.icon strokeWidth={2} className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                  <ArrowRight
                    strokeWidth={2}
                    className="w-4 h-4 text-primary/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all"
                  />
                </div>
                <div className="relative">
                  <p className="text-base sm:text-lg font-bold leading-tight">{t(`quickAccess.${a.labelKey}`)}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">{t(`quickAccess.${a.descKey}`)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* FILA 1 - IZQ: Próxima consulta */}
        <section data-tour="dashboard-proxima-cita" className="lg:col-span-2 bg-card rounded-2xl border border-border overflow-hidden flex flex-col min-w-0 order-1">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <CalendarDays strokeWidth={1.75} className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-semibold leading-tight">
                  {t("proximaConsulta.sectionTitle")}
                </h2>
                <p className="text-[11px] sm:text-xs text-muted-foreground">
                  {primeraCita
                    ? formatDistanceToNow(new Date(primeraCita.fechaHora), {
                        addSuffix: true,
                        locale: es,
                      })
                    : t("proximaConsulta.sinCitasPendientes")}
                </p>
              </div>
            </div>
            <Link
              href="/agenda"
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary transition-colors shrink-0"
            >
              {t("proximaConsulta.verAgenda")}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {!primeraCita ? (
            <div className="p-6 flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <CalendarDays strokeWidth={1.75} className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm font-medium mb-1">{t("proximaConsulta.sinCitasProgramadas")}</p>
              <Link
                href="/agenda/nueva"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline mt-1"
              >
                <CalendarPlus className="w-3.5 h-3.5" />
                {t("proximaConsulta.agendarCita")}
              </Link>
            </div>
          ) : (
            <Link
              href={`/pacientes/${primeraCita.paciente.id}`}
              className="group flex-1 flex items-center gap-3 sm:gap-4 p-4 sm:p-5 hover:bg-muted/30 transition-colors"
            >
              <AvatarPaciente
                nombre={primeraCita.paciente.nombre}
                apellidos={primeraCita.paciente.apellidos}
                fotoUrl={primeraCita.paciente.fotoUrl}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <span className="text-[10px] uppercase tracking-wide font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {formatDistanceToNow(new Date(primeraCita.fechaHora), {
                      addSuffix: true,
                      locale: es,
                    })}
                  </span>
                  {primeraCita.motivo && (
                    <span className="text-[11px] text-muted-foreground truncate">
                      {primeraCita.motivo}
                    </span>
                  )}
                </div>
                <p className="font-bold text-base sm:text-lg truncate leading-tight">
                  {primeraCita.paciente.nombre} {primeraCita.paciente.apellidos}
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" />
                    {(() => {
                      const d = new Date(primeraCita.fechaHora);
                      const wd = d.toLocaleDateString(tag, {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        timeZone: "Europe/Madrid",
                      });
                      return wd.charAt(0).toUpperCase() + wd.slice(1);
                    })()}
                  </span>
                  <span className="inline-flex items-center gap-1 tabular-nums">
                    <Clock className="w-3 h-3" />
                    {(() => {
                      const inicio = new Date(primeraCita.fechaHora);
                      const fin = new Date(inicio.getTime() + primeraCita.duracion * 60_000);
                      const t0 = inicio.toLocaleTimeString(tag, {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Europe/Madrid",
                      });
                      const t1 = fin.toLocaleTimeString(tag, {
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Europe/Madrid",
                      });
                      return `${t0} – ${t1}`;
                    })()}
                  </span>
                  {primeraCita.duracion && (
                    <span className="inline-flex items-center gap-1">
                      <Hourglass className="w-3 h-3" />
                      {primeraCita.duracion} min
                    </span>
                  )}
                </div>
              </div>
              <ArrowRight className="hidden sm:block w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 group-hover:text-primary transition-all shrink-0" />
            </Link>
          )}
        </section>

        {/* FILA 1 - DER: Última notificación */}
        <section data-tour="dashboard-notificacion" className="bg-card rounded-2xl border border-border overflow-hidden flex flex-col min-w-0 order-2">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Bell strokeWidth={1.75} className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-semibold leading-tight">
                  {t("ultimaNotificacion.sectionTitle")}
                </h2>
                <p className="text-[11px] sm:text-xs text-muted-foreground truncate">
                  {ultimaNotificacion
                    ? formatDistanceToNow(new Date(ultimaNotificacion.createdAt), {
                        addSuffix: true,
                        locale: es,
                      })
                    : t("ultimaNotificacion.sinNotificaciones")}
                </p>
              </div>
            </div>
            <Link
              href="/notificaciones"
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary transition-colors shrink-0"
            >
              {t("ultimaNotificacion.verTodas")}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {ultimaNotificacion ? (
            <Link
              href={ultimaNotificacion.enlace || "/notificaciones"}
              className="group flex-1 flex items-center gap-3 p-5 hover:bg-muted/40 transition-colors bg-primary/5"
            >
              {!ultimaNotificacion.leida && (
                <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-0.5" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-tight">
                  {ultimaNotificacion.titulo}
                </p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {ultimaNotificacion.mensaje}
                </p>
              </div>
            </Link>
          ) : (
            <div className="p-5 flex-1 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <Bell strokeWidth={1.75} className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm font-medium">{t("ultimaNotificacion.todoAlDia")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("ultimaNotificacion.sinNotificacionesPendientes")}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

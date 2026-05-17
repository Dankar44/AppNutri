import Link from "next/link";
import { FileBarChart, Users, FileText, UtensilsCrossed, Sparkles, UserCheck, CalendarDays } from "lucide-react";
import { getCurrentDietista } from "@/app/actions/auth";
import { getEstadisticasDietista, getDistribucionObjetivos, getConsultasPorMes } from "@/app/actions/estadisticas";
import { getMetricasDashboard } from "@/app/actions/metricas";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StatsCard } from "@/components/stats-card";
import { DistribucionChart, ActividadAnualChart } from "./reportes-charts";
import { PageHeader } from "@/components/page-header";
import { getTranslations } from "next-intl/server";

export default async function ReportesPage() {
  const t = await getTranslations("reports");
  const dietista = await getCurrentDietista();
  if (!dietista) redirect("/login");

  const [stats, metricas, distribucion, consultasMes, pacientesRecientes] = await Promise.all([
    getEstadisticasDietista(),
    getMetricasDashboard(),
    getDistribucionObjetivos(),
    getConsultasPorMes(),
    prisma.paciente.findMany({
      where: { dietistaId: dietista.id, activo: true },
      select: {
        id: true,
        nombre: true,
        apellidos: true,
        _count: { select: { planes: true, consultas: true, medidas: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  if (!stats || !metricas) redirect("/login");

  const kpisMes = [
    { label: t("resumenMes.totalPacientes"), value: metricas.totalPacientes, icon: Users, href: "/pacientes" },
    { label: t("resumenMes.consultasEsteMes"), value: metricas.consultasMes, icon: UserCheck, href: "/agenda" },
    { label: t("resumenMes.planesActivos"), value: metricas.planesActivos, icon: UtensilsCrossed, href: "/dietas" },
    { label: t("resumenMes.citasEstaSemana"), value: metricas.citasSemana, icon: CalendarDays, href: "/agenda" },
  ];

  return (
    <div>
      <PageHeader
        icon={FileBarChart}
        title={t("page.title")}
        subtitle={t("page.subtitle")}
      />

      {/* Resumen del mes */}
      <section data-tour="reports-kpis" className="mb-8">
        <h2 className="text-lg font-semibold mb-4">{t("resumenMes.titulo")}</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {kpisMes.map((kpi) => (
            <Link
              key={kpi.label}
              href={kpi.href}
              className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 sm:p-5 hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <kpi.icon
                strokeWidth={1.5}
                className="absolute -bottom-3 -right-3 w-24 h-24 sm:w-28 sm:h-28 text-primary/10 pointer-events-none"
              />
              <div className="relative">
                <kpi.icon
                  strokeWidth={1.75}
                  className="w-7 h-7 sm:w-8 sm:h-8 text-primary"
                />
                <p className="text-3xl sm:text-4xl font-bold tabular-nums leading-none mt-6 sm:mt-8">
                  {kpi.value}
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1.5">
                  {kpi.label}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Métricas avanzadas */}
      <h2 className="text-lg font-semibold mb-4">{t("metricas.titulo")}</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard icon={Users} label={t("metricas.tasaRetencion")} value={`${stats.tasaRetencion}%`} color="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10" />
        <StatsCard icon={FileText} label={t("metricas.mediaConsultasPac")} value={stats.mediaConsultas} color="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10" />
        <StatsCard icon={Sparkles} label={t("metricas.planesCreados")} value={stats.planesIA} color="text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10" />
        <StatsCard icon={UserCheck} label={t("metricas.pacientesConPortal")} value={stats.pacientesConPortal} color="text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Distribución por objetivo */}
        <section className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">{t("charts.pacientesPorObjetivo")}</h2>
          <DistribucionChart data={distribucion} />
        </section>

        {/* Actividad anual */}
        <section className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">{t("charts.actividadUltimos12Meses")}</h2>
          <ActividadAnualChart data={consultasMes} />
        </section>
      </div>

      {/* Exportar PDF por paciente */}
      <section data-tour="patient-reports" className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">{t("exportar.titulo")}</h2>
        <div className="space-y-2">
          {pacientesRecientes.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border"
            >
              <div>
                <p className="text-sm font-medium">
                  {p.nombre} {p.apellidos}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("exportar.planesCount", { count: p._count.planes })}, {t("exportar.consultasCount", { count: p._count.consultas })},{" "}
                  {t("exportar.medidasCount", { count: p._count.medidas })}
                </p>
              </div>
              <Link
                href={`/reportes/${p.id}`}
                className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-xs font-medium"
              >
                {t("exportar.verInformes")}
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

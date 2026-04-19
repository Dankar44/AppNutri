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

export default async function ReportesPage() {
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
    { label: "Total pacientes", value: metricas.totalPacientes, icon: Users, href: "/pacientes" },
    { label: "Consultas este mes", value: metricas.consultasMes, icon: UserCheck, href: "/agenda" },
    { label: "Planes activos", value: metricas.planesActivos, icon: UtensilsCrossed, href: "/dietas" },
    { label: "Citas esta semana", value: metricas.citasSemana, icon: CalendarDays, href: "/agenda" },
  ];

  return (
    <div>
      <PageHeader
        icon={FileBarChart}
        title="Reportes y Estadísticas"
        subtitle="Métricas de tu consulta"
      />

      {/* Resumen del mes */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Resumen del mes</h2>
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
      <h2 className="text-lg font-semibold mb-4">Métricas de consulta</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard icon={Users} label="Tasa de retención" value={`${stats.tasaRetencion}%`} color="text-blue-600 bg-blue-50" />
        <StatsCard icon={FileText} label="Media consultas/pac." value={stats.mediaConsultas} color="text-green-600 bg-green-50" />
        <StatsCard icon={Sparkles} label="Planes creados" value={stats.planesIA} color="text-amber-600 bg-amber-50" />
        <StatsCard icon={UserCheck} label="Pacientes con portal" value={stats.pacientesConPortal} color="text-purple-600 bg-purple-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Distribución por objetivo */}
        <section className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Pacientes por objetivo</h2>
          <DistribucionChart data={distribucion} />
        </section>

        {/* Actividad anual */}
        <section className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Actividad (últimos 12 meses)</h2>
          <ActividadAnualChart data={consultasMes} />
        </section>
      </div>

      {/* Exportar PDF por paciente */}
      <section className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Exportar informes por paciente</h2>
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
                  {p._count.planes} planes, {p._count.consultas} consultas,{" "}
                  {p._count.medidas} medidas
                </p>
              </div>
              <Link
                href={`/reportes/${p.id}`}
                className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-xs font-medium"
              >
                Ver informes
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

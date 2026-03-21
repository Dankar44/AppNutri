import Link from "next/link";
import { FileBarChart, Users, FileText, UtensilsCrossed, Sparkles, UserCheck, CalendarDays } from "lucide-react";
import { getCurrentDietista } from "@/app/actions/auth";
import { getEstadisticasDietista, getDistribucionObjetivos, getConsultasPorMes } from "@/app/actions/estadisticas";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StatsCard } from "@/components/stats-card";
import { DistribucionChart, ActividadAnualChart } from "./reportes-charts";

export default async function ReportesPage() {
  const dietista = await getCurrentDietista();
  if (!dietista) redirect("/login");

  const [stats, distribucion, consultasMes, pacientesRecientes] = await Promise.all([
    getEstadisticasDietista(),
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

  if (!stats) redirect("/login");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Reportes y Estadísticas</h1>
        <p className="text-muted-foreground mt-1">
          Métricas de tu consulta
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard icon={Users} label="Tasa de retención" value={`${stats.tasaRetencion}%`} color="text-blue-600 bg-blue-50" />
        <StatsCard icon={FileText} label="Media consultas/pac." value={stats.mediaConsultas} color="text-green-600 bg-green-50" />
        <StatsCard icon={Sparkles} label="Planes con IA" value={stats.planesIA} color="text-amber-600 bg-amber-50" />
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

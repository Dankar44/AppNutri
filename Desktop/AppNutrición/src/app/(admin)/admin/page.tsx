import { Users, UserPlus, UtensilsCrossed, Stethoscope, TrendingUp, TrendingDown } from "lucide-react";
import { getAdminStats, getRegistrosMensuales, getDietistasAdmin } from "@/app/actions/admin";
import { AdminCharts } from "./admin-charts";
import { capitalizarNombre, formatDate } from "@/lib/utils";
import { getTranslations } from "next-intl/server";

export default async function AdminDashboardPage() {
  const t = await getTranslations("admin.dashboard");
  const [stats, registros, dietistas] = await Promise.all([
    getAdminStats(),
    getRegistrosMensuales(),
    getDietistasAdmin(),
  ]);

  const topDietistas = dietistas
    .sort((a, b) => b._count.pacientes - a._count.pacientes)
    .slice(0, 5);

  const statCards = [
    {
      label: t("stats.totalDietistas"),
      value: stats.totalDietistas,
      change: stats.cambioDietistas,
      nuevos: stats.dietistasEsteMes,
      icon: Users,
      color: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10",
    },
    {
      label: t("stats.totalPacientes"),
      value: stats.totalPacientes,
      change: stats.cambioPacientes,
      nuevos: stats.pacientesEsteMes,
      icon: UserPlus,
      color: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10",
    },
    {
      label: t("stats.planesActivos"),
      value: stats.totalPlanes,
      change: null,
      nuevos: null,
      icon: UtensilsCrossed,
      color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10",
    },
    {
      label: t("stats.consultasEsteMes"),
      value: stats.totalConsultas,
      change: null,
      nuevos: null,
      icon: Stethoscope,
      color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-card rounded-xl border border-border p-3 sm:p-5"
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-xs sm:text-sm text-muted-foreground">{card.label}</span>
              <div className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center ${card.color}`}>
                <card.icon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-bold">{card.value}</p>
            {card.change !== null && (
              <div className="flex items-center gap-1 mt-1 flex-wrap">
                {card.change >= 0 ? (
                  <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-green-600 dark:text-green-400" />
                ) : (
                  <TrendingDown className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-red-600 dark:text-red-400" />
                )}
                <span className={`text-[10px] sm:text-xs font-medium ${card.change >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  {card.change >= 0 ? "+" : ""}{card.change}%
                </span>
                <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:inline">
                  ({t("stats.nuevos", { count: card.nuevos })})
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6">
          <h2 className="font-semibold mb-4">{t("charts.registrosMensuales")}</h2>
          <AdminCharts data={registros} />
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-semibold mb-4">{t("resumenRapido.title")}</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t("resumenRapido.dietistasRegistrados")}</span>
              <span className="font-semibold">{stats.totalDietistas}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div className="bg-indigo-500 h-2 rounded-full" style={{ width: "100%" }} />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t("resumenRapido.mediaPacientesDietista")}</span>
              <span className="font-semibold">
                {stats.totalDietistas > 0
                  ? (stats.totalPacientes / stats.totalDietistas).toFixed(1)
                  : "0"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{t("resumenRapido.planesPorDietista")}</span>
              <span className="font-semibold">
                {stats.totalDietistas > 0
                  ? (stats.totalPlanes / stats.totalDietistas).toFixed(1)
                  : "0"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top dietistas */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold">{t("topDietistas.title")}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">{t("topDietistas.columns.dietista")}</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden md:table-cell">{t("topDietistas.columns.email")}</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-muted-foreground">{t("topDietistas.columns.pacientes")}</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-muted-foreground hidden sm:table-cell">{t("topDietistas.columns.planes")}</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-muted-foreground hidden sm:table-cell">{t("topDietistas.columns.consultas")}</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden lg:table-cell">{t("topDietistas.columns.registro")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {topDietistas.map((d) => (
                <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <a href={`/admin/dietistas/${d.id}`} className="font-medium hover:text-indigo-600 transition-colors">
                      {capitalizarNombre(d.nombre)} {capitalizarNombre(d.apellidos)}
                    </a>
                    {d.especialidad && (
                      <p className="text-xs text-muted-foreground">{d.especialidad}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{d.email}</td>
                  <td className="px-4 py-3 text-center font-semibold">{d._count.pacientes}</td>
                  <td className="px-4 py-3 text-center text-sm hidden sm:table-cell">{d._count.planes}</td>
                  <td className="px-4 py-3 text-center text-sm hidden sm:table-cell">{d._count.consultas}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">{formatDate(d.createdAt)}</td>
                </tr>
              ))}
              {topDietistas.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    {t("topDietistas.empty")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

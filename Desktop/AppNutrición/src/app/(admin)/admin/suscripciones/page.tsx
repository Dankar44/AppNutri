import { CreditCard } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getSuscripcionesAdmin, getDistribucionPlanes } from "@/app/actions/admin";
import { capitalizarNombre, formatDate } from "@/lib/utils";

const PLAN_BADGE: Record<string, string> = { BASICO: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400", PROFESIONAL: "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400" };
const ESTADO_COLOR: Record<string, string> = { ACTIVA: "text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-500/10", PRUEBA: "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10", CANCELADA: "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-500/10", EXPIRADA: "text-muted-foreground bg-muted" };

export default async function SuscripcionesPage() {
  const [suscripciones, distribucion, t] = await Promise.all([
    getSuscripcionesAdmin(),
    getDistribucionPlanes(),
    getTranslations("admin.suscripciones"),
  ]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground mt-1">{t("subtitle", { total: distribucion.total })}</p>
      </div>

      {/* Distribución */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {Object.entries(distribucion.porPlan).map(([plan, count]) => {
          const n = count as number;
          return (
            <div key={plan} className="bg-card rounded-xl border border-border p-5">
              <p className="text-sm text-muted-foreground mb-1">{t("planLabel", { plan: t(`planLabels.${plan.toLowerCase()}` as Parameters<typeof t>[0]) || plan })}</p>
              <p className="text-2xl font-bold">{n}</p>
              <div className="mt-2 w-full bg-muted rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${plan === "PROFESIONAL" ? "bg-purple-500" : "bg-blue-500"}`}
                  style={{ width: `${distribucion.total > 0 ? (n / distribucion.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          );
        })}
        {Object.entries(distribucion.porEstado).map(([estado, count]) => {
          const n = count as number;
          return (
            <div key={estado} className="bg-card rounded-xl border border-border p-5">
              <p className="text-sm text-muted-foreground mb-1">{t(`estadoLabels.${estado.toLowerCase()}` as Parameters<typeof t>[0]) || estado}</p>
              <p className="text-2xl font-bold">{n}</p>
              <div className="mt-2 w-full bg-muted rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full ${
                    estado === "ACTIVA" ? "bg-green-500" : estado === "PRUEBA" ? "bg-amber-500" : estado === "CANCELADA" ? "bg-red-500" : "bg-gray-400"
                  }`}
                  style={{ width: `${distribucion.total > 0 ? (n / distribucion.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabla */}
      {suscripciones.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium text-lg mb-1">{t("empty.title")}</h3>
          <p className="text-muted-foreground">{t("empty.description")}</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">{t("columns.dietista")}</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden md:table-cell">{t("columns.email")}</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-muted-foreground">{t("columns.plan")}</th>
                  <th className="text-center px-4 py-3 text-sm font-medium text-muted-foreground">{t("columns.estado")}</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden sm:table-cell">{t("columns.inicio")}</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground hidden lg:table-cell">{t("columns.fin")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {suscripciones.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      {capitalizarNombre(s.dietista.nombre)} {capitalizarNombre(s.dietista.apellidos)}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{s.dietista.email}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${PLAN_BADGE[s.plan] || ""}`}>
                        {t(`planLabels.${s.plan.toLowerCase()}` as Parameters<typeof t>[0]) || s.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_COLOR[s.estado] || ""}`}>
                        {t(`estadoLabels.${s.estado.toLowerCase()}` as Parameters<typeof t>[0]) || s.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">{formatDate(s.fechaInicio)}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">{s.fechaFin ? formatDate(s.fechaFin) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

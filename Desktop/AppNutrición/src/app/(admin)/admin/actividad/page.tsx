import { Activity, Stethoscope, CalendarDays, BookOpen, Sparkles, Users } from "lucide-react";
import { getActividadGlobal } from "@/app/actions/admin";
import { capitalizarNombre, formatDate } from "@/lib/utils";

export default async function ActividadPage() {
  const actividad = await getActividadGlobal();

  const statsHoy = [
    { label: "Consultas hoy", value: actividad.consultasHoy, icon: Stethoscope, color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10" },
    { label: "Citas hoy", value: actividad.citasHoy, icon: CalendarDays, color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10" },
    { label: "Entradas diario hoy", value: actividad.diarioHoy, icon: BookOpen, color: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10" },
    { label: "Consultas este mes", value: actividad.consultasMes, icon: Activity, color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10" },
    { label: "Generaciones IA mes", value: actividad.generacionesIA, icon: Sparkles, color: "text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-500/10" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Actividad de la plataforma</h1>
        <p className="text-muted-foreground mt-1">Métricas de uso en tiempo real</p>
      </div>

      {/* Stats de hoy */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {statsHoy.map((s) => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{s.label}</span>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dietistas más activos */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Dietistas más activos este mes
            </h2>
          </div>
          {actividad.dietistasActivos.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Sin actividad este mes</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 text-sm font-medium text-muted-foreground">Dietista</th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-muted-foreground">Consultas mes</th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-muted-foreground">Pacientes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {actividad.dietistasActivos.map((d, i) => (
                    <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <a href={`/admin/dietistas/${d.id}`} className="font-medium hover:text-indigo-600 transition-colors">
                          <span className="text-muted-foreground mr-2 text-xs">{i + 1}.</span>
                          {d.nombre}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold">{d.consultasMes}</td>
                      <td className="px-4 py-3 text-center text-sm">{d.totalPacientes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Últimos registros */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Últimos dietistas registrados
            </h2>
          </div>
          {actividad.ultimosDietistas.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Sin registros</div>
          ) : (
            <div className="divide-y divide-border">
              {actividad.ultimosDietistas.map((d) => (
                <a
                  key={d.id}
                  href={`/admin/dietistas/${d.id}`}
                  className="flex items-center justify-between px-6 py-3 hover:bg-muted/30 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {capitalizarNombre(d.nombre)} {capitalizarNombre(d.apellidos)}
                    </p>
                    <p className="text-xs text-muted-foreground">{d.email}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatDate(d.createdAt)}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

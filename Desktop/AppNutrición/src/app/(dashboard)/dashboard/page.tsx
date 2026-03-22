import {
  Users,
  UserCheck,
  UtensilsCrossed,
  CalendarDays,
  Clock,
  AlertCircle,
} from "lucide-react";
import { getCurrentDietista } from "@/app/actions/auth";
import { getCitasHoy } from "@/app/actions/citas";
import { getMetricasDashboard, getActividadMensual, getPacientesAtencion } from "@/app/actions/metricas";
import { generarNotificaciones } from "@/app/actions/notificaciones";
import { redirect } from "next/navigation";
import Link from "next/link";
import { StatsCard } from "@/components/stats-card";
import { DashboardCharts } from "./dashboard-charts";
import { PacientesAtencion } from "./pacientes-atencion";

export default async function DashboardPage() {
  const dietista = await getCurrentDietista();
  if (!dietista) redirect("/login");

  // Generar notificaciones en background (no bloquea la carga)
  generarNotificaciones().catch(() => {});

  const [metricas, actividad, citasHoy, atencion] = await Promise.all([
    getMetricasDashboard(),
    getActividadMensual(),
    getCitasHoy(),
    getPacientesAtencion(),
  ]);

  if (!metricas) redirect("/login");

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">
          ¡Hola, {dietista.nombre}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Aquí tienes un resumen de tu consulta
        </p>
      </div>

      {/* Stats con tendencia */}
      <div data-tour="stats-cards" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <StatsCard
          icon={Users}
          label="Total pacientes"
          value={metricas.totalPacientes}
          change={metricas.cambioPacientes}
          color="text-blue-600 bg-blue-50"
        />
        <StatsCard
          icon={UserCheck}
          label="Consultas este mes"
          value={metricas.consultasMes}
          change={metricas.cambioConsultas}
          color="text-green-600 bg-green-50"
        />
        <StatsCard
          icon={UtensilsCrossed}
          label="Planes activos"
          value={metricas.planesActivos}
          color="text-orange-600 bg-orange-50"
        />
        <StatsCard
          icon={CalendarDays}
          label="Citas esta semana"
          value={metricas.citasSemana}
          color="text-purple-600 bg-purple-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Gráfico de actividad */}
        <div data-tour="activity-chart" className="lg:col-span-2 bg-card rounded-xl border border-border p-5">
          <h2 className="text-lg font-semibold mb-4">Actividad (últimos 6 meses)</h2>
          <DashboardCharts data={actividad} />
        </div>

        {/* Pacientes que necesitan atención */}
        <div className="bg-card rounded-xl border border-border">
          <div className="p-5 border-b border-border flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-semibold">Necesitan atención</h2>
          </div>
          <PacientesAtencion
            sinConsulta={atencion.sinConsulta}
            sinMedidas={atencion.sinMedidas}
            planesAntiguos={atencion.planesAntiguos}
          />
        </div>
      </div>

      {/* Citas de hoy */}
      <div className="bg-card rounded-xl border border-border">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold">Citas de hoy</h2>
          <Link
            href="/agenda"
            className="text-sm text-primary hover:underline font-medium"
          >
            Ver agenda
          </Link>
        </div>
        {citasHoy.length === 0 ? (
          <div className="p-8 text-center">
            <CalendarDays className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No tienes citas programadas para hoy
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {citasHoy.map((cita) => (
              <div key={cita.id} className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {cita.paciente.nombre} {cita.paciente.apellidos}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(cita.fechaHora).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    - {cita.duracion} min
                    {cita.motivo ? ` · ${cita.motivo}` : ""}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    cita.estado === "CONFIRMADA"
                      ? "bg-blue-50 text-blue-700"
                      : cita.estado === "COMPLETADA"
                        ? "bg-green-50 text-green-700"
                        : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {cita.estado === "CONFIRMADA"
                    ? "Confirmada"
                    : cita.estado === "COMPLETADA"
                      ? "Completada"
                      : "Pendiente"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

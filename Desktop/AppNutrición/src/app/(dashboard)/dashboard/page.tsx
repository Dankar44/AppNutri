import {
  Users,
  UserCheck,
  UtensilsCrossed,
  CalendarDays,
  Clock,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { getCurrentDietista } from "@/app/actions/auth";
import { getProximasCitas } from "@/app/actions/citas";
import {
  getMetricasDashboard,
  getActividadMensual,
  getPacientesAtencion,
} from "@/app/actions/metricas";
import { generarNotificaciones } from "@/app/actions/notificaciones";
import { redirect } from "next/navigation";
import Link from "next/link";
import { StatsCard } from "@/components/stats-card";
import { DashboardCharts } from "./dashboard-charts";
import { PacientesAtencion } from "./pacientes-atencion";
import { AvatarPaciente } from "@/components/avatar-paciente";

export default async function DashboardPage() {
  const dietista = await getCurrentDietista();
  if (!dietista) redirect("/login");

  generarNotificaciones().catch(() => {});

  const [metricas, actividad, proximasCitas, atencion] = await Promise.all([
    getMetricasDashboard(),
    getActividadMensual(),
    getProximasCitas(8),
    getPacientesAtencion(),
  ]);

  if (!metricas) redirect("/login");

  const primeraCita = proximasCitas[0];
  const restoCitas = proximasCitas.slice(1);

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

      {/* Citas previstas (izq.) + estadísticas 2×2 (der.) — misma altura en desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8 lg:items-stretch">
        <section
          aria-labelledby="citas-previstas-heading"
          className="flex flex-col min-h-0 h-full"
        >
          <div className="flex flex-wrap items-center gap-2 mb-4 shrink-0">
            <h2
              id="citas-previstas-heading"
              className="text-lg font-semibold"
            >
              Citas previstas
            </h2>
            {primeraCita && (
              <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100">
                {formatDistanceToNow(new Date(primeraCita.fechaHora), {
                  addSuffix: true,
                  locale: es,
                })}
              </span>
            )}
          </div>

          {!primeraCita ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center flex-1 flex flex-col items-center justify-center gap-4 min-h-[12rem]">
              <CalendarDays className="w-10 h-10 text-muted-foreground shrink-0" />
              <p className="text-sm text-muted-foreground">
                No tienes citas programadas a partir de ahora
              </p>
              <Link
                href="/agenda"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                Abrir calendario
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="flex flex-col flex-1 min-h-0 gap-4">
              <div className="rounded-xl border border-sky-100 bg-sky-50/80 dark:bg-sky-950/20 dark:border-sky-900/40 p-5 sm:p-6 flex-1 flex flex-col min-h-[12rem]">
                <div className="flex items-start gap-4 flex-1">
                  <AvatarPaciente
                    nombre={primeraCita.paciente.nombre}
                    apellidos={primeraCita.paciente.apellidos}
                    fotoUrl={primeraCita.paciente.fotoUrl}
                    size="lg"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-lg truncate">
                      {primeraCita.paciente.nombre}{" "}
                      {primeraCita.paciente.apellidos}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {(() => {
                        const inicio = new Date(primeraCita.fechaHora);
                        const fin = new Date(
                          inicio.getTime() + primeraCita.duracion * 60_000
                        );
                        const wd = inicio.toLocaleDateString("es-ES", {
                          weekday: "long",
                        });
                        const dia =
                          wd.charAt(0).toUpperCase() + wd.slice(1);
                        const t0 = inicio.toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                        const t1 = fin.toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                        return `${dia} | ${t0} – ${t1}`;
                      })()}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/pacientes/${primeraCita.paciente.id}/consultas/nueva`}
                  className="mt-5 flex w-full shrink-0 items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Iniciar consulta
                </Link>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm shrink-0">
                <span className="text-muted-foreground font-medium">
                  Próximas consultas
                </span>
                <Link
                  href="/agenda"
                  className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                >
                  Abrir calendario
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {restoCitas.length > 0 && (
                <ul className="divide-y divide-border rounded-xl border border-border bg-card overflow-hidden shrink-0">
                  {restoCitas.map((cita) => (
                    <li key={cita.id}>
                      <Link
                        href={`/agenda`}
                        className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="p-2 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-300">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {cita.paciente.nombre} {cita.paciente.apellidos}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(cita.fechaHora).toLocaleString("es-ES", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {cita.duracion ? ` · ${cita.duracion} min` : ""}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>

        <section
          aria-labelledby="stats-heading"
          className="flex flex-col h-full min-h-0"
        >
          <h2
            id="stats-heading"
            className="text-lg font-semibold mb-4 shrink-0"
          >
            Mis estadísticas mensuales
          </h2>
          <div
            data-tour="stats-cards"
            className="grid grid-cols-2 gap-3 sm:gap-4 flex-1 content-start"
          >
            <StatsCard
              icon={Users}
              label="Total pacientes"
              value={metricas.totalPacientes}
              color="text-blue-600 bg-blue-50"
            />
            <StatsCard
              icon={UserCheck}
              label="Consultas este mes"
              value={metricas.consultasMes}
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
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div
          data-tour="activity-chart"
          className="lg:col-span-2 bg-card rounded-xl border border-border p-5"
        >
          <h2 className="text-lg font-semibold mb-4">
            Actividad (últimos 6 meses)
          </h2>
          <DashboardCharts data={actividad} />
        </div>

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
    </div>
  );
}

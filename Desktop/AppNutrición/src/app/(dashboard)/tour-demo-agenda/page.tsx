import { ChevronLeft, ChevronRight, CalendarDays, Calendar, CalendarRange, Plus, Clock, User, Check, X, Trash2 } from "lucide-react";
import { DEMO_CITAS_SEMANA } from "@/lib/tour-demo-data";

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

function getFechasSemana(): string[] {
  const hoy = new Date();
  const diaSemana = hoy.getDay() === 0 ? 6 : hoy.getDay() - 1;
  const lunes = new Date(hoy);
  lunes.setDate(hoy.getDate() - diaSemana);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    return `${d.getDate()} ${d.toLocaleDateString("es-ES", { month: "short" })}`;
  });
}

function getDetalleDia(): string {
  const hoy = new Date();
  const diaSemana = hoy.getDay() === 0 ? 6 : hoy.getDay() - 1;
  const miercoles = new Date(hoy);
  miercoles.setDate(hoy.getDate() - diaSemana + 2);
  return miercoles.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

const HOY_INDEX = 2;

const ESTADO_STYLES: Record<string, string> = {
  PENDIENTE: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30",
  CONFIRMADA: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30",
  COMPLETADA: "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/30",
  CANCELADA: "bg-muted text-muted-foreground border-border",
};

const ESTADO_LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente", CONFIRMADA: "Confirmada", COMPLETADA: "Completada", CANCELADA: "Cancelada",
};

export default function TourDemoAgendaPage() {
  const fechas = getFechasSemana();
  const detalleFecha = getDetalleDia();

  return (
    <div>
      <div className="mb-4">
        <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-lg inline-flex items-center gap-1 mb-3 font-medium">
          Agenda de demostración — Solo para el tour guiado
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Agenda</h1>
        <span data-tour="agenda-nueva-cita" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
          <Plus className="w-4 h-4" /> Nueva cita
        </span>
      </div>

      {/* Controles */}
      <div data-tour="agenda-controles" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg border border-border"><ChevronLeft className="w-4 h-4" /></span>
          <span className="px-3 py-1.5 rounded-lg border border-border text-sm font-medium">Hoy</span>
          <span className="p-1.5 rounded-lg border border-border"><ChevronRight className="w-4 h-4" /></span>
          <span className="text-sm font-medium ml-2">{fechas[0]} - {fechas[6]}</span>
        </div>

        <div data-tour="agenda-vistas" className="flex rounded-lg border border-border overflow-hidden">
          <span className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium hover:bg-muted">
            <CalendarRange className="w-4 h-4" /> Día
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground">
            <CalendarDays className="w-4 h-4" /> Semana
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium hover:bg-muted">
            <Calendar className="w-4 h-4" /> Mes
          </span>
        </div>
      </div>

      {/* Vista semanal */}
      <div data-tour="agenda-semana" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {DIAS.map((dia, i) => {
          const isHoy = i === HOY_INDEX;
          const citasDia = DEMO_CITAS_SEMANA.filter((c) => c.dia === i);

          return (
            <div key={dia} className="min-w-0">
              <div className={`w-full text-center text-sm font-semibold py-2 rounded-t-lg border-b border-border ${isHoy ? "bg-primary text-primary-foreground" : "bg-muted/50"}`}>
                <p>{dia}</p>
                <p className={`text-xs font-normal ${isHoy ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{fechas[i]}</p>
              </div>
              <div className="border-x border-b border-border rounded-b-lg p-2 min-h-[120px] space-y-2">
                {citasDia.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">-</p>
                ) : (
                  citasDia.map((cita, j) => (
                    <div key={j} className={`rounded-lg border p-2 text-xs ${ESTADO_STYLES[cita.estado]}`}>
                      <div className="flex items-center gap-1 font-semibold mb-0.5">
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        {cita.hora} ({cita.duracion}min)
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{cita.paciente}</span>
                      </div>
                      {cita.motivo && <p className="text-[10px] opacity-80 truncate mt-0.5">{cita.motivo}</p>}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detalle del día seleccionado (miércoles = hoy) */}
      <div data-tour="agenda-detalle-dia" className="bg-card rounded-xl border border-border p-5 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold capitalize">{detalleFecha}</h3>
          <span className="p-1 rounded hover:bg-muted"><X className="w-4 h-4 text-muted-foreground" /></span>
        </div>

        <div className="space-y-3">
          {DEMO_CITAS_SEMANA.filter((c) => c.dia === HOY_INDEX).map((cita, i) => (
            <div key={i} className={`rounded-xl border p-4 ${ESTADO_STYLES[cita.estado]}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="font-semibold">{cita.hora}</span>
                    <span className="text-xs">({cita.duracion} min)</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <User className="w-4 h-4" />
                    <span className="font-medium">{cita.paciente}</span>
                  </div>
                  {cita.motivo && <p className="text-sm mt-1">{cita.motivo}</p>}
                </div>
                <div data-tour="agenda-estado-cita" className="flex items-center gap-1">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${ESTADO_STYLES[cita.estado]}`}>
                    {ESTADO_LABELS[cita.estado]}
                  </span>
                </div>
              </div>
              <div data-tour="agenda-acciones-cita" className="flex items-center gap-2 mt-3 pt-3 border-t border-current/10">
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-current/20 font-medium"><Check className="w-3 h-3" /> Completar</span>
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-current/20 font-medium"><Calendar className="w-3 h-3" /> Google Calendar</span>
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 font-medium"><Trash2 className="w-3 h-3" /> Eliminar</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

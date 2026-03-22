import { ChevronLeft, ChevronRight, CalendarDays, Calendar, Plus, Clock, User, Check, X, Trash2 } from "lucide-react";

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const FECHAS = ["17 mar", "18 mar", "19 mar", "20 mar", "21 mar", "22 mar", "23 mar"];

const CITAS_SEMANA = [
  { dia: 1, hora: "10:00", duracion: 30, paciente: "Laura Martínez", estado: "CONFIRMADA", motivo: "Revisión mensual" },
  { dia: 1, hora: "11:30", duracion: 45, paciente: "Carlos García", estado: "PENDIENTE", motivo: "Primera consulta" },
  { dia: 2, hora: "09:00", duracion: 30, paciente: "Ana López", estado: "COMPLETADA", motivo: "Seguimiento dieta" },
  { dia: 3, hora: "16:00", duracion: 60, paciente: "Laura Martínez", estado: "CONFIRMADA", motivo: "Revisión medidas" },
  { dia: 4, hora: "10:00", duracion: 30, paciente: "Pedro Ruiz", estado: "PENDIENTE", motivo: "Nuevo plan" },
  { dia: 4, hora: "12:00", duracion: 45, paciente: "Ana López", estado: "CONFIRMADA", motivo: "Control peso" },
];

const ESTADO_STYLES: Record<string, string> = {
  PENDIENTE: "bg-amber-50 text-amber-700 border-amber-200",
  CONFIRMADA: "bg-blue-50 text-blue-700 border-blue-200",
  COMPLETADA: "bg-green-50 text-green-700 border-green-200",
  CANCELADA: "bg-gray-100 text-gray-500 border-gray-200",
};

const ESTADO_LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente", CONFIRMADA: "Confirmada", COMPLETADA: "Completada", CANCELADA: "Cancelada",
};

export default function TourDemoAgendaPage() {
  return (
    <div>
      <div className="mb-4">
        <p className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg inline-flex items-center gap-1 mb-3 font-medium">
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
          <span className="text-sm font-medium ml-2">17 mar - 23 mar</span>
        </div>

        <div data-tour="agenda-vistas" className="flex rounded-lg border border-border overflow-hidden">
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
          const isHoy = i === 4; // Viernes como "hoy"
          const citasDia = CITAS_SEMANA.filter((c) => c.dia === i);

          return (
            <div key={dia} className="min-w-0">
              <div className={`w-full text-center text-sm font-semibold py-2 rounded-t-lg border-b border-border ${isHoy ? "bg-primary text-primary-foreground" : "bg-muted/50"}`}>
                <p>{dia}</p>
                <p className={`text-xs font-normal ${isHoy ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{FECHAS[i]}</p>
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

      {/* Detalle del día seleccionado */}
      <div data-tour="agenda-detalle-dia" className="bg-card rounded-xl border border-border p-5 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Viernes, 21 De Marzo De 2026</h3>
          <span className="p-1 rounded hover:bg-muted"><X className="w-4 h-4 text-muted-foreground" /></span>
        </div>

        <div className="space-y-3">
          {CITAS_SEMANA.filter((c) => c.dia === 4).map((cita, i) => (
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
                <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-red-200 text-red-600 font-medium"><Trash2 className="w-3 h-3" /> Eliminar</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

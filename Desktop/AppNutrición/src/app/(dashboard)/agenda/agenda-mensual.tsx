"use client";

import { useLocale } from "next-intl";
import { intlTag, type Locale } from "@/i18n/config";

const DIA_LABELS_CORTO = ["L", "M", "X", "J", "V", "S", "D"];

interface Cita {
  id: string;
  fechaHora: string;
  duracion: number;
  motivo: string | null;
  estado: string;
  notas: string | null;
  paciente: { nombre: string; apellidos: string };
}

interface Props {
  citas: Cita[];
  anio: number;
  mes: number;
  diaSeleccionado: string | null;
  onSelectDia: (dia: string | null) => void;
}

function formatLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const ESTADO_DOT: Record<string, string> = {
  PENDIENTE: "bg-amber-400",
  CONFIRMADA: "bg-blue-400",
  COMPLETADA: "bg-green-400",
  CANCELADA: "bg-gray-300",
};

export function AgendaMensual({ citas, anio, mes, diaSeleccionado, onSelectDia }: Props) {
  const tag = intlTag(useLocale() as Locale);
  const hoyStr = formatLocalDate(new Date());

  // Generar grid del calendario
  const primerDia = new Date(anio, mes, 1);
  const ultimoDia = new Date(anio, mes + 1, 0);

  // Día de la semana del primer día (0=dom, ajustar a lun=0)
  let startDay = primerDia.getDay() - 1;
  if (startDay < 0) startDay = 6;

  // Días del mes anterior para rellenar
  const diasPrevios = Array.from({ length: startDay }, (_, i) => {
    const d = new Date(anio, mes, -startDay + i + 1);
    return { date: d, currentMonth: false };
  });

  // Días del mes actual
  const diasMes = Array.from({ length: ultimoDia.getDate() }, (_, i) => ({
    date: new Date(anio, mes, i + 1),
    currentMonth: true,
  }));

  // Días del mes siguiente para completar la última fila
  const totalCeldas = diasPrevios.length + diasMes.length;
  const filasNecesarias = Math.ceil(totalCeldas / 7);
  const celdasRestantes = filasNecesarias * 7 - totalCeldas;
  const diasSiguientes = Array.from({ length: celdasRestantes }, (_, i) => ({
    date: new Date(anio, mes + 1, i + 1),
    currentMonth: false,
  }));

  const todosLosDias = [...diasPrevios, ...diasMes, ...diasSiguientes];

  // Mapa de citas por día
  const citasPorDia = new Map<string, Cita[]>();
  for (const cita of citas) {
    const key = formatLocalDate(new Date(cita.fechaHora));
    if (!citasPorDia.has(key)) citasPorDia.set(key, []);
    citasPorDia.get(key)!.push(cita);
  }

  // Vista móvil: lista de días con citas
  const diasConCitas = diasMes.filter((d) => {
    const key = formatLocalDate(d.date);
    return (citasPorDia.get(key) || []).length > 0;
  });

  return (
    <>
    {/* Vista móvil: calendario cuadrícula compacto */}
    <div className="sm:hidden bg-card rounded-xl border border-border overflow-hidden">
      <div className="grid grid-cols-7">
        {DIA_LABELS_CORTO.map((label) => (
          <div
            key={label}
            className="text-center text-[11px] font-semibold text-muted-foreground py-2"
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {todosLosDias.map(({ date, currentMonth }, i) => {
          const diaStr = formatLocalDate(date);
          const isHoy = diaStr === hoyStr;
          const isSeleccionado = diaStr === diaSeleccionado;
          const citasDia = citasPorDia.get(diaStr) || [];
          const tieneCitas = citasDia.length > 0;

          return (
            <button
              key={i}
              type="button"
              onClick={() => currentMonth ? onSelectDia(isSeleccionado ? null : diaStr) : undefined}
              className={`flex flex-col items-center justify-center py-2.5 border-b border-r border-border/50 transition-colors ${
                !currentMonth
                  ? "text-muted-foreground/30"
                  : isSeleccionado
                    ? "bg-primary/10"
                    : "active:bg-muted/60"
              }`}
            >
              <span
                className={`flex items-center justify-center w-8 h-8 text-sm tabular-nums rounded-full ${
                  isHoy
                    ? "bg-primary text-primary-foreground font-bold"
                    : currentMonth
                      ? "font-medium"
                      : ""
                }`}
              >
                {date.getDate()}
              </span>
              <div className="flex items-center gap-0.5 mt-1 h-2">
                {tieneCitas && currentMonth && citasDia.slice(0, 3).map((cita) => (
                  <span
                    key={cita.id}
                    className={`w-1.5 h-1.5 rounded-full ${ESTADO_DOT[cita.estado] || ESTADO_DOT.PENDIENTE}`}
                  />
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>

    {/* Vista desktop/tablet: calendario tradicional */}
    <div className="hidden sm:block bg-card rounded-xl border border-border overflow-hidden">
      {/* Cabecera días de la semana */}
      <div className="grid grid-cols-7 border-b border-border">
        {DIA_LABELS_CORTO.map((label) => (
          <div
            key={label}
            className="text-center text-xs font-semibold text-muted-foreground py-2"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Grid de días */}
      <div className="grid grid-cols-7">
        {todosLosDias.map(({ date, currentMonth }, i) => {
          const diaStr = formatLocalDate(date);
          const isHoy = diaStr === hoyStr;
          const isSeleccionado = diaStr === diaSeleccionado;
          const citasDia = citasPorDia.get(diaStr) || [];

          return (
            <button
              key={i}
              type="button"
              onClick={() => currentMonth ? onSelectDia(isSeleccionado ? null : diaStr) : undefined}
              className={`relative h-[80px] sm:h-[92px] md:h-[104px] lg:h-[116px] p-1.5 sm:p-2 border-b border-r border-border text-left transition-colors overflow-hidden flex flex-col ${
                !currentMonth
                  ? "bg-muted/30 text-muted-foreground/40 cursor-default"
                  : isSeleccionado
                    ? "bg-primary/10 ring-2 ring-primary ring-inset"
                    : "hover:bg-muted/50 cursor-pointer"
              }`}
            >
              <span
                className={`inline-flex shrink-0 items-center justify-center w-6 h-6 text-xs font-medium rounded-full ${
                  isHoy
                    ? "bg-primary text-primary-foreground"
                    : ""
                }`}
              >
                {date.getDate()}
              </span>

              {/* Indicadores de citas */}
              <div className="mt-0.5 min-h-0 flex-1 overflow-y-auto space-y-0.5">
                {citasDia.slice(0, 3).map((cita) => (
                  <div
                    key={cita.id}
                    className="flex items-center gap-1 text-[11px] leading-tight truncate"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ESTADO_DOT[cita.estado] || ESTADO_DOT.PENDIENTE}`} />
                    <span className="truncate">
                      {new Date(cita.fechaHora).toLocaleTimeString(tag, { hour: "2-digit", minute: "2-digit" })}{" "}
                      {cita.paciente.nombre}
                    </span>
                  </div>
                ))}
                {citasDia.length > 3 && (
                  <p className="text-[10px] text-muted-foreground font-medium">
                    +{citasDia.length - 3} más
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
    </>
  );
}

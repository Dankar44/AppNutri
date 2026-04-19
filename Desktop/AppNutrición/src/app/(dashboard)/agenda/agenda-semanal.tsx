"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, User } from "lucide-react";
import { CitaDetalleModal, type CitaDetalle } from "./cita-detalle-modal";
import { toMadridDateStr, toMadridTimeStr } from "@/lib/tz";

const DIA_LABELS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

const ESTADO_STYLES: Record<string, string> = {
  PENDIENTE: "bg-amber-50 text-amber-700 border-amber-200",
  CONFIRMADA: "bg-blue-50 text-blue-700 border-blue-200",
  COMPLETADA: "bg-green-50 text-green-700 border-green-200",
  CANCELADA: "bg-gray-100 text-gray-500 border-gray-200",
  CONTRAPROPUESTA: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

interface Cita {
  id: string;
  fechaHora: string;
  duracion: number;
  motivo: string | null;
  estado: string;
  notas: string | null;
  origen?: string;
  propuestoPor?: string;
  isOnline?: boolean;
  googleMeetLink?: string | null;
  paciente: { id: string; nombre: string; apellidos: string; fotoUrl?: string | null };
}

interface Props {
  citas: Cita[];
  lunes: string;
  diaSeleccionado: string | null;
  onSelectDia: (dia: string | null) => void;
}

// Usar zona horaria de Madrid para que la agrupación por día coincida
// con lo que ve el paciente al solicitar cita.
const formatLocalDate = toMadridDateStr;

export function AgendaSemanal({ citas, lunes, diaSeleccionado, onSelectDia }: Props) {
  const router = useRouter();
  const [citaAbierta, setCitaAbierta] = useState<CitaDetalle | null>(null);

  const lunesDate = new Date(lunes + "T12:00:00");
  const diasSemana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunesDate);
    d.setDate(d.getDate() + i);
    return d;
  });

  const hoyStr = formatLocalDate(new Date());

  const citasPorDia = diasSemana.map((dia) => {
    const diaStr = formatLocalDate(dia);
    return citas.filter((c) => formatLocalDate(new Date(c.fechaHora)) === diaStr);
  });

  function irAVistaDia(diaStr: string) {
    router.push(`/agenda?vista=dia&fecha=${diaStr}`);
  }

  return (
    <>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
      {diasSemana.map((dia, i) => {
        const diaStr = formatLocalDate(dia);
        const isHoy = diaStr === hoyStr;
        const isSeleccionado = diaStr === diaSeleccionado;

        return (
          <div key={i} className="min-w-0">
            <button
              type="button"
              onClick={() => onSelectDia(isSeleccionado ? null : diaStr)}
              className={`w-full text-center text-sm font-semibold py-2 rounded-t-lg border-b border-border transition-colors cursor-pointer ${
                isSeleccionado
                  ? "bg-primary text-primary-foreground"
                  : isHoy
                    ? "bg-primary/10 text-primary hover:bg-primary/20"
                    : "bg-muted/50 hover:bg-muted"
              }`}
              title="Ver detalle del día"
            >
              <p>{DIA_LABELS[i]}</p>
              <p className={`text-xs font-normal ${isSeleccionado ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                {dia.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
              </p>
            </button>
            <div
              role="button"
              tabIndex={0}
              onClick={(e) => {
                // Si el clic fue dentro de una cita, dejar que el button de la cita maneje el onClick
                if ((e.target as HTMLElement).closest("[data-cita]")) return;
                irAVistaDia(diaStr);
              }}
              onKeyDown={(e) => { if (e.key === "Enter") irAVistaDia(diaStr); }}
              className="w-full border-x border-b border-border rounded-b-lg p-2 min-h-[120px] space-y-2 hover:bg-muted/30 transition-colors text-left cursor-pointer"
              title="Ir a vista día"
            >
              {citasPorDia[i].length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">-</p>
              ) : (
                citasPorDia[i].map((cita) => {
                  const hora = toMadridTimeStr(new Date(cita.fechaHora));
                  const esSolicitudPaciente = cita.estado === "PENDIENTE" && cita.origen === "PACIENTE";
                  return (
                    <button
                      key={cita.id}
                      type="button"
                      data-cita
                      onClick={(e) => { e.stopPropagation(); setCitaAbierta(cita as CitaDetalle); }}
                      className={`w-full text-left rounded-lg border p-2 text-xs transition-colors cursor-pointer hover:ring-2 hover:ring-primary/30 ${ESTADO_STYLES[cita.estado] || ESTADO_STYLES.PENDIENTE}`}
                    >
                      <div className="flex items-center gap-1 font-semibold mb-0.5">
                        <Clock className="w-3 h-3 flex-shrink-0" />
                        {hora} ({cita.duracion}min)
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">
                          {cita.paciente.nombre} {cita.paciente.apellidos}
                        </span>
                      </div>
                      {esSolicitudPaciente && (
                        <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200 font-medium">
                          Solicitud del paciente
                        </span>
                      )}
                      {cita.motivo && (
                        <p className="text-[10px] opacity-80 truncate mt-0.5">{cita.motivo}</p>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>

    {citaAbierta && (
      <CitaDetalleModal cita={citaAbierta} onClose={() => setCitaAbierta(null)} />
    )}
    </>
  );
}

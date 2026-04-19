"use client";

import { useEffect, useState, useTransition, useMemo } from "react";
import { X, Loader2, Clock } from "lucide-react";
import { toast } from "sonner";
import { DatePicker } from "@/components/date-picker";
import {
  getHuecosLibresDelNutri,
  solicitarCitaPaciente,
  type SlotLibre,
} from "@/app/actions/citas-flujo";

function labelFechaLarga(fechaYYYYMMDD: string): string {
  if (!fechaYYYYMMDD) return "";
  const [y, m, d] = fechaYYYYMMDD.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("es-ES", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

export function SolicitarCitaModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const hoy = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(hoy);
  const [slots, setSlots] = useState<SlotLibre[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [slotSeleccionado, setSlotSeleccionado] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");
  const [submitting, startSubmit] = useTransition();

  // Cargar 30 días de slots por adelantado (una sola carga)
  useEffect(() => {
    let cancelled = false;
    async function cargar() {
      setLoadingSlots(true);
      try {
        const desde = new Date();
        desde.setHours(0, 0, 0, 0);
        const hasta = new Date(desde);
        hasta.setDate(hasta.getDate() + 60);
        const res = await getHuecosLibresDelNutri(desde.toISOString(), hasta.toISOString());
        if (!cancelled) setSlots(res);
      } catch {
        if (!cancelled) setSlots([]);
      } finally {
        if (!cancelled) setLoadingSlots(false);
      }
    }
    cargar();
    return () => { cancelled = true; };
  }, []);

  // Filtrar slots del día seleccionado
  const slotsDelDia = useMemo(() => {
    if (!slots || !fechaSeleccionada) return [];
    return slots.filter((s) => s.fechaLocal === fechaSeleccionada);
  }, [slots, fechaSeleccionada]);

  // Conjunto de fechas con huecos disponibles (para ayudar al usuario a saber qué día elegir)
  const diasConHuecos = useMemo(() => {
    const set = new Set<string>();
    if (slots) for (const s of slots) set.add(s.fechaLocal);
    return set;
  }, [slots]);

  function handleSolicitar() {
    if (!slotSeleccionado) return;
    startSubmit(async () => {
      try {
        await solicitarCitaPaciente(slotSeleccionado, motivo.trim() || undefined);
        toast.success("Solicitud enviada. Tu nutricionista revisará la cita.");
        onDone();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al solicitar cita");
      }
    });
  }

  function handleCambioFecha(nueva: string) {
    setFechaSeleccionada(nueva);
    setSlotSeleccionado(null);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm overflow-y-auto p-4"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-2xl border border-border shadow-2xl max-w-lg w-full my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-semibold">Solicitar nueva cita</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Paso 1: elegir fecha */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Fecha</label>
            <DatePicker value={fechaSeleccionada} onChange={handleCambioFecha} />
            <p className="text-xs text-muted-foreground mt-1 capitalize">
              {labelFechaLarga(fechaSeleccionada)}
            </p>
          </div>

          {/* Paso 2: elegir hora */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Horas disponibles</label>
            {loadingSlots ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : slotsDelDia.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
                <Clock className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                {diasConHuecos.size === 0
                  ? "No hay huecos disponibles próximamente."
                  : "No hay huecos este día. Prueba con otro día."}
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-[280px] overflow-y-auto">
                {slotsDelDia.map((s) => {
                  const sel = slotSeleccionado === s.fechaHora;
                  return (
                    <button
                      key={s.fechaHora}
                      type="button"
                      onClick={() => setSlotSeleccionado(s.fechaHora)}
                      className={`text-sm font-medium py-2 px-2 rounded-lg border transition-colors ${
                        sel
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background border-border hover:bg-muted"
                      }`}
                    >
                      {s.horaLocal}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Paso 3: motivo */}
          {slotSeleccionado && (
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Motivo <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                maxLength={500}
                rows={2}
                placeholder="Ej: Revisión de seguimiento, duda sobre el plan..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 p-5 border-t border-border bg-muted/20">
          <p className="text-xs text-muted-foreground">
            {slotSeleccionado && (
              <>
                Has elegido: <strong className="text-foreground">
                  {new Date(slotSeleccionado).toLocaleString("es-ES", {
                    timeZone: "Europe/Madrid",
                    weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                  })}
                </strong>
              </>
            )}
          </p>
          <button
            type="button"
            onClick={handleSolicitar}
            disabled={!slotSeleccionado || submitting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-green-700 disabled:opacity-60 transition-colors"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Solicitar cita
          </button>
        </div>
      </div>
    </div>
  );
}

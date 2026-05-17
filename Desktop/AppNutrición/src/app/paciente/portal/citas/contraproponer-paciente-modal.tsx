"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { X, Loader2, Clock, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { useTranslations, useLocale } from "next-intl";
import { DatePicker } from "@/components/date-picker";
import {
  getHuecosLibresDelNutri,
  contraproponerPorPaciente,
  type SlotLibre,
  type CitaPortalPaciente,
} from "@/app/actions/citas-flujo";

function labelFechaLarga(fechaYYYYMMDD: string, locale: string): string {
  if (!fechaYYYYMMDD) return "";
  const [y, m, d] = fechaYYYYMMDD.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(locale, {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function formatFechaActual(iso: string, locale: string): string {
  return new Date(iso).toLocaleString(locale, {
    timeZone: "Europe/Madrid",
    weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit",
  });
}

export function ContraproponerPacienteModal({
  cita,
  onClose,
  onDone,
}: {
  cita: CitaPortalPaciente;
  onClose: () => void;
  onDone: () => void;
}) {
  const t = useTranslations("patient-portal");
  const locale = useLocale();
  const dateLocale = locale === "pt" ? "pt-BR" : "es-ES";
  const hoy = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Madrid" });
  const [fechaSeleccionada, setFechaSeleccionada] = useState<string>(hoy);
  const [slots, setSlots] = useState<SlotLibre[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [slotSeleccionado, setSlotSeleccionado] = useState<string | null>(null);
  const [nota, setNota] = useState("");
  const [submitting, startSubmit] = useTransition();

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

  const slotsDelDia = useMemo(() => {
    if (!slots || !fechaSeleccionada) return [];
    return slots.filter((s) => s.fechaLocal === fechaSeleccionada);
  }, [slots, fechaSeleccionada]);

  function handleSubmit() {
    if (!slotSeleccionado) return;
    startSubmit(async () => {
      try {
        await contraproponerPorPaciente(cita.id, slotSeleccionado, nota.trim() || undefined);
        toast.success(t("contraproponer.toast.propuestaEnviada"));
        onDone();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error");
      }
    });
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
          <div className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-lg font-semibold">{t("contraproponer.title")}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="px-5 py-3 bg-muted/30 border-b border-border">
          <p className="text-xs text-muted-foreground">{t("contraproponer.propuestaActual")}</p>
          <p className="text-sm font-medium capitalize">{formatFechaActual(cita.fechaHora, dateLocale)}</p>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("contraproponer.nuevaFecha")}</label>
            <DatePicker value={fechaSeleccionada} onChange={(v) => { setFechaSeleccionada(v); setSlotSeleccionado(null); }} />
            <p className="text-xs text-muted-foreground mt-1 capitalize">
              {labelFechaLarga(fechaSeleccionada, dateLocale)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">{t("contraproponer.horasDisponibles")}</label>
            {loadingSlots ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : slotsDelDia.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border py-6 text-center text-sm text-muted-foreground">
                <Clock className="w-5 h-5 mx-auto mb-2" />
                {t("contraproponer.sinHuecos")}
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

          {slotSeleccionado && (
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t("contraproponer.mensajeNutricionista")} <span className="text-muted-foreground font-normal">{t("contraproponer.mensajeOpcional")}</span>
              </label>
              <textarea
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                maxLength={500}
                rows={2}
                placeholder={t("contraproponer.mensajePlaceholder")}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 p-5 border-t border-border bg-muted/20">
          <p className="text-xs text-muted-foreground">
            {slotSeleccionado && (
              <>
                {t("contraproponer.propones")} <strong className="text-foreground">
                  {new Date(slotSeleccionado).toLocaleString(dateLocale, {
                    timeZone: "Europe/Madrid",
                    weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                  })}
                </strong>
              </>
            )}
          </p>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!slotSeleccionado || submitting}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 disabled:opacity-60 transition-colors"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {t("contraproponer.enviarPropuesta")}
          </button>
        </div>
      </div>
    </div>
  );
}

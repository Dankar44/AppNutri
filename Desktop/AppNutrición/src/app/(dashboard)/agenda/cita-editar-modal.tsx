"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Loader2, Video, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { actualizarCita } from "@/app/actions/citas";
import { DatePicker } from "@/components/date-picker";
import { TimePicker } from "@/components/time-picker";
import { useDemoGuard } from "@/contexts/demo-context";
import { toMadridDateStr, toMadridTimeStr } from "@/lib/tz";

export interface CitaEditable {
  id: string;
  fechaHora: string;
  duracion: number;
  motivo: string | null;
  notas?: string | null;
  estado: string;
  origen?: string;
  isOnline?: boolean;
  enlaceVideollamada?: string | null;
}

interface Props {
  cita: CitaEditable;
  onClose: () => void;
  onGuardado: () => void;
}

export function CitaEditarModal({ cita, onClose, onGuardado }: Props) {
  const t = useTranslations("agenda.citaEditarModal");
  const blockIfDemo = useDemoGuard();
  const fechaInicial = new Date(cita.fechaHora);
  const [fecha, setFecha] = useState(() => toMadridDateStr(fechaInicial));
  const [hora, setHora] = useState(() => toMadridTimeStr(fechaInicial));
  const [duracion, setDuracion] = useState(cita.duracion);
  const [motivo, setMotivo] = useState(cita.motivo ?? "");
  const [notas, setNotas] = useState(cita.notas ?? "");
  const [isOnline, setIsOnline] = useState(cita.isOnline ?? false);
  const [enlaceVideollamada, setEnlaceVideollamada] = useState(
    cita.enlaceVideollamada ?? "",
  );
  const [guardando, setGuardando] = useState(false);
  const duraciones = Array.from(new Set([15, 30, 45, 60, 90, 120, cita.duracion])).sort(
    (a, b) => a - b,
  );

  useEffect(() => {
    function cerrarConEscape(evento: KeyboardEvent) {
      if (evento.key === "Escape") onClose();
    }
    document.addEventListener("keydown", cerrarConEscape);
    return () => document.removeEventListener("keydown", cerrarConEscape);
  }, [onClose]);

  async function guardar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (blockIfDemo()) return;
    if (new Date(`${fecha}T${hora}`) <= new Date()) {
      toast.error(t("fechaPasadaError"));
      return;
    }

    setGuardando(true);
    try {
      const resultado = await actualizarCita(cita.id, {
        fechaHora: `${fecha}T${hora}:00`,
        duracion,
        motivo,
        notas,
        isOnline,
        enlaceVideollamada,
      });
      if (!resultado.ok) {
        toast.error(resultado.error || t("toastError"));
        return;
      }
      toast.success(t("toastGuardada"));
      onGuardado();
    } catch {
      toast.error(t("toastError"));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="editar-cita-titulo"
        className="bg-card rounded-2xl border border-border shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(evento) => evento.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 id="editar-cita-titulo" className="text-lg font-semibold inline-flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-primary" />
            {t("title")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("cerrar")}
            className="w-11 h-11 -mr-2 inline-flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={guardar}>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">{t("fecha")}</label>
                <DatePicker value={fecha} onChange={setFecha} required futureOnly />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">{t("hora")}</label>
                <TimePicker
                  value={hora}
                  onChange={setHora}
                  fecha={fecha}
                  ariaLabel={t("hora")}
                  inputClassName="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">{t("duracion")}</label>
              <select
                value={duracion}
                onChange={(evento) => setDuracion(Number(evento.target.value))}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              >
                {duraciones.map((minutos) => (
                  <option key={minutos} value={minutos}>
                    {t("minutos", { minutos })}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">{t("motivo")}</label>
              <input
                value={motivo}
                onChange={(evento) => setMotivo(evento.target.value)}
                maxLength={200}
                placeholder={t("motivoPlaceholder")}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">{t("notas")}</label>
              <textarea
                value={notas}
                onChange={(evento) => setNotas(evento.target.value)}
                rows={4}
                maxLength={2000}
                placeholder={t("notasPlaceholder")}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm resize-y"
              />
              <p className="text-xs text-muted-foreground mt-1">{t("notasPrivadas")}</p>
            </div>

            <label className="flex items-start gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/40 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors">
              <input
                type="checkbox"
                checked={isOnline}
                onChange={(evento) => setIsOnline(evento.target.checked)}
                className="mt-1 accent-primary"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium inline-flex items-center gap-2">
                  <Video className="w-4 h-4 text-primary" />
                  {t("online")}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{t("onlineHint")}</p>
              </div>
            </label>

            <div>
              <label className="block text-sm font-medium mb-1.5">{t("enlace")}</label>
              <input
                type="url"
                inputMode="url"
                value={enlaceVideollamada}
                onChange={(evento) => setEnlaceVideollamada(evento.target.value)}
                placeholder={t("enlacePlaceholder")}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1.5">{t("enlaceHint")}</p>
            </div>
          </div>

          <div className="p-5 border-t border-border bg-muted/20 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="min-h-11 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted disabled:opacity-60 transition-colors"
            >
              {t("cancelar")}
            </button>
            <button
              type="submit"
              disabled={guardando || !fecha || !hora}
              className="min-h-11 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors inline-flex items-center justify-center gap-2"
            >
              {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
              {guardando ? t("guardando") : t("guardar")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

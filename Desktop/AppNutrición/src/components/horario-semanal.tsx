"use client";

import { useState, useMemo } from "react";
import { X, Save, Loader2, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { HorarioEntry } from "@/app/actions/pacientes";
import { toast } from "sonner";
import { CATEGORIAS } from "@/components/paciente/horario/horario-utils";

// Stable data keys stored in the DB — must NOT be translated
const DIA_KEYS = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"] as const;
const DIA_DB_VALUE: Record<(typeof DIA_KEYS)[number], string> = {
  LUNES: "Lunes",
  MARTES: "Martes",
  MIERCOLES: "Miércoles",
  JUEVES: "Jueves",
  VIERNES: "Viernes",
  SABADO: "Sábado",
  DOMINGO: "Domingo",
};
const HORAS = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00",
  "20:00", "21:00", "22:00", "23:00",
];
// Opciones para "Hasta" (fin exclusivo): de 07:00 a 24:00.
const HORAS_FIN = [...HORAS.slice(1), "24:00"];
const PREVIEW_ROWS = 5;

const COLOR_IDS = ["trabajo", "ejercicio", "comida", "descanso", "otro"] as const;
const COLOR_CLASSES: Record<string, string> = {
  trabajo: "bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30",
  ejercicio: "bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/30",
  comida: "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30",
  descanso: "bg-purple-100 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/30",
  otro: "bg-muted text-foreground border-border",
};

function getColorClass(color?: string) {
  return COLOR_CLASSES[color || "otro"] || COLOR_CLASSES.otro;
}

// Siguiente hora en la rejilla (para el "Hasta" por defecto). Tras 23:00 → 24:00.
function nextHour(h: string): string {
  const i = HORAS.indexOf(h);
  return i >= 0 && i < HORAS.length - 1 ? HORAS[i + 1] : "24:00";
}

// El portal del paciente guarda los días en minúsculas y sin tilde ("lunes",
// "miercoles"...) mientras que esta vista usa "Lunes", "Miércoles"... Normalizamos
// (minúsculas + sin tildes) al comparar para que el horario que rellena el paciente
// se muestre aquí sin depender de mayúsculas/acentos.
function normalizaDia(d: string) {
  return d.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

interface Props {
  initialEntries: HorarioEntry[];
  readOnly?: boolean;
  onSave: (entries: HorarioEntry[]) => Promise<void>;
}

// Borrador del modal "Nueva/Editar actividad".
interface Draft {
  diaIdx: number;
  horaInicio: string;
  horaFin: string; // exclusivo
  actividad: string;
  color: string;
  nota: string;
  repetir: number[]; // índices de días adicionales
  editHora?: string; // hora original si se está editando una celda existente
}

export function HorarioSemanal({ initialEntries, readOnly, onSave }: Props) {
  const t = useTranslations("agenda");
  const tm = useTranslations("patients.horario");
  const DIAS = DIA_KEYS.map((k) => DIA_DB_VALUE[k]);
  const [entries, setEntries] = useState<HorarioEntry[]>(initialEntries);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [mobileDia, setMobileDia] = useState(DIAS[0]);

  const horasVisibles = expanded ? HORAS : HORAS.slice(0, PREVIEW_ROWS);

  const entryMap = useMemo(() => {
    const m = new Map<string, HorarioEntry>();
    for (const e of entries) m.set(`${normalizaDia(e.dia)}-${e.hora}`, e);
    return m;
  }, [entries]);

  const entriesPorDia = useMemo(() => {
    const m = new Map<string, number>();
    for (const dia of DIAS) {
      let count = 0;
      for (const h of HORAS) if (entryMap.has(`${normalizaDia(dia)}-${h}`)) count++;
      m.set(dia, count);
    }
    return m;
  }, [entryMap]);

  function getEntry(dia: string, hora: string) {
    return entryMap.get(`${normalizaDia(dia)}-${hora}`);
  }

  // Abre el modal: nueva actividad (celda vacía) o edición (celda con contenido).
  function startEdit(dia: string, hora: string) {
    if (readOnly) return;
    const diaIdx = Math.max(0, DIAS.indexOf(dia));
    const ex = getEntry(dia, hora);
    setDraft({
      diaIdx,
      horaInicio: hora,
      horaFin: nextHour(hora),
      actividad: ex?.actividad ?? "",
      color: ex?.color ?? "trabajo",
      nota: ex?.nota ?? "",
      repetir: [],
      editHora: ex ? hora : undefined,
    });
  }

  function toggleRepetir(i: number) {
    setDraft((d) =>
      d
        ? { ...d, repetir: d.repetir.includes(i) ? d.repetir.filter((x) => x !== i) : [...d.repetir, i] }
        : d,
    );
  }

  // Guarda el borrador: expande el rango [horaInicio, horaFin) a una entry por hora,
  // en el día elegido y en los días de "repetir".
  function saveDraft() {
    if (!draft) return;
    const act = draft.actividad.trim();
    if (!act) { setDraft(null); return; }
    const diaPrincipal = DIAS[draft.diaIdx];
    let horas = HORAS.filter((h) => h >= draft.horaInicio && h < draft.horaFin);
    if (horas.length === 0) horas = [draft.horaInicio];
    const dias = [diaPrincipal, ...draft.repetir.map((i) => DIAS[i])];

    let updated = entries.slice();
    // Si se edita una celda existente, quitar primero la entry original.
    if (draft.editHora) {
      updated = updated.filter(
        (e) => !(normalizaDia(e.dia) === normalizaDia(diaPrincipal) && e.hora === draft.editHora),
      );
    }
    for (const d of dias) {
      for (const h of horas) {
        updated = updated.filter((e) => !(normalizaDia(e.dia) === normalizaDia(d) && e.hora === h));
        updated.push({ dia: d, hora: h, actividad: act, color: draft.color, nota: draft.nota.trim() || undefined });
      }
    }
    setEntries(updated);
    setDirty(true);
    setDraft(null);
  }

  function removeEntry(dia: string, hora: string) {
    setEntries(entries.filter((e) => !(normalizaDia(e.dia) === normalizaDia(dia) && e.hora === hora)));
    setDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(entries);
      toast.success(t("horarioSemanal.toastSaved"));
    } catch {
      toast.error(t("horarioSemanal.toastSaveError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {/* Leyenda + guardar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex flex-wrap gap-1.5">
          {COLOR_IDS.map((id) => (
            <span key={id} className={`text-[11px] px-2 py-0.5 rounded-full border ${COLOR_CLASSES[id]}`}>
              {t(`horarioSemanal.colorLabels.${id}`)}
            </span>
          ))}
        </div>
        {!readOnly && dirty && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            {t("horarioSemanal.save")}
          </button>
        )}
      </div>

      {/* === MÓVIL: vista por día === */}
      <div className="sm:hidden">
        <div className="flex rounded-lg border border-border overflow-hidden mb-3">
          {DIAS.map((dia, i) => {
            const count = entriesPorDia.get(dia) || 0;
            return (
              <button
                key={dia}
                type="button"
                onClick={() => setMobileDia(dia)}
                className={`flex-1 flex flex-col items-center justify-center py-2 text-[13px] font-medium transition-colors ${
                  mobileDia === dia ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                {t(`horarioSemanal.daysShort.${DIA_KEYS[i]}`)}
                {count > 0 && (
                  <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${mobileDia === dia ? "bg-primary-foreground/60" : "bg-primary/50"}`} />
                )}
              </button>
            );
          })}
        </div>

        <div className="border border-border rounded-lg overflow-hidden">
          {horasVisibles.map((hora) => {
            const entry = getEntry(mobileDia, hora);
            return (
              <div
                key={hora}
                className={`flex border-b last:border-b-0 border-border ${!readOnly ? "active:bg-muted/30" : ""}`}
                onClick={() => startEdit(mobileDia, hora)}
              >
                <div className="w-14 shrink-0 py-3 text-xs text-muted-foreground font-mono border-r border-border bg-muted/20 flex items-start justify-center">
                  {hora}
                </div>
                <div className="flex-1 min-h-[44px] relative group">
                  {entry ? (
                    <div className={`m-1 px-2 py-1.5 rounded border text-sm leading-tight ${getColorClass(entry.color)}`}>
                      <span className="font-medium">{entry.actividad}</span>
                      {entry.nota && <p className="text-xs opacity-70 mt-0.5">{entry.nota}</p>}
                      {!readOnly && (
                        <button
                          onClick={(e) => { e.stopPropagation(); removeEntry(mobileDia, hora); }}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* === DESKTOP: tabla completa === */}
      <div className="hidden sm:block overflow-x-auto border border-border rounded-lg">
        <table className="w-full border-collapse min-w-[600px]">
          <thead>
            <tr>
              <th className="bg-muted/50 p-2 text-xs font-medium text-muted-foreground text-center w-[60px] border-b border-r border-border">{t("horarioSemanal.hour")}</th>
              {DIAS.map((dia, i) => (
                <th key={dia} className="bg-muted/50 p-2 text-xs font-semibold text-center border-b border-r border-border last:border-r-0">{t(`horarioSemanal.daysFull.${DIA_KEYS[i]}`)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {horasVisibles.map((hora) => (
              <tr key={hora}>
                <td className="p-1.5 text-[11px] text-muted-foreground text-center font-mono border-r border-b border-border bg-muted/20">
                  {hora}
                </td>
                {DIAS.map((dia) => {
                  const entry = getEntry(dia, hora);
                  return (
                    <td
                      key={`${dia}-${hora}`}
                      className={`border-r border-b border-border last:border-r-0 p-0.5 h-[34px] align-top ${!readOnly ? "cursor-pointer hover:bg-muted/20" : ""} transition-colors relative group`}
                      onClick={() => startEdit(dia, hora)}
                    >
                      {entry ? (
                        <div className={`text-[10px] px-1.5 py-0.5 rounded border leading-tight h-full ${getColorClass(entry.color)}`}>
                          <span className="font-medium">{entry.actividad}</span>
                          {entry.nota && <p className="text-[9px] opacity-70 mt-0.5">{entry.nota}</p>}
                          {!readOnly && (
                            <button
                              onClick={(e) => { e.stopPropagation(); removeEntry(dia, hora); }}
                              className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-2 h-2" />
                            </button>
                          )}
                        </div>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Botón expandir/colapsar */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full mt-2 py-2 flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
      >
        {expanded ? (
          <>
            <ChevronUp className="w-4 h-4" />
            {t("horarioSemanal.showLess")}
          </>
        ) : (
          <>
            <ChevronDown className="w-4 h-4" />
            {t("horarioSemanal.showMore", { count: HORAS.length - PREVIEW_ROWS })}
          </>
        )}
      </button>

      {/* === MODAL "Nueva / Editar actividad" === */}
      {draft && !readOnly && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setDraft(null)}
        >
          <div
            className="bg-card rounded-2xl border border-border shadow-xl max-w-md w-full p-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold">
                  {draft.editHora ? tm("editarActividad") : tm("nuevaActividad")}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t(`horarioSemanal.daysFull.${DIA_KEYS[draft.diaIdx]}`)}
                </p>
              </div>
              <button type="button" onClick={() => setDraft(null)} className="p-1 rounded hover:bg-muted text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Nombre */}
            <div className="mb-3">
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">{tm("nombre")}</label>
              <input
                type="text"
                value={draft.actividad}
                autoFocus
                onChange={(e) => setDraft({ ...draft, actividad: e.target.value })}
                onKeyDown={(e) => { if (e.key === "Enter" && draft.actividad.trim()) saveDraft(); }}
                placeholder={tm("nombrePlaceholder")}
                maxLength={80}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Categoría */}
            <div className="mb-3">
              <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">{tm("categoria")}</label>
              <div className="grid grid-cols-5 gap-1.5">
                {CATEGORIAS.map((c) => {
                  const Icon = c.Icon;
                  const selected = draft.color === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setDraft({ ...draft, color: c.id })}
                      className={`rounded-lg border p-2 flex flex-col items-center gap-1 transition-all ${
                        selected
                          ? `${c.block} ring-2 ring-offset-1 ring-offset-card ring-primary/30`
                          : "bg-card hover:bg-muted/50 border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Icon className="w-4 h-4" strokeWidth={1.75} />
                      <span className="text-[10px] font-medium leading-none">{tm(c.labelKey)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Horas */}
            <div className="mb-3 grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground mb-1">{tm("desde")}</label>
                <select
                  value={draft.horaInicio}
                  onChange={(e) => {
                    const ini = e.target.value;
                    const fin = draft.horaFin <= ini ? nextHour(ini) : draft.horaFin;
                    setDraft({ ...draft, horaInicio: ini, horaFin: fin });
                  }}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 tabular-nums"
                >
                  {HORAS.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-muted-foreground mb-1">{tm("hasta")}</label>
                <select
                  value={draft.horaFin}
                  onChange={(e) => setDraft({ ...draft, horaFin: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 tabular-nums"
                >
                  {HORAS_FIN.filter((h) => h > draft.horaInicio).map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>

            {/* Repetir en (solo al crear) */}
            {!draft.editHora && (
              <div className="mb-3">
                <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">{tm("repetirTambienEn")}</label>
                <div className="flex flex-wrap gap-1.5">
                  {DIAS.map((d, i) =>
                    i === draft.diaIdx ? null : (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleRepetir(i)}
                        className={`px-2.5 h-8 rounded-md border text-xs font-medium transition-colors ${
                          draft.repetir.includes(i)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card hover:bg-muted/50 border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {t(`horarioSemanal.daysShort.${DIA_KEYS[i]}`)}
                      </button>
                    ),
                  )}
                </div>
              </div>
            )}

            {/* Nota */}
            <div className="mb-4">
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">{draft.color === "comida" ? tm("queSuelesComer") : tm("notaOpcional")}</label>
              <input
                type="text"
                value={draft.nota}
                onChange={(e) => setDraft({ ...draft, nota: e.target.value })}
                onKeyDown={(e) => { if (e.key === "Enter" && draft.actividad.trim()) saveDraft(); }}
                placeholder={draft.color === "comida" ? tm("queSuelesComerPlaceholder") : tm("notaPlaceholder")}
                maxLength={200}
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Acciones */}
            <div className="flex items-center justify-between gap-2">
              {draft.editHora ? (
                <button
                  type="button"
                  onClick={() => { removeEntry(DIAS[draft.diaIdx], draft.editHora!); setDraft(null); }}
                  className="inline-flex items-center gap-1.5 px-3 h-9 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/40 dark:text-red-400 dark:hover:bg-red-950/30 text-xs font-medium transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {tm("eliminar")}
                </button>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDraft(null)}
                  className="px-3 h-9 rounded-lg border border-border hover:bg-muted text-xs font-medium transition-colors"
                >
                  {tm("cancelar")}
                </button>
                <button
                  type="button"
                  onClick={saveDraft}
                  disabled={!draft.actividad.trim()}
                  className="inline-flex items-center gap-1.5 px-4 h-9 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 text-xs font-semibold transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  {draft.editHora ? t("horarioSemanal.save") : tm("anadir")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useMemo } from "react";
import { X, Save, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useTranslations } from "next-intl";
import type { HorarioEntry } from "@/app/actions/pacientes";
import { toast } from "sonner";

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

interface Props {
  initialEntries: HorarioEntry[];
  readOnly?: boolean;
  onSave: (entries: HorarioEntry[]) => Promise<void>;
}

export function HorarioSemanal({ initialEntries, readOnly, onSave }: Props) {
  const t = useTranslations("agenda");
  const DIAS = DIA_KEYS.map((k) => DIA_DB_VALUE[k]);
  const [entries, setEntries] = useState<HorarioEntry[]>(initialEntries);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [editingCell, setEditingCell] = useState<{ dia: string; hora: string } | null>(null);
  const [inputActividad, setInputActividad] = useState("");
  const [inputColor, setInputColor] = useState("otro");
  const [inputNota, setInputNota] = useState("");
  const [mobileDia, setMobileDia] = useState(DIAS[0]);

  const horasVisibles = expanded ? HORAS : HORAS.slice(0, PREVIEW_ROWS);

  const entryMap = useMemo(() => {
    const m = new Map<string, HorarioEntry>();
    for (const e of entries) m.set(`${e.dia}-${e.hora}`, e);
    return m;
  }, [entries]);

  const entriesPorDia = useMemo(() => {
    const m = new Map<string, number>();
    for (const dia of DIAS) {
      let count = 0;
      for (const h of HORAS) if (entryMap.has(`${dia}-${h}`)) count++;
      m.set(dia, count);
    }
    return m;
  }, [entryMap]);

  function getEntry(dia: string, hora: string) {
    return entryMap.get(`${dia}-${hora}`);
  }

  function startEdit(dia: string, hora: string) {
    if (readOnly) return;
    const existing = getEntry(dia, hora);
    setEditingCell({ dia, hora });
    setInputActividad(existing?.actividad || "");
    setInputColor(existing?.color || "otro");
    setInputNota(existing?.nota || "");
  }

  function saveCell() {
    if (!editingCell) return;
    const updated = entries.filter((e) => !(e.dia === editingCell.dia && e.hora === editingCell.hora));
    if (inputActividad.trim()) {
      updated.push({
        dia: editingCell.dia,
        hora: editingCell.hora,
        actividad: inputActividad.trim(),
        color: inputColor,
        nota: inputNota.trim() || undefined,
      });
    }
    setEntries(updated);
    setDirty(true);
    setEditingCell(null);
    setInputActividad("");
    setInputNota("");
  }

  function removeEntry(dia: string, hora: string) {
    setEntries(entries.filter((e) => !(e.dia === dia && e.hora === hora)));
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

  function renderEditForm(dia: string, hora: string) {
    return (
      <div className="p-2 space-y-1.5">
        <div className="flex gap-1">
          {COLOR_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={(e) => { e.stopPropagation(); setInputColor(id); }}
              className={`w-5 h-5 sm:w-4 sm:h-4 rounded-full border-2 transition-all ${inputColor === id ? "border-foreground scale-110" : "border-transparent"} ${COLOR_CLASSES[id]}`}
              title={t(`horarioSemanal.colorLabels.${id}`)}
            />
          ))}
        </div>
        <input
          type="text"
          value={inputActividad}
          onChange={(e) => setInputActividad(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && saveCell()}
          placeholder={t("horarioSemanal.activityPlaceholder")}
          autoFocus
          className="w-full px-2 py-1 text-sm sm:text-[11px] rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
          onClick={(e) => e.stopPropagation()}
        />
        <input
          type="text"
          value={inputNota}
          onChange={(e) => setInputNota(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && saveCell()}
          placeholder={t("horarioSemanal.notePlaceholder")}
          className="w-full px-2 py-1 text-xs sm:text-[10px] rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-muted-foreground"
          onClick={(e) => e.stopPropagation()}
        />
        <div className="flex gap-1.5">
          <button onClick={(e) => { e.stopPropagation(); saveCell(); }} className="text-xs px-2 py-1 rounded bg-primary text-white">OK</button>
          <button onClick={(e) => { e.stopPropagation(); setEditingCell(null); }} className="text-xs px-2 py-1 rounded border border-border">{t("horarioSemanal.cancel")}</button>
        </div>
      </div>
    );
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
            const isEditing = editingCell?.dia === mobileDia && editingCell?.hora === hora;

            return (
              <div
                key={hora}
                className={`flex border-b last:border-b-0 border-border ${!readOnly && !isEditing ? "active:bg-muted/30" : ""}`}
                onClick={() => !isEditing && startEdit(mobileDia, hora)}
              >
                <div className="w-14 shrink-0 py-3 text-xs text-muted-foreground font-mono border-r border-border bg-muted/20 flex items-start justify-center">
                  {hora}
                </div>
                <div className="flex-1 min-h-[44px] relative group">
                  {isEditing ? renderEditForm(mobileDia, hora) : entry ? (
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
                  const isEditing = editingCell?.dia === dia && editingCell?.hora === hora;

                  return (
                    <td
                      key={`${dia}-${hora}`}
                      className={`border-r border-b border-border last:border-r-0 p-0.5 h-[34px] align-top ${!readOnly && !isEditing ? "cursor-pointer hover:bg-muted/20" : ""} transition-colors relative group`}
                      onClick={() => !isEditing && startEdit(dia, hora)}
                    >
                      {isEditing ? (
                        <div className="p-1 space-y-1">
                          <div className="flex gap-0.5">
                            {COLOR_IDS.map((id) => (
                              <button
                                key={id}
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setInputColor(id); }}
                                className={`w-4 h-4 rounded-full border-2 transition-all ${inputColor === id ? "border-foreground scale-110" : "border-transparent"} ${COLOR_CLASSES[id]}`}
                                title={t(`horarioSemanal.colorLabels.${id}`)}
                              />
                            ))}
                          </div>
                          <input
                            type="text"
                            value={inputActividad}
                            onChange={(e) => setInputActividad(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && saveCell()}
                            placeholder={t("horarioSemanal.activityPlaceholder")}
                            autoFocus
                            className="w-full px-1.5 py-0.5 text-[11px] rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <input
                            type="text"
                            value={inputNota}
                            onChange={(e) => setInputNota(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && saveCell()}
                            placeholder={t("horarioSemanal.notePlaceholder")}
                            className="w-full px-1.5 py-0.5 text-[10px] rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary text-muted-foreground"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex gap-1">
                            <button onClick={(e) => { e.stopPropagation(); saveCell(); }} className="text-[10px] px-1.5 py-0.5 rounded bg-primary text-white">OK</button>
                            <button onClick={(e) => { e.stopPropagation(); setEditingCell(null); }} className="text-[10px] px-1.5 py-0.5 rounded border border-border">X</button>
                          </div>
                        </div>
                      ) : entry ? (
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
    </div>
  );
}

"use client";

import { useState } from "react";
import { Plus, X, Save, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import type { HorarioEntry } from "@/app/actions/pacientes";
import { toast } from "sonner";

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const HORAS = [
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00",
  "20:00", "21:00", "22:00", "23:00",
];
const PREVIEW_ROWS = 5;

const COLORES = [
  { id: "trabajo", label: "Trabajo", class: "bg-blue-100 text-blue-700 border-blue-200" },
  { id: "ejercicio", label: "Ejercicio", class: "bg-green-100 text-green-700 border-green-200" },
  { id: "comida", label: "Comida", class: "bg-amber-100 text-amber-700 border-amber-200" },
  { id: "descanso", label: "Descanso", class: "bg-purple-100 text-purple-700 border-purple-200" },
  { id: "otro", label: "Otro", class: "bg-gray-100 text-gray-700 border-gray-200" },
];

function getColorClass(color?: string) {
  return COLORES.find((c) => c.id === color)?.class || COLORES[4].class;
}

interface Props {
  initialEntries: HorarioEntry[];
  readOnly?: boolean;
  onSave: (entries: HorarioEntry[]) => Promise<void>;
}

export function HorarioSemanal({ initialEntries, readOnly, onSave }: Props) {
  const [entries, setEntries] = useState<HorarioEntry[]>(initialEntries);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [editingCell, setEditingCell] = useState<{ dia: string; hora: string } | null>(null);
  const [inputActividad, setInputActividad] = useState("");
  const [inputColor, setInputColor] = useState("otro");
  const [inputNota, setInputNota] = useState("");
  const hasChanges = JSON.stringify(entries) !== JSON.stringify(initialEntries);

  const horasVisibles = expanded ? HORAS : HORAS.slice(0, PREVIEW_ROWS);

  function getEntry(dia: string, hora: string) {
    return entries.find((e) => e.dia === dia && e.hora === hora);
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
    setEditingCell(null);
    setInputActividad("");
    setInputNota("");
  }

  function removeEntry(dia: string, hora: string) {
    setEntries(entries.filter((e) => !(e.dia === dia && e.hora === hora)));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(entries);
      toast.success("Horario guardado");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {/* Acciones */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex flex-wrap gap-1.5">
          {COLORES.map((c) => (
            <span key={c.id} className={`text-[11px] px-2 py-0.5 rounded-full border ${c.class}`}>
              {c.label}
            </span>
          ))}
        </div>
        {!readOnly && hasChanges && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Guardar
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="overflow-x-auto border border-border rounded-lg">
        <table className="w-full border-collapse min-w-[600px]">
          <thead>
            <tr>
              <th className="bg-muted/50 p-2 text-xs font-medium text-muted-foreground text-center w-[60px] border-b border-r border-border">Hora</th>
              {DIAS.map((dia) => (
                <th key={dia} className="bg-muted/50 p-2 text-xs font-semibold text-center border-b border-r border-border last:border-r-0">{dia}</th>
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
                            {COLORES.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setInputColor(c.id); }}
                                className={`w-4 h-4 rounded-full border-2 transition-all ${inputColor === c.id ? "border-foreground scale-110" : "border-transparent"} ${c.class}`}
                                title={c.label}
                              />
                            ))}
                          </div>
                          <input
                            type="text"
                            value={inputActividad}
                            onChange={(e) => setInputActividad(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && saveCell()}
                            placeholder="Actividad..."
                            autoFocus
                            className="w-full px-1.5 py-0.5 text-[11px] rounded border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <input
                            type="text"
                            value={inputNota}
                            onChange={(e) => setInputNota(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && saveCell()}
                            placeholder="Nota (opcional)..."
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
            Mostrar menos
          </>
        ) : (
          <>
            <ChevronDown className="w-4 h-4" />
            Ver horario completo ({HORAS.length - PREVIEW_ROWS} horas más)
          </>
        )}
      </button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown, Trash2, Plus, X, GripVertical } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import {
  getBuiltin,
  opcionesDeSelect,
  ESCALA_MAX,
  type EstructuraPlantilla,
  type SeccionPlantilla,
  type PreguntaPlantilla,
  type PreguntaCondicionada,
  type CondicionVisibilidad,
} from "@/lib/anamnesis-plantillas";
import type { TipoCampoAnamnesis } from "@/lib/ficha-informacion-types";

type TFunc = (key: string, values?: Record<string, string>) => string;

function nuevoId() {
  return "c_" + Math.random().toString(36).slice(2, 10);
}

/** Respuestas posibles de una pregunta (value/label), para los chips de la condición. Vacío = texto libre. */
function opcionesPregunta(p: PreguntaPlantilla, tp: TFunc): { value: string; label: string }[] {
  if (p.kind === "builtin") {
    const b = getBuiltin(p.ref);
    if (b && b.input === "selector" && b.selectId) return opcionesDeSelect(b.selectId, tp);
    return [];
  }
  if (p.tipo === "escala") return Array.from({ length: ESCALA_MAX }, (_, i) => String(i + 1)).map((n) => ({ value: n, label: n }));
  if (p.tipo === "selector" || p.tipo === "checkbox") return (p.opciones ?? []).map((o) => ({ value: o, label: o }));
  return [];
}

/** Id estable y único (dentro de su sección) para el sortable de una pregunta. */
function pregId(p: PreguntaPlantilla): string {
  return p.kind === "custom" ? `c__${p.id}` : `b__${p.ref}`;
}

const INPUT_CLS =
  "w-full rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring";
const ICON_BTN =
  "p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed";
const GRIP_BTN =
  "p-1.5 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted transition-colors cursor-grab active:cursor-grabbing touch-none shrink-0";

/** Editor de las opciones de un desplegable/casillas como etiquetas (escribir + Enter/coma añade; X elimina). */
function EditorOpciones({
  opciones,
  onChange,
}: {
  opciones: string[];
  onChange: (o: string[]) => void;
}) {
  const t = useTranslations("patients.preconsulta");
  const [nueva, setNueva] = useState("");

  function add(valor: string) {
    const v = valor.trim();
    if (v && !opciones.some((o) => o.toLowerCase() === v.toLowerCase())) {
      onChange([...opciones, v]);
    }
    setNueva("");
  }

  return (
    <div className="basis-full">
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-input bg-background px-2 py-1.5">
        {opciones.map((op, i) => (
          <span key={i} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
            {op}
            <button
              type="button"
              title={t("editorEliminar")}
              onClick={() => onChange(opciones.filter((_, j) => j !== i))}
              className="text-muted-foreground hover:text-red-600"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          value={nueva}
          onChange={(e) => setNueva(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(nueva);
            } else if (e.key === "Backspace" && !nueva && opciones.length) {
              onChange(opciones.slice(0, -1));
            }
          }}
          onBlur={() => add(nueva)}
          placeholder={opciones.length === 0 ? t("editorOpciones") : ""}
          className="flex-1 min-w-[8rem] bg-transparent px-1 py-0.5 text-xs focus:outline-none"
        />
      </div>
      <p className="text-[11px] text-muted-foreground mt-1 pl-1">{t("editorOpcionesAyuda")}</p>
    </div>
  );
}

/** Casilla "Añadir pregunta condicional": al marcarla se CREA una pregunta nueva (la hija) que aparece
 * según la respuesta de ESTA pregunta. `opcionesPropias` son las respuestas posibles de la madre. */
function CondicionEditor({
  opcionesPropias,
  condicion,
  onChange,
  t,
}: {
  opcionesPropias: { value: string; label: string }[];
  condicion?: CondicionVisibilidad;
  onChange: (c?: CondicionVisibilidad) => void;
  t: TFunc;
}) {
  const marcado = !!condicion;
  const valores = condicion?.valores ?? [];
  const hija = condicion?.pregunta;
  const tieneOpciones = opcionesPropias.length > 0;

  function toggleMarcado() {
    if (marcado) onChange(undefined);
    else onChange({ valores: [], pregunta: { id: nuevoId(), label: "", tipo: "texto" } });
  }

  function toggleValor(v: string) {
    if (!condicion) return;
    const next = valores.includes(v) ? valores.filter((x) => x !== v) : [...valores, v];
    onChange({ ...condicion, valores: next });
  }

  function setHija(patch: Partial<PreguntaCondicionada>) {
    if (!condicion) return;
    onChange({ ...condicion, pregunta: { ...condicion.pregunta, ...patch } });
  }

  return (
    <div className="space-y-2 pl-1">
      <label className="inline-flex items-center gap-2 text-[11px] font-medium text-muted-foreground cursor-pointer">
        <input
          type="checkbox"
          checked={marcado}
          onChange={toggleMarcado}
          className="h-3.5 w-3.5 rounded border-input accent-primary"
        />
        {t("editorCondicionLabel")}
      </label>

      {marcado && hija && (
        <div className="space-y-2.5 rounded-lg border border-dashed border-border bg-muted/30 p-2.5">
          {/* Cuándo aparece (según la respuesta de la pregunta madre) */}
          {tieneOpciones ? (
            <div className="space-y-1.5">
              <p className="text-[11px] text-muted-foreground">{t("editorCondicionMostrarSi")}</p>
              <div className="flex flex-wrap items-center gap-1.5">
                {opcionesPropias.map((op) => {
                  const on = valores.includes(op.value);
                  return (
                    <button
                      type="button"
                      key={op.value}
                      onClick={() => toggleValor(op.value)}
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-xs transition-colors",
                        on
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-input bg-background text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {op.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground">{t("editorCondicionSiRellena")}</p>
          )}

          {/* La pregunta que aparece (se crea aquí) */}
          <div className="space-y-2 rounded-lg border border-border bg-background p-2">
            <input
              value={hija.label}
              onChange={(e) => setHija({ label: e.target.value })}
              placeholder={t("editorCondicionPreguntaPlaceholder")}
              className={INPUT_CLS}
            />
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={hija.tipo}
                onChange={(e) => setHija({ tipo: e.target.value as TipoCampoAnamnesis })}
                className="rounded-lg border border-input bg-background px-2 py-1 text-xs"
              >
                <option value="texto">{t("editorTipoTexto")}</option>
                <option value="textarea">{t("editorTipoTextarea")}</option>
                <option value="selector">{t("editorTipoSelector")}</option>
                <option value="checkbox">{t("editorTipoCheckbox")}</option>
                <option value="escala">{t("editorTipoEscala")}</option>
              </select>
              {(hija.tipo === "selector" || hija.tipo === "checkbox") && (
                <EditorOpciones opciones={hija.opciones ?? []} onChange={(o) => setHija({ opciones: o })} />
              )}
              {hija.tipo === "escala" && (
                <span className="basis-full pl-1 text-[11px] text-muted-foreground">{t("editorEscalaAyuda")}</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Una pregunta (fija o propia) como item ordenable. */
function PreguntaSortable({
  pregunta,
  esPrimera,
  esUltima,
  onChange,
  onSubir,
  onBajar,
  onEliminar,
  t,
  tp,
}: {
  pregunta: PreguntaPlantilla;
  esPrimera: boolean;
  esUltima: boolean;
  onChange: (p: PreguntaPlantilla) => void;
  onSubir: () => void;
  onBajar: () => void;
  onEliminar: () => void;
  t: TFunc;
  tp: TFunc;
}) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: pregId(pregunta),
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const esBuiltin = pregunta.kind === "builtin";
  const b = esBuiltin ? getBuiltin(pregunta.ref) : undefined;
  const labelDefecto = b ? tp(b.labelKey) : "";
  const valorLabel = esBuiltin ? (pregunta.labelOverride ?? "") : pregunta.label;

  function setCondicion(cond?: CondicionVisibilidad) {
    if (cond) {
      onChange({ ...pregunta, condicion: cond } as PreguntaPlantilla);
      return;
    }
    const rest = { ...pregunta };
    delete (rest as { condicion?: unknown }).condicion;
    onChange(rest as PreguntaPlantilla);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-lg border border-border bg-background p-2.5 space-y-2",
        isDragging && "opacity-60 shadow-lg ring-2 ring-primary/30",
      )}
    >
      <div className="flex items-center gap-1.5">
        <button type="button" title={t("editorArrastrar")} className={GRIP_BTN} {...attributes} {...listeners}>
          <GripVertical className="w-4 h-4" />
        </button>
        <input
          value={valorLabel}
          onChange={(e) =>
            onChange(
              esBuiltin
                ? ({ ...pregunta, labelOverride: e.target.value } as PreguntaPlantilla)
                : ({ ...pregunta, label: e.target.value } as PreguntaPlantilla),
            )
          }
          placeholder={esBuiltin ? labelDefecto : t("editorNombrePregunta")}
          className={INPUT_CLS + " flex-1"}
        />
        <button type="button" title={t("editorSubir")} onClick={onSubir} disabled={esPrimera} className={ICON_BTN}>
          <ChevronUp className="w-4 h-4" />
        </button>
        <button type="button" title={t("editorBajar")} onClick={onBajar} disabled={esUltima} className={ICON_BTN}>
          <ChevronDown className="w-4 h-4" />
        </button>
        <button type="button" title={t("editorEliminar")} onClick={onEliminar} className={ICON_BTN + " hover:text-red-600"}>
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      {esBuiltin ? (
        <p className="text-[11px] text-muted-foreground pl-1">{t("editorFija")}</p>
      ) : (
        <div className="flex flex-wrap items-center gap-2 pl-1">
          <select
            value={pregunta.tipo}
            onChange={(e) => onChange({ ...pregunta, tipo: e.target.value as TipoCampoAnamnesis } as PreguntaPlantilla)}
            className="rounded-lg border border-input bg-background px-2 py-1 text-xs"
          >
            <option value="texto">{t("editorTipoTexto")}</option>
            <option value="textarea">{t("editorTipoTextarea")}</option>
            <option value="selector">{t("editorTipoSelector")}</option>
            <option value="checkbox">{t("editorTipoCheckbox")}</option>
            <option value="escala">{t("editorTipoEscala")}</option>
          </select>
          {(pregunta.tipo === "selector" || pregunta.tipo === "checkbox") && (
            <EditorOpciones
              opciones={pregunta.opciones ?? []}
              onChange={(o) => onChange({ ...pregunta, opciones: o } as PreguntaPlantilla)}
            />
          )}
          {pregunta.tipo === "escala" && (
            <span className="basis-full pl-1 text-[11px] text-muted-foreground">{t("editorEscalaAyuda")}</span>
          )}
        </div>
      )}
      <CondicionEditor opcionesPropias={opcionesPregunta(pregunta, tp)} condicion={pregunta.condicion} onChange={setCondicion} t={t} />
    </div>
  );
}

/** Una sección como item ordenable, con su propia lista ordenable de preguntas. */
function SeccionSortable({
  seccion,
  esPrimera,
  esUltima,
  onChange,
  onSubir,
  onBajar,
  onEliminar,
  t,
  tp,
}: {
  seccion: SeccionPlantilla;
  esPrimera: boolean;
  esUltima: boolean;
  onChange: (s: SeccionPlantilla) => void;
  onSubir: () => void;
  onBajar: () => void;
  onEliminar: () => void;
  t: TFunc;
  tp: TFunc;
}) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: seccion.id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const tituloDefecto = seccion.tituloKey ? tp(seccion.tituloKey) : "";
  const preguntas = seccion.preguntas;

  function setPreguntas(nuevas: PreguntaPlantilla[]) {
    onChange({ ...seccion, preguntas: nuevas });
  }

  function handlePregDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = preguntas.map(pregId);
    const oldI = ids.indexOf(String(active.id));
    const newI = ids.indexOf(String(over.id));
    if (oldI !== -1 && newI !== -1) setPreguntas(arrayMove(preguntas, oldI, newI));
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-xl border border-border bg-card overflow-hidden",
        isDragging && "opacity-70 shadow-xl ring-2 ring-primary/30",
      )}
    >
      <div className="flex items-center gap-1.5 px-3 py-3 border-b border-border/60 bg-muted/30">
        <button type="button" title={t("editorArrastrar")} className={GRIP_BTN} {...attributes} {...listeners}>
          <GripVertical className="w-4 h-4" />
        </button>
        <input
          value={seccion.titulo ?? ""}
          onChange={(e) => onChange({ ...seccion, titulo: e.target.value })}
          placeholder={tituloDefecto || t("editorNombreSeccion")}
          className="flex-1 rounded-lg border border-input bg-background px-3 py-1.5 font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button type="button" title={t("editorSubir")} onClick={onSubir} disabled={esPrimera} className={ICON_BTN}>
          <ChevronUp className="w-4 h-4" />
        </button>
        <button type="button" title={t("editorBajar")} onClick={onBajar} disabled={esUltima} className={ICON_BTN}>
          <ChevronDown className="w-4 h-4" />
        </button>
        <button type="button" title={t("editorEliminar")} onClick={onEliminar} className={ICON_BTN + " hover:text-red-600"}>
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="p-3 space-y-2">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handlePregDragEnd}>
          <SortableContext items={preguntas.map(pregId)} strategy={verticalListSortingStrategy}>
            {preguntas.map((p, pi) => (
              <PreguntaSortable
                key={pregId(p)}
                pregunta={p}
                esPrimera={pi === 0}
                esUltima={pi === preguntas.length - 1}
                onChange={(np) => setPreguntas(preguntas.map((q, i) => (i === pi ? np : q)))}
                onSubir={() => setPreguntas(arrayMove(preguntas, pi, pi - 1))}
                onBajar={() => setPreguntas(arrayMove(preguntas, pi, pi + 1))}
                onEliminar={() => setPreguntas(preguntas.filter((_, i) => i !== pi))}
                t={t}
                tp={tp}
              />
            ))}
          </SortableContext>
        </DndContext>

        <button
          type="button"
          onClick={() => setPreguntas([...preguntas, { kind: "custom", id: nuevoId(), label: "", tipo: "texto" }])}
          className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-dashed border-border hover:border-primary/50 hover:bg-muted/50 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          {t("editorAnadirPregunta")}
        </button>
      </div>
    </div>
  );
}

/** Editor de la ESTRUCTURA de la anamnesis (secciones y preguntas). Controlado: estructura + onChange. */
export function AnamnesisEditor({
  estructura,
  onChange,
}: {
  estructura: EstructuraPlantilla;
  onChange: (e: EstructuraPlantilla) => void;
}) {
  const t = useTranslations("patients.preconsulta");
  const tp = useTranslations("patients");
  const secciones = estructura.secciones;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function setSecciones(nuevas: SeccionPlantilla[]) {
    onChange({ secciones: nuevas });
  }

  function handleSecDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldI = secciones.findIndex((s) => s.id === active.id);
    const newI = secciones.findIndex((s) => s.id === over.id);
    if (oldI !== -1 && newI !== -1) setSecciones(arrayMove(secciones, oldI, newI));
  }

  return (
    <div className="space-y-4">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleSecDragEnd}>
        <SortableContext items={secciones.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          {secciones.map((sec, si) => (
            <div key={sec.id} className="mb-4">
              <SeccionSortable
                seccion={sec}
                esPrimera={si === 0}
                esUltima={si === secciones.length - 1}
                onChange={(ns) => setSecciones(secciones.map((s, i) => (i === si ? ns : s)))}
                onSubir={() => setSecciones(arrayMove(secciones, si, si - 1))}
                onBajar={() => setSecciones(arrayMove(secciones, si, si + 1))}
                onEliminar={() => setSecciones(secciones.filter((_, i) => i !== si))}
                t={t}
                tp={tp}
              />
            </div>
          ))}
        </SortableContext>
      </DndContext>

      <button
        type="button"
        onClick={() => setSecciones([...secciones, { id: nuevoId(), titulo: t("editorSeccionNueva"), preguntas: [] }])}
        className="inline-flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg border border-dashed border-border hover:border-primary/50 hover:bg-muted/50 transition-colors"
      >
        <Plus className="w-4 h-4" />
        {t("editorAnadirSeccion")}
      </button>
    </div>
  );
}

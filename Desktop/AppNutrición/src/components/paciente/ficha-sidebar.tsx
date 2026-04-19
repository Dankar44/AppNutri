"use client";

import { useState } from "react";
import {
  FileText,
  BookOpen,
  Brain,
  Folder,
  Target,
  X,
  Loader2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { DatePicker } from "@/components/date-picker";
import type {
  FichaSidebarData,
  Observacion,
  DiarioAlimentario,
  ComportamientoAlimentario,
  Objetivo,
} from "@/lib/ficha-sidebar-types";
import {
  TIPOS_OBJETIVO,
  TIPOS_MEDICION,
  UNIDADES_MEDICION,
  COMIDAS,
} from "@/lib/ficha-sidebar-types";
import { guardarFichaSidebar } from "@/app/actions/ficha-sidebar";

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function formatFecha(s: string) {
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

// ─── Modal wrapper ──────────────────────────────────────
function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-xl border border-border shadow-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button type="button" onClick={onClose} className="p-1 hover:bg-muted rounded-md">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Field helpers ──────────────────────────────────────
function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-muted-foreground mb-1">
      {children}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
    />
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function ModalButtons({
  saving,
  onCancel,
  label = "Guardar",
}: {
  saving: boolean;
  onCancel: () => void;
  label?: string;
}) {
  return (
    <div className="flex justify-end gap-2 mt-5">
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted"
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={saving}
        className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-2"
      >
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
        {label}
      </button>
    </div>
  );
}

// ─── Section box ────────────────────────────────────────
function SidebarSection({
  title,
  icon: Icon,
  empty,
  onAdd,
  children,
}: {
  title: string;
  icon: React.ElementType;
  empty: string;
  onAdd: () => void;
  children?: React.ReactNode;
}) {
  const hasChildren = Array.isArray(children)
    ? children.filter(Boolean).length > 0
    : !!children;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <button
          type="button"
          onClick={onAdd}
          className="text-muted-foreground hover:text-primary text-lg leading-none px-1 transition-colors"
          title={`Añadir ${title.toLowerCase()}`}
        >
          +
        </button>
      </div>
      {hasChildren ? (
        <div className="space-y-1.5">{children}</div>
      ) : (
        <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
          <Icon className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground leading-snug">{empty}</p>
        </div>
      )}
    </div>
  );
}

function EntryCard({
  fecha,
  text,
  onDelete,
}: {
  fecha: string;
  text: string;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-2.5 text-xs group relative">
      <p className="text-muted-foreground mb-0.5">{formatFecha(fecha)}</p>
      <p className="text-foreground line-clamp-2">{text}</p>
      <button
        type="button"
        onClick={onDelete}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────
export function FichaSidebar({
  pacienteId,
  initialData,
}: {
  pacienteId: string;
  initialData: FichaSidebarData;
}) {
  const [data, setData] = useState<FichaSidebarData>(initialData);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<
    null | "observacion" | "diario" | "comportamiento" | "objetivo"
  >(null);

  async function save(updated: FichaSidebarData) {
    setSaving(true);
    try {
      await guardarFichaSidebar(pacienteId, updated);
      setData(updated);
      setModal(null);
    } catch {
      toast.error("No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  function deleteEntry<K extends keyof FichaSidebarData>(key: K, id: string) {
    const arr = (data[key] as { id: string }[]) || [];
    const updated = { ...data, [key]: arr.filter((e) => e.id !== id) };
    save(updated);
  }

  // ── Observaciones ─────────────────────────
  const [obsForm, setObsForm] = useState({ fecha: todayStr(), texto: "" });

  function handleAddObservacion(e: React.FormEvent) {
    e.preventDefault();
    if (!obsForm.texto.trim()) return;
    const entry: Observacion = { id: genId(), ...obsForm };
    save({ ...data, observaciones: [...(data.observaciones || []), entry] });
    setObsForm({ fecha: todayStr(), texto: "" });
  }

  // ── Diarios alimentarios ──────────────────
  const [diaForm, setDiaForm] = useState({ fecha: todayStr(), comida: "desayuno", observaciones: "" });

  function handleAddDiario(e: React.FormEvent) {
    e.preventDefault();
    const entry: DiarioAlimentario = { id: genId(), ...diaForm };
    save({ ...data, diarios: [...(data.diarios || []), entry] });
    setDiaForm({ fecha: todayStr(), comida: "desayuno", observaciones: "" });
  }

  // ── Comportamientos ───────────────────────
  const [compForm, setCompForm] = useState({ fecha: todayStr(), texto: "" });

  function handleAddComportamiento(e: React.FormEvent) {
    e.preventDefault();
    if (!compForm.texto.trim()) return;
    const entry: ComportamientoAlimentario = { id: genId(), ...compForm };
    save({ ...data, comportamientos: [...(data.comportamientos || []), entry] });
    setCompForm({ fecha: todayStr(), texto: "" });
  }

  // ── Objetivos ─────────────────────────────
  const [objForm, setObjForm] = useState({
    tipo: "generico" as "generico" | "medicion",
    descripcion: "",
    fechaLimite: "",
    tipoMedicion: "peso",
    valor: "",
    unidad: "kg",
  });

  function handleAddObjetivo(e: React.FormEvent) {
    e.preventDefault();
    if (!objForm.descripcion.trim()) return;
    const entry: Objetivo = {
      id: genId(),
      tipo: objForm.tipo,
      descripcion: objForm.descripcion,
      fechaLimite: objForm.fechaLimite,
      ...(objForm.tipo === "medicion" && {
        tipoMedicion: objForm.tipoMedicion,
        valor: objForm.valor ? parseFloat(objForm.valor) : undefined,
        unidad: objForm.unidad,
      }),
    };
    save({ ...data, objetivos: [...(data.objetivos || []), entry] });
    setObjForm({ tipo: "generico", descripcion: "", fechaLimite: "", tipoMedicion: "peso", valor: "", unidad: "kg" });
  }

  const comidaLabel = (v: string) => COMIDAS.find((c) => c.value === v)?.label ?? v;

  return (
    <aside className="space-y-4 xl:sticky xl:top-6 self-start">
      {/* Observaciones */}
      <SidebarSection
        title="Observaciones"
        icon={FileText}
        empty="Todavía no has registrado observaciones"
        onAdd={() => { setObsForm({ fecha: todayStr(), texto: "" }); setModal("observacion"); }}
      >
        {(data.observaciones || []).map((o) => (
          <EntryCard
            key={o.id}
            fecha={o.fecha}
            text={o.texto}
            onDelete={() => deleteEntry("observaciones", o.id)}
          />
        ))}
      </SidebarSection>

      {/* Diarios alimentarios */}
      <SidebarSection
        title="Diarios alimentarios"
        icon={BookOpen}
        empty="Todavía no has registrado ningún diario alimentario"
        onAdd={() => { setDiaForm({ fecha: todayStr(), comida: "desayuno", observaciones: "" }); setModal("diario"); }}
      >
        {(data.diarios || []).map((d) => (
          <EntryCard
            key={d.id}
            fecha={d.fecha}
            text={`${comidaLabel(d.comida)}${d.observaciones ? `: ${d.observaciones}` : ""}`}
            onDelete={() => deleteEntry("diarios", d.id)}
          />
        ))}
      </SidebarSection>

      {/* Comportamientos alimentarios */}
      <SidebarSection
        title="Comportamientos alimentarios"
        icon={Brain}
        empty="Todavía no has registrado ningún comportamiento alimentario"
        onAdd={() => { setCompForm({ fecha: todayStr(), texto: "" }); setModal("comportamiento"); }}
      >
        {(data.comportamientos || []).map((c) => (
          <EntryCard
            key={c.id}
            fecha={c.fecha}
            text={c.texto}
            onDelete={() => deleteEntry("comportamientos", c.id)}
          />
        ))}
      </SidebarSection>

      {/* Archivos (placeholder - necesita storage) */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-foreground">Archivos</h3>
          <button
            type="button"
            onClick={() => toast.message("Próximamente", { description: "Subida de archivos en desarrollo." })}
            className="text-muted-foreground hover:text-primary text-lg leading-none px-1 transition-colors"
          >
            +
          </button>
        </div>
        <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
          <Folder className="w-8 h-8 text-muted-foreground/60 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground leading-snug">Próximamente</p>
        </div>
      </div>

      {/* Objetivos */}
      <SidebarSection
        title="Objetivos"
        icon={Target}
        empty="Aún no definiste ningún objetivo"
        onAdd={() => {
          setObjForm({ tipo: "generico", descripcion: "", fechaLimite: "", tipoMedicion: "peso", valor: "", unidad: "kg" });
          setModal("objetivo");
        }}
      >
        {(data.objetivos || []).map((o) => (
          <EntryCard
            key={o.id}
            fecha={o.fechaLimite || "sin fecha"}
            text={`${o.descripcion}${o.valor ? ` — ${o.valor} ${o.unidad}` : ""}`}
            onDelete={() => deleteEntry("objetivos", o.id)}
          />
        ))}
      </SidebarSection>

      {/* ── Modales ─────────────────────────── */}

      <Modal open={modal === "observacion"} onClose={() => setModal(null)} title="Observaciones">
        <form onSubmit={handleAddObservacion}>
          <div className="space-y-3">
            <div>
              <Label>Fecha de registro</Label>
              <DatePicker value={obsForm.fecha} onChange={(v) => setObsForm({ ...obsForm, fecha: v })} />
            </div>
            <div>
              <Label required>Observaciones</Label>
              <Textarea rows={5} value={obsForm.texto} onChange={(e) => setObsForm({ ...obsForm, texto: e.target.value })} />
            </div>
          </div>
          <ModalButtons saving={saving} onCancel={() => setModal(null)} />
        </form>
      </Modal>

      <Modal open={modal === "diario"} onClose={() => setModal(null)} title="Diario alimentario">
        <form onSubmit={handleAddDiario}>
          <div className="space-y-3">
            <div>
              <Label>Fecha de registro</Label>
              <DatePicker value={diaForm.fecha} onChange={(v) => setDiaForm({ ...diaForm, fecha: v })} />
            </div>
            <div>
              <Label>Añadir comida</Label>
              <Select value={diaForm.comida} onChange={(v) => setDiaForm({ ...diaForm, comida: v })} options={COMIDAS} />
            </div>
            <div>
              <Label>Observaciones</Label>
              <Textarea rows={4} value={diaForm.observaciones} onChange={(e) => setDiaForm({ ...diaForm, observaciones: e.target.value })} />
            </div>
          </div>
          <ModalButtons saving={saving} onCancel={() => setModal(null)} />
        </form>
      </Modal>

      <Modal open={modal === "comportamiento"} onClose={() => setModal(null)} title="Comportamiento alimentario">
        <form onSubmit={handleAddComportamiento}>
          <div className="space-y-3">
            <div>
              <Label>Fecha de registro</Label>
              <DatePicker value={compForm.fecha} onChange={(v) => setCompForm({ ...compForm, fecha: v })} />
            </div>
            <div>
              <Label required>Comportamientos alimentarios</Label>
              <Textarea rows={4} value={compForm.texto} onChange={(e) => setCompForm({ ...compForm, texto: e.target.value })} />
            </div>
          </div>
          <ModalButtons saving={saving} onCancel={() => setModal(null)} />
        </form>
      </Modal>

      <Modal open={modal === "objetivo"} onClose={() => setModal(null)} title="Define un nuevo objetivo">
        <form onSubmit={handleAddObjetivo}>
          <div className="space-y-3">
            <div>
              <Label required>Tipo de objetivo</Label>
              <Select
                value={objForm.tipo}
                onChange={(v) => {
                  setObjForm({ ...objForm, tipo: v as "generico" | "medicion" });
                }}
                options={TIPOS_OBJETIVO}
              />
            </div>
            {objForm.tipo === "medicion" && (
              <>
                <div>
                  <Label required>Tipo de medición</Label>
                  <Select
                    value={objForm.tipoMedicion}
                    onChange={(v) =>
                      setObjForm({ ...objForm, tipoMedicion: v, unidad: UNIDADES_MEDICION[v] || "" })
                    }
                    options={TIPOS_MEDICION}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label required>Valor</Label>
                    <Input
                      type="number" inputMode="decimal"
                      step="0.1"
                      placeholder="Introduzca un número"
                      value={objForm.valor}
                      onChange={(e) => setObjForm({ ...objForm, valor: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Unidad</Label>
                    <Input
                      value={objForm.unidad}
                      onChange={(e) => setObjForm({ ...objForm, unidad: e.target.value })}
                    />
                  </div>
                </div>
              </>
            )}
            <div>
              <Label required>Descripción</Label>
              <Input
                placeholder="ej: Beber más de 1 litro de agua al día"
                value={objForm.descripcion}
                onChange={(e) => setObjForm({ ...objForm, descripcion: e.target.value })}
              />
            </div>
            <div>
              <Label required>Fecha límite</Label>
              <DatePicker value={objForm.fechaLimite} onChange={(v) => setObjForm({ ...objForm, fechaLimite: v })} />
            </div>
          </div>
          <ModalButtons saving={saving} onCancel={() => setModal(null)} label="Definir objetivo" />
        </form>
      </Modal>
    </aside>
  );
}

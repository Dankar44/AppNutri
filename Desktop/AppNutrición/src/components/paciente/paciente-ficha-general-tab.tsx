"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Brain,
  Calendar,
  Clock3,
  FileText,
  Heart,
  Loader2,
  Mail,
  Phone,
  Pill,
  Ruler,
  Scale,
  Shield,
  Stethoscope,
  Target,
  Trash2,
  UserRound,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";
import type { HorarioEntry } from "@/app/actions/pacientes";
import { HorarioSemanal } from "@/components/horario-semanal";
import { RecomendacionesCard } from "@/components/recomendaciones-card";
import { DatePicker } from "@/components/date-picker";
import { guardarFichaSidebar } from "@/app/actions/ficha-sidebar";
import type {
  FichaSidebarData,
  Observacion,
  ComportamientoAlimentario,
  Objetivo,
} from "@/lib/ficha-sidebar-types";
import {
  TIPOS_OBJETIVO,
  TIPOS_MEDICION,
  UNIDADES_MEDICION,
} from "@/lib/ficha-sidebar-types";

type PacienteGeneral = {
  id: string;
  email: string | null;
  telefono: string | null;
  fechaNacimiento: string | null;
  sexo: string | null;
  peso: number | null;
  altura: number | null;
  objetivo: string | null;
  objetivoDetalle: string | null;
  alergias: string[];
  intolerancias: string[];
  patologias: string[];
  medicamentos: string[];
  suplementos: string[];
};

type PlanResumen = {
  id: string;
  nombre: string;
  caloriasObjetivo: number | null;
  createdAt: string;
  activo: boolean;
};

function renderObjetivo(objetivo: string | null, detalle: string | null) {
  if (detalle?.trim()) return detalle;
  if (!objetivo) return "No registrado";

  const labels: Record<string, string> = {
    PERDER_PESO: "Perdida de peso",
    GANAR_MASA: "Ganar masa",
    MANTENIMIENTO: "Mantenimiento",
    PATOLOGIA: "Patologia",
    DEPORTIVO: "Deportivo",
    OTRO: "Otro",
  };

  return labels[objetivo] ?? objetivo;
}

function renderLista(items: string[] | undefined | null) {
  return items?.length ? items.join(", ") : "Ninguna registrada";
}

export function PacienteFichaGeneralTab({
  paciente,
  horario,
  recomendaciones,
  planes,
  sidebarData: initialSidebar = {},
}: {
  paciente: PacienteGeneral;
  horario: HorarioEntry[];
  recomendaciones: string;
  planes: PlanResumen[];
  sidebarData?: FichaSidebarData;
}) {
  const [sidebar, setSidebar] = useState<FichaSidebarData>(initialSidebar);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<null | "observacion" | "comportamiento" | "objetivo">(null);

  async function saveSidebar(updated: FichaSidebarData) {
    setSaving(true);
    try {
      await guardarFichaSidebar(paciente.id, updated);
      setSidebar(updated);
      setModal(null);
    } catch {
      toast.error("No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  function deleteEntry<K extends keyof FichaSidebarData>(key: K, id: string) {
    const arr = (sidebar[key] as { id: string }[]) || [];
    saveSidebar({ ...sidebar, [key]: arr.filter((e) => e.id !== id) });
  }
  const planesOrdenados = [...planes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const previewPlanes = planesOrdenados.slice(0, 3);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-3 sm:gap-5 items-start">
      <div className="space-y-3 sm:space-y-5">
      <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <h3 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 inline-flex items-center gap-2">
          <UserRound className="w-5 h-5 text-green-600 dark:text-green-400" />
          Datos personales
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground inline-flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </p>
            <p className="font-medium">{paciente.email || "No registrado"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground inline-flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Teléfono
            </p>
            <p className="font-medium">{paciente.telefono || "No registrado"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground inline-flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Fecha nacimiento
            </p>
            <p className="font-medium">
              {paciente.fechaNacimiento ? formatDate(paciente.fechaNacimiento) : "No registrada"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground inline-flex items-center gap-2">
              <UserRound className="w-4 h-4" />
              Sexo
            </p>
            <p className="font-medium">{paciente.sexo || "No registrado"}</p>
          </div>
        </div>
      </section>
      <section className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-2xl font-semibold mb-4 inline-flex items-center gap-2">
          <Heart className="w-5 h-5 text-rose-500" />
          Historial médico
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground inline-flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Alergias
            </p>
            <p className="font-medium mt-1">{renderLista(paciente.alergias)}</p>
          </div>
          <div>
            <p className="text-muted-foreground inline-flex items-center gap-2">
              <Stethoscope className="w-4 h-4" />
              Intolerancias
            </p>
            <p className="font-medium mt-1">{renderLista(paciente.intolerancias)}</p>
          </div>
          <div>
            <p className="text-muted-foreground inline-flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Patologías
            </p>
            <p className="font-medium mt-1">{renderLista(paciente.patologias)}</p>
          </div>
          <div>
            <p className="text-muted-foreground inline-flex items-center gap-2">
              <Pill className="w-4 h-4" />
              Medicamentos
            </p>
            <p className="font-medium mt-1">{renderLista(paciente.medicamentos)}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-muted-foreground inline-flex items-center gap-2">
              <Pill className="w-4 h-4" />
              Suplementos
            </p>
            <p className="font-medium mt-1">{renderLista(paciente.suplementos)}</p>
          </div>
        </div>
      </section>
      <section className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-2xl font-semibold mb-2 inline-flex items-center gap-2">
          <Clock3 className="w-5 h-5 text-indigo-500" />
          Horario semanal
        </h3>
        <p className="text-sm text-muted-foreground mb-3">
          Horario compartido con el paciente. Haz clic en una celda para añadir una actividad.
        </p>
        <HorarioSemanal initialEntries={horario} readOnly onSave={async () => {}} />
      </section>
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-2xl font-semibold inline-flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-green-600 dark:text-green-400" />
            Planes alimenticios
          </h3>
          <Link
            href={`/dietas/nuevo?pacienteId=${paciente.id}`}
            className="inline-flex items-center rounded-full bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            + Nuevo plan
          </Link>
        </div>

        <div className="space-y-2">
          {previewPlanes.map((plan) => (
            <Link
              key={plan.id}
              href={`/dietas/${plan.id}`}
              className="flex items-center justify-between rounded-xl border border-border px-4 py-3 hover:bg-muted/40"
            >
              <div>
                <p className="font-medium">{plan.nombre}</p>
                <p className="text-sm text-muted-foreground">{formatDate(plan.createdAt)}</p>
              </div>
              {plan.caloriasObjetivo != null && (
                <span className="rounded-full bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1 text-sm font-medium text-amber-700 dark:text-amber-400">
                  {plan.caloriasObjetivo} kcal
                </span>
              )}
            </Link>
          ))}
        </div>

        {planesOrdenados.length > 0 && (
          <Link
            href={`/pacientes/${paciente.id}?pestana=plan-alimentacion`}
            className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-border px-3 py-2 text-base font-medium text-primary hover:bg-muted/50"
          >
            Ver todos los planes ({planesOrdenados.length})
          </Link>
        )}
      </section>
      </div>

      <div className="space-y-5">
      {/* Objetivos unificados: principal + parciales */}
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-semibold inline-flex items-center gap-2">
            <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
            Objetivos
          </h3>
          <button
            type="button"
            onClick={() => setModal("objetivo")}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            + Añadir
          </button>
        </div>

        <div className="mb-3">
          <p className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Objetivo principal</p>
          <div className="w-full rounded-lg bg-sidebar-accent px-3 py-2.5 text-sidebar-foreground font-semibold flex items-center justify-center text-center">
            {renderObjetivo(paciente.objetivo, paciente.objetivoDetalle)}
          </div>
        </div>

        {(sidebar.objetivos || []).length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Objetivos parciales</p>
            <div className="space-y-2">
              {(sidebar.objetivos || []).map((o) => (
                <EntryCard key={o.id} fecha={o.fechaLimite || ""} text={`${o.descripcion}${o.valor ? ` — ${o.valor} ${o.unidad}` : ""}`} onDelete={() => deleteEntry("objetivos", o.id)} />
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-2xl font-semibold inline-flex items-center gap-2">
          <Ruler className="w-5 h-5 text-blue-500" />
          Medidas
        </h3>
        <div className="text-sm space-y-2">
          <p className="flex items-center justify-between">
            <span className="text-muted-foreground inline-flex items-center gap-2">
              <Scale className="w-4 h-4" />
              Peso
            </span>
            <span className="font-medium">{paciente.peso != null ? `${paciente.peso} kg` : "-"}</span>
          </p>
          <p className="flex items-center justify-between">
            <span className="text-muted-foreground inline-flex items-center gap-2">
              <Ruler className="w-4 h-4" />
              Altura
            </span>
            <span className="font-medium">{paciente.altura != null ? `${paciente.altura} cm` : "-"}</span>
          </p>
        </div>
        <Link
          href={`/pacientes/${paciente.id}?pestana=mediciones`}
          className="inline-flex w-full items-center justify-center rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          Ver evolución y registrar medidas
        </Link>
      </section>

      {/* Observaciones */}
      <SeguimientoSection
        title="Observaciones"
        icon={FileText}
        iconColor="text-amber-600 dark:text-amber-400"
        empty="Todavía no has registrado observaciones"
        onAdd={() => setModal("observacion")}
      >
        {(sidebar.observaciones || []).map((o) => (
          <EntryCard key={o.id} fecha={o.fecha} text={o.texto} onDelete={() => deleteEntry("observaciones", o.id)} />
        ))}
      </SeguimientoSection>

      {/* Comportamientos alimentarios */}
      <SeguimientoSection
        title="Comportamientos alimentarios"
        icon={Brain}
        iconColor="text-indigo-500"
        empty="Todavía no has registrado ningún comportamiento"
        onAdd={() => setModal("comportamiento")}
      >
        {(sidebar.comportamientos || []).map((c) => (
          <EntryCard key={c.id} fecha={c.fecha} text={c.texto} onDelete={() => deleteEntry("comportamientos", c.id)} />
        ))}
      </SeguimientoSection>

      <section className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-2xl font-semibold mb-4 inline-flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          Seguimiento diario
        </h3>
        <Link
          href={`/pacientes/${paciente.id}/seguimiento`}
          className="inline-flex w-full items-center justify-center rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          Ver seguimiento del paciente
        </Link>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-2xl font-semibold mb-4 inline-flex items-center gap-2">
          <Shield className="w-5 h-5 text-violet-500" />
          Portal del paciente
        </h3>
        <Link
          href={`/pacientes/${paciente.id}/portal`}
          className="inline-flex w-full items-center justify-center rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          Configurar acceso al portal
        </Link>
      </section>

      <div>
        <RecomendacionesCard pacienteId={paciente.id} initialText={recomendaciones} />
      </div>
      </div>

      {/* ── Modales ── */}
      <ModalObservacion
        open={modal === "observacion"}
        onClose={() => setModal(null)}
        saving={saving}
        onSave={(entry) => saveSidebar({ ...sidebar, observaciones: [...(sidebar.observaciones || []), entry] })}
      />
      <ModalComportamiento
        open={modal === "comportamiento"}
        onClose={() => setModal(null)}
        saving={saving}
        onSave={(entry) => saveSidebar({ ...sidebar, comportamientos: [...(sidebar.comportamientos || []), entry] })}
      />
      <ModalObjetivo
        open={modal === "objetivo"}
        onClose={() => setModal(null)}
        saving={saving}
        onSave={(entry) => saveSidebar({ ...sidebar, objetivos: [...(sidebar.objetivos || []), entry] })}
      />
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

function formatFechaCorta(s: string) {
  if (!s) return "";
  const [y, m, d] = s.split("-");
  return `${d}/${m}/${y}`;
}

// ─── Componentes de seguimiento ─────────────────────────

function SeguimientoSection({
  title,
  icon: Icon,
  iconColor,
  empty,
  onAdd,
  children,
}: {
  title: string;
  icon: React.ElementType;
  iconColor: string;
  empty: string;
  onAdd: () => void;
  children?: React.ReactNode;
}) {
  const hasChildren = Array.isArray(children) ? children.filter(Boolean).length > 0 : !!children;
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-2xl font-semibold inline-flex items-center gap-2">
          <Icon className={`w-5 h-5 ${iconColor}`} />
          {title}
        </h3>
        <button
          type="button"
          onClick={onAdd}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          + Añadir
        </button>
      </div>
      {hasChildren ? (
        <div className="space-y-2">{children}</div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-3">{empty}</p>
      )}
    </section>
  );
}

function EntryCard({ fecha, text, onDelete }: { fecha: string; text: string; onDelete: () => void }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-sm group relative">
      {fecha && <p className="text-xs text-muted-foreground mb-0.5">{formatFechaCorta(fecha)}</p>}
      <p className="text-foreground line-clamp-2">{text}</p>
      <button
        type="button"
        onClick={onDelete}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── Modales ────────────────────────────────────────────

function ModalShell({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-xl border border-border shadow-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button type="button" onClick={onClose} className="p-1 hover:bg-muted rounded-md"><X className="w-4 h-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalButtons({ saving, onCancel, label = "Guardar" }: { saving: boolean; onCancel: () => void; label?: string }) {
  return (
    <div className="flex justify-end gap-2 mt-5">
      <button type="button" onClick={onCancel} disabled={saving} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted">Cancelar</button>
      <button type="submit" disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-2">
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
        {label}
      </button>
    </div>
  );
}

function ModalObservacion({ open, onClose, saving, onSave }: { open: boolean; onClose: () => void; saving: boolean; onSave: (e: Observacion) => void }) {
  const [form, setForm] = useState({ fecha: todayStr(), texto: "" });
  return (
    <ModalShell open={open} onClose={onClose} title="Observaciones">
      <form onSubmit={(e) => { e.preventDefault(); if (!form.texto.trim()) return; onSave({ id: genId(), ...form }); setForm({ fecha: todayStr(), texto: "" }); }}>
        <div className="space-y-3">
          <div><label className="block text-sm font-medium text-muted-foreground mb-1">Fecha de registro</label><DatePicker value={form.fecha} onChange={(v) => setForm({ ...form, fecha: v })} /></div>
          <div><label className="block text-sm font-medium text-muted-foreground mb-1">Observaciones <span className="text-destructive">*</span></label><textarea rows={5} value={form.texto} onChange={(e) => setForm({ ...form, texto: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none" /></div>
        </div>
        <ModalButtons saving={saving} onCancel={onClose} />
      </form>
    </ModalShell>
  );
}

function ModalComportamiento({ open, onClose, saving, onSave }: { open: boolean; onClose: () => void; saving: boolean; onSave: (e: ComportamientoAlimentario) => void }) {
  const [form, setForm] = useState({ fecha: todayStr(), texto: "" });
  return (
    <ModalShell open={open} onClose={onClose} title="Comportamiento alimentario">
      <form onSubmit={(e) => { e.preventDefault(); if (!form.texto.trim()) return; onSave({ id: genId(), ...form }); setForm({ fecha: todayStr(), texto: "" }); }}>
        <div className="space-y-3">
          <div><label className="block text-sm font-medium text-muted-foreground mb-1">Fecha de registro</label><DatePicker value={form.fecha} onChange={(v) => setForm({ ...form, fecha: v })} /></div>
          <div><label className="block text-sm font-medium text-muted-foreground mb-1">Comportamientos alimentarios <span className="text-destructive">*</span></label><textarea rows={4} value={form.texto} onChange={(e) => setForm({ ...form, texto: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none" /></div>
        </div>
        <ModalButtons saving={saving} onCancel={onClose} />
      </form>
    </ModalShell>
  );
}

function ModalObjetivo({ open, onClose, saving, onSave }: { open: boolean; onClose: () => void; saving: boolean; onSave: (e: Objetivo) => void }) {
  const [form, setForm] = useState({ tipo: "generico" as "generico" | "medicion", descripcion: "", fechaLimite: "", tipoMedicion: "peso", valor: "", unidad: "kg" });
  return (
    <ModalShell open={open} onClose={onClose} title="Define un nuevo objetivo">
      <form onSubmit={(e) => {
        e.preventDefault();
        if (!form.descripcion.trim()) return;
        const entry: Objetivo = {
          id: genId(), tipo: form.tipo, descripcion: form.descripcion, fechaLimite: form.fechaLimite,
          ...(form.tipo === "medicion" && { tipoMedicion: form.tipoMedicion, valor: form.valor ? parseFloat(form.valor) : undefined, unidad: form.unidad }),
        };
        onSave(entry);
        setForm({ tipo: "generico", descripcion: "", fechaLimite: "", tipoMedicion: "peso", valor: "", unidad: "kg" });
      }}>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Tipo de objetivo <span className="text-destructive">*</span></label>
            <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as "generico" | "medicion" })} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {TIPOS_OBJETIVO.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          {form.tipo === "medicion" && (
            <>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">Tipo de medición <span className="text-destructive">*</span></label>
                <select value={form.tipoMedicion} onChange={(e) => setForm({ ...form, tipoMedicion: e.target.value, unidad: UNIDADES_MEDICION[e.target.value] || "" })} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {TIPOS_MEDICION.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-muted-foreground mb-1">Valor <span className="text-destructive">*</span></label><input type="number" inputMode="decimal" step="0.1" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} placeholder="Número" className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
                <div><label className="block text-sm font-medium text-muted-foreground mb-1">Unidad</label><input value={form.unidad} onChange={(e) => setForm({ ...form, unidad: e.target.value })} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
              </div>
            </>
          )}
          <div><label className="block text-sm font-medium text-muted-foreground mb-1">Descripción <span className="text-destructive">*</span></label><input value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="ej: Beber más de 1 litro de agua al día" className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
          <div><label className="block text-sm font-medium text-muted-foreground mb-1">Fecha límite</label><DatePicker value={form.fechaLimite} onChange={(v) => setForm({ ...form, fechaLimite: v })} /></div>
        </div>
        <ModalButtons saving={saving} onCancel={onClose} label="Definir objetivo" />
      </form>
    </ModalShell>
  );
}


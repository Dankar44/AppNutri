"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
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

function useRenderObjetivo() {
  const t = useTranslations("patients.general");
  const tForm = useTranslations("patients.form");
  return (objetivo: string | null, detalle: string | null) => {
    if (detalle?.trim()) return detalle;
    if (!objetivo) return t("noRegistrado");

    const labels: Record<string, string> = {
      PERDER_PESO: tForm("objetivoPerderPeso"),
      GANAR_MASA: tForm("objetivoGanarMasa"),
      MANTENIMIENTO: tForm("objetivoMantenimiento"),
      PATOLOGIA: tForm("objetivoPatologia"),
      DEPORTIVO: tForm("objetivoRendimiento"),
      OTRO: tForm("objetivoOtro"),
    };

    return labels[objetivo] ?? objetivo;
  };
}

function useRenderLista() {
  const t = useTranslations("patients.general");
  return (items: string[] | undefined | null) => {
    return items?.length ? items.join(", ") : t("ningunaRegistrada");
  };
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
  const t = useTranslations("patients.general");
  const tSidebar = useTranslations("patients.sidebar");
  const renderObjetivo = useRenderObjetivo();
  const renderLista = useRenderLista();
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
      toast.error(tSidebar("noSePudoGuardar"));
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
          {t("datosPersonales")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground inline-flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {t("email")}
            </p>
            <p className="font-medium">{paciente.email || t("noRegistrado")}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground inline-flex items-center gap-2">
              <Phone className="w-4 h-4" />
              {t("telefono")}
            </p>
            <p className="font-medium">{paciente.telefono || t("noRegistrado")}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground inline-flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {t("fechaNacimiento")}
            </p>
            <p className="font-medium">
              {paciente.fechaNacimiento ? formatDate(paciente.fechaNacimiento) : t("noRegistrada")}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground inline-flex items-center gap-2">
              <UserRound className="w-4 h-4" />
              {t("sexo")}
            </p>
            <p className="font-medium">{paciente.sexo || t("noRegistrado")}</p>
          </div>
        </div>
      </section>
      <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <h3 className="text-base sm:text-2xl font-semibold mb-4 inline-flex items-center gap-2">
          <Heart className="w-5 h-5 text-rose-500" />
          {t("historialMedico")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground inline-flex items-center gap-2">
              <Heart className="w-4 h-4" />
              {t("alergias")}
            </p>
            <p className="font-medium mt-1">{renderLista(paciente.alergias)}</p>
          </div>
          <div>
            <p className="text-muted-foreground inline-flex items-center gap-2">
              <Stethoscope className="w-4 h-4" />
              {t("intolerancias")}
            </p>
            <p className="font-medium mt-1">{renderLista(paciente.intolerancias)}</p>
          </div>
          <div>
            <p className="text-muted-foreground inline-flex items-center gap-2">
              <Heart className="w-4 h-4" />
              {t("patologias")}
            </p>
            <p className="font-medium mt-1">{renderLista(paciente.patologias)}</p>
          </div>
          <div>
            <p className="text-muted-foreground inline-flex items-center gap-2">
              <Pill className="w-4 h-4" />
              {t("medicamentos")}
            </p>
            <p className="font-medium mt-1">{renderLista(paciente.medicamentos)}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-muted-foreground inline-flex items-center gap-2">
              <Pill className="w-4 h-4" />
              {t("suplementos")}
            </p>
            <p className="font-medium mt-1">{renderLista(paciente.suplementos)}</p>
          </div>
        </div>
      </section>
      <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <h3 className="text-base sm:text-2xl font-semibold mb-2 inline-flex items-center gap-2">
          <Clock3 className="w-5 h-5 text-indigo-500" />
          {t("horarioSemanal")}
        </h3>
        <p className="text-sm text-muted-foreground mb-3">
          {t("horarioCompartidoHint")}
        </p>
        <HorarioSemanal initialEntries={horario} readOnly onSave={async () => {}} />
      </section>
      <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-base sm:text-2xl font-semibold inline-flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-green-600 dark:text-green-400" />
            {t("planesAlimenticios")}
          </h3>
          <Link
            href={`/dietas/nuevo?pacienteId=${paciente.id}`}
            className="inline-flex items-center rounded-full bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {t("nuevoPlan")}
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
            {t("verTodosPlanes", { count: planesOrdenados.length })}
          </Link>
        )}
      </section>
      </div>

      <div className="space-y-5">
      {/* Objetivos unificados: principal + parciales */}
      <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-2xl font-semibold inline-flex items-center gap-2">
            <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
            {t("objetivos")}
          </h3>
          <button
            type="button"
            onClick={() => setModal("objetivo")}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {t("anadirObjetivo")}
          </button>
        </div>

        <div className="mb-3">
          <p className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">{t("objetivoPrincipal")}</p>
          <div className="w-full rounded-lg bg-sidebar-accent px-3 py-2.5 text-sidebar-foreground font-semibold flex items-center justify-center text-center">
            {renderObjetivo(paciente.objetivo, paciente.objetivoDetalle)}
          </div>
        </div>

        {(sidebar.objetivos || []).length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">{t("objetivosParciales")}</p>
            <div className="space-y-2">
              {(sidebar.objetivos || []).map((o) => (
                <EntryCard key={o.id} fecha={o.fechaLimite || ""} text={`${o.descripcion}${o.valor ? ` — ${o.valor} ${o.unidad}` : ""}`} onDelete={() => deleteEntry("objetivos", o.id)} />
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-base sm:text-2xl font-semibold inline-flex items-center gap-2">
          <Ruler className="w-5 h-5 text-blue-500" />
          {t("medidas")}
        </h3>
        <div className="text-sm space-y-2">
          <p className="flex items-center justify-between">
            <span className="text-muted-foreground inline-flex items-center gap-2">
              <Scale className="w-4 h-4" />
              {t("peso")}
            </span>
            <span className="font-medium">{paciente.peso != null ? `${paciente.peso} kg` : "-"}</span>
          </p>
          <p className="flex items-center justify-between">
            <span className="text-muted-foreground inline-flex items-center gap-2">
              <Ruler className="w-4 h-4" />
              {t("altura")}
            </span>
            <span className="font-medium">{paciente.altura != null ? `${paciente.altura} cm` : "-"}</span>
          </p>
        </div>
        <Link
          href={`/pacientes/${paciente.id}?pestana=mediciones`}
          className="inline-flex w-full items-center justify-center rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          {t("verEvolucion")}
        </Link>
      </section>

      {/* Observaciones */}
      <SeguimientoSection
        title={tSidebar("observaciones")}
        icon={FileText}
        iconColor="text-amber-600 dark:text-amber-400"
        empty={tSidebar("sinObservaciones")}
        onAdd={() => setModal("observacion")}
      >
        {(sidebar.observaciones || []).map((o) => (
          <EntryCard key={o.id} fecha={o.fecha} text={o.texto} onDelete={() => deleteEntry("observaciones", o.id)} />
        ))}
      </SeguimientoSection>

      {/* Comportamientos alimentarios */}
      <SeguimientoSection
        title={tSidebar("comportamientosAlimentarios")}
        icon={Brain}
        iconColor="text-indigo-500"
        empty={tSidebar("sinComportamientos")}
        onAdd={() => setModal("comportamiento")}
      >
        {(sidebar.comportamientos || []).map((c) => (
          <EntryCard key={c.id} fecha={c.fecha} text={c.texto} onDelete={() => deleteEntry("comportamientos", c.id)} />
        ))}
      </SeguimientoSection>

      <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <h3 className="text-base sm:text-2xl font-semibold mb-4 inline-flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          {t("seguimientoDiario")}
        </h3>
        <Link
          href={`/pacientes/${paciente.id}/seguimiento`}
          className="inline-flex w-full items-center justify-center rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          {t("verSeguimiento")}
        </Link>
      </section>

      <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <h3 className="text-base sm:text-2xl font-semibold mb-4 inline-flex items-center gap-2">
          <Shield className="w-5 h-5 text-violet-500" />
          {t("portalPaciente")}
        </h3>
        <Link
          href={`/pacientes/${paciente.id}/portal`}
          className="inline-flex w-full items-center justify-center rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          {t("configurarAcceso")}
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
  const t = useTranslations("patients.general");
  const hasChildren = Array.isArray(children) ? children.filter(Boolean).length > 0 : !!children;
  return (
    <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="text-base sm:text-2xl font-semibold inline-flex items-center gap-2">
          <Icon className={`w-5 h-5 shrink-0 ${iconColor}`} />
          {title}
        </h3>
        <button
          type="button"
          onClick={onAdd}
          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
        >
          {t("anadirObjetivo")}
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

function ModalButtons({ saving, onCancel, label }: { saving: boolean; onCancel: () => void; label?: string }) {
  const t = useTranslations("patients.sidebar");
  return (
    <div className="flex justify-end gap-2 mt-5">
      <button type="button" onClick={onCancel} disabled={saving} className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-muted">{t("cancelar")}</button>
      <button type="submit" disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 inline-flex items-center gap-2">
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
        {label ?? t("guardar")}
      </button>
    </div>
  );
}

function ModalObservacion({ open, onClose, saving, onSave }: { open: boolean; onClose: () => void; saving: boolean; onSave: (e: Observacion) => void }) {
  const t = useTranslations("patients.sidebar");
  const [form, setForm] = useState({ fecha: todayStr(), texto: "" });
  return (
    <ModalShell open={open} onClose={onClose} title={t("observaciones")}>
      <form onSubmit={(e) => { e.preventDefault(); if (!form.texto.trim()) return; onSave({ id: genId(), ...form }); setForm({ fecha: todayStr(), texto: "" }); }}>
        <div className="space-y-3">
          <div><label className="block text-sm font-medium text-muted-foreground mb-1">{t("fechaRegistro")}</label><DatePicker value={form.fecha} onChange={(v) => setForm({ ...form, fecha: v })} /></div>
          <div><label className="block text-sm font-medium text-muted-foreground mb-1">{t("observaciones")} <span className="text-destructive">*</span></label><textarea rows={5} value={form.texto} onChange={(e) => setForm({ ...form, texto: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none" /></div>
        </div>
        <ModalButtons saving={saving} onCancel={onClose} />
      </form>
    </ModalShell>
  );
}

function ModalComportamiento({ open, onClose, saving, onSave }: { open: boolean; onClose: () => void; saving: boolean; onSave: (e: ComportamientoAlimentario) => void }) {
  const t = useTranslations("patients.sidebar");
  const [form, setForm] = useState({ fecha: todayStr(), texto: "" });
  return (
    <ModalShell open={open} onClose={onClose} title={t("comportamientosAlimentarios")}>
      <form onSubmit={(e) => { e.preventDefault(); if (!form.texto.trim()) return; onSave({ id: genId(), ...form }); setForm({ fecha: todayStr(), texto: "" }); }}>
        <div className="space-y-3">
          <div><label className="block text-sm font-medium text-muted-foreground mb-1">{t("fechaRegistro")}</label><DatePicker value={form.fecha} onChange={(v) => setForm({ ...form, fecha: v })} /></div>
          <div><label className="block text-sm font-medium text-muted-foreground mb-1">{t("comportamientosAlimentarios")} <span className="text-destructive">*</span></label><textarea rows={4} value={form.texto} onChange={(e) => setForm({ ...form, texto: e.target.value })} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none" /></div>
        </div>
        <ModalButtons saving={saving} onCancel={onClose} />
      </form>
    </ModalShell>
  );
}

function ModalObjetivo({ open, onClose, saving, onSave }: { open: boolean; onClose: () => void; saving: boolean; onSave: (e: Objetivo) => void }) {
  const t = useTranslations("patients.sidebar");
  const [form, setForm] = useState({ tipo: "generico" as "generico" | "medicion", descripcion: "", fechaLimite: "", tipoMedicion: "peso", valor: "", unidad: "kg" });
  return (
    <ModalShell open={open} onClose={onClose} title={t("definirNuevoObjetivo")}>
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
            <label className="block text-sm font-medium text-muted-foreground mb-1">{t("tipoObjetivo")} <span className="text-destructive">*</span></label>
            <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as "generico" | "medicion" })} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {TIPOS_OBJETIVO.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          {form.tipo === "medicion" && (
            <>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">{t("tipoMedicion")} <span className="text-destructive">*</span></label>
                <select value={form.tipoMedicion} onChange={(e) => setForm({ ...form, tipoMedicion: e.target.value, unidad: UNIDADES_MEDICION[e.target.value] || "" })} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {TIPOS_MEDICION.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-muted-foreground mb-1">{t("valor")} <span className="text-destructive">*</span></label><input type="number" inputMode="decimal" step="0.1" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} placeholder={t("introduzcaNumero")} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
                <div><label className="block text-sm font-medium text-muted-foreground mb-1">{t("unidad")}</label><input value={form.unidad} onChange={(e) => setForm({ ...form, unidad: e.target.value })} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
              </div>
            </>
          )}
          <div><label className="block text-sm font-medium text-muted-foreground mb-1">{t("descripcion")} <span className="text-destructive">*</span></label><input value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder={t("ejemploAgua")} className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></div>
          <div><label className="block text-sm font-medium text-muted-foreground mb-1">{t("fechaLimite")}</label><DatePicker value={form.fechaLimite} onChange={(v) => setForm({ ...form, fechaLimite: v })} /></div>
        </div>
        <ModalButtons saving={saving} onCancel={onClose} label={t("definirObjetivo")} />
      </form>
    </ModalShell>
  );
}


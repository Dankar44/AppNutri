"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X, Plus, AlertTriangle, ChevronDown } from "lucide-react";
import { DatePicker } from "@/components/date-picker";
import { toast } from "sonner";
import type { PacienteFormData } from "@/app/actions/pacientes";
import { TelefonoInput } from "@/components/telefono-input";
import type { Paciente } from "@/generated/prisma/client";
import { useTranslations } from "next-intl";
import { useFormPersist } from "@/lib/form-persist";
import { withTimeout, ActionTimeoutError, isNextNavigation, cn } from "@/lib/utils";
import { useDemoGuard } from "@/contexts/demo-context";

function getObjetivos(t: (key: string) => string) {
  return [
    { value: "PERDER_PESO", label: t("form.objetivoPerderPeso") },
    { value: "GANAR_MASA", label: t("form.objetivoGanarMasa") },
    { value: "MANTENIMIENTO", label: t("form.objetivoMantenimiento") },
    { value: "PATOLOGIA", label: t("form.objetivoPatologia") },
    { value: "DEPORTIVO", label: t("form.objetivoRendimiento") },
    { value: "OTRO", label: t("form.objetivoOtro") },
  ];
}

function getSexos(t: (key: string) => string) {
  return [
    { value: "MASCULINO", label: t("form.sexoMasculino") },
    { value: "FEMENINO", label: t("form.sexoFemenino") },
    { value: "OTRO", label: t("form.sexoOtro") },
  ];
}

interface Props {
  paciente?: Paciente | null;
  action: (data: PacienteFormData) => Promise<{ error: string } | void>;
  submitLabel: string;
}

function TagInput({
  label,
  placeholder,
  tags,
  onChange,
  ariaPrefix,
}: {
  label: string;
  placeholder: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  ariaPrefix: string;
}) {
  const [input, setInput] = useState("");

  function addTag() {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput("");
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder={placeholder}
          maxLength={100}
          className="flex-1 px-4 py-2 rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring transition-shadow text-sm"
        />
        <button
          type="button"
          onClick={addTag}
          aria-label={`${ariaPrefix} ${label.toLowerCase()}`}
          className="px-3 py-2 rounded-lg border border-input hover:bg-muted transition-colors min-h-11 min-w-11 shrink-0 flex items-center justify-center"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
            >
              {tag}
              <button
                type="button"
                onClick={() => onChange(tags.filter((t) => t !== tag))}
                className="hover:text-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function PacienteForm({ paciente, action, submitLabel }: Props) {
  const router = useRouter();
  const t = useTranslations("patients");
  const tc = useTranslations("common.deploy");
  const blockIfDemo = useDemoGuard();
  const [loading, setLoading] = useState(false);
  const OBJETIVOS = getObjetivos(t);
  const SEXOS = getSexos(t);
  // En alta nueva pedimos solo lo esencial; el resto va plegado (lo rellenará el paciente con la anamnesis o el nutri más tarde).
  const esNuevo = !paciente;
  const [showOpcional, setShowOpcional] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const pendingHrefRef = useRef<string | null>(null);
  const [form, setForm] = useState<PacienteFormData>({
    nombre: paciente?.nombre || "",
    apellidos: paciente?.apellidos || "",
    email: paciente?.email || "",
    telefono: paciente?.telefono || "",
    fechaNacimiento: paciente?.fechaNacimiento
      ? new Date(paciente.fechaNacimiento).toISOString().split("T")[0]
      : "",
    sexo: paciente?.sexo || undefined,
    peso: paciente?.peso || undefined,
    altura: paciente?.altura || undefined,
    alergias: paciente?.alergias || [],
    intolerancias: paciente?.intolerancias || [],
    patologias: paciente?.patologias || [],
    medicamentos: paciente?.medicamentos || [],
    suplementos: (paciente as Record<string, unknown>)?.suplementos as string[] || [],
    objetivo: paciente?.objetivo || "MANTENIMIENTO",
    objetivoDetalle: paciente?.objetivoDetalle || "",
    nivelActividad: (paciente as Record<string, unknown>)?.nivelActividad as string || "",
    frecuenciaEjercicio: (paciente as Record<string, unknown>)?.frecuenciaEjercicio as string || "",
    tipoEjercicio: (paciente as Record<string, unknown>)?.tipoEjercicio as string || "",
    horarioTrabajo: (paciente as Record<string, unknown>)?.horarioTrabajo as string || "",
    horarioEjercicio: (paciente as Record<string, unknown>)?.horarioEjercicio as string || "",
    horasDescanso: (paciente as Record<string, unknown>)?.horasDescanso as string || "",
    ocupacion: (paciente as Record<string, unknown>)?.ocupacion as string || "",
    preferencias: paciente?.preferencias || [],
    notas: paciente?.notas || "",
  });

  const { wasRestored, clear: clearDraft } = useFormPersist(
    `paciente-${paciente?.id ?? "nuevo"}`,
    form as unknown as Record<string, unknown>,
    (val) => setForm(val as unknown as PacienteFormData),
  );

  useEffect(() => {
    if (wasRestored) toast.success(tc("datosRestaurados"));
  }, [wasRestored, tc]);

  function update(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // Detección de cambios sin guardar
  const initialFormRef = useRef(JSON.stringify(form));
  const savedRef = useRef(false);
  const isDirty = JSON.stringify(form) !== initialFormRef.current;

  useEffect(() => {
    if (!isDirty || savedRef.current) return;

    // Aviso nativo al cerrar pestaña / refrescar (no personalizable por el navegador)
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);

    // Interceptar clicks en links para navegación client-side
    const handleClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest("a[href]") as HTMLAnchorElement | null;
      if (!link) return;
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("javascript:") || link.target === "_blank") return;
      try {
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin) return;
      } catch { return; }
      e.preventDefault();
      e.stopPropagation();
      pendingHrefRef.current = href;
      setShowUnsavedModal(true);
    };
    document.addEventListener("click", handleClick, true);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", handleClick, true);
    };
  }, [isDirty]);

  function handleConfirmLeave() {
    setShowUnsavedModal(false);
    savedRef.current = true;
    if (pendingHrefRef.current) {
      router.push(pendingHrefRef.current);
    }
    pendingHrefRef.current = null;
  }

  function handleCancelLeave() {
    setShowUnsavedModal(false);
    pendingHrefRef.current = null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (blockIfDemo()) return;
    if (!form.nombre.trim() || !form.apellidos.trim()) {
      toast.error(t("form.nombreApellidosObligatorios"));
      return;
    }
    if (form.email && form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error(t("form.emailInvalido"));
      return;
    }
    if (!form.fechaNacimiento) {
      toast.error(t("form.fechaNacimientoObligatoria"));
      return;
    }
    setLoading(true);
    savedRef.current = true;
    clearDraft();
    try {
      const result = await withTimeout(action(form));
      if (result && "error" in result) {
        savedRef.current = false;
        toast.error(result.error);
        setLoading(false);
        return;
      }
    } catch (error) {
      if (isNextNavigation(error)) throw error;
      savedRef.current = false;
      const msg = error instanceof ActionTimeoutError
        ? t("form.errorTimeout")
        : (error instanceof Error ? error.message : t("form.errorGuardarPaciente"));
      toast.error(msg);
      setLoading(false);
    }
  }

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
      {/* Datos personales */}
      <section className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">{t("form.datosPersonales")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              {t("form.nombre")} <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => update("nombre", e.target.value)}
              required
              maxLength={100}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              {t("form.apellidos")} <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={form.apellidos}
              onChange={(e) => update("apellidos", e.target.value)}
              required
              maxLength={100}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              {t("form.email")}
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              maxLength={200}
              placeholder={t("form.opcional")}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t("form.emailHint")}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              {t("form.telefono")}
            </label>
            <TelefonoInput
              value={form.telefono || ""}
              onChange={(v) => update("telefono", v)}
              inputClassName="w-full px-4 py-2.5 rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              {t("form.fechaNacimiento")} <span className="text-destructive">*</span>
            </label>
            <DatePicker
              value={form.fechaNacimiento ?? ""}
              onChange={(v) => update("fechaNacimiento", v)}
              required
              pastOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("form.sexo")}</label>
            <select
              value={form.sexo || ""}
              onChange={(e) => update("sexo", e.target.value || undefined)}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            >
              <option value="">{t("form.seleccionar")}</option>
              {SEXOS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Resto de datos: en alta nueva van plegados (los rellena el paciente con la anamnesis o el nutri más tarde); en edición se muestran siempre */}
      {esNuevo && (
        <button
          type="button"
          onClick={() => setShowOpcional((v) => !v)}
          aria-expanded={showOpcional}
          className="w-full flex items-center justify-between gap-3 bg-card rounded-xl border border-border p-6 text-left hover:border-primary/40 transition-colors"
        >
          <div>
            <h2 className="text-lg font-semibold">{t("form.masDatosOpcional")}</h2>
            <p className="text-sm text-muted-foreground mt-1">{t("form.masDatosHint")}</p>
          </div>
          <ChevronDown
            className={cn(
              "w-5 h-5 shrink-0 text-muted-foreground transition-transform",
              showOpcional && "rotate-180",
            )}
          />
        </button>
      )}

      {(!esNuevo || showOpcional) && (
        <>
      {/* Medidas */}
      <section className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">{t("form.medidasCorporales")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              {t("form.pesoKg")}
            </label>
            <input
              type="number" inputMode="decimal"
              step="0.1"
              min="1"
              max="500"
              value={form.peso || ""}
              onChange={(e) =>
                update("peso", e.target.value ? parseFloat(e.target.value) : undefined)
              }
              placeholder={t("form.pesoPlaceholder")}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              {t("form.alturaCm")}
            </label>
            <input
              type="number" inputMode="decimal"
              step="0.1"
              min="30"
              max="300"
              value={form.altura || ""}
              onChange={(e) =>
                update(
                  "altura",
                  e.target.value ? parseFloat(e.target.value) : undefined
                )
              }
              placeholder={t("form.alturaPlaceholder")}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            />
          </div>
        </div>
        {form.peso && form.altura && (
          <div className="mt-4 p-3 rounded-lg bg-muted">
            <p className="text-sm">
              <span className="font-medium">{t("form.imcCalculado")} </span>
              {(
                form.peso /
                ((form.altura / 100) * (form.altura / 100))
              ).toFixed(1)}
            </p>
          </div>
        )}
      </section>

      {/* Objetivo */}
      <section className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">{t("form.objetivoNutricional")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              {t("form.objetivoPrincipal")}
            </label>
            <select
              value={form.objetivo}
              onChange={(e) => update("objetivo", e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            >
              {OBJETIVOS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              {t("form.detalleObjetivo")}
            </label>
            <input
              type="text"
              value={form.objetivoDetalle}
              onChange={(e) => update("objetivoDetalle", e.target.value)}
              placeholder={t("form.detalleObjetivoPlaceholder")}
              maxLength={200}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            />
          </div>
        </div>
      </section>

      {/* Historial médico */}
      <section className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">{t("form.historialMedico")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TagInput
            label={t("form.alergias")}
            placeholder={t("form.alergiasPlaceholder")}
            tags={form.alergias}
            onChange={(tags) => update("alergias", tags)}
            ariaPrefix={t("form.anadir")}
          />
          <TagInput
            label={t("form.intolerancias")}
            placeholder={t("form.intoleranciasPlaceholder")}
            tags={form.intolerancias}
            onChange={(tags) => update("intolerancias", tags)}
            ariaPrefix={t("form.anadir")}
          />
          <TagInput
            label={t("form.patologias")}
            placeholder={t("form.patologiasPlaceholder")}
            tags={form.patologias}
            onChange={(tags) => update("patologias", tags)}
            ariaPrefix={t("form.anadir")}
          />
          <TagInput
            label={t("form.medicamentos")}
            placeholder={t("form.medicamentosPlaceholder")}
            tags={form.medicamentos}
            onChange={(tags) => update("medicamentos", tags)}
            ariaPrefix={t("form.anadir")}
          />
          <TagInput
            label={t("form.suplementos")}
            placeholder={t("form.suplementosPlaceholder")}
            tags={form.suplementos}
            onChange={(tags) => update("suplementos", tags)}
            ariaPrefix={t("form.anadir")}
          />
        </div>
      </section>

      {/* Actividad física y estilo de vida */}
      <section className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">{t("form.actividadFisica")}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("form.ocupacion")}</label>
            <input
              type="text"
              value={form.ocupacion}
              onChange={(e) => update("ocupacion", e.target.value)}
              placeholder={t("form.ocupacionPlaceholder")}
              maxLength={200}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("form.nivelActividad")}</label>
            <select
              value={form.nivelActividad}
              onChange={(e) => update("nivelActividad", e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            >
              <option value="">{t("form.seleccionar")}</option>
              <option value="SEDENTARIO">{t("form.actividadSedentarioDesc")}</option>
              <option value="LIGERO">{t("form.actividadLigeroDesc")}</option>
              <option value="MODERADO">{t("form.actividadModeradoDesc")}</option>
              <option value="ACTIVO">{t("form.actividadActivoDesc")}</option>
              <option value="MUY_ACTIVO">{t("form.actividadMuyActivoDesc")}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("form.frecuenciaEjercicio")}</label>
            <input
              type="text"
              value={form.frecuenciaEjercicio}
              onChange={(e) => update("frecuenciaEjercicio", e.target.value)}
              placeholder={t("form.frecuenciaEjercicioPlaceholder")}
              maxLength={100}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("form.tipoEjercicio")}</label>
            <input
              type="text"
              value={form.tipoEjercicio}
              onChange={(e) => update("tipoEjercicio", e.target.value)}
              placeholder={t("form.tipoEjercicioPlaceholder")}
              maxLength={200}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("form.horarioTrabajo")}</label>
            <input
              type="text"
              value={form.horarioTrabajo}
              onChange={(e) => update("horarioTrabajo", e.target.value)}
              placeholder={t("form.horarioTrabajoPlaceholder")}
              maxLength={100}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("form.horarioEjercicio")}</label>
            <input
              type="text"
              value={form.horarioEjercicio}
              onChange={(e) => update("horarioEjercicio", e.target.value)}
              placeholder={t("form.horarioEjercicioPlaceholder")}
              maxLength={100}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">{t("form.horasDescanso")}</label>
            <input
              type="text"
              value={form.horasDescanso}
              onChange={(e) => update("horasDescanso", e.target.value)}
              placeholder={t("form.horasDescansoPlaceholder")}
              maxLength={100}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            />
          </div>
        </div>
      </section>

      {/* Preferencias */}
      <section className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">{t("form.preferenciasAlimentarias")}</h2>
        <TagInput
          label={t("form.preferencias")}
          placeholder={t("form.preferenciasPlaceholder")}
          tags={form.preferencias}
          onChange={(tags) => update("preferencias", tags)}
          ariaPrefix={t("form.anadir")}
        />
      </section>

      {/* Notas */}
      <section className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">{t("form.notasAdicionales")}</h2>
        <textarea
          value={form.notas}
          onChange={(e) => update("notas", e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder={t("form.notasPlaceholder")}
          className="w-full px-4 py-2.5 rounded-lg border border-input bg-card focus:outline-none focus:ring-2 focus:ring-ring transition-shadow resize-none"
        />
      </section>
        </>
      )}

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? t("form.guardando") : submitLabel}
        </button>
      </div>
    </form>

    {showUnsavedModal && (
      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-0 sm:px-4"
        onClick={handleCancelLeave}
      >
        <div
          className="bg-card rounded-t-2xl sm:rounded-2xl border border-border shadow-2xl w-full sm:max-w-md p-5 sm:p-6 pb-safe sm:pb-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold">{t("form.cambiosSinGuardar")}</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-5 sm:mb-6 sm:pl-[52px]">
            {t("form.cambiosSinGuardarDescripcionLarga")}
          </p>
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleCancelLeave}
              className="px-4 py-3 sm:py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors min-h-11 sm:min-h-0"
            >
              {t("form.seguirEditando")}
            </button>
            <button
              type="button"
              onClick={handleConfirmLeave}
              className="px-4 py-3 sm:py-2.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors min-h-11 sm:min-h-0"
            >
              {t("form.salirSinGuardar")}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

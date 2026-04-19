"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X, Plus, AlertTriangle } from "lucide-react";
import { DatePicker } from "@/components/date-picker";
import { toast } from "sonner";
import type { PacienteFormData } from "@/app/actions/pacientes";
import type { Paciente } from "@/generated/prisma/client";

const OBJETIVOS = [
  { value: "PERDER_PESO", label: "Perder peso" },
  { value: "GANAR_MASA", label: "Ganar masa muscular" },
  { value: "MANTENIMIENTO", label: "Mantenimiento" },
  { value: "PATOLOGIA", label: "Patología" },
  { value: "DEPORTIVO", label: "Rendimiento deportivo" },
  { value: "OTRO", label: "Otro" },
];

const SEXOS = [
  { value: "MASCULINO", label: "Masculino" },
  { value: "FEMENINO", label: "Femenino" },
  { value: "OTRO", label: "Otro" },
];

interface Props {
  paciente?: Paciente | null;
  action: (data: PacienteFormData) => Promise<void>;
  submitLabel: string;
}

function TagInput({
  label,
  placeholder,
  tags,
  onChange,
}: {
  label: string;
  placeholder: string;
  tags: string[];
  onChange: (tags: string[]) => void;
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
          className="flex-1 px-4 py-2 rounded-lg border border-input bg-white focus:outline-none focus:ring-2 focus:ring-ring transition-shadow text-sm"
        />
        <button
          type="button"
          onClick={addTag}
          aria-label={`Añadir ${label.toLowerCase()}`}
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
  const [loading, setLoading] = useState(false);
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
    if (!form.nombre.trim() || !form.apellidos.trim()) {
      toast.error("Nombre y apellidos son obligatorios.");
      return;
    }
    if (!form.email || !form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("El email es obligatorio y debe ser válido.");
      return;
    }
    if (!form.fechaNacimiento) {
      toast.error("La fecha de nacimiento es obligatoria.");
      return;
    }
    setLoading(true);
    savedRef.current = true;
    try {
      await action(form);
    } catch (error) {
      // redirect() de Next.js lanza un error con digest "NEXT_REDIRECT" - no es un error real
      if (error && typeof error === "object" && "digest" in error) {
        throw error;
      }
      savedRef.current = false;
      const msg = error instanceof Error ? error.message : "Error al guardar el paciente.";
      toast.error(msg);
      setLoading(false);
    }
  }

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
      {/* Datos personales */}
      <section className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Datos personales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Nombre <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => update("nombre", e.target.value)}
              required
              maxLength={100}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-white focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Apellidos <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={form.apellidos}
              onChange={(e) => update("apellidos", e.target.value)}
              required
              maxLength={100}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-white focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Email <span className="text-destructive">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              required
              maxLength={200}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-white focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Necesario para el acceso al portal del paciente
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Teléfono
            </label>
            <input
              type="tel"
              value={form.telefono}
              onChange={(e) => update("telefono", e.target.value)}
              maxLength={20}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-white focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Fecha de nacimiento <span className="text-destructive">*</span>
            </label>
            <DatePicker
              value={form.fechaNacimiento ?? ""}
              onChange={(v) => update("fechaNacimiento", v)}
              required
              pastOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Sexo</label>
            <select
              value={form.sexo || ""}
              onChange={(e) => update("sexo", e.target.value || undefined)}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-white focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            >
              <option value="">Seleccionar...</option>
              {SEXOS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Medidas */}
      <section className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Medidas corporales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Peso (kg)
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
              placeholder="Ej: 70.5"
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-white focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Altura (cm)
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
              placeholder="Ej: 170"
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-white focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            />
          </div>
        </div>
        {form.peso && form.altura && (
          <div className="mt-4 p-3 rounded-lg bg-muted">
            <p className="text-sm">
              <span className="font-medium">IMC calculado: </span>
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
        <h2 className="text-lg font-semibold mb-4">Objetivo nutricional</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Objetivo principal
            </label>
            <select
              value={form.objetivo}
              onChange={(e) => update("objetivo", e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-white focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
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
              Detalle del objetivo
            </label>
            <input
              type="text"
              value={form.objetivoDetalle}
              onChange={(e) => update("objetivoDetalle", e.target.value)}
              placeholder="Ej: Bajar 5kg en 3 meses"
              maxLength={200}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-white focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            />
          </div>
        </div>
      </section>

      {/* Historial médico */}
      <section className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Historial médico</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TagInput
            label="Alergias alimentarias"
            placeholder="Ej: Cacahuetes"
            tags={form.alergias}
            onChange={(tags) => update("alergias", tags)}
          />
          <TagInput
            label="Intolerancias"
            placeholder="Ej: Lactosa"
            tags={form.intolerancias}
            onChange={(tags) => update("intolerancias", tags)}
          />
          <TagInput
            label="Patologías"
            placeholder="Ej: Diabetes tipo 2"
            tags={form.patologias}
            onChange={(tags) => update("patologias", tags)}
          />
          <TagInput
            label="Medicamentos"
            placeholder="Ej: Metformina"
            tags={form.medicamentos}
            onChange={(tags) => update("medicamentos", tags)}
          />
          <TagInput
            label="Suplementos"
            placeholder="Ej: Proteína whey, Creatina, Vitamina D..."
            tags={form.suplementos}
            onChange={(tags) => update("suplementos", tags)}
          />
        </div>
      </section>

      {/* Actividad física y estilo de vida */}
      <section className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Actividad física y estilo de vida</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Ocupación</label>
            <input
              type="text"
              value={form.ocupacion}
              onChange={(e) => update("ocupacion", e.target.value)}
              placeholder="Ej: Oficinista, Profesor, Camarero..."
              maxLength={200}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-white focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Nivel de actividad</label>
            <select
              value={form.nivelActividad}
              onChange={(e) => update("nivelActividad", e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-white focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            >
              <option value="">Seleccionar...</option>
              <option value="SEDENTARIO">Sedentario (poco o nada de ejercicio)</option>
              <option value="LIGERO">Ligero (1-2 días/semana)</option>
              <option value="MODERADO">Moderado (3-4 días/semana)</option>
              <option value="ACTIVO">Activo (5-6 días/semana)</option>
              <option value="MUY_ACTIVO">Muy activo (ejercicio diario intenso)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Frecuencia de ejercicio</label>
            <input
              type="text"
              value={form.frecuenciaEjercicio}
              onChange={(e) => update("frecuenciaEjercicio", e.target.value)}
              placeholder="Ej: 4 veces por semana, 1h cada sesión"
              maxLength={100}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-white focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Tipo de ejercicio</label>
            <input
              type="text"
              value={form.tipoEjercicio}
              onChange={(e) => update("tipoEjercicio", e.target.value)}
              placeholder="Ej: Musculación, Cardio, CrossFit, Natación..."
              maxLength={200}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-white focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Horario de trabajo</label>
            <input
              type="text"
              value={form.horarioTrabajo}
              onChange={(e) => update("horarioTrabajo", e.target.value)}
              placeholder="Ej: 9:00 - 18:00, turnos rotativos..."
              maxLength={100}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-white focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Horario de ejercicio</label>
            <input
              type="text"
              value={form.horarioEjercicio}
              onChange={(e) => update("horarioEjercicio", e.target.value)}
              placeholder="Ej: 7:00 - 8:00, después del trabajo..."
              maxLength={100}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-white focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Horas de descanso</label>
            <input
              type="text"
              value={form.horasDescanso}
              onChange={(e) => update("horasDescanso", e.target.value)}
              placeholder="Ej: 7-8 horas, duerme de 23:00 a 7:00"
              maxLength={100}
              className="w-full px-4 py-2.5 rounded-lg border border-input bg-white focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            />
          </div>
        </div>
      </section>

      {/* Preferencias */}
      <section className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Preferencias alimentarias</h2>
        <TagInput
          label="Preferencias"
          placeholder="Ej: Vegetariano, Sin gluten, Mediterránea..."
          tags={form.preferencias}
          onChange={(tags) => update("preferencias", tags)}
        />
      </section>

      {/* Notas */}
      <section className="bg-card rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Notas adicionales</h2>
        <textarea
          value={form.notas}
          onChange={(e) => update("notas", e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="Notas, observaciones, comentarios..."
          className="w-full px-4 py-2.5 rounded-lg border border-input bg-white focus:outline-none focus:ring-2 focus:ring-ring transition-shadow resize-none"
        />
      </section>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Guardando..." : submitLabel}
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
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold">Cambios sin guardar</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-5 sm:mb-6 sm:pl-[52px]">
            Has modificado datos del paciente que aún no se han guardado.
            Si sales ahora, perderás los cambios.
          </p>
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleCancelLeave}
              className="px-4 py-3 sm:py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors min-h-11 sm:min-h-0"
            >
              Seguir editando
            </button>
            <button
              type="button"
              onClick={handleConfirmLeave}
              className="px-4 py-3 sm:py-2.5 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors min-h-11 sm:min-h-0"
            >
              Salir sin guardar
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

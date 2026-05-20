"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft, User, Sparkles, Mail, Phone, Calendar, Target,
  Activity, Scale, BookOpen, FileText, Loader2, ChefHat, Apple,
  Layers, Plus,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { intlTag, type Locale } from "@/i18n/config";
import { toast } from "sonner";
import { useUncontrolledFormPersist } from "@/lib/form-persist";
import {
  crearPlan,
  getPacientesParaPlan,
  getPacienteContextoPlan,
  type PlanFormData,
} from "@/app/actions/planes";
import { getPlantillas, crearPlanDesdePlantilla } from "@/app/actions/plantillas";
import { PlantillaSelector } from "@/components/dieta/plantilla-selector";
import { isNextNavigation, withTimeout } from "@/lib/utils";

type Paciente = {
  id: string;
  nombre: string;
  apellidos: string;
  fotoUrl: string | null;
  email: string | null;
  telefono: string | null;
  fechaNacimiento: Date | string | null;
  objetivo: string | null;
  objetivoDetalle: string | null;
  peso: number | null;
  altura: number | null;
};

type Contexto = Awaited<ReturnType<typeof getPacienteContextoPlan>>;

const OBJETIVO_KEYS = [
  "PERDER_PESO", "GANAR_PESO", "MANTENER_PESO", "GANAR_MASA_MUSCULAR",
  "MEJORAR_RENDIMIENTO", "HABITOS_SALUDABLES", "PATOLOGIA", "OTRO",
] as const;

function calcularEdad(fechaNacimiento: Date | string | null): number | null {
  if (!fechaNacimiento) return null;
  const fn = new Date(fechaNacimiento);
  const hoy = new Date();
  let edad = hoy.getFullYear() - fn.getFullYear();
  const m = hoy.getMonth() - fn.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < fn.getDate())) edad--;
  return edad;
}

function getInitials(nombre: string, apellidos: string) {
  return `${nombre[0] || ""}${apellidos[0] || ""}`.toUpperCase();
}

export default function NuevoPlanPage() {
  const t = useTranslations("diets");
  const locale = useLocale() as Locale;
  const tag = intlTag(locale);
  const router = useRouter();
  const searchParams = useSearchParams();
  const plantillaParam = searchParams.get("plantilla") || "";
  const tc = useTranslations("common.deploy");
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { wasRestored, clear: clearDraft } = useUncontrolledFormPersist(
    "plan-nuevo",
    formRef,
  );

  useEffect(() => {
    if (wasRestored) toast.success(tc("datosRestaurados"));
  }, [wasRestored, tc]);

  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [plantillas, setPlantillas] = useState<{ id: string; nombre: string }[]>([]);
  const [plantillaId, setPlantillaId] = useState(plantillaParam);
  const [pacienteId, setPacienteId] = useState(searchParams.get("pacienteId") || "");
  const [contexto, setContexto] = useState<Contexto>(null);
  const [cargandoContexto, setCargandoContexto] = useState(false);

  useEffect(() => {
    getPacientesParaPlan().then((p) => setPacientes(p as unknown as Paciente[]));
    getPlantillas().then(setPlantillas);
  }, []);

  useEffect(() => {
    if (!pacienteId) {
      setContexto(null);
      return;
    }
    setCargandoContexto(true);
    getPacienteContextoPlan(pacienteId)
      .then(setContexto)
      .finally(() => setCargandoContexto(false));
  }, [pacienteId]);

  const pacienteSeleccionado = useMemo(
    () => pacientes.find((p) => p.id === pacienteId) || null,
    [pacientes, pacienteId],
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const pId = form.get("pacienteId") as string;
    const nombre = form.get("nombre") as string;

    try {
      clearDraft();
      if (plantillaId) {
        await withTimeout(crearPlanDesdePlantilla(plantillaId, pId, nombre));
        toast.success(t("nuevo.toastPlanCreatedFromTemplate"));
      } else {
        const data: PlanFormData = {
          nombre,
          pacienteId: pId,
          caloriasObjetivo: parseFloat(form.get("caloriasObjetivo") as string) || undefined,
          proteinasObjetivo: parseFloat(form.get("proteinasObjetivo") as string) || undefined,
          carbohidratosObjetivo: parseFloat(form.get("carbohidratosObjetivo") as string) || undefined,
          grasasObjetivo: parseFloat(form.get("grasasObjetivo") as string) || undefined,
        };
        await withTimeout(crearPlan(data));
        toast.success(t("nuevo.toastPlanCreated"));
      }
    } catch (error) {
      if (isNextNavigation(error)) throw error;
      toast.error(t("nuevo.toastErrorCreating"));
      setLoading(false);
    }
  }

  const edad = pacienteSeleccionado ? calcularEdad(pacienteSeleccionado.fechaNacimiento) : null;
  const objetivoLabel = pacienteSeleccionado?.objetivo
    ? (OBJETIVO_KEYS.includes(pacienteSeleccionado.objetivo as typeof OBJETIVO_KEYS[number])
        ? t(`nuevo.objetivoFormLabels.${pacienteSeleccionado.objetivo}`)
        : pacienteSeleccionado.objetivo)
    : null;

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/dietas"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3 py-2 sm:py-0 -my-2 sm:my-0"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("nuevo.backToPlans")}
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold">{t("nuevo.pageTitle")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("nuevo.subtitle")}
        </p>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_minmax(300px,380px)]">
        {/* COLUMNA IZQUIERDA - FORMULARIO */}
        <div className="space-y-6 min-w-0">
          {/* Selector paciente con preview integrado */}
          <section className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-border bg-gradient-to-br from-primary/5 to-transparent">
              <label className="flex items-center gap-2 text-sm font-semibold mb-3">
                <User className="w-4 h-4 text-primary" />
                {t("nuevo.patientLabel")}
              </label>
              <select
                name="pacienteId"
                required
                value={pacienteId}
                onChange={(e) => setPacienteId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              >
                <option value="">{t("nuevo.selectPatient")}</option>
                {pacientes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} {p.apellidos}
                  </option>
                ))}
              </select>

              {/* Card de paciente seleccionado integrada arriba */}
              {pacienteSeleccionado && (
                <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-card border border-primary/20 shadow-sm">
                  {pacienteSeleccionado.fotoUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={pacienteSeleccionado.fotoUrl}
                      alt={pacienteSeleccionado.nombre}
                      className="w-14 h-14 rounded-full object-cover shrink-0 ring-2 ring-primary/20"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center font-bold text-lg shrink-0 ring-2 ring-primary/20">
                      {getInitials(pacienteSeleccionado.nombre, pacienteSeleccionado.apellidos)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-base truncate">
                      {pacienteSeleccionado.nombre} {pacienteSeleccionado.apellidos}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      {edad !== null && (
                        <span className="text-xs text-muted-foreground">{edad} años</span>
                      )}
                      {objetivoLabel && (
                        <>
                          {edad !== null && <span className="text-muted-foreground">·</span>}
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                            <Target className="w-3 h-3" />
                            {objetivoLabel}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  {contexto && (
                    <div className="hidden sm:flex flex-col items-end gap-0.5 shrink-0 pl-2 border-l border-border">
                      <p className="text-xs text-muted-foreground">{t("nuevo.plans")}</p>
                      <p className="text-xl font-bold text-primary tabular-nums">
                        {contexto.totalPlanes}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-1.5">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  {t("nuevo.planNameLabel")}
                </label>
                <input
                  name="nombre"
                  required
                  maxLength={200}
                  placeholder={t("nuevo.planNamePlaceholder")}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                />
              </div>

              <PlantillaSelector
                plantillas={plantillas}
                value={plantillaId}
                onChange={setPlantillaId}
              />
            </div>
          </section>

          {/* Macros */}
          {!plantillaId && (
            <section className="bg-card rounded-xl border border-border p-4 sm:p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Activity className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h2 className="text-base sm:text-lg font-semibold">{t("nuevo.macroGoals")}</h2>
                  <p className="text-xs text-muted-foreground">
                    {t("nuevo.macroGoalsHint")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1 text-muted-foreground">
                    {t("nuevo.calories")}
                  </label>
                  <input
                    name="caloriasObjetivo"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={20000}
                    placeholder="2000"
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1 text-muted-foreground">
                    {t("nuevo.proteins")}
                  </label>
                  <input
                    name="proteinasObjetivo"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={2000}
                    placeholder="120"
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1 text-muted-foreground">
                    {t("nuevo.carbs")}
                  </label>
                  <input
                    name="carbohidratosObjetivo"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={2000}
                    placeholder="250"
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium mb-1 text-muted-foreground">
                    {t("nuevo.fats")}
                  </label>
                  <input
                    name="grasasObjetivo"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={2000}
                    placeholder="70"
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm tabular-nums"
                  />
                </div>
              </div>

              {contexto?.planActivo?.caloriasObjetivo != null && (
                <div className="rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 p-3 text-xs text-amber-900 dark:text-amber-200">
                  <p className="font-medium mb-0.5">
                    {t("nuevo.activePlanCurrent")} {contexto.planActivo.nombre}
                  </p>
                  <p className="opacity-80">
                    Macros: {contexto.planActivo.caloriasObjetivo} kcal
                    {contexto.planActivo.proteinasObjetivo
                      ? ` · ${contexto.planActivo.proteinasObjetivo}g P`
                      : ""}
                    {contexto.planActivo.carbohidratosObjetivo
                      ? ` · ${contexto.planActivo.carbohidratosObjetivo}g C`
                      : ""}
                    {contexto.planActivo.grasasObjetivo
                      ? ` · ${contexto.planActivo.grasasObjetivo}g G`
                      : ""}
                  </p>
                </div>
              )}
            </section>
          )}

          {/* Botones */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <Link
              href="/dietas"
              className="px-4 py-2.5 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium text-center"
            >
              {t("nuevo.cancel")}
            </Link>
            <button
              type="submit"
              disabled={loading || !pacienteId}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("nuevo.creating")}
                </>
              ) : (
                <>
                  {t("nuevo.createPlan")}
                </>
              )}
            </button>
          </div>
        </div>

        {/* COLUMNA DERECHA - PREVIEW DEL PACIENTE */}
        <aside className="lg:sticky lg:top-4 lg:self-start space-y-4">
          {!pacienteSeleccionado ? (
            <div className="bg-card rounded-xl border border-dashed border-border p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-muted mx-auto flex items-center justify-center mb-3">
                <User className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium mb-1">{t("nuevo.noPatientSelected")}</p>
              <p className="text-xs text-muted-foreground">
                {t("nuevo.selectPatientHintFull")}
              </p>

              <div className="mt-5 pt-5 border-t border-border space-y-2 text-left">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-2">
                  {t("nuevo.tips")}
                </p>
                <div className="flex items-start gap-2 text-xs">
                  <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <p>{t.rich("nuevo.tipTemplateSidebar", { strong: (c) => <strong>{c}</strong> })}</p>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <Target className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <p>{t.rich("nuevo.tipMacrosSidebar", { strong: (c) => <strong>{c}</strong> })}</p>
                </div>
                <div className="flex items-start gap-2 text-xs">
                  <ChefHat className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <p>{t.rich("nuevo.tipRecipesSidebar", { strong: (c) => <strong>{c}</strong> })}</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Card hero del paciente */}
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="h-20 bg-gradient-to-br from-primary/20 via-primary/10 to-emerald-100" />
                <div className="px-4 pb-4 -mt-10">
                  {pacienteSeleccionado.fotoUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={pacienteSeleccionado.fotoUrl}
                      alt={pacienteSeleccionado.nombre}
                      className="w-20 h-20 rounded-full object-cover ring-4 ring-card shadow-sm"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center font-bold text-2xl ring-4 ring-card shadow-sm">
                      {getInitials(pacienteSeleccionado.nombre, pacienteSeleccionado.apellidos)}
                    </div>
                  )}
                  <h3 className="mt-3 font-bold text-lg leading-tight">
                    {pacienteSeleccionado.nombre} {pacienteSeleccionado.apellidos}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                    {edad !== null && <span>{edad} años</span>}
                    {edad !== null && objetivoLabel && <span>·</span>}
                    {objetivoLabel && (
                      <span className="inline-flex items-center gap-1 text-primary font-medium">
                        <Target className="w-3 h-3" />
                        {objetivoLabel}
                      </span>
                    )}
                  </div>
                  {pacienteSeleccionado.objetivoDetalle && (
                    <p className="text-xs text-muted-foreground italic mt-1.5 line-clamp-2">
                      “{pacienteSeleccionado.objetivoDetalle}”
                    </p>
                  )}
                </div>

                {/* Stats compactas */}
                <div className="grid grid-cols-3 border-t border-border divide-x divide-border">
                  <div className="p-3 text-center">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                      {t("nuevo.plans")}
                    </p>
                    <p className="text-lg font-bold tabular-nums mt-0.5">
                      {cargandoContexto ? "—" : contexto?.totalPlanes ?? 0}
                    </p>
                  </div>
                  <div className="p-3 text-center">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                      {t("nuevo.weight")}
                    </p>
                    <p className="text-lg font-bold tabular-nums mt-0.5">
                      {pacienteSeleccionado.peso ? `${pacienteSeleccionado.peso}` : "—"}
                      {pacienteSeleccionado.peso && (
                        <span className="text-[10px] font-normal text-muted-foreground ml-0.5">kg</span>
                      )}
                    </p>
                  </div>
                  <div className="p-3 text-center">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
                      {t("nuevo.height")}
                    </p>
                    <p className="text-lg font-bold tabular-nums mt-0.5">
                      {pacienteSeleccionado.altura ? `${pacienteSeleccionado.altura}` : "—"}
                      {pacienteSeleccionado.altura && (
                        <span className="text-[10px] font-normal text-muted-foreground ml-0.5">cm</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Datos de contacto */}
              {(pacienteSeleccionado.email || pacienteSeleccionado.telefono) && (
                <div className="bg-card rounded-xl border border-border p-4 space-y-2.5">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                    {t("nuevo.contact")}
                  </p>
                  {pacienteSeleccionado.email && (
                    <a
                      href={`mailto:${pacienteSeleccionado.email}`}
                      className="flex items-center gap-2 text-xs hover:text-primary transition-colors min-w-0"
                    >
                      <Mail className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">{pacienteSeleccionado.email}</span>
                    </a>
                  )}
                  {pacienteSeleccionado.telefono && (
                    <a
                      href={`tel:${pacienteSeleccionado.telefono}`}
                      className="flex items-center gap-2 text-xs hover:text-primary transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                      <span>{pacienteSeleccionado.telefono}</span>
                    </a>
                  )}
                </div>
              )}

              {/* Plan activo */}
              {contexto?.planActivo && (
                <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Layers className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    <p className="text-[11px] uppercase tracking-wide text-emerald-900 dark:text-emerald-200 font-bold">
                      {t("nuevo.activePlan")}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200 truncate">
                    {contexto.planActivo.nombre}
                  </p>
                  {contexto.planActivo.caloriasObjetivo && (
                    <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5 tabular-nums">
                      {contexto.planActivo.caloriasObjetivo} kcal/día
                    </p>
                  )}
                  <p className="text-[11px] text-emerald-700/70 mt-2">
                    {t("nuevo.autoDeactivateNote")}
                  </p>
                </div>
              )}

              {/* Última medida */}
              {contexto?.ultimaMedida && (
                <div className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Scale className="w-4 h-4 text-muted-foreground" />
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                      {t("nuevo.lastMeasure")}
                    </p>
                  </div>
                  <div className="flex items-baseline gap-3">
                    {contexto.ultimaMedida.peso != null && (
                      <span className="text-base font-semibold tabular-nums">
                        {contexto.ultimaMedida.peso} kg
                      </span>
                    )}
                    {contexto.ultimaMedida.imc != null && (
                      <span className="text-xs text-muted-foreground tabular-nums">
                        IMC {Number(contexto.ultimaMedida.imc).toFixed(1)}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {new Date(contexto.ultimaMedida.fecha).toLocaleDateString(tag, {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              )}

              {/* Próxima cita */}
              {contexto?.proximaCita && (
                <div className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                      {t("nuevo.nextAppointment")}
                    </p>
                  </div>
                  <p className="text-sm font-medium">
                    {new Date(contexto.proximaCita.fechaHora).toLocaleDateString(tag, {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground tabular-nums mt-0.5">
                    {new Date(contexto.proximaCita.fechaHora).toLocaleTimeString(tag, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {contexto.proximaCita.motivo ? ` · ${contexto.proximaCita.motivo}` : ""}
                  </p>
                </div>
              )}

              {/* Atajos rápidos */}
              <div className="bg-card rounded-xl border border-border p-4">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-2.5">
                  {t("nuevo.shortcuts")}
                </p>
                <div className="space-y-1.5">
                  <Link
                    href={`/pacientes/${pacienteSeleccionado.id}`}
                    className="flex items-center gap-2 text-xs text-foreground hover:text-primary transition-colors"
                  >
                    <User className="w-3.5 h-3.5" />
                    {t("nuevo.viewPatientFile")}
                  </Link>
                  <Link
                    href="/recetas"
                    className="flex items-center gap-2 text-xs text-foreground hover:text-primary transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    {t("nuevo.exploreRecipes")}
                  </Link>
                  <Link
                    href="/alimentos"
                    className="flex items-center gap-2 text-xs text-foreground hover:text-primary transition-colors"
                  >
                    <Apple className="w-3.5 h-3.5" />
                    {t("nuevo.exploreFoods")}
                  </Link>
                </div>
              </div>
            </>
          )}
        </aside>
      </form>
    </div>
  );
}

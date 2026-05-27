"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Mail,
  Phone,
  Target,
  Utensils,
  Scale,
  CalendarCheck,
  CalendarX,
  User,
  Lightbulb,
  Video,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { intlTag, type Locale } from "@/i18n/config";
import { toast } from "sonner";
import { useUncontrolledFormPersist } from "@/lib/form-persist";
import { useDemoGuard } from "@/contexts/demo-context";
import {
  crearCita,
  getPacientesParaCita,
  getPacienteContextoCita,
} from "@/app/actions/citas";
import { AvatarPaciente } from "@/components/avatar-paciente";
import { capitalizarNombre, formatDate, isNextNavigation, withTimeout } from "@/lib/utils";

type PacienteListItem = {
  id: string;
  nombre: string;
  apellidos: string;
  fotoUrl: string | null;
  email: string | null;
  telefono: string | null;
  fechaNacimiento: Date | null;
  objetivo: string | null;
  objetivoDetalle: string | null;
};

type ContextoCita = Awaited<ReturnType<typeof getPacienteContextoCita>>;

const OBJETIVO_KEYS = ["PERDIDA_PESO", "GANANCIA_MUSCULO", "MANTENIMIENTO", "DEPORTIVO", "SALUD_GENERAL", "EMBARAZO", "PATOLOGIA_DIGESTIVA", "OTRO", "PERDER_PESO", "GANAR_MASA", "PATOLOGIA"] as const;

function calcularEdad(fecha: Date | string | null) {
  if (!fecha) return null;
  const f = new Date(fecha);
  const hoy = new Date();
  let edad = hoy.getFullYear() - f.getFullYear();
  const mes = hoy.getMonth() - f.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < f.getDate())) edad--;
  return edad;
}

export default function NuevaCitaPage() {
  const router = useRouter();
  const t = useTranslations("agenda");
  const tag = intlTag(useLocale() as Locale);
  const tc = useTranslations("common.deploy");
  const blockIfDemo = useDemoGuard();
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const { wasRestored, clear: clearDraft } = useUncontrolledFormPersist(
    "cita-nueva",
    formRef,
  );

  useEffect(() => {
    if (wasRestored) toast.success(tc("datosRestaurados"));
  }, [wasRestored, tc]);

  const [pacientes, setPacientes] = useState<PacienteListItem[]>([]);
  const [pacienteId, setPacienteId] = useState("");
  const [contexto, setContexto] = useState<ContextoCita>(null);
  const [contextoLoading, setContextoLoading] = useState(false);

  useEffect(() => {
    getPacientesParaCita().then((data) =>
      setPacientes(data as PacienteListItem[]),
    );
  }, []);

  useEffect(() => {
    if (!pacienteId) {
      setContexto(null);
      return;
    }
    setContextoLoading(true);
    getPacienteContextoCita(pacienteId)
      .then((data) => setContexto(data))
      .finally(() => setContextoLoading(false));
  }, [pacienteId]);

  const pacienteSeleccionado = useMemo(
    () => pacientes.find((p) => p.id === pacienteId) ?? null,
    [pacientes, pacienteId],
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (blockIfDemo()) return;
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const fecha = form.get("fecha") as string;
    const hora = form.get("hora") as string;

    const modo = (form.get("modo") as "directa" | "proponer") || "directa";
    const isOnline = form.get("isOnline") === "on";

    try {
      await withTimeout(crearCita({
        pacienteId: form.get("pacienteId") as string,
        fechaHora: `${fecha}T${hora}:00`,
        duracion: parseInt(form.get("duracion") as string) || 30,
        motivo: (form.get("motivo") as string) || undefined,
        notas: (form.get("notas") as string) || undefined,
        isOnline,
        modo,
      }));
      clearDraft();
      toast.success(
        modo === "proponer"
          ? t("nueva.toastProposed")
          : t("nueva.toastCreatedConfirmed"),
      );
      router.push("/agenda");
    } catch (error) {
      if (isNextNavigation(error)) throw error;
      toast.error(t("nueva.toastCreateError"));
      setLoading(false);
    }
  }

  const edad = calcularEdad(pacienteSeleccionado?.fechaNacimiento ?? null);

  return (
    <div>
      <div className="mb-5 sm:mb-6">
        <Link
          href="/agenda"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3 py-2 sm:py-0 -my-2 sm:my-0"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("nueva.backToAgenda")}
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold">{t("nueva.pageTitle")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("nueva.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(280px,360px)] gap-4 lg:gap-6 items-start">
        {/* Form principal */}
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 min-w-0">
          <section className="bg-card rounded-xl border border-border p-4 sm:p-6 space-y-4">
            <h2 className="text-base sm:text-lg font-semibold inline-flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              {t("nueva.patientAndSchedule")}
            </h2>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t("nueva.patientLabel")}</label>
              <select
                name="pacienteId"
                required
                value={pacienteId}
                onChange={(e) => setPacienteId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              >
                <option value="">{t("nueva.selectPatient")}</option>
                {pacientes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {capitalizarNombre(p.nombre)} {capitalizarNombre(p.apellidos)}
                  </option>
                ))}
              </select>
              {pacientes.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1.5">
                  {t("nueva.noActivePatients")}{" "}
                  <Link href="/pacientes/nuevo" className="text-primary hover:underline">
                    {t("nueva.createPatient")}
                  </Link>
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">{t("nueva.dateLabel")}</label>
                <input
                  name="fecha"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">{t("nueva.timeLabel")}</label>
                <input
                  name="hora"
                  type="time"
                  required
                  defaultValue="10:00"
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t("nueva.durationLabel")}</label>
              <select
                name="duracion"
                defaultValue="30"
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              >
                <option value="15">{t("nueva.duration15")}</option>
                <option value="30">{t("nueva.duration30")}</option>
                <option value="45">{t("nueva.duration45")}</option>
                <option value="60">{t("nueva.duration60")}</option>
                <option value="90">{t("nueva.duration90")}</option>
                <option value="120">{t("nueva.duration120")}</option>
              </select>
            </div>

            <label className="flex items-start gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/40 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors">
              <input type="checkbox" name="isOnline" className="mt-1 accent-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium inline-flex items-center gap-2">
                  <Video className="w-4 h-4 text-primary" />
                  {t("nueva.onlineAppointment")}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("nueva.onlineHintFull")}
                </p>
              </div>
            </label>

            <div>
              <label className="block text-sm font-medium mb-1.5">{t("nueva.howToCreate")}</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="relative flex items-start gap-2 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/40 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors">
                  <input type="radio" name="modo" value="directa" defaultChecked className="mt-1 accent-primary" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{t("nueva.agreedAppointment")}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("nueva.agreedHintFull")}
                    </p>
                  </div>
                </label>
                <label className="relative flex items-start gap-2 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/40 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors">
                  <input type="radio" name="modo" value="proponer" className="mt-1 accent-primary" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{t("nueva.proposeToPatient")}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("nueva.proposeHintFull")}
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </section>

          <section className="bg-card rounded-xl border border-border p-4 sm:p-6 space-y-4">
            <h2 className="text-base sm:text-lg font-semibold inline-flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              {t("nueva.details")}
            </h2>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t("nueva.reasonLabel")}</label>
              <input
                name="motivo"
                maxLength={200}
                placeholder={t("nueva.reasonPlaceholderAlt")}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">{t("nueva.internalNotes")}</label>
              <textarea
                name="notas"
                rows={4}
                maxLength={2000}
                placeholder={t("nueva.notesPlaceholderAlt")}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm resize-y"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {t("nueva.onlyVisibleToYouFull")}
              </p>
            </div>
          </section>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
            <Link
              href="/agenda"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium min-h-11"
            >
              {t("nueva.cancel")}
            </Link>
            <button
              type="submit"
              disabled={loading || !pacienteId}
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50 min-h-11"
            >
              {loading ? t("nueva.creating") : t("nueva.createAppointment")}
            </button>
          </div>
        </form>

        {/* Sidebar derecha: preview paciente o tips */}
        <aside className="lg:sticky lg:top-4 space-y-4">
          {pacienteSeleccionado ? (
            <>
              <section className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-center gap-3 mb-4">
                  <AvatarPaciente
                    nombre={pacienteSeleccionado.nombre}
                    apellidos={pacienteSeleccionado.apellidos}
                    fotoUrl={pacienteSeleccionado.fotoUrl}
                    size="lg"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-base leading-tight truncate">
                      {capitalizarNombre(pacienteSeleccionado.nombre)}{" "}
                      {capitalizarNombre(pacienteSeleccionado.apellidos)}
                    </h3>
                    {edad != null && (
                      <p className="text-xs text-muted-foreground">{t("nueva.yearsOld", { age: edad })}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {pacienteSeleccionado.objetivo && (
                    <div className="inline-flex items-start gap-2 w-full">
                      <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">{t("nueva.goal")}</p>
                        <p className="font-medium text-sm leading-tight">
                          {pacienteSeleccionado.objetivoDetalle ||
                            (OBJETIVO_KEYS.includes(pacienteSeleccionado.objetivo as typeof OBJETIVO_KEYS[number]) ? t(`objetivoLabels.${pacienteSeleccionado.objetivo}`) : pacienteSeleccionado.objetivo)}
                        </p>
                      </div>
                    </div>
                  )}
                  {pacienteSeleccionado.email && (
                    <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{pacienteSeleccionado.email}</span>
                    </div>
                  )}
                  {pacienteSeleccionado.telefono && (
                    <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      <span>{pacienteSeleccionado.telefono}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <Link
                    href={`/pacientes/${pacienteSeleccionado.id}`}
                    className="text-xs text-primary hover:underline"
                  >
                    {t("nueva.viewFullFile")}
                  </Link>
                </div>
              </section>

              {/* Contexto */}
              {contextoLoading ? (
                <section className="bg-card rounded-xl border border-border p-5 text-center text-xs text-muted-foreground">
                  {t("nueva.loadingPatientInfo")}
                </section>
              ) : (
                contexto && (
                  <section className="bg-card rounded-xl border border-border p-5 space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      {t("nueva.context")}
                    </h3>

                    {contexto.proximaCita && (
                      <div className="flex items-start gap-2.5">
                        <CalendarCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground">{t("nueva.nextAppointment")}</p>
                          <p className="text-sm font-medium">
                            {formatDate(contexto.proximaCita.fechaHora)} ·{" "}
                            {new Date(contexto.proximaCita.fechaHora).toLocaleTimeString(tag, {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          {contexto.proximaCita.motivo && (
                            <p className="text-xs text-muted-foreground truncate">
                              {contexto.proximaCita.motivo}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {contexto.ultimaCita && (
                      <div className="flex items-start gap-2.5">
                        <CalendarX className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground">{t("nueva.lastAppointment")}</p>
                          <p className="text-sm font-medium">
                            {formatDate(contexto.ultimaCita.fechaHora)}
                          </p>
                          {contexto.ultimaCita.motivo && (
                            <p className="text-xs text-muted-foreground truncate">
                              {contexto.ultimaCita.motivo}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {contexto.planActivo && (
                      <div className="flex items-start gap-2.5">
                        <Utensils className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground">{t("nueva.currentDiet")}</p>
                          <p className="text-sm font-medium truncate">
                            {contexto.planActivo.nombre}
                          </p>
                          {contexto.planActivo.caloriasObjetivo && (
                            <p className="text-xs text-muted-foreground">
                              {contexto.planActivo.caloriasObjetivo} kcal/día
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {contexto.ultimaMedida && (
                      <div className="flex items-start gap-2.5">
                        <Scale className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground">{t("nueva.lastMeasure")}</p>
                          <p className="text-sm font-medium">
                            {contexto.ultimaMedida.peso != null
                              ? `${contexto.ultimaMedida.peso} kg`
                              : "—"}
                            {contexto.ultimaMedida.imc != null &&
                              ` · IMC ${contexto.ultimaMedida.imc}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(contexto.ultimaMedida.fecha)}
                          </p>
                        </div>
                      </div>
                    )}

                    {!contexto.proximaCita &&
                      !contexto.ultimaCita &&
                      !contexto.planActivo &&
                      !contexto.ultimaMedida && (
                        <p className="text-xs text-muted-foreground italic">
                          {t("nueva.noHistory")}
                        </p>
                      )}
                  </section>
                )
              )}
            </>
          ) : (
            // Sin paciente seleccionado: tips + atajos
            <>
              <section className="bg-card rounded-xl border border-border p-5">
                <h3 className="font-semibold text-base mb-3 inline-flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  {t("nueva.tipsTitle")}
                </h3>
                <ul className="space-y-2.5 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">·</span>
                    <span>
                      <strong className="text-foreground">{t("nueva.tipSelectPatientShort")}</strong> {t("nueva.tipSelectPatientDesc")}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">·</span>
                    <span>
                      {t("nueva.tipDurationPrefix")} <strong className="text-foreground">{t("nueva.tipDurationShort")}</strong> {t("nueva.tipDurationDesc")} <strong className="text-foreground">{t("nueva.tipDurationLong")}</strong> {t("nueva.tipDurationDescEnd")}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">·</span>
                    <span>
                      {t("nueva.tipNotesPrefix")} <strong className="text-foreground">{t("nueva.tipNotesShort")}</strong> {t("nueva.tipNotesDesc")}
                    </span>
                  </li>
                </ul>
              </section>

              <section className="bg-card rounded-xl border border-border p-5">
                <h3 className="font-semibold text-base mb-3 inline-flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  {t("nueva.shortcuts")}
                </h3>
                <div className="space-y-2">
                  <Link
                    href="/agenda/horario"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1.5"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    {t("nueva.configureWorkSchedule")}
                  </Link>
                  <Link
                    href="/agenda"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    {t("nueva.viewFullAgenda")}
                  </Link>
                  <Link
                    href="/pacientes"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1.5"
                  >
                    <User className="w-3.5 h-3.5" />
                    {t("nueva.viewMyPatients")}
                  </Link>
                </div>
              </section>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

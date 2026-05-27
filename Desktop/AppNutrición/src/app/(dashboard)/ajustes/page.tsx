import {
  AlertTriangle,
  ClipboardList,
  CreditCard,
  User,
  Wallet,
  Settings,
  Briefcase,
  Plug,
  Sparkles as SparklesIcon,
  GraduationCap,
  Lock,
  Globe,
  Building2,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { TourSettings } from "@/components/tour/tour-settings";
import { getCurrentDietista, getGoogleIdentityLinked } from "@/app/actions/auth";
import { getSuscripcion } from "@/app/actions/suscripcion";
import { getIntegracionNutri } from "@/app/actions/google-integracion";
import { isDemoEliminado } from "@/app/actions/pacientes";
import { redirect } from "next/navigation";
import { PerfilForm } from "./perfil-form";
import { FotoPerfil } from "./foto-perfil";
import { SuscripcionCard } from "./suscripcion-card";
import { IntegracionesCard } from "./integraciones-card";
import { EliminarCuentaButton } from "./eliminar-cuenta-button";
import { PageHeader } from "@/components/page-header";
import { AjustesNav } from "./ajustes-nav";
import { PacienteDemoCard } from "./paciente-demo-card";
import { GoogleLoginCard } from "./google-login-card";
import { DocumentosPdfSection } from "./documentos-pdf-section";
import { CambiarPasswordForm } from "./cambiar-password-form";
import { CamposAnamnesisForm } from "./campos-anamnesis-form";
import { IdiomaCard } from "./idioma-card";
import { getCamposAnamnesis } from "@/app/actions/perfil";
import { EarlyAdopterBadge } from "@/components/early-adopter-badge";
import { EmpresaSection } from "./empresa-section";
import Link from "next/link";

/** Encabezado común de cada bloque: icono + título + descripción. */
function SectionHeader({
  id,
  icon: Icon,
  title,
  description,
  tone = "default",
}: {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  tone?: "default" | "danger";
}) {
  const colorBg = tone === "danger" ? "bg-red-50 dark:bg-red-500/10" : "bg-primary/10";
  const colorFg = tone === "danger" ? "text-red-600 dark:text-red-400" : "text-primary";
  return (
    <div id={id} className="scroll-mt-6 flex items-start gap-3 mb-4">
      <div className={`w-10 h-10 rounded-xl ${colorBg} flex items-center justify-center shrink-0`}>
        <Icon className={`w-5 h-5 ${colorFg}`} strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <h2 className="text-base sm:text-lg font-semibold leading-tight">{title}</h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  );
}

function googleErrorMessage(reason: string | undefined, t: Awaited<ReturnType<typeof getTranslations<"settings">>>): string {
  switch (reason) {
    case "no_configurado":
      return t("googleErrors.noConfigurado");
    case "state_mismatch":
      return t("googleErrors.stateMismatch");
    case "missing_params":
      return t("googleErrors.missingParams");
    case "no_tokens":
      return t("googleErrors.noTokens");
    case "exchange_failed":
      return t("googleErrors.exchangeFailed");
    case "access_denied":
      return t("googleErrors.accessDenied");
    default:
      return t("googleErrors.default");
  }
}

export default async function AjustesPage({
  searchParams,
}: {
  searchParams: Promise<{ google?: string; reason?: string; backfill?: string }>;
}) {
  const t = await getTranslations("settings");
  const dietista = await getCurrentDietista();
  if (!dietista) redirect("/login");

  const [suscripcion, googleIntegracion, googleLinked, demoEliminado, camposAnamnesis, sp] = await Promise.all([
    getSuscripcion(),
    getIntegracionNutri(),
    getGoogleIdentityLinked(),
    isDemoEliminado(),
    getCamposAnamnesis(),
    searchParams,
  ]);

  const googleFlash =
    sp.google === "ok"
      ? { type: "ok" as const, message: t("googleFlash.ok") }
      : sp.google === "error"
        ? {
            type: "error" as const,
            message: googleErrorMessage(sp.reason, t),
          }
        : null;

  return (
    <div>
      <PageHeader
        icon={Settings}
        title={t("page.title")}
        subtitle={t("page.subtitle")}
      />

      {/* Resumen de la cuenta */}
      <section className="mb-6 rounded-2xl border border-border bg-card p-5 flex items-center gap-4 flex-wrap">
        <FotoPerfil
          nombre={dietista.nombre}
          apellidos={dietista.apellidos}
          fotoUrl={dietista.logoUrl}
        />
        <div className="min-w-0 flex-1">
          <p className="text-lg sm:text-xl font-semibold leading-tight">
            {dietista.nombre} {dietista.apellidos}
          </p>
          <p className="text-sm text-muted-foreground truncate">{dietista.email}</p>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            {dietista.earlyAdopter && <EarlyAdopterBadge size="sm" />}
            {dietista.especialidad && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-medium">
                {dietista.especialidad}
              </span>
            )}
            {suscripcion && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted text-[11px] font-medium text-muted-foreground">
                {t("page.plan", { plan: suscripcion.plan })}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Layout con nav lateral + contenido */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 items-start">
        <AjustesNav />

        <main className="flex-1 min-w-0 space-y-10">
          {/* PERFIL */}
          <section>
            <SectionHeader
              id="perfil"
              icon={User}
              title={t("sections.perfil.title")}
              description={t("sections.perfil.description")}
            />
            <div className="bg-card rounded-xl border border-border p-5 sm:p-6">
              <PerfilForm
                defaultValues={{
                  nombre: dietista.nombre,
                  apellidos: dietista.apellidos,
                  telefono: dietista.telefono || undefined,
                  especialidad: dietista.especialidad || undefined,
                  numColegiado: dietista.numColegiado || undefined,
                  clinica: dietista.clinica || undefined,
                }}
              />
            </div>
          </section>

          {/* EARLY ADOPTER */}
          {dietista.earlyAdopter && (
            <section>
              <div id="founding" className="scroll-mt-6 flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-violet-600 dark:text-violet-400">
                    <path d="M8 13L5 21l3.5-1.5L12 21l3.5-1.5L19 21l-3-8" fill="currentColor" opacity="0.4" />
                    <circle cx="12" cy="9" r="7" fill="currentColor" opacity="0.25" />
                    <circle cx="12" cy="9" r="5.5" fill="currentColor" opacity="0.35" />
                    <path d="M12 5.5l1.09 2.21 2.44.35-1.77 1.72.42 2.43L12 11.15l-2.18 1.06.42-2.43-1.77-1.72 2.44-.35L12 5.5z" fill="currentColor" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-semibold leading-tight">{t("earlyAdopter.title")}</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{t("earlyAdopter.description")}</p>
                </div>
              </div>
              <div className="rounded-xl border border-violet-400/30 dark:border-violet-500/20 bg-gradient-to-br from-violet-50/60 via-purple-50/40 to-violet-50/60 dark:from-violet-500/5 dark:via-purple-500/5 dark:to-violet-500/5 p-5 sm:p-6 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm">
                  <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7 text-white">
                    <path d="M8 13L5 21l3.5-1.5L12 21l3.5-1.5L19 21l-3-8" fill="currentColor" opacity="0.5" />
                    <circle cx="12" cy="9" r="7" fill="currentColor" opacity="0.3" />
                    <circle cx="12" cy="9" r="5.5" fill="currentColor" opacity="0.4" />
                    <path d="M12 5.5l1.09 2.21 2.44.35-1.77 1.72.42 2.43L12 11.15l-2.18 1.06.42-2.43-1.77-1.72 2.44-.35L12 5.5z" fill="currentColor" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <EarlyAdopterBadge size="md" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">{t("earlyAdopter.description")}</p>
                </div>
              </div>
            </section>
          )}

          {/* CONTRASEÑA */}
          <section>
            <SectionHeader
              id="contrasena"
              icon={Lock}
              title={t("sections.contrasena.title")}
              description={t("sections.contrasena.description")}
            />
            <div className="bg-card rounded-xl border border-border p-5 sm:p-6">
              <CambiarPasswordForm />
            </div>
          </section>

          {/* IDIOMA */}
          <section>
            <SectionHeader
              id="idioma"
              icon={Globe}
              title={t("sections.idioma.title")}
              description={t("sections.idioma.description")}
            />
            <div className="bg-card rounded-xl border border-border p-5 sm:p-6">
              <IdiomaCard />
            </div>
          </section>

          {/* PROFESIONAL — mismo form, sub-sección visible por separado */}
          <section>
            <SectionHeader
              id="profesional"
              icon={Briefcase}
              title={t("sections.profesional.title")}
              description={t("sections.profesional.description")}
            />
            <div className="bg-card rounded-xl border border-border p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <InfoItem label={t("profesionalInfo.especialidadLabel")} value={dietista.especialidad || t("profesionalInfo.emptyValue")} />
              <InfoItem label={t("profesionalInfo.numColegiadoLabel")} value={dietista.numColegiado || t("profesionalInfo.emptyValue")} />
              <InfoItem label={t("profesionalInfo.clinicaLabel")} value={dietista.clinica || t("profesionalInfo.emptyValue")} />
            </div>
          </section>

          {/* DOCUMENTOS PDF */}
          <section>
            <SectionHeader
              id="documentos"
              icon={Briefcase}
              title={t("sections.documentos.title")}
              description={t("sections.documentos.description")}
            />
            <div className="bg-card rounded-xl border border-border p-5 sm:p-6">
              <DocumentosPdfSection
                temaPdf={dietista.temaPdf}
                colorPrimarioPdf={dietista.colorPrimarioPdf}
                pdfLogoUrl={dietista.pdfLogoUrl}
                marcaPdf={dietista.marcaPdf}
              />
            </div>
          </section>

          {/* CAMPOS ANAMNESIS */}
          <section>
            <SectionHeader
              id="anamnesis"
              icon={ClipboardList}
              title={t("sections.anamnesis.title")}
              description={t("sections.anamnesis.description")}
            />
            <div className="bg-card rounded-xl border border-border p-5 sm:p-6">
              <CamposAnamnesisForm initialCampos={camposAnamnesis} />
            </div>
          </section>

          {/* EMPRESA / CENTRO */}
          <section>
            <SectionHeader
              id="empresa"
              icon={Building2}
              title={t("sections.empresa.title")}
              description={t("sections.empresa.description")}
            />
            <div className="bg-card rounded-xl border border-border p-5 sm:p-6">
              {dietista.empresaId ? (
                <div className="flex items-center gap-3">
                  <Building2 className="w-8 h-8 text-muted-foreground/40" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground">{t("sections.empresa.tienesCentro")}</p>
                  </div>
                  <Link href="/centro" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shrink-0">
                    {t("sections.empresa.irACentro")}
                  </Link>
                </div>
              ) : (
                <EmpresaSection isDemo={!!dietista.isDemo} />
              )}
            </div>
          </section>

          {/* INTEGRACIONES */}
          <section>
            <SectionHeader
              id="integraciones"
              icon={Plug}
              title={t("sections.integraciones.title")}
              description={t("sections.integraciones.description")}
            />
            <div className="space-y-4">
              <IntegracionesCard integracion={googleIntegracion} flash={googleFlash} />
              <GoogleLoginCard googleLinked={googleLinked} />
            </div>
          </section>

          {/* PACIENTE DEMO */}
          <section>
            <SectionHeader
              id="paciente-demo"
              icon={SparklesIcon}
              title={t("sections.pacienteDemo.title")}
              description={t("sections.pacienteDemo.description")}
            />
            <PacienteDemoCard demoEliminado={demoEliminado} />
          </section>

          {/* SUSCRIPCIÓN */}
          {suscripcion && (
            <section>
              <SectionHeader
                id="suscripcion"
                icon={CreditCard}
                title={t("sections.suscripcion.title")}
                description={t("sections.suscripcion.description")}
              />
              <div className="bg-card rounded-xl border border-border p-5 sm:p-6">
                <SuscripcionCard
                  plan={suscripcion.plan}
                  estado={suscripcion.estado}
                  fechaInicio={new Date(suscripcion.fechaInicio).toISOString()}
                  fechaFin={suscripcion.fechaFin ? new Date(suscripcion.fechaFin).toISOString() : null}
                />
              </div>
            </section>
          )}

          {/* COBROS CON STRIPE */}
          <section>
            <SectionHeader
              id="cobros"
              icon={Wallet}
              title={t("sections.cobros.title")}
              description={t("sections.cobros.description")}
            />
            <div className="bg-card rounded-xl border border-border p-5 sm:p-6">
              <div className="flex items-start gap-3 bg-muted/50 rounded-lg p-4">
                <Wallet className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">{t("sections.cobros.proximamente")}</p>
                  <p>{t("sections.cobros.proximamenteDesc")}</p>
                </div>
              </div>
            </div>
          </section>

          {/* GUÍAS INTERACTIVAS */}
          <section>
            <SectionHeader
              id="guias"
              icon={GraduationCap}
              title={t("sections.guias.title")}
              description={t("sections.guias.description")}
            />
            <TourSettings />
          </section>

          {/* ZONA PELIGROSA */}
          <section>
            <SectionHeader
              id="peligroso"
              icon={AlertTriangle}
              title={t("sections.zonaPeligrosa.title")}
              description={t("sections.zonaPeligrosa.description")}
              tone="danger"
            />
            <div className="rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50/30 dark:bg-red-500/5 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                  {t("eliminarCuenta.titulo")}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("eliminarCuenta.descripcion")}
                </p>
              </div>
              <EliminarCuentaButton />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide font-medium text-muted-foreground">{label}</p>
      <p className="text-sm mt-1 font-medium">{value}</p>
    </div>
  );
}

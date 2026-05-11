import {
  AlertTriangle,
  CreditCard,
  User,
  Wallet,
  Settings,
  Briefcase,
  Plug,
  Sparkles as SparklesIcon,
  GraduationCap,
  Lock,
} from "lucide-react";
import { TourSettings } from "@/components/tour/tour-settings";
import { getCurrentDietista, getGoogleIdentityLinked } from "@/app/actions/auth";
import { getSuscripcion } from "@/app/actions/suscripcion";
import { getStripeAccountStatus } from "@/app/actions/stripe";
import { getIntegracionNutri } from "@/app/actions/google-integracion";
import { isDemoEliminado } from "@/app/actions/pacientes";
import { redirect } from "next/navigation";
import { PerfilForm } from "./perfil-form";
import { FotoPerfil } from "./foto-perfil";
import { SuscripcionCard } from "./suscripcion-card";
import { StripeConnectCard } from "./stripe-connect-card";
import { IntegracionesCard } from "./integraciones-card";
import { EliminarCuentaButton } from "./eliminar-cuenta-button";
import { PageHeader } from "@/components/page-header";
import { AjustesNav } from "./ajustes-nav";
import { PacienteDemoCard } from "./paciente-demo-card";
import { GoogleLoginCard } from "./google-login-card";
import { DocumentosPdfSection } from "./documentos-pdf-section";
import { CambiarPasswordForm } from "./cambiar-password-form";

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

function googleErrorMessage(reason?: string): string {
  switch (reason) {
    case "no_configurado":
      return "Google no está configurado en este entorno.";
    case "state_mismatch":
      return "La conexión con Google se canceló o expiró. Inténtalo de nuevo.";
    case "missing_params":
      return "No se recibió la respuesta de Google. Inténtalo de nuevo.";
    case "no_tokens":
      return "Google no concedió los permisos necesarios. Asegúrate de aceptar todos los permisos.";
    case "exchange_failed":
      return "Error al conectar con Google. Inténtalo de nuevo en unos minutos.";
    case "access_denied":
      return "Se denegó el acceso a Google. Inténtalo de nuevo y acepta los permisos.";
    default:
      return "No se pudo conectar con Google. Inténtalo de nuevo.";
  }
}

export default async function AjustesPage({
  searchParams,
}: {
  searchParams: Promise<{ google?: string; reason?: string; backfill?: string }>;
}) {
  const dietista = await getCurrentDietista();
  if (!dietista) redirect("/login");

  const [suscripcion, stripeStatus, googleIntegracion, googleLinked, demoEliminado, sp] = await Promise.all([
    getSuscripcion(),
    getStripeAccountStatus(),
    getIntegracionNutri(),
    getGoogleIdentityLinked(),
    isDemoEliminado(),
    searchParams,
  ]);

  const googleFlash =
    sp.google === "ok"
      ? { type: "ok" as const, message: "Google Calendar conectado correctamente." }
      : sp.google === "error"
        ? {
            type: "error" as const,
            message: googleErrorMessage(sp.reason),
          }
        : null;

  return (
    <div>
      <PageHeader
        icon={Settings}
        title="Ajustes"
        subtitle="Configura tu perfil, integraciones y preferencias"
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
            {dietista.especialidad && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-medium">
                {dietista.especialidad}
              </span>
            )}
            {suscripcion && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted text-[11px] font-medium text-muted-foreground">
                Plan {suscripcion.plan}
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
              title="Perfil personal"
              description="Datos básicos que se mostrarán en tu cuenta y en comunicaciones con pacientes."
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

          {/* CONTRASEÑA */}
          <section>
            <SectionHeader
              id="contrasena"
              icon={Lock}
              title="Contraseña"
              description="Cambia la contraseña de acceso a tu cuenta."
            />
            <div className="bg-card rounded-xl border border-border p-5 sm:p-6">
              <CambiarPasswordForm />
            </div>
          </section>

          {/* PROFESIONAL — mismo form, sub-sección visible por separado */}
          <section>
            <SectionHeader
              id="profesional"
              icon={Briefcase}
              title="Información profesional"
              description="Número de colegiado, especialidad y clínica (se editan desde la sección de Perfil)."
            />
            <div className="bg-card rounded-xl border border-border p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <InfoItem label="Especialidad" value={dietista.especialidad || "—"} />
              <InfoItem label="Nº colegiado" value={dietista.numColegiado || "—"} />
              <InfoItem label="Clínica" value={dietista.clinica || "—"} />
            </div>
          </section>

          {/* DOCUMENTOS PDF */}
          <section>
            <SectionHeader
              id="documentos"
              icon={Briefcase}
              title="Personalizar documentos"
              description="Elige los colores, logo y nombre de marca de tus entregables PDF."
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

          {/* INTEGRACIONES */}
          <section>
            <SectionHeader
              id="integraciones"
              icon={Plug}
              title="Integraciones"
              description="Conecta servicios externos para automatizar tu día a día."
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
              title="Paciente de ejemplo"
              description="Paciente con datos precargados para probar todas las funciones sin afectar a tus pacientes reales."
            />
            <PacienteDemoCard demoEliminado={demoEliminado} />
          </section>

          {/* SUSCRIPCIÓN */}
          {suscripcion && (
            <section>
              <SectionHeader
                id="suscripcion"
                icon={CreditCard}
                title="Suscripción"
                description="Plan actual, estado y fechas de renovación."
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
              title="Cobros con Stripe"
              description="Conecta tu cuenta de Stripe para cobrar consultas a través de la plataforma."
            />
            <div className="bg-card rounded-xl border border-border p-5 sm:p-6">
              <StripeConnectCard status={stripeStatus} />
            </div>
          </section>

          {/* GUÍAS INTERACTIVAS */}
          <section>
            <SectionHeader
              id="guias"
              icon={GraduationCap}
              title="Guías interactivas"
              description="Tours paso a paso para aprender cada sección de la aplicación."
            />
            <TourSettings />
          </section>

          {/* ZONA PELIGROSA */}
          <section>
            <SectionHeader
              id="peligroso"
              icon={AlertTriangle}
              title="Zona peligrosa"
              description="Acciones irreversibles sobre tu cuenta. Úsalas con precaución."
              tone="danger"
            />
            <div className="rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50/30 dark:bg-red-500/5 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                  Eliminar cuenta
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Todos tus datos (pacientes, consultas, medidas, dietas, mensajes…) se borrarán permanentemente.
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

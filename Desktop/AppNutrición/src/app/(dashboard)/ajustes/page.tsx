import { AlertTriangle, CreditCard, User, Wallet, Settings } from "lucide-react";
import { TourSettings } from "@/components/tour/tour-settings";
import { getCurrentDietista } from "@/app/actions/auth";
import { getSuscripcion } from "@/app/actions/suscripcion";
import { getStripeAccountStatus } from "@/app/actions/stripe";
import { getIntegracionNutri } from "@/app/actions/google-integracion";
import { redirect } from "next/navigation";
import { PerfilForm } from "./perfil-form";
import { FotoPerfil } from "./foto-perfil";
import { SuscripcionCard } from "./suscripcion-card";
import { StripeConnectCard } from "./stripe-connect-card";
import { IntegracionesCard } from "./integraciones-card";
import { EliminarCuentaButton } from "./eliminar-cuenta-button";
import { PageHeader } from "@/components/page-header";

export default async function AjustesPage({
  searchParams,
}: {
  searchParams: Promise<{ google?: string; reason?: string; backfill?: string }>;
}) {
  const dietista = await getCurrentDietista();
  if (!dietista) redirect("/login");

  const [suscripcion, stripeStatus, googleIntegracion, sp] = await Promise.all([
    getSuscripcion(),
    getStripeAccountStatus(),
    getIntegracionNutri(),
    searchParams,
  ]);

  const googleFlash =
    sp.google === "ok"
      ? { type: "ok" as const, message: "Google Calendar conectado correctamente." }
      : sp.google === "error"
        ? { type: "error" as const, message: `No se pudo conectar Google (${sp.reason || "error"}).` }
        : null;

  return (
    <div>
      <PageHeader
        icon={Settings}
        title="Ajustes"
        subtitle="Configura tu perfil y preferencias"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Columna izquierda: Perfil + Zona peligrosa */}
        <div className="space-y-2">
          <section className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Perfil profesional
            </h2>

            <div className="flex flex-col gap-6 mb-6 pb-6 border-b border-border">
              <FotoPerfil
                nombre={dietista.nombre}
                apellidos={dietista.apellidos}
                fotoUrl={dietista.logoUrl}
              />
              <div>
                <p className="font-semibold text-lg">{dietista.nombre} {dietista.apellidos}</p>
                <p className="text-sm text-muted-foreground">{dietista.email}</p>
                {dietista.especialidad && (
                  <p className="text-sm text-muted-foreground mt-1">{dietista.especialidad}</p>
                )}
              </div>
            </div>

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
          </section>

          <section className="bg-card rounded-xl border border-red-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-red-600">Zona peligrosa</h2>
                <p className="text-xs text-muted-foreground">
                  Se borrarán todos tus datos permanentemente.
                </p>
              </div>
            </div>
            <EliminarCuentaButton />
          </section>
        </div>

        {/* Columna derecha: Suscripción + Stripe */}
        <div className="space-y-6">
          {suscripcion && (
            <section className="bg-card rounded-xl border border-border p-5">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Tu suscripción
              </h2>
              <SuscripcionCard
                plan={suscripcion.plan}
                estado={suscripcion.estado}
                fechaInicio={new Date(suscripcion.fechaInicio).toISOString()}
                fechaFin={suscripcion.fechaFin ? new Date(suscripcion.fechaFin).toISOString() : null}
              />
            </section>
          )}

          <section className="bg-card rounded-xl border border-border p-5">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              Cobros con Stripe
            </h2>
            <StripeConnectCard status={stripeStatus} />
          </section>

          <IntegracionesCard integracion={googleIntegracion} flash={googleFlash} />
        </div>
      </div>

      <div className="mt-4">
        <TourSettings />
      </div>
    </div>
  );
}

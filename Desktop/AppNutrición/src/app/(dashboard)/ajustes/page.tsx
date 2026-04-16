import { AlertTriangle, CreditCard, User, Wallet } from "lucide-react";
import { TourSettings } from "@/components/tour/tour-settings";
import { getCurrentDietista } from "@/app/actions/auth";
import { getSuscripcion } from "@/app/actions/suscripcion";
import { getStripeAccountStatus } from "@/app/actions/stripe";
import { redirect } from "next/navigation";
import { PerfilForm } from "./perfil-form";
import { FotoPerfil } from "./foto-perfil";
import { SuscripcionCard } from "./suscripcion-card";
import { StripeConnectCard } from "./stripe-connect-card";
import { EliminarCuentaButton } from "./eliminar-cuenta-button";

export default async function AjustesPage() {
  const dietista = await getCurrentDietista();
  if (!dietista) redirect("/login");

  const [suscripcion, stripeStatus] = await Promise.all([
    getSuscripcion(),
    getStripeAccountStatus(),
  ]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Ajustes</h1>
        <p className="text-muted-foreground mt-1">
          Configura tu perfil y preferencias
        </p>
      </div>

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
        </div>
      </div>

      <div className="mt-4">
        <TourSettings />
      </div>
    </div>
  );
}

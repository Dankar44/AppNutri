import { AlertTriangle, CreditCard, User } from "lucide-react";
import { getCurrentDietista } from "@/app/actions/auth";
import { getSuscripcion } from "@/app/actions/suscripcion";
import { redirect } from "next/navigation";
import { PerfilForm } from "./perfil-form";
import { FotoPerfil } from "./foto-perfil";
import { SuscripcionCard } from "./suscripcion-card";
import { EliminarCuentaButton } from "./eliminar-cuenta-button";

export default async function AjustesPage() {
  const dietista = await getCurrentDietista();
  if (!dietista) redirect("/login");

  const suscripcion = await getSuscripcion();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Ajustes</h1>
        <p className="text-muted-foreground mt-1">
          Configura tu perfil y preferencias
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna izquierda: Perfil */}
        <div className="space-y-6">
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
        </div>

        {/* Columna derecha: Suscripción + Zona peligro */}
        <div className="flex flex-col gap-6">
          {suscripcion && (
            <section className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
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

          <section className="bg-card rounded-xl border border-red-200 p-6 mt-auto">
            <h2 className="text-lg font-semibold mb-2 flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Zona peligrosa
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Al eliminar tu cuenta se borrarán permanentemente todos tus datos: pacientes, dietas, recetas, consultas y medidas.
            </p>
            <EliminarCuentaButton />
          </section>
        </div>
      </div>
    </div>
  );
}

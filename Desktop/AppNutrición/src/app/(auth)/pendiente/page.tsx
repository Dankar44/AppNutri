import { redirect } from "next/navigation";
import { Clock, ShieldCheck, LogOut } from "lucide-react";
import { getCurrentDietista, signOut } from "@/app/actions/auth";

export default async function PendientePage() {
  const dietista = await getCurrentDietista();
  if (!dietista) redirect("/login");
  if (dietista.verificado) redirect("/dashboard");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md text-center">
        <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-6">
          <Clock className="w-10 h-10 text-amber-500" />
        </div>

        <h1 className="text-2xl font-bold mb-2">Cuenta pendiente de verificación</h1>
        <p className="text-muted-foreground mb-6">
          Hemos recibido tu solicitud de registro como dietista profesional.
        </p>

        <div className="bg-card rounded-xl border border-border p-6 mb-6 text-left">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span className="font-semibold">Datos de tu solicitud</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nombre</span>
              <span className="font-medium">{dietista.nombre} {dietista.apellidos}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{dietista.email}</span>
            </div>
            {dietista.numColegiado && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">N.º colegiado</span>
                <span className="font-medium">{dietista.numColegiado}</span>
              </div>
            )}
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-6">
          Nuestro equipo verificará tu número de colegiado y activará tu cuenta lo antes posible. Puedes volver a intentar acceder más tarde.
        </p>

        <form action={signOut}>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  );
}

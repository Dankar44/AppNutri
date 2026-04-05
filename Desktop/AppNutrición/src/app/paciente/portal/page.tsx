import { redirect } from "next/navigation";
import Link from "next/link";
import { UtensilsCrossed, BookOpen, TrendingUp, ShoppingCart, ClipboardCheck } from "lucide-react";
import { getCurrentPaciente } from "@/lib/patient-auth";
import { prisma } from "@/lib/prisma";
import { capitalizarNombre } from "@/lib/utils";

export default async function PatientPortalPage() {
  const session = await getCurrentPaciente();
  if (!session) redirect("/paciente/login");

  const paciente = await prisma.paciente.findUnique({
    where: { id: session.pacienteId },
    select: {
      nombre: true,
      apellidos: true,
      dietista: {
        select: { nombre: true, apellidos: true, especialidad: true, logoUrl: true },
      },
    },
  });

  const planActivo = await prisma.planAlimenticio.findFirst({
    where: { pacienteId: session.pacienteId, activo: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, nombre: true },
  });

  const dietista = paciente?.dietista;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl sm:text-2xl font-bold">
          Hola, {capitalizarNombre(paciente?.nombre || "")}
        </h1>
        <p className="text-muted-foreground mt-1">
          Bienvenido a tu portal de nutrición
        </p>
      </div>

      {/* Tu nutricionista */}
      {dietista && (
        <div data-tour="dietista-info" className="bg-card rounded-xl border border-border p-5 mb-6 flex items-center gap-4">
          {dietista.logoUrl ? (
            <img
              src={dietista.logoUrl}
              alt={dietista.nombre}
              className="w-14 h-14 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl shrink-0">
              {dietista.nombre[0]?.toUpperCase()}{dietista.apellidos[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Tu nutricionista</p>
            <p className="font-semibold text-lg">
              {capitalizarNombre(dietista.nombre)} {capitalizarNombre(dietista.apellidos)}
            </p>
            {dietista.especialidad && (
              <p className="text-sm text-muted-foreground">{dietista.especialidad}</p>
            )}
          </div>
        </div>
      )}

      <div data-tour="quick-access" className="grid grid-cols-2 gap-3 sm:gap-4">
        <Link
          href="/paciente/portal/dieta"
          className="bg-card rounded-xl border border-border p-4 sm:p-6 hover:border-primary/30 hover:shadow-sm transition-all"
        >
          <UtensilsCrossed className="w-6 h-6 sm:w-8 sm:h-8 text-primary mb-2 sm:mb-3" />
          <h3 className="font-semibold mb-1">Mi dieta</h3>
          <p className="text-sm text-muted-foreground">
            {planActivo ? `Plan activo: ${planActivo.nombre}` : "No tienes un plan activo"}
          </p>
        </Link>

        <Link
          href="/paciente/portal/diario"
          className="bg-card rounded-xl border border-border p-4 sm:p-6 hover:border-primary/30 hover:shadow-sm transition-all"
        >
          <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mb-2 sm:mb-3" />
          <h3 className="font-semibold mb-1">Mi diario</h3>
          <p className="text-sm text-muted-foreground">Registra lo que comes cada día</p>
        </Link>

        <Link
          href="/paciente/portal/seguimiento"
          className="bg-card rounded-xl border border-border p-4 sm:p-6 hover:border-primary/30 hover:shadow-sm transition-all"
        >
          <ClipboardCheck className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600 mb-2 sm:mb-3" />
          <h3 className="font-semibold mb-1">Mi seguimiento</h3>
          <p className="text-sm text-muted-foreground">Registra comidas, agua y ejercicio</p>
        </Link>

        <Link
          href="/paciente/portal/evolucion"
          className="bg-card rounded-xl border border-border p-4 sm:p-6 hover:border-primary/30 hover:shadow-sm transition-all"
        >
          <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 mb-2 sm:mb-3" />
          <h3 className="font-semibold mb-1">Mi evolución</h3>
          <p className="text-sm text-muted-foreground">Gráficos de peso y medidas</p>
        </Link>

        {planActivo && (
          <Link
            href="/paciente/portal/dieta/lista-compra"
            className="bg-card rounded-xl border border-border p-4 sm:p-6 hover:border-primary/30 hover:shadow-sm transition-all"
          >
            <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600 mb-2 sm:mb-3" />
            <h3 className="font-semibold mb-1">Lista de la compra</h3>
            <p className="text-sm text-muted-foreground">Generada desde tu plan semanal</p>
          </Link>
        )}
      </div>
    </div>
  );
}

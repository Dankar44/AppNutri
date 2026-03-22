import { redirect } from "next/navigation";
import { MessageSquareText } from "lucide-react";
import { getCurrentPaciente } from "@/lib/patient-auth";
import { prisma } from "@/lib/prisma";
import { capitalizarNombre } from "@/lib/utils";

export default async function RecomendacionesPage() {
  const session = await getCurrentPaciente();
  if (!session) redirect("/paciente/login");

  // Obtener recomendaciones y nombre del dietista via raw SQL
  const rows = await prisma.$queryRawUnsafe<{
    recomendaciones: string | null;
    dietistaNombre: string;
    dietistaApellidos: string;
  }[]>(
    `SELECT p.recomendaciones, d.nombre as "dietistaNombre", d.apellidos as "dietistaApellidos"
     FROM pacientes p JOIN dietistas d ON p."dietistaId" = d.id
     WHERE p.id = $1`,
    session.pacienteId
  );

  const data = rows[0];
  const recomendaciones = data?.recomendaciones || "";
  const dietistaNombre = data
    ? `${capitalizarNombre(data.dietistaNombre)} ${capitalizarNombre(data.dietistaApellidos)}`
    : "Tu nutricionista";

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <MessageSquareText className="w-6 h-6 text-teal-500" />
          Recomendaciones
        </h1>
        <p className="text-muted-foreground mt-1">
          Escritas por {dietistaNombre}
        </p>
      </div>

      {recomendaciones ? (
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="prose prose-sm max-w-none whitespace-pre-line text-foreground">
            {recomendaciones}
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <MessageSquareText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium text-lg mb-1">Sin recomendaciones</h3>
          <p className="text-muted-foreground">
            Tu nutricionista aún no ha escrito recomendaciones para ti.
          </p>
        </div>
      )}
    </div>
  );
}

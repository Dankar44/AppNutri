import { redirect } from "next/navigation";
import { FileDown } from "lucide-react";
import { getCurrentPaciente } from "@/lib/patient-auth";
import { prisma } from "@/lib/prisma";
import { capitalizarNombre } from "@/lib/utils";
import { ExportarPDFPaciente } from "./exportar-form";
import { PageHeader } from "@/components/page-header";

export default async function ExportarPDFPage() {
  const session = await getCurrentPaciente();
  if (!session) redirect("/paciente/login");

  const paciente = await prisma.paciente.findUnique({
    where: { id: session.pacienteId },
    select: {
      nombre: true,
      apellidos: true,
      dietista: { select: { nombre: true, apellidos: true } },
    },
  });
  if (!paciente) redirect("/paciente/login");

  // Plan activo con todo el detalle
  const plan = await prisma.planAlimenticio.findFirst({
    where: { pacienteId: session.pacienteId, activo: true },
    orderBy: { createdAt: "desc" },
    include: {
      dias: {
        orderBy: { dia: "asc" },
        include: {
          comidas: {
            orderBy: { orden: "asc" },
            include: {
              alimentos: {
                orderBy: { orden: "asc" },
                include: {
                  alimento: true,
                  receta: { include: { ingredientes: { include: { alimento: { select: { nombre: true } } } } } },
                },
              },
            },
          },
        },
      },
    },
  });

  // Recomendaciones y horario via raw SQL
  let recomendaciones = "";
  let horario: unknown[] = [];
  try {
    const rows = await prisma.$queryRawUnsafe<{ recomendaciones: string | null; horario: unknown }[]>(
      `SELECT recomendaciones, horario FROM pacientes WHERE id = $1`,
      session.pacienteId
    );
    recomendaciones = (rows[0]?.recomendaciones as string) || "";
    horario = (rows[0]?.horario as unknown[]) || [];
  } catch { /* ignore */ }

  const pacienteNombre = `${capitalizarNombre(paciente.nombre)} ${capitalizarNombre(paciente.apellidos)}`;
  const dietistaNombre = paciente.dietista
    ? `${capitalizarNombre(paciente.dietista.nombre)} ${capitalizarNombre(paciente.dietista.apellidos)}`
    : "NutriApp";

  return (
    <div>
      <PageHeader
        icon={FileDown}
        title="Generar PDF"
        subtitle="Elige qué incluir en tu documento personalizado"
      />

      {!plan ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <FileDown className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium text-lg mb-1">Sin plan activo</h3>
          <p className="text-muted-foreground">Necesitas un plan alimenticio para generar el PDF.</p>
        </div>
      ) : (
        <ExportarPDFPaciente
          plan={JSON.parse(JSON.stringify(plan))}
          pacienteNombre={pacienteNombre}
          dietistaNombre={dietistaNombre}
          recomendaciones={recomendaciones}
          horario={JSON.parse(JSON.stringify(horario))}
        />
      )}
    </div>
  );
}

import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPaciente } from "@/app/actions/pacientes";
import { getMedidas } from "@/app/actions/medidas";
import { parsePestanaFicha } from "@/lib/paciente-ficha-pestanas";
import { PacienteFichaClient } from "@/components/paciente/paciente-ficha-client";
import { getPlanesPaciente, getPlanesDetallePaciente } from "@/app/actions/planes";
import { getHorarioPaciente, getRecomendaciones } from "@/app/actions/pacientes";
import { getFichaSidebar } from "@/app/actions/ficha-sidebar";
import { ensurePlanificacionDefecto, getPlanificaciones } from "@/app/actions/planificaciones";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pestana?: string }>;
}

export default async function PacienteDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { pestana: rawPestana } = await searchParams;

  const paciente = await getPaciente(id);
  if (!paciente) notFound();

  const pestana = parsePestanaFicha(rawPestana);
  const serializado = JSON.parse(JSON.stringify(paciente));

  const needsMedidas = ["mediciones", "planificacion", "plan-alimentacion"].includes(pestana);

  // Paralelizar todas las queries secundarias en un solo Promise.all
  const [horario, recomendaciones, planesResumen, sidebarData, medidas, planes, planificaciones] = await Promise.all([
    getHorarioPaciente(id),
    getRecomendaciones(id),
    getPlanesPaciente(id),
    getFichaSidebar(id),
    needsMedidas
      ? getMedidas(id).then((m) => JSON.parse(JSON.stringify(m)))
      : [],
    pestana === "plan-alimentacion"
      ? getPlanesDetallePaciente(id)
      : [],
    pestana === "planificacion"
      ? ensurePlanificacionDefecto(id).then(() => getPlanificaciones(id))
      : [],
  ]);

  return (
    <div>
      <Link
        href="/pacientes"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a pacientes
      </Link>

      <PacienteFichaClient
        paciente={serializado}
        pestana={pestana}
        medidas={medidas}
        planes={planes}
        planificaciones={planificaciones}
        horario={JSON.parse(JSON.stringify(horario))}
        recomendaciones={recomendaciones}
        planesResumen={JSON.parse(JSON.stringify(planesResumen))}
        sidebarData={sidebarData}
      />
    </div>
  );
}

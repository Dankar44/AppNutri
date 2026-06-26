import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getPaciente } from "@/app/actions/pacientes";
import { getMedidas } from "@/app/actions/medidas";
import { parsePestanaFicha } from "@/lib/paciente-ficha-pestanas";
import { PacienteFichaClient } from "@/components/paciente/paciente-ficha-client";
import { getPlanesPaciente, getPlanesDetallePaciente } from "@/app/actions/planes";
import { getHorarioPaciente, getRecomendaciones } from "@/app/actions/pacientes";
import { getFichaSidebar } from "@/app/actions/ficha-sidebar";
import { ensurePlanificacionDefecto, getPlanificaciones } from "@/app/actions/planificaciones";
import { getMapaNotificacionesPacientes } from "@/app/actions/notificaciones";
import { getCamposAnamnesis } from "@/app/actions/perfil";
import { getEstructuraEfectivaPaciente, getPlantillasAnamnesis } from "@/app/actions/plantillas-anamnesis";
import { AutoMarkLeidas } from "./auto-mark-leidas";

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
  const [horario, recomendaciones, planesResumen, sidebarData, medidas, planes, planificaciones, mapaNotifs, camposAnamnesis, estructuraAnamnesis, plantillasAnamnesis] = await Promise.all([
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
    getMapaNotificacionesPacientes(),
    pestana === "informacion" ? getCamposAnamnesis() : Promise.resolve([]),
    pestana === "informacion" ? getEstructuraEfectivaPaciente(id) : Promise.resolve(null),
    pestana === "informacion" ? getPlantillasAnamnesis() : Promise.resolve([]),
  ]);
  const notifsPaciente = mapaNotifs[id] || [];
  const t = await getTranslations("patients");

  return (
    <div>
      <AutoMarkLeidas pacienteId={id} pestana={pestana} />
      <Link
        href="/pacientes"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 py-2 sm:py-0 -my-2 sm:my-0"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("nuevo.volverAPacientes")}
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
        camposAnamnesis={camposAnamnesis}
        estructuraAnamnesis={estructuraAnamnesis}
        plantillasAnamnesis={plantillasAnamnesis}
        notifsPorTipo={notifsPaciente.reduce<Record<string, number>>((acc, n) => {
          acc[n.tipo] = (acc[n.tipo] ?? 0) + 1;
          return acc;
        }, {})}
        notifsDetalle={notifsPaciente.map((n) => ({
          tipo: n.tipo,
          titulo: n.titulo,
          mensaje: n.mensaje,
        }))}
      />
    </div>
  );
}

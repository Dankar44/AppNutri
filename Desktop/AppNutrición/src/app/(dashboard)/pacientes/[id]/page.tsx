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
import { AvisoCaso } from "./aviso-caso";
import { AvisoPlantilla } from "./aviso-plantilla";
import { getCasoDePacientePlantilla, getAsignacionesDeCaso, getClasesParaAsignar } from "@/app/actions/casos";
import { getCasoDelPaciente } from "@/app/actions/aula";
import { cursoTerminado } from "@/lib/docencia";
import { formatDate, formatDateTime } from "@/lib/utils";
import { getLocale } from "@/i18n/locale";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pestana?: string; desde?: string }>;
}

// De dónde se viene a la ficha de la plantilla de un caso: "clase:<id>" cuando se abre desde la
// página de la clase, para que «volver» lleve allí y no al caso. Solo se acepta esa forma exacta.
const DESDE_CLASE = /^clase:([0-9a-f-]{36})$/;

export default async function PacienteDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { pestana: rawPestana, desde } = await searchParams;

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
      : // #78-C: el plan de alimentación también las necesita, para el reparto por comida
        // (aquí solo se leen: no se crea la de por defecto si aún no existe).
        pestana === "plan-alimentacion"
        ? getPlanificaciones(id)
        : [],
    getMapaNotificacionesPacientes(),
    pestana === "informacion" ? getCamposAnamnesis() : Promise.resolve([]),
    pestana === "informacion" ? getEstructuraEfectivaPaciente(id) : Promise.resolve(null),
    pestana === "informacion" ? getPlantillasAnamnesis() : Promise.resolve([]),
  ]);
  const notifsPaciente = mapaNotifs[id] || [];
  const t = await getTranslations("patients");
  const tCasos = await getTranslations("casos");

  // #40 — Si el paciente viene de un caso de clase, el alumno tiene delante lo que le han pedido,
  // hasta cuándo y el botón de entregar. Solo se pregunta si está marcado como de clase.
  const caso = paciente.esDeClase ? await getCasoDelPaciente(id) : null;
  // Y si es la PLANTILLA de un caso del profesor, se le recuerda que lo que rellena aquí es lo que
  // se van a encontrar sus alumnos.
  const plantillaDe = paciente.esCasoDocente ? await getCasoDePacientePlantilla(id) : null;
  const [asignacionesDelCaso, clasesParaAsignar] = plantillaDe
    ? await Promise.all([getAsignacionesDeCaso(plantillaDe.id), getClasesParaAsignar(plantillaDe.id)])
    : [[], []];
  const locale = await getLocale();

  const claseDeOrigen = plantillaDe ? desde?.match(DESDE_CLASE)?.[1] ?? null : null;
  const volver = claseDeOrigen
    ? { href: `/profesor/clases/${claseDeOrigen}`, texto: tCasos("paciente.volverAClase") }
    : plantillaDe
      ? { href: `/profesor/casos/${plantillaDe.id}`, texto: plantillaDe.nombre }
      : { href: "/pacientes", texto: t("nuevo.volverAPacientes") };

  return (
    <div>
      <AutoMarkLeidas pacienteId={id} pestana={pestana} />
      <Link
        href={volver.href}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 py-2 sm:py-0 -my-2 sm:my-0"
      >
        <ArrowLeft className="w-4 h-4" />
        {volver.texto}
      </Link>

      {plantillaDe && (
        <AvisoPlantilla caso={plantillaDe} asignaciones={asignacionesDelCaso} clases={clasesParaAsignar} />
      )}

      {caso && (
        <AvisoCaso
          asignacionId={caso.asignacionId}
          entregaId={caso.entregaId}
          casoNombre={caso.casoNombre}
          consigna={caso.consigna}
          claseNombre={caso.claseNombre}
          estado={caso.estado}
          nota={caso.nota}
          comentario={caso.comentario}
          fechaLimite={caso.fechaLimite ? formatDate(caso.fechaLimite, locale) : null}
          fueraDePlazo={
            (caso.estado === "SIN_EMPEZAR" || caso.estado === "EN_MARCHA") &&
            cursoTerminado(caso.fechaLimite)
          }
          entregadaEl={caso.entregadaAt ? formatDateTime(caso.entregadaAt, locale) : null}
          entregableNombre={caso.entregableNombre}
          entregablePlanNombre={caso.entregablePlanNombre}
          planes={caso.planes}
        />
      )}

      <PacienteFichaClient
        paciente={serializado}
        pestana={pestana}
        casoEntrega={caso ? { asignacionId: caso.asignacionId, estado: caso.estado, planes: caso.planes } : null}
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

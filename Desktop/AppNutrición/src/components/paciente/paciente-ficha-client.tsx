"use client";

import Link from "next/link";
import { Mail, Calendar, Pencil } from "lucide-react";
import type { FichaInformacionData } from "@/lib/ficha-informacion-types";
import { AvatarPaciente } from "@/components/avatar-paciente";
import {
  cn,
  capitalizarNombre,
  calcularEdad,
  formatDate,
} from "@/lib/utils";
import { PacienteFichaInformacionTab } from "./paciente-ficha-informacion-tab";
import {
  PacienteFichaMedicionesTab,
  type MedidaSerializada,
} from "./paciente-ficha-mediciones-tab";
import { PacienteActions } from "@/app/(dashboard)/pacientes/[id]/paciente-actions";
import { FICHA_TABS, type PestanaFicha } from "@/lib/paciente-ficha-pestanas";
import { PlanificacionPorDefectoTab } from "./planificacion-por-defecto-tab";
import type { Planificacion } from "@/app/actions/planificaciones";
import { PlanDeAlimentacionTab } from "./plan-de-alimentacion-tab";
import { PacienteFichaGeneralTab } from "./paciente-ficha-general-tab";
import { SeguimientoTab } from "./seguimiento-tab";
import { RecomendacionesTab } from "./recomendaciones-tab";
import { EntregablesTab } from "./entregables-tab";
import { PortalPacienteTab } from "./portal-paciente-tab";
import type { HorarioEntry } from "@/app/actions/pacientes";
import type { FichaSidebarData } from "@/lib/ficha-sidebar-types";

export type { PestanaFicha };

type PacienteSerializado = {
  id: string;
  nombre: string;
  apellidos: string;
  fotoUrl: string | null;
  email: string | null;
  fechaNacimiento: string | null;
  sexo: string | null;
  telefono: string | null;
  objetivo: string | null;
  activo: boolean;
  peso: number | null;
  altura: number | null;
  objetivoDetalle: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  patologias: string[];
  medicamentos: string[];
  alergias: string[];
  intolerancias: string[];
  suplementos: string[];
  fichaInformacion: unknown;
};

type PlanResumen = {
  id: string;
  nombre: string;
  caloriasObjetivo: number | null;
  createdAt: string;
  activo: boolean;
};

type PlanDetalleItem = {
  id: string;
  cantidad: number;
  unidad: string;
  alimento: {
    id: string;
    nombre: string;
    calorias: number;
    proteinas: number;
    carbohidratos: number;
    grasas: number;
    fibra: number;
  } | null;
  receta: {
    id: string;
    nombre: string;
    calorias: number;
    proteinas: number;
    carbohidratos: number;
    grasas: number;
    fibra: number;
    porciones: number;
  } | null;
};

type PlanDetalleComida = {
  id: string;
  tipo: string;
  descripcion?: string | null;
  alimentos: PlanDetalleItem[];
};

type PlanDetalleDia = {
  id: string;
  dia: string;
  comidas: PlanDetalleComida[];
};

type PlanDetalle = {
  id: string;
  nombre: string;
  caloriasObjetivo: number | null;
  proteinasObjetivo: number | null;
  carbohidratosObjetivo: number | null;
  grasasObjetivo: number | null;
  activo: boolean;
  createdAt: string;
  dias: PlanDetalleDia[];
};

export function PacienteFichaClient({
  paciente,
  pestana,
  medidas = [],
  planes = [],
  planificaciones = [],
  horario = [],
  recomendaciones = "",
  planesResumen = [],
  sidebarData = {},
}: {
  paciente: PacienteSerializado;
  pestana: PestanaFicha;
  medidas?: MedidaSerializada[];
  planes?: PlanDetalle[];
  planificaciones?: Planificacion[];
  horario?: HorarioEntry[];
  recomendaciones?: string;
  planesResumen?: PlanResumen[];
  sidebarData?: FichaSidebarData;
}) {
  const nombre = capitalizarNombre(paciente.nombre);
  const apellidos = capitalizarNombre(paciente.apellidos);
  const edad = paciente.fechaNacimiento
    ? calcularEdad(new Date(paciente.fechaNacimiento))
    : null;

  const ficha = (paciente.fichaInformacion || null) as
    | FichaInformacionData
    | null
    | undefined;

  return (
    <div>
      <div className="mb-5 sm:mb-6 flex flex-col gap-3 lg:gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-border pb-4 sm:pb-6">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <AvatarPaciente
            nombre={nombre}
            apellidos={apellidos}
            fotoUrl={paciente.fotoUrl}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-bold truncate">
                {nombre} {apellidos}
              </h1>
              {paciente.nombre === "Paciente" && paciente.apellidos === "Prueba" && (
                <span
                  title="Paciente de ejemplo precargado. Puedes eliminarlo o modificarlo libremente."
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 text-[10px] sm:text-xs font-medium border border-amber-200 dark:border-amber-500/30 shrink-0"
                >
                  Paciente de ejemplo
                </span>
              )}
            </div>
            {paciente.fechaNacimiento && (
              <span className="lg:hidden inline-flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                {formatDate(paciente.fechaNacimiento)}
                {edad != null && ` (${edad} años)`}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap">
          {paciente.fechaNacimiento && (
            <span className="hidden lg:inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 shrink-0" />
              {formatDate(paciente.fechaNacimiento)}
              {edad != null && ` (${edad} años)`}
            </span>
          )}
          {paciente.email && (
            <a
              href={`mailto:${paciente.email}`}
              className="p-2.5 lg:p-2 rounded-lg border border-border hover:bg-muted transition-colors min-h-11 min-w-11 lg:min-h-0 lg:min-w-0 flex items-center justify-center"
              title={paciente.email}
              aria-label="Enviar email"
            >
              <Mail className="w-4 h-4" />
            </a>
          )}
          <Link
            href={`/pacientes/${paciente.id}/editar`}
            className="p-2.5 lg:p-2 rounded-lg border border-border hover:bg-muted transition-colors min-h-11 min-w-11 lg:min-h-0 lg:min-w-0 flex items-center justify-center"
            title="Editar paciente"
            aria-label="Editar paciente"
          >
            <Pencil className="w-4 h-4" />
          </Link>
          <PacienteActions pacienteId={paciente.id} activo={paciente.activo} />
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto pb-px mb-5 sm:mb-6 -mx-1 px-1 scrollbar-thin touch-scroll-x [scroll-snap-type:x_proximity]">
        {FICHA_TABS.map((t) => (
          <Link
            key={t.id}
            href={`/pacientes/${paciente.id}?pestana=${t.id}`}
            scroll={false}
            className={cn(
              "whitespace-nowrap px-3 py-2.5 sm:py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors [scroll-snap-align:start] min-h-11 sm:min-h-0 flex items-center",
              pestana === t.id
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/60"
            )}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {pestana === "general" && (
        <PacienteFichaGeneralTab
          paciente={{
            id: paciente.id,
            email: paciente.email,
            telefono: paciente.telefono,
            fechaNacimiento: paciente.fechaNacimiento,
            sexo: paciente.sexo,
            peso: paciente.peso,
            altura: paciente.altura,
            objetivo: paciente.objetivo,
            objetivoDetalle: paciente.objetivoDetalle,
            alergias: paciente.alergias,
            intolerancias: paciente.intolerancias,
            patologias: paciente.patologias,
            medicamentos: paciente.medicamentos,
            suplementos: paciente.suplementos,
          }}
          horario={horario}
          recomendaciones={recomendaciones}
          planes={planesResumen}
          sidebarData={sidebarData}
        />
      )}

      {pestana === "informacion" && (
        <PacienteFichaInformacionTab
          pacienteId={paciente.id}
          pacienteEmail={paciente.email}
          initialFicha={ficha}
          resumen={{
            patologias: paciente.patologias,
            medicamentos: paciente.medicamentos,
            alergias: paciente.alergias,
            intolerancias: paciente.intolerancias,
            objetivo: paciente.objetivo,
            objetivoDetalle: paciente.objetivoDetalle,
          }}
        />
      )}

      {pestana === "mediciones" && (
        <PacienteFichaMedicionesTab
          pacienteId={paciente.id}
          medidas={medidas}
          pacientePeso={paciente.peso ?? null}
          pacienteAltura={paciente.altura ?? null}
        />
      )}

      {pestana === "planificacion" && (
        <PlanificacionPorDefectoTab
          paciente={paciente}
          medidas={medidas}
          ficha={ficha}
          planificaciones={planificaciones}
          pacienteId={paciente.id}
        />
      )}

      {pestana === "plan-alimentacion" && (
        <PlanDeAlimentacionTab
          pacienteId={paciente.id}
          pacienteNombre={`${paciente.nombre} ${paciente.apellidos}`}
          planes={planes}
          pacientePeso={paciente.peso}
          pacienteObjetivo={paciente.objetivo}
        />
      )}

      {pestana === "seguimiento" && (
        <SeguimientoTab
          pacienteId={paciente.id}
          pacienteNombre={`${paciente.nombre} ${paciente.apellidos}`}
          pacientePeso={paciente.peso}
        />
      )}

      {pestana === "recomendaciones" && (
        <RecomendacionesTab
          pacienteId={paciente.id}
          pacientePeso={paciente.peso}
        />
      )}

      {pestana === "entregables" && (
        <EntregablesTab
          pacienteId={paciente.id}
          pacienteEmail={paciente.email}
          pacienteNombre={`${paciente.nombre} ${paciente.apellidos}`}
          planActivo={
            planesResumen.find((p) => p.activo)
              ? { id: planesResumen.find((p) => p.activo)!.id, nombre: planesResumen.find((p) => p.activo)!.nombre }
              : null
          }
        />
      )}

      {pestana === "portal-paciente" && (
        <PortalPacienteTab
          pacienteId={paciente.id}
          pacienteEmail={paciente.email}
          esDemo={paciente.nombre === "Paciente" && paciente.apellidos === "Prueba"}
        />
      )}

      {pestana !== "general" &&
        pestana !== "informacion" &&
        pestana !== "mediciones" &&
        pestana !== "planificacion" &&
        pestana !== "plan-alimentacion" &&
        pestana !== "seguimiento" &&
        pestana !== "recomendaciones" &&
        pestana !== "entregables" &&
        pestana !== "portal-paciente" && (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center">
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            La sección <strong className="text-foreground">{FICHA_TABS.find((x) => x.id === pestana)?.label}</strong> la
            construiremos en el siguiente paso. Mientras tanto puedes usar el
            resto de la app desde el menú o{" "}
            <Link
              href={`/pacientes/${paciente.id}/editar`}
              className="text-primary font-medium hover:underline"
            >
              editar datos básicos
            </Link>
            .
          </p>
          <EnlacesRapidos pacienteId={paciente.id} pestana={pestana} />
        </div>
      )}
    </div>
  );
}

function EnlacesRapidos({
  pacienteId,
  pestana,
}: {
  pacienteId: string;
  pestana: PestanaFicha;
}) {
  const links: { href: string; label: string }[] = [];
  if (pestana === "seguimiento")
    links.push({ href: `/pacientes/${pacienteId}/seguimiento`, label: "Seguimiento diario" });
  if (!links.length) return null;

  return (
    <div className="mt-6 flex flex-wrap justify-center gap-2">
      {links.map((l) => (
        <Link
          key={l.href + l.label}
          href={l.href}
          className="text-sm px-3 py-1.5 rounded-lg bg-card border border-border hover:bg-muted"
        >
          {l.label}
        </Link>
      ))}
    </div>
  );
}

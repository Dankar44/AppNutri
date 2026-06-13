"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Calendar, X } from "lucide-react";
import type { FichaInformacionData, CampoPersonalizadoDefinicion } from "@/lib/ficha-informacion-types";
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
import { PacienteActionBar } from "./paciente-action-bar";
import { getFichaTabs, type PestanaFicha } from "@/lib/paciente-ficha-pestanas";
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

const TIPOS_POR_PESTANA: Record<string, string[]> = {
  mediciones: ["PACIENTE_SIN_MEDIDAS"],
  seguimiento: ["DIARIO_NUEVO"],
  general: ["PACIENTE_SIN_CONSULTA"],
  "plan-alimentacion": ["PLAN_ANTIGUO"],
  planificacion: ["PLAN_ANTIGUO"],
};

function notifsPorTipoPestana(
  tabId: string,
  notifsPorTipo: Record<string, number>,
): number {
  const tipos = TIPOS_POR_PESTANA[tabId] || [];
  return tipos.reduce((acc, t) => acc + (notifsPorTipo[t] ?? 0), 0);
}

export type NotifDetalle = { tipo: string; titulo: string; mensaje: string };

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
  esDemo?: boolean;
  ocultarCalorias?: boolean;
  avisarPorEmail?: boolean;
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
  camposAnamnesis = [],
  notifsPorTipo = {},
  notifsDetalle = [],
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
  camposAnamnesis?: CampoPersonalizadoDefinicion[];
  notifsPorTipo?: Record<string, number>;
  notifsDetalle?: NotifDetalle[];
}) {
  const t = useTranslations("patients.ficha");
  const tTabs = useTranslations("patients.fichaTabs");
  const fichaTabs = getFichaTabs(tTabs);
  const router = useRouter();
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
              {paciente.esDemo && (
                <span
                  title={t("pacienteEjemploHint")}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 text-[10px] sm:text-xs font-medium border border-amber-200 dark:border-amber-500/30 shrink-0"
                >
                  {t("pacienteEjemplo")}
                </span>
              )}
            </div>
            {paciente.fechaNacimiento && (
              <span className="lg:hidden inline-flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                {formatDate(paciente.fechaNacimiento)}
                {edad != null && ` (${edad} ${t("edadAnios")})`}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap">
          {paciente.fechaNacimiento && (
            <span className="hidden lg:inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 shrink-0" />
              {formatDate(paciente.fechaNacimiento)}
              {edad != null && ` (${edad} ${t("edadAnios")})`}
            </span>
          )}
          <PacienteActionBar
            pacienteId={paciente.id}
            activo={paciente.activo}
            email={paciente.email}
            esDemo={paciente.esDemo === true}
          />
        </div>
      </div>

      {/* Móvil: dropdown */}
      <div className="sm:hidden mb-5 relative">
        <select
          value={pestana}
          onChange={(e) => router.push(`/pacientes/${paciente.id}?pestana=${e.target.value}`, { scroll: false })}
          className="w-full px-3 py-2.5 rounded-lg border border-border bg-card text-sm font-medium text-foreground appearance-none pr-8"
        >
          {fichaTabs.map((t) => {
            const n = notifsPorTipoPestana(t.id, notifsPorTipo);
            return (
              <option key={t.id} value={t.id}>
                {t.label}{n > 0 ? ` (${n})` : ""}
              </option>
            );
          })}
        </select>
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      </div>

      {/* Desktop: tabs */}
      <nav className="hidden sm:flex gap-1 overflow-x-auto pb-px mb-6 -mx-1 px-1 scrollbar-thin">
        {fichaTabs.map((t) => {
          const notifCount = notifsPorTipoPestana(t.id, notifsPorTipo);
          return (
            <Link
              key={t.id}
              href={`/pacientes/${paciente.id}?pestana=${t.id}`}
              scroll={false}
              className={cn(
                "whitespace-nowrap px-3 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors flex items-center gap-2",
                pestana === t.id
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              {t.label}
              {notifCount > 0 && (
                <span
                  aria-label={`${notifCount} notificación${notifCount === 1 ? "" : "es"} sin leer`}
                  className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-red-500 text-white shrink-0"
                >
                  {notifCount > 9 ? "9+" : notifCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <NotifBannerPestana pestana={pestana} notifsDetalle={notifsDetalle} />

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
          pacienteNombre={`${nombre} ${apellidos}`.trim()}
          pacienteEmail={paciente.email}
          initialFicha={ficha}
          camposAnamnesis={camposAnamnesis}
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
        <>
          <div className="sm:hidden rounded-xl border border-border bg-muted/30 p-6 text-center">
            <p className="text-sm font-medium text-foreground mb-1">{t("seccionDisponibleOrdenador")}</p>
            <p className="text-xs text-muted-foreground">{t("planificacionRequiereTablas")}</p>
          </div>
          <div className="hidden sm:block">
            <PlanificacionPorDefectoTab
              paciente={paciente}
              medidas={medidas}
              ficha={ficha}
              planificaciones={planificaciones}
              pacienteId={paciente.id}
            />
          </div>
        </>
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
          ocultarCalorias={paciente.ocultarCalorias === true}
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
          esDemo={paciente.esDemo === true}
          ocultarCaloriasInicial={paciente.ocultarCalorias === true}
          avisarPorEmailInicial={paciente.avisarPorEmail !== false}
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
            {t("seccionEnConstruccion", { seccion: fichaTabs.find((x) => x.id === pestana)?.label ?? "" })}{" "}
            <Link
              href={`/pacientes/${paciente.id}/editar`}
              className="text-primary font-medium hover:underline"
            >
              {t("editarDatosBasicos")}
            </Link>
            .
          </p>
          <EnlacesRapidos pacienteId={paciente.id} pestana={pestana} />
        </div>
      )}
    </div>
  );
}

function NotifBannerPestana({
  pestana,
  notifsDetalle,
}: {
  pestana: string;
  notifsDetalle: NotifDetalle[];
}) {
  const t = useTranslations("patients.ficha");
  const tipos = TIPOS_POR_PESTANA[pestana] || [];
  const relevantes = notifsDetalle.filter((n) => tipos.includes(n.tipo));

  const [cached, setCached] = useState<NotifDetalle[]>(relevantes);
  const [dismissedTab, setDismissedTab] = useState<string | null>(null);

  // Capturar las notificaciones la primera vez que llegan (antes de que revalidatePath las borre)
  if (relevantes.length > 0 && cached.length === 0) {
    setCached(relevantes);
  }

  const items = cached.length > 0 ? cached : relevantes;
  if (dismissedTab === pestana || items.length === 0) return null;

  return (
    <div className="mb-4 space-y-2">
      {items.map((n, i) => (
        <div
          key={`${n.tipo}-${i}`}
          className="flex items-start gap-3 rounded-lg border border-amber-300 dark:border-amber-500/50 bg-amber-100 dark:bg-amber-500/20 px-4 py-3 text-sm"
        >
          <span className="mt-0.5 text-amber-700 dark:text-amber-400 shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3a9 9 0 100 18 9 9 0 000-18z" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-amber-900 dark:text-amber-200">{n.titulo}</p>
            <p className="text-amber-800 dark:text-amber-300 text-xs mt-0.5">{n.mensaje}</p>
          </div>
          {i === 0 && (
            <button
              onClick={() => setDismissedTab(pestana)}
              className="mt-0.5 p-0.5 rounded hover:bg-amber-200 dark:hover:bg-amber-500/30 text-amber-700 dark:text-amber-400 transition-colors shrink-0"
              aria-label={t("cerrarAviso")}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
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
  const t = useTranslations("patients.ficha");
  const links: { href: string; label: string }[] = [];
  if (pestana === "seguimiento")
    links.push({ href: `/pacientes/${pacienteId}/seguimiento`, label: t("seguimientoDiario") });
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

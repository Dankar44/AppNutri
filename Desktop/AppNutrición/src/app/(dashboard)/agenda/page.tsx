import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { Plus, CalendarDays } from "lucide-react";
import {
  getCitasSemana,
  getCitasMes,
  getCitasDia,
  getProximasCitas,
} from "@/app/actions/citas";
import { getIntegracionNutri } from "@/app/actions/google-integracion";
import { isGoogleConfigured } from "@/lib/google-oauth";
import { prisma } from "@/lib/prisma";
import { AgendaClient } from "./agenda-client";
import { AgendaSidebar } from "./agenda-sidebar";
import { AutoMarkLeidasCita } from "./auto-mark-leidas-cita";
import { PageHeader } from "@/components/page-header";

interface Props {
  searchParams: Promise<{ fecha?: string; vista?: string; cita?: string }>;
}

function formatLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getLunesDeSemana(d: Date): Date {
  const lunes = new Date(d);
  const day = lunes.getDay();
  lunes.setDate(lunes.getDate() - day + (day === 0 ? -6 : 1));
  lunes.setHours(0, 0, 0, 0);
  return lunes;
}

export default async function AgendaPage({ searchParams }: Props) {
  const params = await searchParams;
  const vistaRaw = params.vista;
  const vista =
    vistaRaw === "semana" || vistaRaw === "mes" || vistaRaw === "dia"
      ? vistaRaw
      : "semana"; // por defecto SEMANA

  // Si viene ?cita=xxx (p.ej. desde una notificación), saltar a la semana de esa cita
  // y seleccionar el día para que se abra el detalle con los botones.
  let fecha = params.fecha;
  let diaResaltado: string | undefined;
  if (params.cita) {
    const citaUrl = await prisma.cita.findUnique({
      where: { id: params.cita },
      select: { fechaHora: true },
    });
    if (citaUrl) {
      fecha = formatLocalDate(citaUrl.fechaHora);
      diaResaltado = fecha;
    }
  }

  const fechaRef = fecha ? new Date(fecha + "T12:00:00") : new Date();

  let citas;
  let fechaInicio: string;

  if (vista === "mes") {
    citas = await getCitasMes(fechaRef.getFullYear(), fechaRef.getMonth());
    fechaInicio = formatLocalDate(
      new Date(fechaRef.getFullYear(), fechaRef.getMonth(), 1)
    );
  } else if (vista === "dia") {
    fechaInicio = formatLocalDate(fechaRef);
    citas = await getCitasDia(fechaInicio);
  } else {
    const lunes = getLunesDeSemana(fechaRef);
    citas = await getCitasSemana(lunes.toISOString());
    fechaInicio = formatLocalDate(lunes);
  }

  const [proximas, googleIntegracion] = await Promise.all([
    getProximasCitas(1),
    isGoogleConfigured() ? getIntegracionNutri() : null,
  ]);
  const primera = proximas[0];
  let esPrimeraConsulta = false;
  if (primera) {
    const n = await prisma.consulta.count({
      where: { pacienteId: primera.pacienteId },
    });
    esPrimeraConsulta = n === 0;
  }

  const proximaSidebar = primera
    ? {
        id: primera.id,
        fechaHora: primera.fechaHora.toISOString(),
        duracion: primera.duracion,
        paciente: primera.paciente,
      }
    : null;

  const t = await getTranslations("agenda");

  return (
    <div>
      {params.cita && <AutoMarkLeidasCita citaId={params.cita} />}
      <PageHeader
        icon={CalendarDays}
        title={t("page.title")}
        action={
          <Link
            href="/agenda/nueva"
            data-tour="agenda-nueva-cita"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium shrink-0"
          >
            <Plus className="w-4 h-4" />
            {t("page.newAppointment")}
          </Link>
        }
      />

      <div className="flex flex-col xl:flex-row xl:gap-8 xl:items-start">
        <div className="flex-1 min-w-0 mb-8 xl:mb-0 order-1">
          <AgendaClient
            vista={vista}
            fechaInicio={fechaInicio}
            citas={JSON.parse(JSON.stringify(citas))}
            diaResaltado={diaResaltado}
          />
        </div>
        <AgendaSidebar
          proximaCita={proximaSidebar}
          esPrimeraConsulta={esPrimeraConsulta}
          googleConfigured={isGoogleConfigured()}
          googleIntegracion={googleIntegracion}
        />
      </div>
    </div>
  );
}

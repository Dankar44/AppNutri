import Link from "next/link";
import { Plus } from "lucide-react";
import {
  getCitasSemana,
  getCitasMes,
  getCitasDia,
  getProximasCitas,
} from "@/app/actions/citas";
import { prisma } from "@/lib/prisma";
import { AgendaClient } from "./agenda-client";
import { AgendaSidebar } from "./agenda-sidebar";

interface Props {
  searchParams: Promise<{ fecha?: string; vista?: string }>;
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
  const { fecha } = params;
  const vistaRaw = params.vista;
  const vista =
    vistaRaw === "semana" || vistaRaw === "mes" || vistaRaw === "dia"
      ? vistaRaw
      : "dia";

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

  const proximas = await getProximasCitas(1);
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

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Agenda</h1>
        <Link
          href="/agenda/nueva"
          data-tour="new-appointment-btn"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium shrink-0"
        >
          <Plus className="w-4 h-4" />
          Nueva cita
        </Link>
      </div>

      <div className="flex flex-col xl:flex-row xl:gap-8 xl:items-start">
        <div className="flex-1 min-w-0 mb-8 xl:mb-0">
          <AgendaClient
            vista={vista}
            fechaInicio={fechaInicio}
            citas={JSON.parse(JSON.stringify(citas))}
          />
        </div>
        <AgendaSidebar
          proximaCita={proximaSidebar}
          esPrimeraConsulta={esPrimeraConsulta}
        />
      </div>
    </div>
  );
}

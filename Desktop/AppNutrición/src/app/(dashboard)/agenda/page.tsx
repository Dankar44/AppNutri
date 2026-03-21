import Link from "next/link";
import { Plus } from "lucide-react";
import { getCitasSemana, getCitasMes } from "@/app/actions/citas";
import { AgendaClient } from "./agenda-client";

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
  const { fecha, vista = "semana" } = await searchParams;

  // Usar T12:00 para evitar desfases por timezone al parsear "YYYY-MM-DD"
  const fechaRef = fecha ? new Date(fecha + "T12:00:00") : new Date();

  let citas;
  let fechaInicio: string;

  if (vista === "mes") {
    citas = await getCitasMes(fechaRef.getFullYear(), fechaRef.getMonth());
    fechaInicio = formatLocalDate(new Date(fechaRef.getFullYear(), fechaRef.getMonth(), 1));
  } else {
    const lunes = getLunesDeSemana(fechaRef);
    citas = await getCitasSemana(lunes.toISOString());
    fechaInicio = formatLocalDate(lunes);
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Agenda</h1>
        <Link
          href="/agenda/nueva"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nueva cita
        </Link>
      </div>

      <AgendaClient
        vista={vista as "semana" | "mes"}
        fechaInicio={fechaInicio}
        citas={JSON.parse(JSON.stringify(citas))}
      />
    </div>
  );
}

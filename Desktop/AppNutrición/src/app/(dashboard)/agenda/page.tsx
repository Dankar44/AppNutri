import Link from "next/link";
import { Plus, CalendarDays } from "lucide-react";
import { getCitasSemana } from "@/app/actions/citas";
import { AgendaSemanal } from "./agenda-semanal";

interface Props {
  searchParams: Promise<{ semana?: string }>;
}

function getLunesDeSemana(fecha?: string): Date {
  const d = fecha ? new Date(fecha) : new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const lunes = new Date(d.setDate(diff));
  lunes.setHours(0, 0, 0, 0);
  return lunes;
}

export default async function AgendaPage({ searchParams }: Props) {
  const { semana } = await searchParams;
  const lunes = getLunesDeSemana(semana);
  const citas = await getCitasSemana(lunes.toISOString());

  const semanaAnterior = new Date(lunes);
  semanaAnterior.setDate(semanaAnterior.getDate() - 7);
  const semanaSiguiente = new Date(lunes);
  semanaSiguiente.setDate(semanaSiguiente.getDate() + 7);

  const domingo = new Date(lunes);
  domingo.setDate(domingo.getDate() + 6);

  const formatSemana = (d: Date) =>
    d.toLocaleDateString("es-ES", { day: "numeric", month: "short" });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Agenda</h1>
          <p className="text-muted-foreground mt-1">
            {formatSemana(lunes)} - {formatSemana(domingo)}
          </p>
        </div>
        <Link
          href="/agenda/nueva"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Nueva cita
        </Link>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Link
          href={`/agenda?semana=${semanaAnterior.toISOString().split("T")[0]}`}
          className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-sm"
        >
          Anterior
        </Link>
        <Link
          href="/agenda"
          className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
        >
          Hoy
        </Link>
        <Link
          href={`/agenda?semana=${semanaSiguiente.toISOString().split("T")[0]}`}
          className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-sm"
        >
          Siguiente
        </Link>
      </div>

      {citas.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <CalendarDays className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium text-lg mb-1">Sin citas esta semana</h3>
          <p className="text-muted-foreground mb-4">
            No tienes citas programadas para esta semana
          </p>
        </div>
      ) : (
        <AgendaSemanal citas={citas} lunes={lunes.toISOString()} />
      )}
    </div>
  );
}

"use client";

import { HorarioSemanal } from "./horario-semanal";
import { guardarHorarioPaciente, type HorarioEntry } from "@/app/actions/pacientes";

interface Props {
  pacienteId: string;
  initialEntries: HorarioEntry[];
}

export function HorarioDietistaWrapper({ pacienteId, initialEntries }: Props) {
  return (
    <HorarioSemanal
      initialEntries={initialEntries}
      onSave={(entries) => guardarHorarioPaciente(pacienteId, entries)}
    />
  );
}

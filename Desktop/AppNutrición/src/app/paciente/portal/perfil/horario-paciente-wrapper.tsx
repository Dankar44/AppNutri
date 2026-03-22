"use client";

import { HorarioSemanal } from "@/components/horario-semanal";
import { guardarHorarioPacientePortal, type HorarioEntry } from "@/app/actions/paciente-auth";

interface Props {
  initialEntries: HorarioEntry[];
}

export function HorarioPacienteWrapper({ initialEntries }: Props) {
  return (
    <HorarioSemanal
      initialEntries={initialEntries}
      onSave={(entries) => guardarHorarioPacientePortal(entries)}
    />
  );
}

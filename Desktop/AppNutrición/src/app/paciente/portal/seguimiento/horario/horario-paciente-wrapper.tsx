"use client";

import { HorarioPaciente } from "@/components/paciente/horario/horario-paciente";
import { guardarHorarioPacientePortal, type HorarioEntry } from "@/app/actions/paciente-auth";

interface Props {
  initialEntries: HorarioEntry[];
}

export function HorarioPacienteWrapper({ initialEntries }: Props) {
  return (
    <HorarioPaciente
      initialEntries={initialEntries}
      onSave={(entries) => guardarHorarioPacientePortal(entries)}
    />
  );
}

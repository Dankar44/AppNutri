"use client";

import { useRouter } from "next/navigation";
import { MedidasForm } from "@/components/medidas-form";

interface Props {
  pacienteId: string;
  defaultPeso?: number | null;
  defaultAltura?: number | null;
  defaults?: Partial<Record<string, number | null>>;
}

export function MedidasFormWrapper({ pacienteId, defaultPeso, defaultAltura, defaults }: Props) {
  const router = useRouter();

  return (
    <MedidasForm
      pacienteId={pacienteId}
      defaultPeso={defaultPeso}
      defaultAltura={defaultAltura}
      defaults={defaults}
      onSuccess={() => router.push(`/pacientes/${pacienteId}?pestana=mediciones`)}
    />
  );
}

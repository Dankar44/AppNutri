"use client";

import { useRouter } from "next/navigation";
import { MedidasForm } from "@/components/medidas-form";

interface Props {
  pacienteId: string;
  defaultPeso?: number | null;
  defaultAltura?: number | null;
}

export function MedidasFormWrapper({ pacienteId, defaultPeso, defaultAltura }: Props) {
  const router = useRouter();

  return (
    <MedidasForm
      pacienteId={pacienteId}
      defaultPeso={defaultPeso}
      defaultAltura={defaultAltura}
      onSuccess={() => router.refresh()}
    />
  );
}

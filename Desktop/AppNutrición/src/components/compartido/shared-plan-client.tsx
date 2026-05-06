"use client";

import { PlanVisual, type PlanVisualDetalle } from "@/components/paciente/plan-visual";

interface Props {
  planData: PlanVisualDetalle;
  pacienteNombre: string;
  brandName?: string | null;
  dietistaNombre?: string | null;
}

export function SharedPlanClient({ planData, pacienteNombre, brandName, dietistaNombre }: Props) {
  return (
    <div>
      {(brandName || dietistaNombre) && (
        <div className="text-center mb-6 pb-4 border-b border-border">
          {brandName && <p className="text-lg font-semibold text-foreground">{brandName}</p>}
          {dietistaNombre && <p className="text-sm text-muted-foreground">{dietistaNombre}</p>}
        </div>
      )}
      <PlanVisual
        plan={planData}
        pacienteId=""
        pacienteNombre={pacienteNombre}
        showPlanSelector={false}
        showPdfButton={false}
        showAsignarButton={false}
        showNuevaDietaButton={false}
        showAguaEjercicio={false}
        showFoodTable={false}
        readOnly
        interactionMode="shared"
      />
    </div>
  );
}

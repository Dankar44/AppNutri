"use client";

import { FileDown } from "lucide-react";
import { generatePlanPDF, type PlanPDFData } from "@/lib/pdf/generate-plan-pdf";

interface Props {
  data: PlanPDFData;
}

export function ExportarPDFButton({ data }: Props) {
  function handleExport() {
    const html = generatePlanPDF(data);
    const ventana = window.open("", "_blank");
    if (!ventana) return;
    ventana.document.write(html);
    ventana.document.close();
  }

  return (
    <button
      onClick={handleExport}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
    >
      <FileDown className="w-4 h-4" />
      PDF
    </button>
  );
}

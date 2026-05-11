"use client";

import { Eye } from "lucide-react";

export function DemoBanner() {
  return (
    <div className="fixed top-0 left-0 right-0 z-[60] flex items-center justify-center gap-2 bg-amber-500 px-4 py-1.5 text-xs font-semibold text-white shadow-md sm:text-sm">
      <Eye className="h-4 w-4 shrink-0" />
      <span>Modo demo — los cambios no se guardan</span>
    </div>
  );
}

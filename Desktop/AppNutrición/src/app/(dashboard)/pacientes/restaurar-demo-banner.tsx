"use client";

import { useTransition } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { restaurarPacienteDemo } from "@/app/actions/pacientes";

export function RestaurarDemoBanner() {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleRestaurar() {
    startTransition(async () => {
      try {
        await restaurarPacienteDemo();
        toast.success("Paciente de ejemplo restaurado");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al restaurar");
      }
    });
  }

  return (
    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
      <div className="shrink-0 w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center">
        <Sparkles className="w-5 h-5 text-amber-700" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-900">
          Eliminaste el paciente de ejemplo
        </p>
        <p className="text-xs text-amber-800/90">
          Si quieres volver a tenerlo para explorar todas las funciones con datos precargados,
          puedes restaurarlo cuando quieras.
        </p>
      </div>
      <button
        type="button"
        onClick={handleRestaurar}
        disabled={pending}
        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-60"
      >
        {pending && <Loader2 className="w-4 h-4 animate-spin" />}
        Restaurar
      </button>
    </div>
  );
}

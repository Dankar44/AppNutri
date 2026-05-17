"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Sparkles, Loader2, RotateCcw, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { restaurarPacienteDemo } from "@/app/actions/pacientes";
import { useTranslations } from "next-intl";

/**
 * Tarjeta de gestión del paciente demo. Muestra estado (activo / eliminado) y
 * permite restaurarlo cuando ha sido borrado. Sustituye al `RestaurarDemoBanner`
 * que antes aparecía suelto encima del listado de pacientes.
 */
export function PacienteDemoCard({ demoEliminado }: { demoEliminado: boolean }) {
  const t = useTranslations("settings.pacienteDemo");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleRestaurar() {
    startTransition(async () => {
      try {
        await restaurarPacienteDemo();
        toast.success(t("toastRestaurado"));
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t("toastErrorRestaurar"));
      }
    });
  }

  if (demoEliminado) {
    return (
      <div className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="shrink-0 w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-amber-700 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            {t("eliminado.titulo")}
          </p>
          <p className="text-xs text-amber-800/90 dark:text-amber-300/80 mt-0.5">
            {t("eliminado.descripcion")}
          </p>
        </div>
        <button
          type="button"
          onClick={handleRestaurar}
          disabled={pending}
          className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-60"
        >
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
          {t("eliminado.restaurar")}
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
        <Sparkles className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{t("activo.titulo")}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t.rich("activo.descripcion", { strong: (chunks) => <strong>{chunks}</strong> })}
        </p>
      </div>
      <Link
        href="/pacientes?busqueda=Paciente+Prueba"
        className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
      >
        {t("activo.verFicha")}
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

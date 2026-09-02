"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { cambiarCompartirPlanes } from "@/app/actions/casos";
import { cn } from "@/lib/utils";

/**
 * #40 — «Darles hecha la planificación y el plan». Apagado, lo que el profesor hace en esas dos
 * pestañas es su solución y no viaja a los alumnos; encendido, se les copia al empezar el caso.
 *
 * Interfaz optimista: el interruptor cambia al instante y se vuelve atrás si el servidor falla.
 */
export function CompartirPlanes({ casoId, valor, compacto = false }: { casoId: string; valor: boolean; compacto?: boolean }) {
  const t = useTranslations("casos");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activo, setActivo] = useState(valor);

  function cambiar() {
    const nuevo = !activo;
    setActivo(nuevo);
    startTransition(async () => {
      const result = await cambiarCompartirPlanes(casoId, nuevo);
      if (!result.ok) {
        setActivo(!nuevo);
        toast.error(result.error || t("errorGuardar"));
        return;
      }
      toast.success(nuevo ? t("compartir.activado") : t("compartir.desactivado"));
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={cambiar}
      disabled={isPending}
      aria-pressed={activo}
      className={cn("flex items-start gap-3 text-left w-full", isPending && "opacity-70")}
    >
      <span
        role="switch"
        aria-checked={activo}
        className={cn(
          "relative inline-block w-10 h-6 rounded-full transition-colors shrink-0 mt-0.5",
          activo ? "bg-primary" : "bg-muted-foreground/20",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-card shadow-sm transition-transform",
            activo ? "translate-x-4" : "translate-x-0",
          )}
        />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium">{t("compartir.titulo")}</span>
        <span className={cn("block text-muted-foreground mt-0.5", compacto ? "text-xs" : "text-xs sm:text-sm")}>
          {activo ? t("compartir.encendido") : t("compartir.apagado")}
        </span>
      </span>
    </button>
  );
}

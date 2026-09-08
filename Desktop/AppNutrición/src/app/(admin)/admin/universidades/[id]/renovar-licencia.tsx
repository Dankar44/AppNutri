"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { renovarLicenciaDocente } from "@/app/actions/admin-docencia";
import { SelectorCurso } from "@/components/docencia/selector-curso";
import { cursoActual, cursoDeAnio, cursoDeFechaFin } from "@/lib/docencia";

/**
 * Renovar para el curso siguiente sin crear otra universidad.
 *
 * Es lo de cada verano: «seguimos, y este año somos 13». Al renovar, profesores y alumnos
 * recuperan el espacio docente con su trabajo tal y como lo dejaron.
 */
export function RenovarLicencia({
  licenciaId,
  fechaFin,
  maxProfesores,
  maxAlumnos,
}: {
  licenciaId: string;
  fechaFin: string | null;
  maxProfesores: number;
  maxAlumnos: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [abierto, setAbierto] = useState(false);
  // Se propone el curso siguiente al que tiene: es lo que se va a renovar el 99% de las veces.
  const actual = fechaFin ? cursoDeFechaFin(new Date(fechaFin))?.anio : null;
  const [curso, setCurso] = useState((actual ?? cursoActual().anio) + 1);
  const [profes, setProfes] = useState(String(maxProfesores));
  const [alumnos, setAlumnos] = useState(String(maxAlumnos));

  function renovar() {
    startTransition(async () => {
      const r = await renovarLicenciaDocente({
        licenciaId,
        curso,
        maxProfesores: Number(profes) || 0,
        maxAlumnos: Number(alumnos) || 0,
      });
      if (r.ok) {
        toast.success(`Renovada para el curso ${cursoDeAnio(curso).etiqueta}`);
        setAbierto(false);
        router.refresh();
      } else {
        toast.error(r.error ?? "");
      }
    });
  }

  const input = "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

  if (!abierto) {
    return (
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        Renovar para otro curso
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <p className="text-sm font-medium">Renovar la licencia</p>
      <p className="text-xs text-muted-foreground">
        Las plazas se ponen, no se suman: lo que escribas es lo que tienen ese curso. Al renovar,
        sus profesores y alumnos recuperan el espacio docente con todo su trabajo.
      </p>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-[11px] text-muted-foreground">Curso</label>
          <SelectorCurso value={curso} onChange={setCurso} />
        </div>
        <div>
          <label className="text-[11px] text-muted-foreground">Profesores</label>
          {/* Solo dígitos: un campo de plazas que trague letras acaba en un error al guardar. */}
          <input value={profes} onChange={(e) => setProfes(e.target.value.replace(/\D/g, "").slice(0, 3))}
            inputMode="numeric" className={input} />
        </div>
        <div>
          <label className="text-[11px] text-muted-foreground">Alumnos</label>
          <input value={alumnos} onChange={(e) => setAlumnos(e.target.value.replace(/\D/g, "").slice(0, 4))}
            inputMode="numeric" className={input} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={renovar} disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Renovar para {cursoDeAnio(curso).etiqueta}
        </button>
        <button type="button" onClick={() => setAbierto(false)}
          className="rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted transition-colors">
          Cancelar
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Link2, Copy, Check, Mail } from "lucide-react";
import { toast } from "sonner";
import { crearEnlaceProfesores, enviarEnlaceProfesores, type EnlaceProfesoresResumen } from "@/app/actions/enlaces-profesores";
import { SelectorCurso } from "@/components/docencia/selector-curso";
import { cursoActual } from "@/lib/docencia";

/**
 * Los enlaces con los que una universidad da de alta a su profesorado.
 *
 * Cada uno lleva su cupo y su contador, y el contador solo sube: para vender tres plazas más se
 * crea otro enlace de tres, no se toca el anterior (Guillermo, 8 sep 2026).
 */
export function EnlacesProfesorado({
  licenciaId,
  enlaces,
  contacto,
  libres,
}: {
  licenciaId: string;
  enlaces: EnlaceProfesoresResumen[];
  /** El correo de quien lleva el trato: es a quien se le manda el enlace casi siempre. */
  contacto: string | null;
  /** Cuántos profesores más admite la universidad este curso, contando lo que ya prometen los
   *  enlaces vivos. El enlace reparte plazas, no las crea, así que no puede pasar de aquí. */
  libres: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [plazas, setPlazas] = useState("");
  // Para qué curso vale el enlace. Si en enero venden el año siguiente, se crea ya con ese curso.
  const [curso, setCurso] = useState(cursoActual().anio);
  const [copiado, setCopiado] = useState<string | null>(null);
  const [enviando, setEnviando] = useState<string | null>(null);
  // Viene puesto el de la persona de contacto: es a quien se le manda, y así no hay que copiarlo
  // de más arriba cada vez (Guillermo, 9 sep 2026).
  const [correos, setCorreos] = useState(contacto ?? "");

  // El tope solo aplica al curso contratado: un enlace del curso siguiente se vende por adelantado
  // y sus plazas se pondrán al renovar.
  const delCursoContratado = curso === cursoActual().anio;
  const sePasa = delCursoContratado && Number(plazas) > libres;
  const sinSitio = delCursoContratado && libres === 0;

  function crear(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const r = await crearEnlaceProfesores(licenciaId, Number(plazas), curso);
      if (r.ok) {
        toast.success("Enlace creado");
        setPlazas("");
        router.refresh();
      } else {
        toast.error(r.error ?? "");
      }
    });
  }

  function enviar(enlaceId: string) {
    startTransition(async () => {
      const r = await enviarEnlaceProfesores(enlaceId, correos);
      if (r.ok) {
        toast.success(`Enviado a ${r.enviados} ${r.enviados === 1 ? "dirección" : "direcciones"}`);
        setEnviando(null);
        setCorreos("");
        router.refresh();
      } else {
        toast.error(r.error ?? "");
      }
    });
  }

  async function copiar(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(url);
      setTimeout(() => setCopiado(null), 2000);
    } catch {
      toast.error("No se ha podido copiar");
    }
  }

  const input = "rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="rounded-xl border border-border bg-card p-4 mt-4">
      <h3 className="font-medium text-sm">Enlace para que se den de alta solos</h3>
      <p className="text-xs text-muted-foreground mt-1 mb-3">
        Se lo mandas al representante y él lo reparte por su facultad. Las plazas no se recuperan:
        para vender más, crea otro enlace.
      </p>

      {enlaces.length > 0 && (
        <div className="space-y-3 mb-4">
          {enlaces.map((e) => (
            <div key={e.id} className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span className="text-sm font-medium inline-flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-muted-foreground" />
                  {e.curso} · {e.usadas} de {e.plazas} usadas
                  {e.agotado && <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">agotado</span>}
                </span>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => copiar(e.url)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted transition-colors">
                    {copiado === e.url ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                    Copiar
                  </button>
                  <button type="button" onClick={() => setEnviando(enviando === e.id ? null : e.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-2.5 py-1.5 text-xs font-medium hover:opacity-90 transition-opacity">
                    <Mail className="w-3.5 h-3.5" />
                    Enviar
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2 break-all">{e.url}</p>
              {e.enviadoA.length > 0 && (
                <p className="text-[11px] text-muted-foreground mt-1">Enviado a: {e.enviadoA.join(", ")}</p>
              )}
              {e.altas.length > 0 && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  Entraron: {e.altas.map((a) => `${a.nombre} ${a.apellidos}`.trim()).join(", ")}
                </p>
              )}
              {enviando === e.id && (
                <div className="mt-3 flex items-end gap-2 flex-wrap">
                  <div className="flex-1 min-w-[220px]">
                    <label className="text-[11px] text-muted-foreground">Correos (uno o varios, separados por comas)</label>
                    <input value={correos} onChange={(ev) => setCorreos(ev.target.value)}
                      placeholder="representante@universidad.es" className={`${input} w-full mt-1`} />
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Le llega un correo con el enlace listo para que lo reenvíe a su profesorado.
                    </p>
                  </div>
                  <button type="button" onClick={() => enviar(e.id)} disabled={isPending || !correos.includes("@")}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
                    {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                    Mandar el enlace
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Cuántas quedan de verdad: el enlace reparte plazas de la universidad, no las inventa. Sin
          este número se creaban enlaces para más profesores de los vendidos (Guillermo, 9 sep 2026). */}
      <p className="text-xs text-muted-foreground">
        {sinSitio
          ? "No quedan plazas de profesor libres: sube las licencias en la ficha de arriba para poder repartir más."
          : `${libres === 1 ? "Queda" : "Quedan"} ${libres} plaza${libres === 1 ? "" : "s"} de profesor por repartir en este curso.`}
      </p>

      <form onSubmit={crear} className="flex items-end gap-2 flex-wrap">
        <div className="w-32">
          <label className="text-[11px] text-muted-foreground">Curso</label>
          <SelectorCurso value={curso} onChange={setCurso} />
        </div>
        <div>
          <label className="text-[11px] text-muted-foreground">Plazas del enlace nuevo</label>
          {/* Solo dígitos: un campo de plazas que trague letras acaba en un error al guardar. */}
          <input value={plazas} onChange={(ev) => setPlazas(ev.target.value.replace(/\D/g, "").slice(0, 3))}
            inputMode="numeric" placeholder={String(Math.max(1, libres))} className={`${input} w-24 mt-1`} />
          {sePasa && <p className="text-[11px] text-red-500 mt-1">Solo quedan {libres}</p>}
        </div>
        <button type="submit" disabled={isPending || !plazas || Number(plazas) < 1 || sePasa || sinSitio}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted disabled:opacity-50 transition-colors">
          {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
          Crear enlace
        </button>
      </form>
    </div>
  );
}

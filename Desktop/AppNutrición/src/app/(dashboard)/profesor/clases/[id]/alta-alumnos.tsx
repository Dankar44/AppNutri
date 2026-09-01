"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Link2, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { invitarAlumnos, cambiarEnlaceClase } from "@/app/actions/alumnos";
import { cn } from "@/lib/utils";

export function AltaAlumnos({
  claseId,
  plazasLibres,
  enlace,
  enlaceAbierto,
  puedeDarAltas,
  cursoTerminado,
}: {
  claseId: string;
  plazasLibres: number | null;
  enlace: string | null;
  enlaceAbierto: boolean;
  /** De la licencia de la facultad: si está caducada, no se dan altas en ninguna clase. */
  puedeDarAltas: boolean;
  /** De esta clase en concreto: su curso ya pasó. Se dice aparte porque se arregla de otra forma. */
  cursoTerminado: boolean;
}) {
  const t = useTranslations("docencia");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [modo, setModo] = useState<"correos" | "enlace">("correos");
  const [correos, setCorreos] = useState("");
  const [copiado, setCopiado] = useState(false);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await invitarAlumnos({ claseId, correos });
      if (!result.ok) {
        toast.error(result.error || t("alumnos.errorAlta"));
        return;
      }
      // Se cuenta qué ha pasado con cada uno: da igual invitar a diez si tres ya estaban.
      const d = result.detalle ?? [];
      const cuenta = (r: string) => d.filter((x) => x.resultado === r).length;
      const partes: string[] = [];
      if (cuenta("invitado")) partes.push(t("alumnos.resInvitados", { n: cuenta("invitado") }));
      if (cuenta("matriculado")) partes.push(t("alumnos.resMatriculados", { n: cuenta("matriculado") }));
      if (cuenta("yaEstaba")) partes.push(t("alumnos.resYaEstaban", { n: cuenta("yaEstaba") }));
      if (cuenta("sinPlazas")) partes.push(t("alumnos.resSinPlazas", { n: cuenta("sinPlazas") }));
      if (cuenta("invalido")) partes.push(t("alumnos.resInvalidos", { n: cuenta("invalido") }));
      toast.success(partes.join(" · ") || t("alumnos.altaHecha"));
      setCorreos("");
      router.refresh();
    });
  }

  function cambiarEnlace(abrir: boolean) {
    startTransition(async () => {
      const result = await cambiarEnlaceClase(claseId, abrir);
      if (result.ok) {
        toast.success(abrir ? t("alumnos.enlaceAbierto") : t("alumnos.enlaceCerrado"));
        router.refresh();
      } else {
        toast.error(result.error || t("alumnos.errorAlta"));
      }
    });
  }

  async function copiar() {
    if (!enlace) return;
    try {
      await navigator.clipboard.writeText(enlace);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      toast.error(t("alumnos.errorCopiar"));
    }
  }

  if (cursoTerminado || !puedeDarAltas) {
    return (
      <p className="text-sm text-muted-foreground py-4 lg:p-4 lg:border lg:border-dashed lg:border-border lg:rounded-xl">
        {cursoTerminado ? t("alumnos.cursoTerminadoAviso") : t("alumnos.cursoCerrado")}
      </p>
    );
  }

  const pestana = (activa: boolean) =>
    cn(
      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
      activa ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground hover:text-foreground",
    );

  return (
    <div className="lg:border lg:border-border lg:rounded-xl lg:bg-card lg:p-5 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="font-semibold">{t("alumnos.titulo")}</h3>
        {plazasLibres !== null && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {t("alumnos.plazasLibres", { n: plazasLibres })}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={() => setModo("correos")} className={pestana(modo === "correos")}>
          <Mail className="w-4 h-4" />
          {t("alumnos.porCorreo")}
        </button>
        <button type="button" onClick={() => setModo("enlace")} className={pestana(modo === "enlace")}>
          <Link2 className="w-4 h-4" />
          {t("alumnos.porEnlace")}
        </button>
      </div>

      {modo === "correos" ? (
        <form onSubmit={enviar} className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">{t("alumnos.correos")}</label>
            <textarea
              value={correos}
              onChange={(e) => setCorreos(e.target.value)}
              rows={5}
              placeholder={"alumno1@alumnos.urjc.es\nalumno2@alumnos.urjc.es"}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
            />
            <p className="text-xs text-muted-foreground mt-1">{t("alumnos.correosAyuda")}</p>
          </div>
          <button
            type="submit"
            disabled={isPending || !correos.trim()}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            {t("alumnos.enviarInvitaciones")}
          </button>
        </form>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">{t("alumnos.enlaceExplicacion")}</p>

          {enlaceAbierto && enlace && (
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={enlace}
                onFocus={(e) => e.target.select()}
                className="flex-1 rounded-lg border border-border bg-muted px-3 py-2.5 text-xs font-mono"
              />
              <button
                type="button"
                onClick={copiar}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors shrink-0"
              >
                {copiado ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                {copiado ? t("alumnos.copiado") : t("alumnos.copiar")}
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => cambiarEnlace(!enlaceAbierto)}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-muted disabled:opacity-50 transition-colors"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
            {enlaceAbierto ? t("alumnos.cerrarEnlace") : t("alumnos.abrirEnlace")}
          </button>
          <p className="text-xs text-muted-foreground">
            {enlaceAbierto ? t("alumnos.enlaceAbiertoAyuda") : t("alumnos.enlaceCerradoAyuda")}
          </p>
        </div>
      )}
    </div>
  );
}

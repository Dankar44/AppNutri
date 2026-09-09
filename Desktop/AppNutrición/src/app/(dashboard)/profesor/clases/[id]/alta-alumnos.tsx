"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Link2, Copy, Check, Users, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { invitarAlumnos, cambiarEnlaceClase, cambiarCupoClase } from "@/app/actions/alumnos";
import { cn } from "@/lib/utils";
import { ConfirmModal } from "@/components/confirm-modal";

export function AltaAlumnos({
  claseId,
  plazas,
  enlace,
  enlaceAbierto,
  puedeDarAltas,
  cursoTerminado,
  cupoActual,
  cupoUsado,
  alumnosActivos,
}: {
  claseId: string;
  /** Cuántas plazas de alumno van y cuántas hay en la facultad. */
  plazas: { libres: number; usadas: number; total: number } | null;
  enlace: string | null;
  enlaceAbierto: boolean;
  /** De la licencia de la facultad: si está caducada, no se dan altas en ninguna clase. */
  puedeDarAltas: boolean;
  /** De esta clase en concreto: su curso ya pasó. Se dice aparte porque se arregla de otra forma. */
  cursoTerminado: boolean;
  /** El tope que puso el profesor a SU enlace, si puso alguno. */
  cupoActual: number | null;
  /** Cuántos de ese cupo van gastados este curso. */
  cupoUsado: number | null;
  /** Cuántos alumnos tiene YA la clase: el tope no puede quedar por debajo. */
  alumnosActivos: number;
}) {
  const t = useTranslations("docencia");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmando, setConfirmando] = useState(false);
  const [modo, setModo] = useState<"correos" | "enlace">("correos");
  // Cuántos alumnos tiene la clase. Es de LA CLASE, no del enlace: manda igual para el correo y
  // para el enlace, y hay que decirlo antes de poder dar de alta a nadie (Guillermo, 9 sep 2026).
  const [cambiandoTope, setCambiandoTope] = useState(false);
  const [confirmandoTope, setConfirmandoTope] = useState(false);
  const [topeNuevo, setTopeNuevo] = useState("");

  const yaDentro = alumnosActivos ?? 0;
  // Como mucho, los que ya tiene más lo que le quede a la facultad: el número es el TOTAL de la
  // clase, no las plazas nuevas.
  const topeMaximo = yaDentro + (plazas?.libres ?? 0);
  const topeSePasa = !!topeNuevo && !!plazas && Number(topeNuevo) > topeMaximo;
  // Y tiene que caber alguien: con el mismo número que ya hay, no se puede dar de alta a nadie.
  const topeSinSitio = !!topeNuevo && Number(topeNuevo) <= yaDentro;
  const sinTope = cupoActual == null;
  const llena = cupoActual != null && (cupoUsado ?? 0) >= cupoActual;
  const [correos, setCorreos] = useState("");
  const [copiado, setCopiado] = useState(false);

  /** Cuántos correos hay escritos: es lo que va a costar en plazas. */
  const cuantos = correos.split(/[\s,;]+/).filter((c) => c.includes("@")).length;

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    // Las plazas se gastan para todo el curso y no vuelven, así que se pregunta antes: pegar la
    // lista dos veces, o con erratas, quemaba plazas hasta septiembre sin avisar de nada
    // (Guillermo, 8 sep 2026).
    setConfirmando(true);
  }

  function darDeAlta() {
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
      // El tope de la clase y la bolsa de la facultad son dos motivos distintos, y lo que hay que
      // hacer con cada uno también: uno se arregla subiendo el tope, el otro pidiendo más plazas.
      if (cuenta("claseLlena")) partes.push(t("alumnos.resClaseLlena", { n: cuenta("claseLlena") }));
      if (cuenta("esProfesor")) partes.push(t("alumnos.resEsProfesor", { n: cuenta("esProfesor") }));
      if (cuenta("invalido")) partes.push(t("alumnos.resInvalidos", { n: cuenta("invalido") }));
      // Si no ha entrado nadie, es un aviso, no un éxito: salía en verde un «1 fuera del tope de
      // la clase» que parecía que había ido bien (Guillermo, 9 sep 2026).
      const entraron = cuenta("invitado") + cuenta("matriculado");
      const mensaje = partes.join(" · ") || t("alumnos.altaHecha");
      if (entraron > 0) toast.success(mensaje);
      else toast.error(mensaje);
      setCorreos("");
      setConfirmando(false);
      router.refresh();
    });
  }

  function guardarTope() {
    startTransition(async () => {
      const r = await cambiarCupoClase(claseId, Number(topeNuevo));
      if (r.ok) {
        toast.success(t("alumnos.topeGuardado"));
        setCambiandoTope(false);
        setConfirmandoTope(false);
        router.refresh();
      } else {
        toast.error(r.error || t("alumnos.errorAlta"));
      }
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
      {/* Tres cosas en una línea, de izquierda a derecha: qué es esto, cuántos son en la clase —lo
          que de verdad corta, así que va en medio y a la vista— y cómo va la bolsa de la facultad
          (Guillermo, 9 sep 2026: el botoncito de la derecha "no se ve, tiene que ser más grande"). */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h3 className="font-semibold shrink-0">{t("alumnos.titulo")}</h3>

        {cambiandoTope || sinTope ? (
          <div className="flex items-end gap-2 flex-wrap">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                {t("alumnos.cuantosEnTuClase")}
              </label>
              <input
                value={topeNuevo}
                onChange={(e) => setTopeNuevo(e.target.value.replace(/\D/g, "").slice(0, 4))}
                inputMode="numeric"
                autoFocus={cambiandoTope}
                placeholder={String(Math.max(yaDentro + 1, Math.min(60, topeMaximo)))}
                className={cn(
                  "w-24 rounded-lg border bg-background px-3 py-2 text-base font-semibold tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/30",
                  topeSePasa || topeSinSitio ? "border-red-400" : "border-border",
                )}
              />
            </div>
            <button
              type="button"
              onClick={() => setConfirmandoTope(true)}
              disabled={isPending || !topeNuevo || topeSePasa || topeSinSitio}
              className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {t("alumnos.guardarTope")}
            </button>
            {!sinTope && (
              <button
                type="button"
                onClick={() => setCambiandoTope(false)}
                className="px-2 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                {t("alumnos.cancelarTope")}
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => { setTopeNuevo(String(cupoActual)); setCambiandoTope(true); }}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors",
              llena
                ? "border-red-300 dark:border-red-500/40 bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400"
                : "border-border hover:bg-muted",
            )}
          >
            <Users className="w-4 h-4 shrink-0" />
            <span>
              <span className="text-base font-bold tabular-nums">{cupoActual}</span>
              <span className="ml-1.5">{t("alumnos.alumnosEnTuClase", { usadas: cupoUsado ?? 0 })}</span>
            </span>
            <Pencil className="w-3.5 h-3.5 opacity-60 shrink-0" />
          </button>
        )}

        {plazas && (
          /* La barrita es para verlo de un vistazo; el número de libres, para no tener que restar.
             Se pone en ámbar cuando queda poco y en rojo al llenarse. */
          <span className="inline-flex items-center gap-2 shrink-0">
            <span className="h-1.5 w-20 rounded-full bg-muted overflow-hidden" aria-hidden>
              <span
                className={cn(
                  "block h-full rounded-full transition-all",
                  plazas.libres === 0 ? "bg-red-500" : plazas.libres <= 3 ? "bg-amber-500" : "bg-primary",
                )}
                style={{ width: `${plazas.total > 0 ? Math.min(100, (plazas.usadas / plazas.total) * 100) : 0}%` }}
              />
            </span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {t("alumnos.plazasDe", { usadas: plazas.usadas, total: plazas.total })}
              <span className={cn("ml-1.5 font-medium", plazas.libres === 0 && "text-red-600 dark:text-red-400")}>
                {t("alumnos.plazasLibres", { n: plazas.libres })}
              </span>
            </span>
          </span>
        )}
      </div>

      {/* Qué significan esas plazas libres: son para alumnos NUEVOS. Quien ya esté en otra clase de
          la facultad este curso no gasta otra (Guillermo, 9 sep 2026). */}
      {plazas && (
        <p className="text-xs text-muted-foreground -mt-1">
          {t("alumnos.plazasNuevosAyuda", { n: plazas.libres })}
        </p>
      )}

      {(topeSePasa || topeSinSitio) && (cambiandoTope || sinTope) && (
        <p className="text-xs text-red-600 dark:text-red-400 -mt-1">
          {topeSinSitio ? t("alumnos.cupoSinSitio", { n: yaDentro }) : t("alumnos.cupoSePasa", { n: topeMaximo })}
        </p>
      )}

      {sinTope && (
        <p className="text-xs text-amber-700 dark:text-amber-400">{t("alumnos.diNosCuantosSois")}</p>
      )}

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
            disabled={isPending || !correos.trim() || sinTope}
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
            disabled={isPending || sinTope}
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
      {/* Cambiar el número toca lo que la facultad tiene vendido, así que se pregunta antes. */}
      <ConfirmModal
        open={confirmandoTope}
        title={t("alumnos.confirmarTopeTitulo", { n: Number(topeNuevo) || 0 })}
        description={t("alumnos.confirmarTopeTexto", { n: Number(topeNuevo) || 0, libres: plazas?.libres ?? 0 })}
        confirmLabel={t("alumnos.guardarTope")}
        loading={isPending}
        onConfirm={guardarTope}
        onCancel={() => setConfirmandoTope(false)}
      />
      <ConfirmModal
        open={confirmando}
        title={t("alumnos.confirmarAltaTitulo", { n: cuantos })}
        description={t("alumnos.confirmarAltaTexto", { n: cuantos })}
        confirmLabel={t("alumnos.enviarInvitaciones")}
        loading={isPending}
        onConfirm={darDeAlta}
        onCancel={() => setConfirmando(false)}
      />
    </div>
  );
}

"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * El aviso de «tienes cambios sin guardar», para cualquier editor con botón de guardar.
 *
 * Dos redes: `beforeunload` para cerrar o recargar la pestaña del navegador, y la interceptación
 * de los clics en enlaces internos —otra pestaña de la ficha, el menú lateral…— porque Next
 * navega sin recargar y ahí `beforeunload` no salta: el trabajo se perdía en silencio. Al
 * interceptar se pregunta: guardar y salir, salir sin guardar, o seguir editando.
 *
 * Nacido en la pestaña de planificación; el horario del paciente lo pidió Guillermo el 3 sep 2026
 * ("que aparezca el típico aviso… y que funcione de verdad").
 */
/**
 * Registro de los editores que tienen cambios sin guardar ahora mismo.
 *
 * El hook de abajo intercepta clics en ENLACES, pero «Entregar» es un botón de la misma pantalla:
 * el alumno tocaba la planificación, le daba a entregar y se entregaba sin lo último que había
 * escrito —y como entregar cierra el caso, se perdía (Guillermo, 7 sep 2026). Con esto, cualquiera
 * puede preguntar si queda algo por guardar, y guardarlo, antes de hacer algo irreversible.
 */
type EditorPendiente = { guardar: () => Promise<boolean> };
const pendientes = new Set<EditorPendiente>();

export function hayCambiosSinGuardar(): boolean {
  return pendientes.size > 0;
}

/** Guarda lo que quede pendiente. Devuelve false si alguno falla, para no seguir adelante. */
export async function guardarCambiosPendientes(): Promise<boolean> {
  for (const editor of Array.from(pendientes)) {
    if (!(await editor.guardar())) return false;
  }
  return true;
}

export function useCambiosSinGuardar({
  hayCambios,
  guardar,
  guardando = false,
  esMismaPantalla,
}: {
  hayCambios: boolean;
  /** Guarda y devuelve si ha ido bien. Si falla, no se sale. */
  guardar: () => Promise<boolean>;
  guardando?: boolean;
  /** Enlaces que no son salir (la propia pestaña en la que se está). */
  esMismaPantalla?: (href: string) => boolean;
}): { modal: ReactNode } {
  const t = useTranslations("common.cambiosSinGuardar");
  const router = useRouter();
  const [navPendiente, setNavPendiente] = useState<string | null>(null);
  // Cuando se decide salir sin guardar, hay que dejar pasar la navegación aunque siga habiendo cambios.
  const descartadoRef = useRef(false);

  // Se apunta al registro compartido mientras haya algo que guardar.
  const guardarRef = useRef(guardar);
  guardarRef.current = guardar;
  useEffect(() => {
    if (!hayCambios) return;
    const editor = { guardar: () => guardarRef.current() };
    pendientes.add(editor);
    return () => { pendientes.delete(editor); };
  }, [hayCambios]);

  useEffect(() => {
    if (!hayCambios) { descartadoRef.current = false; return; }
    const handler = (e: BeforeUnloadEvent) => {
      if (descartadoRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hayCambios]);

  useEffect(() => {
    if (!hayCambios) return;
    function onClickCapture(e: MouseEvent) {
      if (descartadoRef.current) return;
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const target = e.target as HTMLElement | null;
      const a = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.getAttribute("href") ?? "";
      // Enlaces externos, anclas o abrir en otra ventana: no son salidas de esta pantalla.
      if (!href || href.startsWith("#") || href.startsWith("http") || a.target === "_blank") return;
      if (esMismaPantalla?.(href)) return;
      e.preventDefault();
      e.stopPropagation();
      setNavPendiente(href);
    }
    document.addEventListener("click", onClickCapture, true);
    return () => document.removeEventListener("click", onClickCapture, true);
  }, [hayCambios, esMismaPantalla]);

  function irA(destino: string) {
    descartadoRef.current = true;
    setNavPendiente(null);
    router.push(destino);
  }

  const modal = navPendiente && typeof document !== "undefined"
    ? createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={() => setNavPendiente(null)}>
          <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2.5 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-bold">{t("titulo")}</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">{t("texto")}</p>
            <div className="flex flex-col sm:flex-row-reverse gap-2">
              <button
                type="button"
                disabled={guardando}
                onClick={async () => {
                  const destino = navPendiente;
                  const ok = await guardar();
                  if (ok && destino) irA(destino);
                  else setNavPendiente(null);
                }}
                className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {guardando ? t("guardando") : t("guardarYSalir")}
              </button>
              <button
                type="button"
                onClick={() => navPendiente && irA(navPendiente)}
                className="px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                {t("salirSinGuardar")}
              </button>
              <button
                type="button"
                onClick={() => setNavPendiente(null)}
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors sm:mr-auto"
              >
                {t("seguirEditando")}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )
    : null;

  return { modal };
}

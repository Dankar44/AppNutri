"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { unirmeComoProfesor } from "@/app/actions/enlaces-profesores";

/**
 * Para quien ya usa Annonia: se le añade el rol a su cuenta, sin tocar nada de lo suyo.
 *
 * También sirve para el profesor que se quedó sin universidad —conserva el rol pero no el sitio—,
 * y ahí lo que hace el botón es meterle en ESTA facultad, no darle un rol que ya tiene.
 */
export function UnirmeConMiCuenta({
  token,
  email,
  yaEraProfesor = false,
}: {
  token: string;
  email: string;
  yaEraProfesor?: boolean;
}) {
  const t = useTranslations("docencia.enlaceProfesorado");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [hecho, setHecho] = useState(false);

  function unirme() {
    startTransition(async () => {
      const r = await unirmeComoProfesor(token);
      if (r.ok) {
        setHecho(true);
        toast.success(t("unirmeHecho"));
        router.push("/profesor");
      } else {
        toast.error(r.error ?? "");
      }
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 text-center">
      <p className="text-sm text-muted-foreground">{t("sesionDe", { email })}</p>
      <p className="text-xs text-muted-foreground mt-2 mb-4">
        {t(yaEraProfesor ? "sinUniversidadAyuda" : "yaTengoCuentaAyuda")}
      </p>
      <button
        type="button"
        onClick={unirme}
        disabled={isPending || hecho}
        className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
        {t(yaEraProfesor ? "unirmeAEstaUniversidad" : "unirmeConMiCuenta")}
      </button>
    </div>
  );
}

import { GraduationCap, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getClasePorToken } from "@/app/actions/clase-publica";
import { getCurrentDietista } from "@/app/actions/auth";
import { ApuntarseForm } from "./apuntarse-form";

export const dynamic = "force-dynamic";

/**
 * #39 — El enlace que el profesor pega en su aula virtual para que los alumnos se apunten solos.
 * Pública: quien la abre todavía no tiene cuenta. Lo que autoriza es el token del enlace, y lo que
 * la protege es el tope de la bolsa y que el profesor pueda cerrarla.
 */
export default async function ClasePublicaPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const clase = await getClasePorToken(token);
  const sesionAbierta = (await getCurrentDietista())?.email ?? null;
  const t = await getTranslations("docencia");

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <GraduationCap strokeWidth={1.75} className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">{t("clasePublica.titulo")}</h1>
          {clase && (
            <p className="text-muted-foreground mt-1">
              {clase.nombre}
              {clase.institucion && <> · {clase.institucion}</>}
            </p>
          )}
        </div>

        {!clase ? (
          <div className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-5">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-900 dark:text-amber-200">{t("clasePublica.noValidaTitulo")}</p>
                <p className="text-amber-800/80 dark:text-amber-200/70 mt-1">{t("clasePublica.noValidaTexto")}</p>
              </div>
            </div>
            <Link href="/login" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
              {t("invitacion.irALogin")}
            </Link>
          </div>
        ) : clase.plazasLibres <= 0 ? (
          <div className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-5 text-sm">
            <p className="font-medium text-amber-900 dark:text-amber-200">{t("clasePublica.sinPlazasTitulo")}</p>
            <p className="text-amber-800/80 dark:text-amber-200/70 mt-1">{t("clasePublica.sinPlazasTexto")}</p>
          </div>
        ) : (
          <ApuntarseForm token={token} dominios={clase.dominios} sesionAbierta={sesionAbierta} />
        )}
      </div>
    </div>
  );
}

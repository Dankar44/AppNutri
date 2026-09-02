import { GraduationCap, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getInvitacionPorToken } from "@/app/actions/invitaciones-docentes";
import { getCurrentDietista } from "@/app/actions/auth";
import { AceptarInvitacionForm } from "./aceptar-form";

export const dynamic = "force-dynamic";

/**
 * #39 — Donde acaba el enlace del correo: la persona crea su cuenta con la contraseña que elija.
 * Pública a propósito (todavía no tiene cuenta); lo único que autoriza es el token del enlace.
 */
export default async function InvitacionPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invitacion = await getInvitacionPorToken(token);
  const t = await getTranslations("docencia");
  // Es normalísimo que el profesor abra el enlace en su propio navegador para probarlo: si no se
  // le dice nada, crea la cuenta del alumno y acaba aterrizando en SU espacio docente sin
  // entender por qué (Guillermo, 1 sep 2026).
  const sesionAbierta = (await getCurrentDietista())?.email ?? null;

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <GraduationCap strokeWidth={1.75} className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">
            {!invitacion
              ? t("invitacion.tituloNoValida")
              : invitacion.rol === "ALUMNO"
                ? t("invitacion.tituloAlumno")
                : t("invitacion.titulo")}
          </h1>
          {invitacion?.institucion && (
            <p className="text-muted-foreground mt-1">{invitacion.institucion}</p>
          )}
          {invitacion?.clase && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {t("invitacion.claseEtiqueta", { clase: invitacion.clase })}
            </p>
          )}
        </div>

        {!invitacion ? (
          <div className="rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-5">
            <div className="flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-900 dark:text-amber-200">
                  {t("invitacion.noValidaTitulo")}
                </p>
                <p className="text-amber-800/80 dark:text-amber-200/70 mt-1">
                  {t("invitacion.noValidaTexto")}
                </p>
              </div>
            </div>
            <Link
              href="/login"
              className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
            >
              {t("invitacion.irALogin")}
            </Link>
          </div>
        ) : (
          <AceptarInvitacionForm
            token={token}
            email={invitacion.email}
            rol={invitacion.rol}
            sesionAbierta={sesionAbierta}
          />
        )}
      </div>
    </div>
  );
}

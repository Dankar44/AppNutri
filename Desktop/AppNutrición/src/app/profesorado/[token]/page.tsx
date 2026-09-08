import Link from "next/link";
import { GraduationCap, AlertTriangle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getEnlaceProfesoresPorToken } from "@/app/actions/enlaces-profesores";
import { getCurrentDietista } from "@/app/actions/auth";
import { AltaProfesorForm } from "./alta-profesor-form";
import { UnirmeConMiCuenta } from "./unirme-con-mi-cuenta";

export const dynamic = "force-dynamic";

/**
 * El enlace que la universidad reparte por su facultad para que el profesorado se dé de alta solo.
 *
 * Pública: quien la abre puede no tener cuenta. Lo que autoriza es el token, y lo que la protege es
 * el cupo del enlace —que no se recupera— y el freno por IP.
 */
export default async function AltaProfesoradoPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const [enlace, dentro, t] = await Promise.all([
    getEnlaceProfesoresPorToken(token),
    getCurrentDietista(),
    getTranslations("docencia.enlaceProfesorado"),
  ]);

  if (!enlace) {
    return (
      <main className="min-h-dvh flex items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold">{t("noValido")}</h1>
          <p className="text-sm text-muted-foreground mt-2">{t("noValidoAyuda")}</p>
        </div>
      </main>
    );
  }

  const esProfesor = dentro?.rolDocente === "PROFESOR";
  const esAlumno = dentro?.rolDocente === "ALUMNO";

  return (
    <main className="min-h-dvh flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <GraduationCap className="w-10 h-10 text-primary mx-auto mb-3" />
          <h1 className="text-xl font-semibold">{t("titulo")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{enlace.institucion}</p>
          {!enlace.agotado && (
            <p className="text-xs text-muted-foreground mt-2">{t("quedan", { n: enlace.quedan })}</p>
          )}
        </div>

        {enlace.agotado ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
            <p className="font-medium">{t("agotado")}</p>
            <p className="text-sm text-muted-foreground mt-1">{t("agotadoAyuda")}</p>
          </div>
        ) : esProfesor ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <p className="font-medium">{t("yaEresProfesor")}</p>
            <Link
              href="/profesor"
              className="inline-flex items-center gap-2 mt-4 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              {t("irAMiEspacio")}
            </Link>
          </div>
        ) : esAlumno ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
            <p className="text-sm">{t("eresAlumno")}</p>
          </div>
        ) : dentro ? (
          /* Ya usa Annonia: no se le crea nada, se le añade el rol a lo suyo. */
          <UnirmeConMiCuenta token={token} email={dentro.email} />
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">{t("explicacion")}</p>
            <AltaProfesorForm token={token} />
            <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-sm font-medium">{t("yaTengoCuenta")}</p>
              <p className="text-xs text-muted-foreground mt-1 mb-3">{t("yaTengoCuentaAyuda")}</p>
              <Link
                href={`/login?next=${encodeURIComponent(`/profesorado/${token}`)}`}
                className="text-sm font-medium text-primary hover:underline"
              >
                {t("entrarConMiCuenta")}
              </Link>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

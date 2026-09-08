import Link from "next/link";
import { redirect } from "next/navigation";
import { GraduationCap, Archive, RefreshCw } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getCurrentDietista } from "@/app/actions/auth";
import { prisma } from "@/lib/prisma";
import { licenciaVigente } from "@/lib/docencia";

export const dynamic = "force-dynamic";

/**
 * Lo que ve un profesor cuando su universidad no ha renovado.
 *
 * No es una puerta cerrada con un error: lo primero que tiene que leer es que **no se ha borrado
 * nada** y que en cuanto la universidad renueve lo recupera todo tal y como lo dejó. Mientras
 * tanto, su cuenta de nutricionista sigue siendo suya y funciona igual.
 */
export default async function DocenciaTerminadaPage() {
  const dietista = await getCurrentDietista();
  if (!dietista) redirect("/login");
  if (dietista.rolDocente !== "PROFESOR") redirect("/dashboard");

  const licencia = dietista.licenciaDocenteId
    ? await prisma.licenciaDocente.findUnique({
        where: { id: dietista.licenciaDocenteId },
        select: { institucion: true, activa: true, fechaFin: true },
      })
    : null;
  // Si la licencia está viva, aquí no pinta nada: se le manda a su espacio.
  if (licenciaVigente(licencia)) redirect("/profesor");

  const t = await getTranslations("docencia.docenciaTerminada");
  const [casos, clases] = await Promise.all([
    prisma.casoClinico.count({ where: { profesorId: dietista.id } }),
    prisma.clase.count({ where: { profesorId: dietista.id } }),
  ]);

  return (
    <main className="min-h-dvh flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <GraduationCap className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h1 className="text-xl font-semibold">{t("titulo")}</h1>
          {licencia?.institucion && (
            <p className="text-sm text-muted-foreground mt-1">{licencia.institucion}</p>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <p className="text-sm">{t("explicacion")}</p>

          <div className="flex items-start gap-3 rounded-lg bg-muted/40 p-3">
            <Archive className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">{t("nadaSeBorra")}</p>
              <p className="text-muted-foreground mt-0.5">
                {t("loQueGuardas", { casos, clases })}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg bg-muted/40 p-3">
            <RefreshCw className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">{t("alRenovar")}</p>
          </div>

          <Link
            href="/dashboard"
            className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {t("irAMiCuenta")}
          </Link>
        </div>
      </div>
    </main>
  );
}

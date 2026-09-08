import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getComparativa } from "@/app/actions/casos";
import { TablaComparativa } from "./tabla-comparativa";

/**
 * Comparar de un vistazo lo que ha hecho cada alumno con el mismo caso.
 *
 * En su propia pantalla: hay que leer la foto de cada entrega y con veinte alumnos eso no puede ir
 * en la ficha del caso, que se abre a cada rato.
 */
export default async function ComparativaPage({
  params,
}: {
  params: Promise<{ id: string; asignacionId: string }>;
}) {
  const { id, asignacionId } = await params;
  const [datos, t] = await Promise.all([
    getComparativa(asignacionId),
    getTranslations("casos.comparativa"),
  ]);
  if (!datos) notFound();

  // Por estado, no por calorías: quien entrega un plan vacío SÍ ha entregado, y que su fila salga
  // con guiones es justo lo que el profesor necesita ver (8 sep 2026).
  const entregados = datos.comparativa.filas.filter(
    (f) => f.estado === "ENTREGADA" || f.estado === "CORREGIDA",
  ).length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 lg:px-6">
      <Link
        href={`/profesor/casos/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("volver")}
      </Link>

      <h1 className="text-xl font-semibold">{t("titulo")}</h1>
      <p className="text-sm text-muted-foreground mt-1">
        {datos.caso} · {datos.clase}
      </p>

      {entregados === 0 ? (
        <p className="text-sm text-muted-foreground mt-8">{t("nadieHaEntregado")}</p>
      ) : (
        <>
          {/* Sin esta línea la tabla son números sueltos: hay que decir contra qué se compara. */}
          <p className="text-xs text-muted-foreground mt-4 mb-3 leading-relaxed">
            {t("comoLeerla")}
          </p>
          <div className="lg:border lg:border-border lg:rounded-xl lg:bg-card lg:p-2">
            <TablaComparativa comparativa={datos.comparativa} />
          </div>
        </>
      )}
    </div>
  );
}

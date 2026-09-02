import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, User, Archive, ArrowRight, ClipboardList } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireProfesor } from "@/app/actions/docencia";
import { getCaso, getAsignacionesDeCaso, getClasesParaAsignar } from "@/app/actions/casos";
import { formatDate } from "@/lib/utils";
import { getLocale } from "@/i18n/locale";
import { AccionesCaso } from "./acciones-caso";
import { Asignaciones } from "./asignaciones";

/**
 * #40 — La ficha del caso: qué se les pide, a qué clases está puesto, y la puerta al paciente.
 *
 * El paciente NO se enseña aquí: se abre su ficha de siempre, que es donde el profesor lo rellena
 * (anamnesis, mediciones, alergias, horario…) exactamente igual que con uno de verdad.
 */
export default async function CasoPage({ params }: { params: Promise<{ id: string }> }) {
  await requireProfesor();
  const { id } = await params;
  const caso = await getCaso(id);
  if (!caso) notFound();

  const [asignaciones, clases, t, locale] = await Promise.all([
    getAsignacionesDeCaso(id),
    getClasesParaAsignar(id),
    getTranslations("casos"),
    getLocale(),
  ]);

  // Las fechas se formatean aquí: los componentes de cliente no saben de idiomas.
  const fechas = Object.fromEntries(
    asignaciones.map((a) => [a.id, a.fechaLimite ? formatDate(a.fechaLimite, locale) : ""]),
  );

  return (
    <div className="space-y-6">
      <Link
        href="/profesor/casos"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("acciones.volver")}
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold">{caso.nombre}</h1>
          {caso.pacienteNombre && (
            <p className="text-sm text-muted-foreground mt-0.5 inline-flex items-center gap-1.5">
              <User className="w-4 h-4" />
              {caso.pacienteNombre}
            </p>
          )}
        </div>
        <AccionesCaso casoId={caso.id} archivado={caso.archivado} />
      </div>

      {caso.archivado && (
        <div className="flex gap-3 py-4 lg:p-4 lg:rounded-xl lg:border lg:border-border lg:bg-muted/50 border-b border-border lg:border-b-0">
          <Archive className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">{t("acciones.archivarTexto")}</p>
        </div>
      )}

      {/* La puerta al paciente, la primera: es donde está el trabajo de verdad del profesor. */}
      {caso.pacienteId && (
        <Link
          href={`/pacientes/${caso.pacienteId}?espacio=docente`}
          className="block py-4 lg:px-6 lg:py-6 lg:rounded-xl lg:border lg:border-primary/30 lg:bg-primary/5 border-b border-border lg:border-b hover:lg:border-primary/60 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <User strokeWidth={1.75} className="w-6 h-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold group-hover:text-primary transition-colors">
                {t("paciente.abrirFicha", { nombre: caso.pacienteNombre })}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">{t("paciente.abrirFichaAyuda")}</p>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary shrink-0" />
          </div>
        </Link>
      )}

      <section className="py-4 lg:px-6 lg:py-6 lg:border lg:border-border lg:rounded-xl lg:bg-card">
        <h2 className="font-semibold inline-flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-muted-foreground" />
          {t("campos.consigna")}
        </h2>
        {caso.consigna ? (
          <p className="text-sm whitespace-pre-wrap mt-2">{caso.consigna}</p>
        ) : (
          <p className="text-sm text-muted-foreground mt-2">
            {t("paciente.sinConsigna")}{" "}
            <Link href={`/profesor/casos/${caso.id}/editar`} className="text-primary hover:underline">
              {t("acciones.editar")}
            </Link>
          </p>
        )}
      </section>

      <Asignaciones casoId={caso.id} asignaciones={asignaciones} clases={clases} fechas={fechas} />
    </div>
  );
}

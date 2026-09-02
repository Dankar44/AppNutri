import Link from "next/link";
import { ClipboardList, ArrowRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

/**
 * #40 — Encima de la ficha del paciente plantilla: el profesor tiene que saber que lo que rellena
 * aquí es lo que se van a encontrar sus alumnos, y tener a un clic la vuelta al caso.
 */
export async function AvisoPlantilla({ caso }: { caso: { id: string; nombre: string; consigna: string | null } }) {
  const t = await getTranslations("casos");
  return (
    <section className="mb-6 py-4 lg:px-6 lg:py-5 lg:rounded-xl lg:border lg:border-primary/30 lg:bg-primary/5 border-b border-border lg:border-b">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="text-xs font-medium text-primary inline-flex items-center gap-1.5">
            <ClipboardList className="w-3.5 h-3.5" />
            {t("paciente.avisoTitulo", { caso: caso.nombre })}
          </p>
          <p className="text-sm mt-1">{t("paciente.avisoTexto")}</p>
          {caso.consigna && (
            <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
              <span className="font-medium text-foreground">{t("campos.consigna")}: </span>
              {caso.consigna}
            </p>
          )}
        </div>
        <Link
          href={`/profesor/casos/${caso.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline shrink-0"
        >
          {t("paciente.verCaso")}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}

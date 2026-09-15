import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getRecetarioPDFData } from "@/app/actions/recetas";
import { PageHeader } from "@/components/page-header";
import { RecetarioEditor } from "./recetario-editor";

interface Props {
  searchParams: Promise<{ ids?: string | string[] }>;
}

export default async function RecetarioPage({ searchParams }: Props) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.ids) ? sp.ids[0] : sp.ids;
  const ids = raw ? raw.split(",").map((id) => id.trim()).filter(Boolean) : [];
  const [resultado, t] = await Promise.all([
    getRecetarioPDFData(ids),
    getTranslations("recipes"),
  ]);

  return (
    <div>
      <Link
        href="/recetas"
        className="mb-3 -my-2 inline-flex items-center gap-1 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:my-0 sm:py-0"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("recetario.volverARecetas")}
      </Link>

      <PageHeader
        icon={BookOpen}
        title={t("recetario.editorTitulo")}
        subtitle={
          resultado.ok
            ? t("recetario.editorSubtitulo", { count: resultado.data.recetas.length })
            : t("recetario.editorSinSeleccion")
        }
      />

      {resultado.ok ? (
        <RecetarioEditor
          data={resultado.data}
          tituloInicial={
            resultado.data.recetas.length === 1
              ? resultado.data.recetas[0].nombre
              : t("recetario.tituloDefault")
          }
        />
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
          <BookOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">{resultado.error}</p>
          <Link
            href="/recetas"
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("recetario.seleccionarRecetas")}
          </Link>
        </div>
      )}
    </div>
  );
}

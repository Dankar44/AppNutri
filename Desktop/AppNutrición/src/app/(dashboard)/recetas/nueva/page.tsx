import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { RecetaForm } from "@/components/receta-form";

export default async function NuevaRecetaPage() {
  const t = await getTranslations("recipes");

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/recetas"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3 py-2 sm:py-0 -my-2 sm:my-0"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("nueva.volverARecetas")}
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold">{t("nueva.titulo")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("nueva.descripcion")}
        </p>
      </div>
      <RecetaForm />
    </div>
  );
}

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireProfesor } from "@/app/actions/docencia";
import { CasoForm } from "../caso-form";

export default async function NuevoCasoPage() {
  await requireProfesor();
  const t = await getTranslations("casos");

  return (
    <div className="space-y-5">
      <Link
        href="/profesor/casos"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("acciones.volver")}
      </Link>
      <h1 className="text-xl sm:text-2xl font-bold">{t("nuevo")}</h1>
      <CasoForm />
    </div>
  );
}

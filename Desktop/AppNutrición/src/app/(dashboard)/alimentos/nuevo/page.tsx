import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { AlimentoForm } from "@/components/alimento-form";
import { getCurrentDietista } from "@/app/actions/auth";
import { prisma } from "@/lib/prisma";

export default async function NuevoAlimentoPage() {
  const t = await getTranslations("foods");
  const dietista = await getCurrentDietista();
  let tieneEmpresa = false;
  if (dietista) {
    const d = await prisma.dietista.findUnique({ where: { id: dietista.id }, select: { empresaId: true } });
    tieneEmpresa = !!d?.empresaId;
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/alimentos"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3 py-2 sm:py-0 -my-2 sm:my-0"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("nuevo.volverAAlimentos")}
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold">{t("nuevo.titulo")}</h1>
        <p className="text-muted-foreground mt-1">
          {t("nuevo.descripcion")}
        </p>
      </div>
      <AlimentoForm tieneEmpresa={tieneEmpresa} />
    </div>
  );
}

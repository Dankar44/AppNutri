import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { AlimentoForm } from "@/components/alimento-form";
import { getCurrentDietista } from "@/app/actions/auth";
import { prisma } from "@/lib/prisma";

export default async function NuevoAlimentoPage() {
  const t = await getTranslations("foods");
  const dietista = await getCurrentDietista();
  // El interruptor de compartir solo se enseña a quien tiene con quién: su centro o su clase.
  const tieneEmpresa = !!dietista?.empresaId;
  const compartirCon = tieneEmpresa ? "centro" : dietista?.rolDocente === "PROFESOR" ? "clase" : null;

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
      <AlimentoForm tieneEmpresa={tieneEmpresa} compartirCon={compartirCon} />
    </div>
  );
}

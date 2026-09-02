import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { requireProfesor } from "@/app/actions/docencia";
import { getCaso } from "@/app/actions/casos";
import { CasoForm } from "../../caso-form";

/** Editar el nombre y la consigna. El paciente se edita en su ficha, como uno de verdad. */
export default async function EditarCasoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireProfesor();
  const { id } = await params;
  const caso = await getCaso(id);
  if (!caso) notFound();
  const t = await getTranslations("casos");

  return (
    <div className="space-y-5">
      <Link
        href={`/profesor/casos/${caso.id}`}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        {caso.nombre}
      </Link>
      <h1 className="text-xl sm:text-2xl font-bold">{t("acciones.editar")}</h1>
      <CasoForm casoId={caso.id} valores={{ nombre: caso.nombre, consigna: caso.consigna ?? "" }} />
    </div>
  );
}

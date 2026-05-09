import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAlimento } from "@/app/actions/alimentos";
import { AlimentoForm } from "@/components/alimento-form";
import { MICRO_KEYS } from "@/lib/micronutrientes";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditarAlimentoPage({ params }: Props) {
  const { id } = await params;
  const alimento = await getAlimento(id);
  if (!alimento) notFound();
  if (!alimento.dietistaId) notFound();

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/alimentos/${alimento.id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3 py-2 sm:py-0 -my-2 sm:my-0"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al alimento
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold">Editar {alimento.nombre}</h1>
      </div>
      <AlimentoForm
        alimentoId={alimento.id}
        defaultValues={{
          nombre: alimento.nombre,
          categoria: alimento.categoria,
          calorias: alimento.calorias,
          proteinas: alimento.proteinas,
          carbohidratos: alimento.carbohidratos,
          grasas: alimento.grasas,
          fibra: alimento.fibra,
          porcion: alimento.porcion,
          unidad: alimento.unidad,
          enlaceProducto: alimento.enlaceProducto ?? "",
          imagenUrl: alimento.imagenUrl ?? "",
          micronutrientes: Object.fromEntries(
            MICRO_KEYS.map((key) => [key, (alimento as Record<string, unknown>)[key] as number | null ?? null])
          ),
        }}
      />
    </div>
  );
}

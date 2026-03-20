import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPlan } from "@/app/actions/planes";
import { getEnlacesDelPlan } from "@/app/actions/compartir";
import { CompartirPanel } from "./compartir-panel";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CompartirPage({ params }: Props) {
  const { id } = await params;
  const plan = await getPlan(id);
  if (!plan) notFound();

  const enlaces = await getEnlacesDelPlan(id);

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/dietas/${id}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al plan
        </Link>
        <h1 className="text-2xl font-bold">Compartir: {plan.nombre}</h1>
        <p className="text-muted-foreground mt-1">
          Genera enlaces para compartir este plan con el paciente
        </p>
      </div>
      <CompartirPanel planId={id} enlaces={enlaces} />
    </div>
  );
}

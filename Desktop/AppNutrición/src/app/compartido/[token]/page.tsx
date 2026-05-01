import { notFound } from "next/navigation";
import { Leaf } from "lucide-react";
import Link from "next/link";
import { getPlanPorToken } from "@/app/actions/compartir";
import { PlanReadOnly } from "@/components/compartido/plan-read-only";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function SharedPlanPage({ params }: Props) {
  const { token } = await params;
  const plan = await getPlanPorToken(token);
  if (!plan) notFound();

  const dias = plan.dias.map((dia) => ({
    dia: dia.dia,
    comidas: dia.comidas.map((comida) => ({
      tipo: comida.tipo,
      alimentos: comida.alimentos.map((a) => ({
        cantidad: a.cantidad,
        alimento: a.alimento ? { nombre: a.alimento.nombre, calorias: a.alimento.calorias, proteinas: a.alimento.proteinas, carbohidratos: a.alimento.carbohidratos, grasas: a.alimento.grasas, enlaceProducto: a.alimento.enlaceProducto } : null,
        receta: a.receta ? {
          nombre: a.receta.nombre, descripcion: a.receta.descripcion, instrucciones: a.receta.instrucciones, porciones: a.receta.porciones,
          calorias: a.receta.calorias, proteinas: a.receta.proteinas, carbohidratos: a.receta.carbohidratos, grasas: a.receta.grasas,
          ingredientes: (a.receta as unknown as { ingredientes: { alimento: { nombre: string }; cantidad: number; unidad: string }[] }).ingredientes || [],
        } : null,
      })),
    })),
  }));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-primary" />
            <span className="font-bold">Annonia</span>
          </div>
          <Link
            href={`/compartido/${token}/lista-compra`}
            className="text-sm text-primary hover:underline font-medium"
          >
            Lista de la compra
          </Link>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 md:p-6">
        <PlanReadOnly
          nombre={plan.nombre}
          pacienteNombre={`${plan.paciente.nombre} ${plan.paciente.apellidos}`}
          dias={dias}
        />
      </main>
    </div>
  );
}

import { notFound } from "next/navigation";
import { Leaf } from "lucide-react";
import Link from "next/link";
import { getPlanPorToken } from "@/app/actions/compartir";
import { SharedPlanClient } from "@/components/compartido/shared-plan-client";
import type { PlanVisualDetalle } from "@/components/paciente/plan-visual";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function SharedPlanPage({ params }: Props) {
  const { token } = await params;
  const plan = await getPlanPorToken(token);
  if (!plan) notFound();

  const planData: PlanVisualDetalle = {
    id: plan.id,
    nombre: plan.nombre,
    caloriasObjetivo: null,
    activo: true,
    proteinasObjetivo: null,
    carbohidratosObjetivo: null,
    grasasObjetivo: null,
    dias: plan.dias.map((dia) => ({
      id: dia.id,
      dia: dia.dia,
      grupoId: dia.grupoId,
      comidas: dia.comidas.map((comida) => ({
        id: comida.id,
        tipo: comida.tipo,
        descripcion: comida.descripcion,
        nombre: comida.nombre,
        hora: comida.hora,
        alimentos: comida.alimentos.map((a) => ({
          id: a.id,
          cantidad: a.cantidad,
          unidad: a.unidad ?? "GRAMOS",
          nombrePersonalizado: a.nombrePersonalizado ?? null,
          alternativas: a.alternativas?.map((alt) => ({
            id: alt.id,
            nombre: alt.nombrePersonalizado || alt.alimento?.nombre || alt.receta?.nombre || "",
            cantidad: alt.cantidad,
            unidad: alt.unidad,
            esReceta: !!alt.receta,
            realId: alt.alimento?.id || alt.receta?.id || null,
            calorias: alt.alimento?.calorias ?? alt.receta?.calorias ?? 0,
            proteinas: alt.alimento?.proteinas ?? alt.receta?.proteinas ?? 0,
            carbohidratos: alt.alimento?.carbohidratos ?? alt.receta?.carbohidratos ?? 0,
            grasas: alt.alimento?.grasas ?? alt.receta?.grasas ?? 0,
            fibra: alt.alimento?.fibra ?? alt.receta?.fibra ?? 0,
            porcion: alt.alimento?.porcion ?? 100,
            recetaPorciones: alt.receta?.porciones ?? undefined,
            recetaDescripcion: alt.receta?.descripcion ?? null,
            recetaIngredientes: alt.receta?.ingredientes?.map((i: { alimento: { nombre: string }; cantidad: number; unidad: string }) => ({ nombre: i.alimento.nombre, cantidad: i.cantidad, unidad: i.unidad })) ?? undefined,
          })) ?? [],
          alimento: a.alimento
            ? {
                id: a.alimento.id,
                nombre: a.alimento.nombre,
                calorias: a.alimento.calorias,
                proteinas: a.alimento.proteinas,
                carbohidratos: a.alimento.carbohidratos,
                grasas: a.alimento.grasas,
                fibra: a.alimento.fibra,
                porcion: a.alimento.porcion ?? 100,
                enlaceProducto: a.alimento.enlaceProducto,
                imagenUrl: a.alimento.imagenUrl,
              }
            : null,
          receta: a.receta
            ? {
                id: a.receta.id,
                nombre: a.receta.nombre,
                calorias: a.receta.calorias,
                proteinas: a.receta.proteinas,
                carbohidratos: a.receta.carbohidratos,
                grasas: a.receta.grasas,
                fibra: a.receta.fibra,
                porciones: a.receta.porciones,
                descripcion: a.receta.descripcion ?? null,
                ingredientes: a.receta.ingredientes?.map((i: { alimento: { nombre: string }; cantidad: number; unidad: string }) => ({ nombre: i.alimento.nombre, cantidad: i.cantidad, unidad: i.unidad })) ?? [],
              }
            : null,
        })),
      })),
    })),
  };

  const brandName = plan.branding?.marcaPdf || null;
  const logoUrl = plan.branding?.pdfLogoUrl;
  const dietistaNombre = plan.branding?.dietistaNombre || null;
  const pacienteNombre = `${plan.paciente.nombre} ${plan.paciente.apellidos}`;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-[1400px] mx-auto px-4 h-14 grid grid-cols-3 items-center">
          <div className="flex items-center gap-2">
            {logoUrl ? (
              <img src={logoUrl} alt={brandName || "Annonia"} className="h-8 max-w-[120px] object-contain" />
            ) : (
              <>
                <Leaf className="w-5 h-5 text-primary" />
                <span className="font-bold">{brandName || "Annonia"}</span>
              </>
            )}
          </div>
          <div className="flex items-center justify-center gap-1.5 text-primary font-bold text-lg">
            <Leaf className="w-5 h-5" />
            Annonia
          </div>
          <div className="flex justify-end">
            <Link
              href={`/compartido/${token}/lista-compra`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary text-primary text-sm font-medium hover:bg-primary/5 transition-colors"
            >
              Lista de la compra
            </Link>
          </div>
        </div>
      </header>
      <main className="max-w-[1400px] mx-auto p-4 md:p-6">
        <SharedPlanClient
          planData={planData}
          pacienteNombre={pacienteNombre}
          brandName={brandName}
          dietistaNombre={dietistaNombre}
        />
      </main>
    </div>
  );
}

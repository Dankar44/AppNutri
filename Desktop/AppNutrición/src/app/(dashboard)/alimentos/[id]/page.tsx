import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { getAlimento } from "@/app/actions/alimentos";
import { prisma } from "@/lib/prisma";
import { AlimentoActions } from "./alimento-actions";
import { MacroAnalysisCard } from "@/components/alimento/macro-analysis-card";
import { PorcionCalculator } from "@/components/alimento/porcion-calculator";
import { MicronutrientesCard } from "@/components/alimento/micronutrientes-card";

const CATEGORIA_LABELS: Record<string, string> = {
  FRUTAS: "Frutas", VERDURAS: "Verduras", CEREALES: "Cereales",
  LEGUMBRES: "Legumbres", CARNES: "Carnes", PESCADOS: "Pescados",
  LACTEOS: "Lácteos", HUEVOS: "Huevos", FRUTOS_SECOS: "Frutos secos",
  ACEITES: "Aceites", BEBIDAS: "Bebidas", CONDIMENTOS: "Condimentos",
  DULCES: "Dulces", OTROS: "Otros",
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AlimentoDetailPage({ params }: Props) {
  const { id } = await params;
  const alimento = await getAlimento(id);
  if (!alimento) notFound();

  const MICRO_COLS = [
    "vitaminaA","vitaminaB6","vitaminaB12","vitaminaC","vitaminaD",
    "vitaminaE","vitaminaK","tiamina","riboflavina","niacina",
    "folato","acidoPantotenico","colina","calcio","hierro",
    "magnesio","fosforo","potasio","sodio","cinc",
    "cobre","manganeso","selenio","fluor",
  ] as const;
  const selectCols = MICRO_COLS.map((c) => `"${c}"`).join(",");
  const microRows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
    `SELECT ${selectCols} FROM alimentos WHERE id = $1`,
    alimento.id,
  );
  const microsRaw = microRows[0] || {};
  const micros: Partial<Record<(typeof MICRO_COLS)[number], number>> = {};
  for (const col of MICRO_COLS) {
    const v = microsRaw[col];
    if (typeof v === "number") micros[col] = v;
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/alimentos"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3 py-2 sm:py-0 -my-2 sm:my-0"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a alimentos
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{alimento.nombre}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted font-medium">
                {CATEGORIA_LABELS[alimento.categoria] || alimento.categoria}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  alimento.origen === "API"
                    ? "bg-blue-50 text-blue-700"
                    : "bg-green-50 text-green-700"
                }`}
              >
                {alimento.origen === "API" ? "Importado" : "Personalizado"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {alimento.dietistaId && (
              <>
                <Link
                  href={`/alimentos/${alimento.id}/editar`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
                >
                  <Pencil className="w-4 h-4" />
                  Editar
                </Link>
                <AlimentoActions alimentoId={alimento.id} />
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="lg:col-span-2 flex">
          <MacroAnalysisCard
            title="Macros por 100g"
            proteinas={alimento.proteinas}
            carbohidratos={alimento.carbohidratos}
            grasas={alimento.grasas}
            fibra={alimento.fibra}
          />
        </div>
        <PorcionCalculator
          calorias={alimento.calorias}
          proteinas={alimento.proteinas}
          carbohidratos={alimento.carbohidratos}
          grasas={alimento.grasas}
          fibra={alimento.fibra}
          porcionDefault={alimento.porcion}
        />
      </div>

      <div className="mt-6">
        <MicronutrientesCard values={micros} />
      </div>
    </div>
  );
}


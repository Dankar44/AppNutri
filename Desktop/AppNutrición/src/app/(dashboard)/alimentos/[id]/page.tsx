import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { getAlimento } from "@/app/actions/alimentos";
import { MacroBadges } from "@/components/macro-badge";
import { calcularMacrosPorcion } from "@/lib/macros";
import { AlimentoActions } from "./alimento-actions";

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

  const macrosPorcion = calcularMacrosPorcion(
    {
      calorias: alimento.calorias,
      proteinas: alimento.proteinas,
      carbohidratos: alimento.carbohidratos,
      grasas: alimento.grasas,
      fibra: alimento.fibra,
    },
    alimento.porcion
  );

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/alimentos"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a alimentos
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{alimento.nombre}</h1>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">Macros por 100g</h2>
          <MacroBadges
            calorias={alimento.calorias}
            proteinas={alimento.proteinas}
            carbohidratos={alimento.carbohidratos}
            grasas={alimento.grasas}
            fibra={alimento.fibra}
            size="md"
          />
          <div className="mt-6 space-y-3">
            <MacroBar label="Proteínas" value={alimento.proteinas} max={100} color="bg-blue-500" />
            <MacroBar label="Carbohidratos" value={alimento.carbohidratos} max={100} color="bg-green-500" />
            <MacroBar label="Grasas" value={alimento.grasas} max={100} color="bg-red-500" />
            <MacroBar label="Fibra" value={alimento.fibra} max={100} color="bg-purple-500" />
          </div>
        </section>

        <section className="bg-card rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold mb-4">
            Macros por porción ({alimento.porcion}g)
          </h2>
          <MacroBadges
            calorias={macrosPorcion.calorias}
            proteinas={macrosPorcion.proteinas}
            carbohidratos={macrosPorcion.carbohidratos}
            grasas={macrosPorcion.grasas}
            fibra={macrosPorcion.fibra}
            size="md"
          />
          <div className="mt-6 space-y-3">
            <MacroBar label="Proteínas" value={macrosPorcion.proteinas} max={alimento.porcion} color="bg-blue-500" />
            <MacroBar label="Carbohidratos" value={macrosPorcion.carbohidratos} max={alimento.porcion} color="bg-green-500" />
            <MacroBar label="Grasas" value={macrosPorcion.grasas} max={alimento.porcion} color="bg-red-500" />
            <MacroBar label="Fibra" value={macrosPorcion.fibra} max={alimento.porcion} color="bg-purple-500" />
          </div>
        </section>
      </div>
    </div>
  );
}

function MacroBar({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}g</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

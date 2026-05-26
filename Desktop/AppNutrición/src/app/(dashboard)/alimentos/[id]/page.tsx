import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, ImageIcon, Pencil } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getAlimento } from "@/app/actions/alimentos";
import { prisma } from "@/lib/prisma";
import { AlimentoActions } from "./alimento-actions";
import { AlimentoImage } from "@/components/alimento/alimento-image";
import { MacroAnalysisCard } from "@/components/alimento/macro-analysis-card";
import { PorcionCalculator } from "@/components/alimento/porcion-calculator";
import { MicronutrientesCard } from "@/components/alimento/micronutrientes-card";
import { StockInfoCard } from "@/components/alimento/stock-info-card";
import { getCurrentDietista } from "@/app/actions/auth";

const CATEGORIA_KEY_MAP: Record<string, string> = {
  FRUTAS: "frutas", VERDURAS: "verduras", CEREALES: "cereales",
  LEGUMBRES: "legumbres", CARNES: "carnes", PESCADOS: "pescados",
  LACTEOS: "lacteos", HUEVOS: "huevos", FRUTOS_SECOS: "frutosSecos",
  ACEITES: "aceites", BEBIDAS: "bebidas", CONDIMENTOS: "condimentos",
  DULCES: "dulces", OTROS: "otros",
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
          {t("detail.volverAAlimentos")}
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">{alimento.nombre}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted font-medium">
                {CATEGORIA_KEY_MAP[alimento.categoria] ? t(`categorias.${CATEGORIA_KEY_MAP[alimento.categoria]}`) : alimento.categoria}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  alimento.origen === "API"
                    ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400"
                    : "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400"
                }`}
              >
                {alimento.origen === "API" ? t("table.importado") : t("table.personalizado")}
              </span>
              {alimento.enlaceProducto && (
                <a
                  href={alimento.enlaceProducto}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={(() => { try { return new URL(alimento.enlaceProducto).hostname; } catch { return undefined; } })()}
                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  {t("detail.verProducto")}
                </a>
              )}
              {alimento.imagenUrl && (
                <a
                  href={alimento.imagenUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-500/20 transition-colors"
                >
                  <ImageIcon className="w-3 h-3" />
                  {t("detail.verImagen")}
                </a>
              )}
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
                  {t("detail.editar")}
                </Link>
                <AlimentoActions alimentoId={alimento.id} />
              </>
            )}
          </div>
        </div>
      </div>

      {alimento.imagenUrl && (
        <div className="mb-6">
          <AlimentoImage
            src={alimento.imagenUrl}
            alt={alimento.nombre}
            className="rounded-xl overflow-hidden border border-border bg-muted/10 p-4"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="lg:col-span-2 flex">
          <MacroAnalysisCard
            title={t("detail.macrosPor100g")}
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

      {tieneEmpresa && alimento.stock !== null && (
        <div className="mt-6">
          <StockInfoCard
            alimentoId={alimento.id}
            stock={alimento.stock}
            precioUnitario={alimento.precioUnitario}
            stockMinimo={alimento.stockMinimo}
          />
        </div>
      )}

      <div className="mt-6">
        <MicronutrientesCard values={micros} />
      </div>
    </div>
  );
}


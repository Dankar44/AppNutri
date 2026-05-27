import Link from "next/link";
import { Plus, Download, Apple } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getAlimentosPaginados, contarMisAlimentos, tieneEmpresaActual } from "@/app/actions/alimentos";
import { getCurrentDietista } from "@/app/actions/auth";
import { AlimentosFilter } from "./alimentos-filter";
import { AlimentosTable } from "./alimentos-table";
import { PageHeader } from "@/components/page-header";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function AlimentosPage({ searchParams }: Props) {
  const params = await searchParams;
  const { busqueda, categoria, origen, calMin, calMax, protMin, protMax, carbMin, carbMax, grasaMin, grasaMax, propios: propiosParam, fuente } = params;
  const propios = propiosParam === "true";
  const fuenteAlimento = fuente === "centro" ? "centro" as const : undefined;

  const MICRO_KEYS = [
    "vitaminaA","vitaminaB6","vitaminaB12","vitaminaC","vitaminaD",
    "vitaminaE","vitaminaK","tiamina","riboflavina","niacina",
    "folato","acidoPantotenico","colina","calcio","hierro",
    "magnesio","fosforo","potasio","sodio","cinc",
    "cobre","manganeso","selenio","fluor",
  ];
  const microMin: Record<string, number> = {};
  for (const k of MICRO_KEYS) {
    const v = params[`m_${k}`];
    if (v) {
      const n = parseFloat(v);
      if (!isNaN(n) && n > 0) microMin[k] = n;
    }
  }

  const t = await getTranslations("foods");

  const [{ alimentos, total, nextCursor }, misAlimentosCount, tieneEmpresa, dietista] = await Promise.all([
    getAlimentosPaginados(
      busqueda,
      categoria as Parameters<typeof getAlimentosPaginados>[1],
      undefined,
      {
        origen,
        propios: propios || undefined,
        fuenteAlimento,
        calMin: calMin ? parseFloat(calMin) : undefined,
        calMax: calMax ? parseFloat(calMax) : undefined,
        protMin: protMin ? parseFloat(protMin) : undefined,
        protMax: protMax ? parseFloat(protMax) : undefined,
        carbMin: carbMin ? parseFloat(carbMin) : undefined,
        carbMax: carbMax ? parseFloat(carbMax) : undefined,
        grasaMin: grasaMin ? parseFloat(grasaMin) : undefined,
        grasaMax: grasaMax ? parseFloat(grasaMax) : undefined,
        microMin: Object.keys(microMin).length ? microMin : undefined,
      }
    ),
    contarMisAlimentos(),
    tieneEmpresaActual(),
    getCurrentDietista(),
  ]);

  return (
    <div>
      <PageHeader
        icon={Apple}
        title={t("list.title")}
        subtitle={propios
          ? (total !== 1 ? t("list.subtitlePropiosCountPlural", { count: total }) : t("list.subtitlePropiosCount", { count: total }))
          : (total !== 1 ? t("list.subtitleCountPlural", { count: total }) : t("list.subtitleCount", { count: total }))
        }
        action={
          <div className="hidden sm:flex gap-2">
            <Link
              href="/alimentos/importar"
              data-tour="import-btn"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
              aria-label={t("list.importarAlimentos")}
            >
              <Download className="w-4 h-4" />
              {t("list.importar")}
            </Link>
            <Link
              href="/alimentos/nuevo"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
              aria-label={t("list.nuevoAlimento")}
            >
              <Plus className="w-4 h-4" />
              {t("list.nuevoAlimento")}
            </Link>
          </div>
        }
      />

      <div className="mb-6">
        <AlimentosFilter misAlimentosCount={misAlimentosCount} tieneEmpresa={tieneEmpresa} />
      </div>

      {alimentos.length === 0 ? (
        <div data-tour="food-list" className="bg-card rounded-xl border border-border p-12 text-center">
          <Apple className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium text-lg mb-1">
            {propios ? t("list.sinAlimentosPropios") : t("list.sinAlimentos")}
          </h3>
          <p className="text-muted-foreground mb-4">
            {busqueda || categoria
              ? t("list.sinResultadosFiltros")
              : propios
                ? t("list.sinAlimentosPropiosCreados")
                : t("list.empiezaAnadiendo")}
          </p>
          {!busqueda && !categoria && (
            <div className="flex gap-2 justify-center">
              <Link
                href="/alimentos/nuevo"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                {t("list.crearAlimento")}
              </Link>
              {propios && (
                <Link
                  href="/alimentos/importar"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
                >
                  <Download className="w-4 h-4" />
                  {t("list.importar")}
                </Link>
              )}
            </div>
          )}
        </div>
      ) : (
        <div data-tour="food-list">
          <AlimentosTable
            initial={alimentos}
            initialCursor={nextCursor}
            busqueda={busqueda}
            categoria={categoria}
            propios={propios}
            fuenteCentro={!!fuenteAlimento}
            currentDietistaId={dietista?.id}
          />
        </div>
      )}
    </div>
  );
}

import Link from "next/link";
import { Plus, CookingPot, Sparkles } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getRecetas, type RecetaFilters } from "@/app/actions/recetas";
import { RecetasFilter } from "./recetas-filter";
import { RecetasGrid } from "./recetas-grid";
import { PageHeader } from "@/components/page-header";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const MICRO_KEYS = [
  "vitaminaA", "vitaminaB6", "vitaminaB12", "vitaminaC", "vitaminaD",
  "vitaminaE", "vitaminaK", "tiamina", "riboflavina", "niacina",
  "folato", "acidoPantotenico", "colina", "calcio", "hierro",
  "magnesio", "fosforo", "potasio", "sodio", "cinc",
  "cobre", "manganeso", "selenio", "fluor",
];

function toNumber(v: string | string[] | undefined): number | undefined {
  if (typeof v !== "string" || v.trim() === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export default async function RecetasPage({ searchParams }: Props) {
  const sp = await searchParams;
  const tab = sp.tab === "app" ? "app" : "mias";
  const busqueda = typeof sp.busqueda === "string" ? sp.busqueda : undefined;

  const microMin: Record<string, number> = {};
  for (const k of MICRO_KEYS) {
    const raw = sp[`m_${k}`];
    const n = toNumber(raw);
    if (n !== undefined && n > 0) microMin[k] = n;
  }

  const filters: RecetaFilters = {
    busqueda,
    ingMin: toNumber(sp.ingMin),
    ingMax: toNumber(sp.ingMax),
    tiempoMin: toNumber(sp.tiempoMin),
    tiempoMax: toNumber(sp.tiempoMax),
    calMin: toNumber(sp.calMin),
    calMax: toNumber(sp.calMax),
    protMin: toNumber(sp.protMin),
    protMax: toNumber(sp.protMax),
    carbMin: toNumber(sp.carbMin),
    carbMax: toNumber(sp.carbMax),
    grasaMin: toNumber(sp.grasaMin),
    grasaMax: toNumber(sp.grasaMax),
    ...(Object.keys(microMin).length ? { microMin } : {}),
  };

  const recetas = await getRecetas({ ...filters, scope: tab });
  const hayFiltros = Object.values(filters).some(
    (v) => v !== undefined && (typeof v !== "object" || Object.keys(v).length > 0),
  );

  const currentParams = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (k === "tab") continue;
    if (typeof v === "string" && v) currentParams.set(k, v);
  }
  const miasHref = (() => {
    const p = new URLSearchParams(currentParams);
    p.delete("tab");
    const q = p.toString();
    return q ? `/recetas?${q}` : "/recetas";
  })();
  const appHref = (() => {
    const p = new URLSearchParams(currentParams);
    p.set("tab", "app");
    return `/recetas?${p.toString()}`;
  })();

  const t = await getTranslations("recipes");
  const subtitle = tab === "mias"
    ? (recetas.length === 1 ? t("list.subtitleCount", { count: recetas.length }) : t("list.subtitleCountPlural", { count: recetas.length }))
    : (recetas.length === 1 ? t("list.subtitleAppCount", { count: recetas.length }) : t("list.subtitleAppCountPlural", { count: recetas.length }));

  return (
    <div>
      <PageHeader
        icon={CookingPot}
        title={t("list.title")}
        subtitle={subtitle}
        action={
          <Link
            href="/recetas/nueva"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            {t("list.nuevaReceta")}
          </Link>
        }
      />

      <div className="flex gap-1 border-b border-border mb-5">
        <Link
          href={miasHref}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
            tab === "mias"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("list.misRecetas")}
        </Link>
        <Link
          href={appHref}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors inline-flex items-center gap-1.5 ${
            tab === "app"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t("list.recetasApp")}</span>
          <span className="sm:hidden">{t("list.recetasAppCorto")}</span>
        </Link>
      </div>

      <div className="mb-6">
        <RecetasFilter />
      </div>

      {recetas.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <CookingPot className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium text-lg mb-1">
            {tab === "app" ? t("list.sinRecetas") : t("list.sinRecetasPropias")}
          </h3>
          <p className="text-muted-foreground mb-4">
            {hayFiltros
              ? t("list.sinResultadosFiltros")
              : tab === "app"
                ? t("list.catalogoDisponiblePronto")
                : t("list.creaPrimeraReceta")}
          </p>
          {!hayFiltros && tab === "mias" && (
            <div className="flex gap-2 justify-center">
              <Link
                href="/recetas/nueva"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                {t("list.crearReceta")}
              </Link>
              <Link
                href={appHref}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
              >
                <Sparkles className="w-4 h-4" />
                {t("list.verCatalogoApp")}
              </Link>
            </div>
          )}
        </div>
      ) : (
        <RecetasGrid recetas={recetas} />
      )}
    </div>
  );
}

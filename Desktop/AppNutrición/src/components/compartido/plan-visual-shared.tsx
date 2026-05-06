"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { calcularMacrosPorcion, sumarMacros, convertirAGramos } from "@/lib/macros";
import { MacroBadges } from "@/components/macro-badge";
import { formatQuantity, getUnidadLabel } from "@/lib/units";
import {
  ChevronDown,
  ChevronRight,
  CookingPot,
  ExternalLink,
  LayoutGrid,
  ClipboardList,
  BarChart3,
  Printer,
  Leaf,
  Flame,
  Droplets,
  Circle,
  Diamond,
  Triangle,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RecetaDetalle {
  nombre: string;
  descripcion?: string | null;
  instrucciones?: string | null;
  porciones: number;
  calorias: number;
  proteinas: number;
  carbohidratos: number;
  grasas: number;
  ingredientes: { alimento: { nombre: string }; cantidad: number; unidad: string }[];
}

interface AlimentoData {
  cantidad: number;
  unidad?: string;
  alimento: {
    nombre: string;
    calorias: number;
    proteinas: number;
    carbohidratos: number;
    grasas: number;
    porcion?: number;
    enlaceProducto?: string | null;
  } | null;
  receta: RecetaDetalle | null;
}

interface ComidaData {
  tipo: string;
  descripcion?: string | null;
  alimentos: AlimentoData[];
}

interface DiaData {
  dia: string;
  comidas: ComidaData[];
}

interface PlanVisualSharedProps {
  nombre: string;
  pacienteNombre?: string;
  dias: DiaData[];
  brandName?: string | null;
  dietistaNombre?: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DIA_LABELS: Record<string, string> = {
  LUNES: "Lunes",
  MARTES: "Martes",
  MIERCOLES: "Miércoles",
  JUEVES: "Jueves",
  VIERNES: "Viernes",
  SABADO: "Sábado",
  DOMINGO: "Domingo",
};

const DIA_KEYS = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"] as const;

const TIPO_LABELS: Record<string, string> = {
  DESAYUNO: "Desayuno",
  MEDIA_MANANA: "Media mañana",
  ALMUERZO: "Almuerzo",
  MERIENDA: "Merienda",
  CENA: "Cena",
  RECENA: "Recena",
};

const HORA_DEFAULT: Record<string, string> = {
  DESAYUNO: "08:30",
  MEDIA_MANANA: "11:00",
  ALMUERZO: "14:00",
  MERIENDA: "17:30",
  CENA: "21:00",
  RECENA: "23:00",
};

const MACRO_COLORS = { grasas: "#eab308", carbohidratos: "#f97316", proteinas: "#3b82f6" };
const MEAL_COLORS = ["#60a5fa", "#93c5fd", "#fdba74", "#fbbf24", "#fde68a", "#d9f99d"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function macrosDeItem(a: AlimentoData) {
  if (a.receta) {
    return {
      calorias: Math.round(a.receta.calorias * a.cantidad * 10) / 10,
      proteinas: Math.round(a.receta.proteinas * a.cantidad * 10) / 10,
      carbohidratos: Math.round(a.receta.carbohidratos * a.cantidad * 10) / 10,
      grasas: Math.round(a.receta.grasas * a.cantidad * 10) / 10,
      fibra: 0,
    };
  }
  if (a.alimento) {
    return calcularMacrosPorcion(
      {
        calorias: a.alimento.calorias,
        proteinas: a.alimento.proteinas,
        carbohidratos: a.alimento.carbohidratos,
        grasas: a.alimento.grasas,
        fibra: 0,
      },
      convertirAGramos(a.cantidad, a.unidad || "GRAMOS", a.alimento.porcion || 100),
    );
  }
  return { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0, fibra: 0 };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function RecetaInline({ receta, cantidad }: { receta: RecetaDetalle; cantidad: number }) {
  return (
    <div className="mx-3 my-1.5 rounded-lg border border-purple-200 dark:border-purple-500/30 bg-purple-50/30 overflow-hidden">
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 mb-1.5">
          <CookingPot className="w-3.5 h-3.5 text-purple-500 shrink-0" />
          <span className="text-sm font-medium text-purple-900 dark:text-purple-200">{receta.nombre}</span>
          <span className="text-xs text-purple-500">({cantidad} porc.)</span>
        </div>
        {receta.descripcion && (
          <p className="text-xs text-purple-700 dark:text-purple-400 italic mb-2">{receta.descripcion}</p>
        )}
        {receta.ingredientes.length > 0 && (
          <div className="ml-5 space-y-0.5">
            {receta.ingredientes.map((ing, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-purple-800 dark:text-purple-300">{ing.alimento.nombre}</span>
                <span className="text-purple-500">{formatQuantity(ing.cantidad, ing.unidad || "GRAMOS")}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ComidaSlotShared({ tipo, descripcion, alimentos }: {
  tipo: string;
  descripcion?: string | null;
  alimentos: AlimentoData[];
}) {
  const [collapsed, setCollapsed] = useState(false);

  const mealTotals = useMemo(
    () => sumarMacros(alimentos.map(macrosDeItem)),
    [alimentos],
  );

  return (
    <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-3 sm:gap-4 px-3 sm:px-6 py-3 sm:py-4 hover:bg-muted/30 transition-colors"
      >
        <span className="text-sm sm:text-base text-muted-foreground tabular-nums shrink-0">
          {HORA_DEFAULT[tipo] || ""}
        </span>
        <h4 className="text-base sm:text-lg font-bold text-foreground flex-1 min-w-0 truncate text-left">
          {TIPO_LABELS[tipo] || tipo}
        </h4>
        {collapsed ? (
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {!collapsed && (
        <div className="border-t border-border/40">
          {alimentos.length === 0 ? (
            <div className="px-4 sm:px-6 py-3 text-xs text-muted-foreground italic">Sin alimentos</div>
          ) : (
            <div>
              {alimentos.map((a, ai) => {
                if (a.receta) {
                  return <RecetaInline key={ai} receta={a.receta} cantidad={a.cantidad} />;
                }
                return (
                  <div key={ai} className="flex items-center gap-2 px-3 sm:px-6 py-2.5 border-b border-border/30 last:border-b-0">
                    <span className="w-12 sm:w-14 text-right tabular-nums text-sm font-medium shrink-0">
                      {a.cantidad}
                    </span>
                    <span className="text-muted-foreground text-sm shrink-0">
                      {getUnidadLabel(a.unidad || "GRAMOS")} de
                    </span>
                    <span className="truncate font-medium text-sm text-foreground flex-1 min-w-0">
                      {a.alimento?.nombre || "Sin nombre"}
                    </span>
                    {a.alimento?.enlaceProducto && (
                      <a href={a.alimento.enlaceProducto} target="_blank" rel="noopener noreferrer" className="shrink-0">
                        <ExternalLink className="w-3.5 h-3.5 text-primary/60 hover:text-primary" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {descripcion?.trim() && (
            <div className="px-4 sm:px-6 py-3 border-t border-border/40">
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Notas</p>
              <p className="text-sm text-foreground/80 whitespace-pre-wrap">{descripcion}</p>
            </div>
          )}

          {alimentos.length > 0 && (
            <div className="px-4 sm:px-6 py-3 border-t border-border/40 bg-muted/20">
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium">
                  {Math.round(mealTotals.calorias)} kcal
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 font-medium">
                  Grasa {mealTotals.grasas.toFixed(1)}g
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 font-medium">
                  HC {mealTotals.carbohidratos.toFixed(1)}g
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
                  Prot {mealTotals.proteinas.toFixed(1)}g
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResumenView({ dias, onSelectDay }: { dias: DiaData[]; onSelectDay: (dayKey: string) => void }) {
  const semanal = useMemo(() => {
    const allMacros = dias.flatMap((d) => d.comidas.flatMap((c) => c.alimentos.map(macrosDeItem)));
    const total = sumarMacros(allMacros);
    const n = Math.max(dias.length, 1);
    return {
      calorias: Math.round(total.calorias / n),
      proteinas: Math.round(total.proteinas / n),
      carbohidratos: Math.round(total.carbohidratos / n),
      grasas: Math.round(total.grasas / n),
    };
  }, [dias]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
              Media diaria de la semana
            </p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold tabular-nums">{semanal.calorias}</span>
              <span className="text-sm text-muted-foreground">kcal / día</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 text-sm font-medium">
              Grasa {semanal.grasas} g
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 text-sm font-medium">
              H. Carbono {semanal.carbohidratos} g
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-medium">
              Proteína {semanal.proteinas} g
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {dias.map((dia) => {
          const macrosList = dia.comidas.flatMap((c) => c.alimentos.map(macrosDeItem));
          const diaTotales = sumarMacros(macrosList);

          return (
            <button
              key={dia.dia}
              type="button"
              onClick={() => onSelectDay(dia.dia)}
              className="group text-left rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <h3 className="font-semibold text-foreground">{DIA_LABELS[dia.dia] || dia.dia}</h3>
                </div>
                <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                  Ver día →
                </span>
              </div>

              <div className="px-5 py-4 space-y-3">
                <div>
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground">Energía</span>
                    <span className="text-sm font-bold tabular-nums">
                      {Math.round(diaTotales.calorias)}
                      <span className="text-xs font-normal text-muted-foreground ml-1">kcal</span>
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-400 to-primary rounded-full"
                      style={{
                        width: `${Math.min(100, Math.round((diaTotales.calorias / Math.max(diaTotales.calorias * 1.1, 1)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  <div className="rounded-lg bg-yellow-50 dark:bg-yellow-500/10 px-2 py-1.5 text-center">
                    <p className="text-[10px] font-medium text-yellow-700 dark:text-yellow-400 uppercase">Grasa</p>
                    <p className="text-sm font-bold text-yellow-700 dark:text-yellow-400 tabular-nums">
                      {diaTotales.grasas.toFixed(0)}g
                    </p>
                  </div>
                  <div className="rounded-lg bg-orange-50 dark:bg-orange-500/10 px-2 py-1.5 text-center">
                    <p className="text-[10px] font-medium text-orange-700 dark:text-orange-400 uppercase">H. C.</p>
                    <p className="text-sm font-bold text-orange-700 dark:text-orange-400 tabular-nums">
                      {diaTotales.carbohidratos.toFixed(0)}g
                    </p>
                  </div>
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-500/10 px-2 py-1.5 text-center">
                    <p className="text-[10px] font-medium text-blue-700 dark:text-blue-400 uppercase">Prot.</p>
                    <p className="text-sm font-bold text-blue-700 dark:text-blue-400 tabular-nums">
                      {diaTotales.proteinas.toFixed(0)}g
                    </p>
                  </div>
                </div>

                <div className="pt-1 space-y-1.5">
                  {dia.comidas.filter((c) => c.alimentos.length > 0).slice(0, 4).map((comida, ci) => {
                    const previews = comida.alimentos
                      .map((a) => a.alimento?.nombre || a.receta?.nombre || "")
                      .filter(Boolean)
                      .slice(0, 3)
                      .join(", ");
                    return (
                      <div key={ci} className="flex items-start gap-2 text-xs">
                        <span className="font-semibold text-muted-foreground w-20 shrink-0">
                          {TIPO_LABELS[comida.tipo] || comida.tipo}
                        </span>
                        <span className="text-foreground/80 flex-1 line-clamp-1">{previews}</span>
                      </div>
                    );
                  })}
                  {dia.comidas.filter((c) => c.alimentos.length === 0).length > 0 && (
                    <p className="text-[10px] text-muted-foreground italic">
                      {dia.comidas.filter((c) => c.alimentos.length === 0).length} comida(s) sin alimentos
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AnalisisView({ dias }: { dias: DiaData[] }) {
  const stats = useMemo(() => {
    const n = Math.max(dias.length, 1);
    const allItems = dias.flatMap((d) => d.comidas.flatMap((c) => c.alimentos));
    const total = sumarMacros(allItems.map(macrosDeItem));
    const avg = {
      calorias: Math.round((total.calorias / n) * 10) / 10,
      proteinas: Math.round((total.proteinas / n) * 10) / 10,
      carbohidratos: Math.round((total.carbohidratos / n) * 10) / 10,
      grasas: Math.round((total.grasas / n) * 10) / 10,
      fibra: Math.round((total.fibra / n) * 10) / 10,
    };
    const grasaKcal = avg.grasas * 9;
    const carbKcal = avg.carbohidratos * 4;
    const protKcal = avg.proteinas * 4;
    const energyTotal = grasaKcal + carbKcal + protKcal || 1;

    const comidasAgg = new Map<string, { gF: number; cF: number; pF: number }>();
    for (const dia of dias) {
      for (const comida of dia.comidas) {
        let gF = 0, cF = 0, pF = 0;
        for (const item of comida.alimentos) {
          if (item.alimento) {
            const f = convertirAGramos(item.cantidad, item.unidad || "GRAMOS", item.alimento.porcion || 100) / 100;
            gF += item.alimento.grasas * f;
            cF += item.alimento.carbohidratos * f;
            pF += item.alimento.proteinas * f;
          } else if (item.receta) {
            gF += item.receta.grasas * item.cantidad;
            cF += item.receta.carbohidratos * item.cantidad;
            pF += item.receta.proteinas * item.cantidad;
          }
        }
        const prev = comidasAgg.get(comida.tipo) ?? { gF: 0, cF: 0, pF: 0 };
        comidasAgg.set(comida.tipo, { gF: prev.gF + gF, cF: prev.cF + cF, pF: prev.pF + pF });
      }
    }
    const comidasMacros = Array.from(comidasAgg.entries()).map(([tipo, v]) => {
      const gAvg = v.gF / n;
      const cAvg = v.cF / n;
      const pAvg = v.pF / n;
      const cal = gAvg * 9 + cAvg * 4 + pAvg * 4;
      return {
        tipo,
        label: TIPO_LABELS[tipo] || tipo,
        grasasG: Math.round(gAvg * 10) / 10,
        carbG: Math.round(cAvg * 10) / 10,
        protG: Math.round(pAvg * 10) / 10,
        grasasKcal: Math.round(gAvg * 9),
        carbKcal: Math.round(cAvg * 4),
        protKcal: Math.round(pAvg * 4),
        calTotal: Math.round(cal),
        grasasPct: cal > 0 ? Math.round((gAvg * 9 / cal) * 100) : 0,
        carbPct: cal > 0 ? Math.round((cAvg * 4 / cal) * 100) : 0,
        protPct: cal > 0 ? Math.round((pAvg * 4 / cal) * 100) : 0,
      };
    });

    return { avg, grasaKcal, carbKcal, protKcal, energyTotal, comidasMacros };
  }, [dias]);

  const { avg, grasaKcal, carbKcal, protKcal, energyTotal, comidasMacros } = stats;
  const macroPieData = [
    { name: "Grasa", value: grasaKcal, color: MACRO_COLORS.grasas },
    { name: "Hidratos", value: carbKcal, color: MACRO_COLORS.carbohidratos },
    { name: "Proteína", value: protKcal, color: MACRO_COLORS.proteinas },
  ];
  const mealsWithEnergy = comidasMacros.filter((c) => c.calTotal > 0);
  const mealsWithProtein = comidasMacros.filter((c) => c.protG > 0);

  return (
    <div className="space-y-4">
      {dias.length > 1 && (
        <p className="text-xs italic text-muted-foreground text-right">Mostrando media diaria</p>
      )}

      {/* Análisis global */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h4 className="text-base font-semibold mb-4">Análisis global</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {[
            { icon: <Flame className="w-4 h-4" />, label: "Energía", value: Math.round(avg.calorias), unit: "kcal", color: "#b197fc", bg: "bg-purple-50 dark:bg-purple-500/10" },
            { icon: <Droplets className="w-4 h-4" />, label: "Grasa", value: avg.grasas, unit: "g", color: MACRO_COLORS.grasas, bg: "bg-yellow-50 dark:bg-yellow-500/10" },
            { icon: <Circle className="w-4 h-4" />, label: "H. Carbono", value: avg.carbohidratos, unit: "g", color: MACRO_COLORS.carbohidratos, bg: "bg-orange-50 dark:bg-orange-500/10" },
            { icon: <Diamond className="w-4 h-4" />, label: "Proteína", value: avg.proteinas, unit: "g", color: MACRO_COLORS.proteinas, bg: "bg-blue-50 dark:bg-blue-500/10" },
            { icon: <Triangle className="w-4 h-4" />, label: "Fibra", value: avg.fibra, unit: "g", color: "#10b981", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
          ].map((m) => (
            <div key={m.label} className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">{m.icon} {m.label}</div>
              <div className={`h-2.5 ${m.bg} rounded-full overflow-hidden`}>
                <div className="h-full rounded-full" style={{ width: "85%", background: m.color }} />
              </div>
              <div className="text-xs tabular-nums">
                <span className="font-bold">{typeof m.value === "number" && m.unit === "g" ? m.value.toFixed(1) : m.value}</span>
                <span className="text-muted-foreground"> {m.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Distribution charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Macronutrientes */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h4 className="text-sm font-semibold mb-3">Distribución de macronutrientes</h4>
          <div className="flex items-center gap-4">
            <div className="w-[120px] h-[120px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={macroPieData} dataKey="value" innerRadius={25} outerRadius={50} paddingAngle={2} startAngle={90} endAngle={-270} isAnimationActive={false}>
                    {macroPieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 text-xs">
              {macroPieData.map((m) => {
                const pct = Math.round((m.value / energyTotal) * 100);
                return (
                  <div key={m.name} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: m.color }} />
                    <span className="text-muted-foreground">{m.name}</span>
                    <span className="font-bold tabular-nums ml-auto">{pct}%</span>
                    <span className="tabular-nums text-muted-foreground">{Math.round(m.value)} kcal</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Distribución energética */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h4 className="text-sm font-semibold mb-3">Distribución energética</h4>
          <div className="flex items-center gap-4">
            <div className="w-[120px] h-[120px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={mealsWithEnergy.map((m, i) => ({ ...m, color: MEAL_COLORS[i % MEAL_COLORS.length] }))} dataKey="calTotal" innerRadius={25} outerRadius={50} paddingAngle={2} startAngle={90} endAngle={-270} isAnimationActive={false}>
                    {mealsWithEnergy.map((_, i) => <Cell key={i} fill={MEAL_COLORS[i % MEAL_COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 text-xs">
              {mealsWithEnergy.map((m, i) => {
                const totalMealKcal = mealsWithEnergy.reduce((s, c) => s + c.calTotal, 0) || 1;
                return (
                  <div key={m.tipo} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: MEAL_COLORS[i % MEAL_COLORS.length] }} />
                    <span className="text-muted-foreground">{m.label}</span>
                    <span className="font-bold tabular-nums ml-auto">{Math.round((m.calTotal / totalMealKcal) * 100)}%</span>
                    <span className="tabular-nums text-muted-foreground">{m.calTotal} kcal</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Distribución proteica */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h4 className="text-sm font-semibold mb-3">Distribución proteica</h4>
          <div className="flex items-center gap-4">
            <div className="w-[120px] h-[120px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={mealsWithProtein.map((m, i) => ({ ...m, color: MEAL_COLORS[i % MEAL_COLORS.length] }))} dataKey="protG" innerRadius={25} outerRadius={50} paddingAngle={2} startAngle={90} endAngle={-270} isAnimationActive={false}>
                    {mealsWithProtein.map((_, i) => <Cell key={i} fill={MEAL_COLORS[i % MEAL_COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 text-xs">
              {mealsWithProtein.map((m, i) => {
                const totalProt = mealsWithProtein.reduce((s, c) => s + c.protG, 0) || 1;
                return (
                  <div key={m.tipo} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: MEAL_COLORS[i % MEAL_COLORS.length] }} />
                    <span className="text-muted-foreground">{m.label}</span>
                    <span className="font-bold tabular-nums ml-auto">{Math.round((m.protG / totalProt) * 100)}%</span>
                    <span className="tabular-nums text-muted-foreground">{m.protG} g</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Distribución de grasas e hidratos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { title: "Distribución de las grasas", totalG: avg.grasas, kcal: Math.round(grasaKcal), pct: Math.round((grasaKcal / energyTotal) * 100), field: "grasasG" as const, color: MACRO_COLORS.grasas },
          { title: "Distribución de los hidratos", totalG: avg.carbohidratos, kcal: Math.round(carbKcal), pct: Math.round((carbKcal / energyTotal) * 100), field: "carbG" as const, color: MACRO_COLORS.carbohidratos },
        ].map((block) => {
          const mealsForBlock = comidasMacros.filter((m) => m[block.field] > 0);
          return (
            <div key={block.title} className="bg-card rounded-xl border border-border p-5">
              <h4 className="text-sm font-semibold mb-3">{block.title}</h4>
              <div className="flex items-center gap-4">
                <div className="w-[100px] h-[100px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={mealsForBlock.map((m, i) => ({ name: m.label, value: m[block.field], color: MEAL_COLORS[i % MEAL_COLORS.length] }))} dataKey="value" innerRadius={20} outerRadius={42} paddingAngle={2} startAngle={90} endAngle={-270} isAnimationActive={false}>
                        {mealsForBlock.map((_, i) => <Cell key={i} fill={MEAL_COLORS[i % MEAL_COLORS.length]} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1">
                  <p className="text-2xl font-bold tabular-nums">{block.totalG.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">g</span></p>
                  <p className="text-xs text-muted-foreground mb-2">{block.kcal} kcal ({block.pct}%)</p>
                  <div className="space-y-1 text-xs">
                    {mealsForBlock.map((m, i) => (
                      <div key={m.tipo} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: MEAL_COLORS[i % MEAL_COLORS.length] }} />
                        <span className="text-muted-foreground">{m.label}</span>
                        <span className="tabular-nums ml-auto font-medium">{m[block.field]} g</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comidas mini charts */}
      {mealsWithEnergy.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-4">
          <h4 className="text-sm font-semibold mb-3">Comidas</h4>
          <div className="grid" style={{ gridTemplateColumns: `repeat(${Math.min(mealsWithEnergy.length, 4)}, 1fr)` }}>
            {mealsWithEnergy.map((meal) => (
              <div key={meal.tipo} className="relative group flex flex-col items-center gap-1 cursor-pointer">
                <div className="w-[60px] h-[60px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { value: meal.grasasKcal || 0.01 },
                          { value: meal.carbKcal || 0.01 },
                          { value: meal.protKcal || 0.01 },
                        ]}
                        dataKey="value"
                        innerRadius={14}
                        outerRadius={26}
                        paddingAngle={2}
                        startAngle={90}
                        endAngle={-270}
                        isAnimationActive={false}
                      >
                        <Cell fill={MACRO_COLORS.grasas} />
                        <Cell fill={MACRO_COLORS.carbohidratos} />
                        <Cell fill={MACRO_COLORS.proteinas} />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <span className="text-xs text-muted-foreground text-center leading-tight">{meal.label}</span>
                <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
                  <div className="bg-card border border-border/30 rounded-2xl shadow-xl p-3 whitespace-nowrap text-[11px]">
                    <div className="grid grid-cols-[auto_auto_auto_auto] gap-x-3 gap-y-1.5 items-center">
                      <span className="font-semibold px-2 py-0.5 rounded-full" style={{ color: MACRO_COLORS.grasas, background: MACRO_COLORS.grasas + "22" }}>Grasa</span>
                      <span className="tabular-nums text-right">{meal.grasasKcal} kcal</span>
                      <span className="tabular-nums text-right">{meal.grasasPct}%</span>
                      <span className="tabular-nums text-right">{meal.grasasG} g</span>
                      <span className="font-semibold px-2 py-0.5 rounded-full" style={{ color: MACRO_COLORS.carbohidratos, background: MACRO_COLORS.carbohidratos + "22" }}>H. Carbono</span>
                      <span className="tabular-nums text-right">{meal.carbKcal} kcal</span>
                      <span className="tabular-nums text-right">{meal.carbPct}%</span>
                      <span className="tabular-nums text-right">{meal.carbG} g</span>
                      <span className="font-semibold px-2 py-0.5 rounded-full" style={{ color: MACRO_COLORS.proteinas, background: MACRO_COLORS.proteinas + "22" }}>Proteína</span>
                      <span className="tabular-nums text-right">{meal.protKcal} kcal</span>
                      <span className="tabular-nums text-right">{meal.protPct}%</span>
                      <span className="tabular-nums text-right">{meal.protG} g</span>
                    </div>
                    <div className="flex items-center gap-3 pt-2 mt-2 border-t border-border/30">
                      <span className="font-semibold text-muted-foreground">Energía</span>
                      <span className="tabular-nums font-semibold">{meal.calTotal} kcal</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function PlanVisualShared({ nombre, pacienteNombre, dias, brandName, dietistaNombre }: PlanVisualSharedProps) {
  const [vista, setVista] = useState<"resumen" | "plan" | "analisis">("resumen");
  const [selectedDayKey, setSelectedDayKey] = useState<string>("TODOS");

  const diasOrdenados = useMemo(
    () => [...dias].sort((a, b) =>
      DIA_KEYS.indexOf(a.dia as typeof DIA_KEYS[number]) - DIA_KEYS.indexOf(b.dia as typeof DIA_KEYS[number])
    ),
    [dias],
  );

  const diasVisible = useMemo(() => {
    if (selectedDayKey === "TODOS") return diasOrdenados;
    const found = diasOrdenados.find((d) => d.dia === selectedDayKey);
    return found ? [found] : [];
  }, [diasOrdenados, selectedDayKey]);

  const isTodos = selectedDayKey === "TODOS";

  return (
    <div className="space-y-5">
      {(brandName || dietistaNombre) && (
        <div className="text-center pb-4 border-b border-border">
          {brandName && <p className="text-lg font-semibold text-foreground">{brandName}</p>}
          {dietistaNombre && <p className="text-sm text-muted-foreground">{dietistaNombre}</p>}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">{nombre}</h2>
          {pacienteNombre && <p className="text-sm text-muted-foreground">{pacienteNombre}</p>}
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium print:hidden"
        >
          <Printer className="w-4 h-4" />
          Imprimir
        </button>
      </div>

      {/* Day tabs + view toggle */}
      <div className="flex items-center gap-2 flex-wrap print:hidden">
        <div className="flex-1 min-w-0 flex items-stretch rounded-xl border border-border bg-card p-1 overflow-x-auto scrollbar-thin">
          <button
            type="button"
            onClick={() => {
              if (vista === "resumen") {
                setSelectedDayKey("TODOS");
                setVista("plan");
              } else {
                setSelectedDayKey("TODOS");
              }
            }}
            className={cn(
              "flex-1 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
              isTodos && vista !== "resumen"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
            )}
          >
            Todas
          </button>
          {DIA_KEYS.map((key) => {
            const exists = diasOrdenados.some((d) => d.dia === key);
            const isActive = !isTodos && selectedDayKey === key && vista !== "resumen";
            return (
              <button
                key={key}
                type="button"
                disabled={!exists}
                onClick={() => {
                  if (!exists) return;
                  setSelectedDayKey(key);
                  if (vista === "resumen") setVista("plan");
                }}
                className={cn(
                  "flex-1 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                  !exists && "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-muted-foreground",
                )}
              >
                {DIA_LABELS[key]}
              </button>
            );
          })}
        </div>

        <div className="inline-flex items-center gap-2 rounded-xl border border-border bg-card p-1 shrink-0">
          <button
            type="button"
            onClick={() => setVista("resumen")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              vista === "resumen"
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-muted-foreground hover:bg-muted/60",
            )}
          >
            <LayoutGrid className="w-4 h-4" />
            Resumen
          </button>
          <button
            type="button"
            onClick={() => setVista("plan")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              vista === "plan"
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-muted-foreground hover:bg-muted/60",
            )}
          >
            <ClipboardList className="w-4 h-4" />
            Plan
          </button>
          <button
            type="button"
            onClick={() => setVista("analisis")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              vista === "analisis"
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-muted-foreground hover:bg-muted/60",
            )}
          >
            <BarChart3 className="w-4 h-4" />
            Análisis
          </button>
        </div>
      </div>

      {/* Views */}
      {vista === "resumen" ? (
        <ResumenView
          dias={diasOrdenados}
          onSelectDay={(dayKey) => {
            setSelectedDayKey(dayKey);
            setVista("plan");
          }}
        />
      ) : vista === "analisis" ? (
        <AnalisisView dias={diasOrdenados} />
      ) : (
        <div className="space-y-8">
          {diasVisible.map((dia) => {
            const dayMacros = sumarMacros(dia.comidas.flatMap((c) => c.alimentos.map(macrosDeItem)));
            return (
              <div key={dia.dia}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    {DIA_LABELS[dia.dia] || dia.dia}
                  </h2>
                  <MacroBadges
                    calorias={dayMacros.calorias}
                    proteinas={dayMacros.proteinas}
                    carbohidratos={dayMacros.carbohidratos}
                    grasas={dayMacros.grasas}
                  />
                </div>
                <div className="space-y-4">
                  {dia.comidas.map((comida, ci) => (
                    <ComidaSlotShared
                      key={ci}
                      tipo={comida.tipo}
                      descripcion={comida.descripcion}
                      alimentos={comida.alimentos}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="mt-10 pt-6 border-t border-border text-center print:mt-4">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Leaf className="w-5 h-5 text-primary" />
          <span className="text-lg font-bold text-primary">Annonia</span>
        </div>
        <p className="text-xs text-muted-foreground">Plan generado con annonia.com</p>
      </div>
    </div>
  );
}

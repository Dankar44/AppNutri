"use client";

import { Fragment, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  Dumbbell,
  Flame,
  MoreVertical,
  Percent,
  Plus,
  Ruler,
  Scale,
  Search,
  Brain,
  Zap,
  Wheat,
  Droplets,
  Beef,
  X,
  Pencil,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import type { FichaInformacionData } from "@/lib/ficha-informacion-types";
import { MonthPicker } from "@/components/month-picker";
import type { MedidaSerializada } from "./paciente-ficha-mediciones-tab";
import type { Planificacion, PlanificacionDatos, RepartoComida } from "@/app/actions/planificaciones";
import {
  guardarPlanificacion,
  actualizarFechasPlanificacion,
  crearPlanificacion,
  renombrarPlanificacion,
  cambiarEstadoPlanificacion,
  eliminarPlanificacion,
} from "@/app/actions/planificaciones";
import { useDemoGuard } from "@/contexts/demo-context";
import { cn } from "@/lib/utils";
import {
  normalizeReparto,
  repartirKcal,
  claveComida,
  DIAS_SEMANA,
  REPARTO_PRESETS,
  MACRO_PRESETS,
  setFila,
  heredarMacrosFila,
  quitarFila,
  renombrarFila,
  repartirEquitativo,
  toggleDiaFila,
  aplicarPresetKcal,
  aplicarPresetMacrosFila,
  presetKcalActivo,
  objetivoDeFila,
  fijarPctFila,
  anadirFila,
  type MacroPreset,
} from "@/lib/reparto-comidas";
import { horaEfectiva, minutosDeHora, horaEntreComidas } from "@/lib/comida-horas";
import { getPlanesPaciente, actualizarPlan, guardarRepartoDePlan } from "@/app/actions/planes";
import { toast } from "sonner";

/* ─── Types ─── */

type PacienteForPlanificacion = {
  fechaNacimiento: string | null;
  sexo: string | null;
  peso: number | null;
  altura: number | null;
  objetivoDetalle: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  nombre: string;
  apellidos: string;
};

/* ─── Pure helpers (logic preserved 1:1) ─── */

function parseKgFromObjetivoDetalle(text: string | null | undefined): number | null {
  if (!text) return null;
  const m = text.match(/(-?\d+(?:[.,]\d+)?)\s*kg\b/i);
  if (!m) return null;
  const value = parseFloat(m[1].replace(",", "."));
  return Number.isFinite(value) ? value : null;
}

function latestValue(medidas: MedidaSerializada[], key: keyof MedidaSerializada): number | null {
  const sorted = [...medidas].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );
  for (const m of sorted) {
    const v = m[key];
    if (typeof v === "number" && Number.isFinite(v)) return v as number;
  }
  return null;
}

function calcularEdad(fechaNacimiento: string | null): number | null {
  if (!fechaNacimiento) return null;
  const d = new Date(fechaNacimiento);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age >= 0 ? age : null;
}

function calcularIMC(pesoKg: number, alturaCm: number): number {
  const hM = alturaCm / 100;
  return pesoKg / (hM * hM);
}

function categoriaIMC(imc: number): { labelKey: string; color: string } {
  if (imc < 18.5) return { labelKey: "imcDelgadez", color: "bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400" };
  if (imc < 25) return { labelKey: "imcEutrofia", color: "bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400" };
  if (imc < 30) return { labelKey: "imcSobrepeso", color: "bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400" };
  return { labelKey: "imcObesidad", color: "bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400" };
}

/* ─── Formula ID constants ─── */

const BMR_IDS = {
  OMS: "oms",
  HENRY: "henry",
  HARRIS_BENEDICT: "harris_benedict",
  HARRIS_BENEDICT_REV: "harris_benedict_rev",
  MIFFLIN_ST_JEOR: "mifflin_st_jeor",
  KATCH_MCARDLE: "katch_mcardle",
  CUNNINGHAM: "cunningham",
  BLACK: "black",
  TEN_HAAF_PESO: "ten_haaf_peso",
  TEN_HAAF_LBM: "ten_haaf_lbm",
} as const;

const EER_IDS = {
  IOM_2005: "eer_iom_2005",
  TMB_PAL: "tmb_pal",
} as const;

const GRASA_IDS = {
  PETERSON: "peterson",
  DURNIN_WOMERSLEY: "durnin_womersley",
  JACKSON_3: "jackson_3",
  JACKSON_7: "jackson_7",
} as const;

/** Opciones rápidas de ajuste calórico por objetivo (déficit / mantenimiento / superávit). */
const AJUSTE_OPCIONES: { value: number; label: string }[] = [
  { value: -20, label: "−20%" },
  { value: -15, label: "−15%" },
  { value: -10, label: "−10%" },
  { value: 0, label: "0%" },
  { value: 10, label: "+10%" },
  { value: 15, label: "+15%" },
  { value: 20, label: "+20%" },
];

/* ─── Reparto por comida (#78-C): presets y mutadores en src/lib/reparto-comidas.ts, que los
 * comparte con el editor de dietas (edita el MISMO reparto: su copia de la dieta). ─── */

/** Map from legacy hardcoded Spanish names to stable formula IDs (for DB migration compat) */
const LEGACY_BMR_MAP: Record<string, string> = {
  "Ecuación de la OMS": BMR_IDS.OMS,
  "Ecuación de Henry": BMR_IDS.HENRY,
  "Ecuación de Harris Benedict": BMR_IDS.HARRIS_BENEDICT,
  "Ecuación revisada de Harris Benedict": BMR_IDS.HARRIS_BENEDICT_REV,
  "Ecuación de Mifflin St Jeor": BMR_IDS.MIFFLIN_ST_JEOR,
  "Ecuación de Katch-McArdle": BMR_IDS.KATCH_MCARDLE,
  "Ecuación de Cunningham": BMR_IDS.CUNNINGHAM,
  "Ecuación de Black": BMR_IDS.BLACK,
  "Ecuación de Ten Haaf (peso)": BMR_IDS.TEN_HAAF_PESO,
  "Ecuación de Ten Haaf (masa magra)": BMR_IDS.TEN_HAAF_LBM,
};

const LEGACY_EER_MAP: Record<string, string> = {
  "EER, IOM 2005": EER_IDS.IOM_2005,
  "TMB x PAL": EER_IDS.TMB_PAL,
};

const LEGACY_GRASA_MAP: Record<string, string> = {
  "Ecuación de Peterson": GRASA_IDS.PETERSON,
  "Ecuación de Durnin y Womersley": GRASA_IDS.DURNIN_WOMERSLEY,
  "Ecuación de Jackson et al (3 Pliegues)": GRASA_IDS.JACKSON_3,
  "Ecuación de Jackson et al (7 Pliegues)": GRASA_IDS.JACKSON_7,
};

/** Normalize a formula value: if it's a legacy Spanish name, convert to ID; otherwise keep as-is */
function normalizeBmrId(raw: string): string {
  return LEGACY_BMR_MAP[raw] ?? raw;
}
function normalizeEerId(raw: string): string {
  return LEGACY_EER_MAP[raw] ?? raw;
}
function normalizeGrasaId(raw: string): string {
  return LEGACY_GRASA_MAP[raw] ?? raw;
}

/* ─── BMR formulas ─── */

function isMale(sexo: string | null): boolean {
  return (sexo || "").toUpperCase() === "MASCULINO";
}

// WHO/FAO/UNU — Schofield (1985), solo peso
function calcularBMR_OMS(pesoKg: number, edad: number, sexo: string | null): number {
  if (isMale(sexo)) {
    if (edad < 18) return 17.5 * pesoKg + 651;
    if (edad < 30) return 15.3 * pesoKg + 679;
    if (edad < 60) return 11.6 * pesoKg + 879;
    return 13.5 * pesoKg + 487;
  }
  if (edad < 18) return 12.2 * pesoKg + 746;
  if (edad < 30) return 14.7 * pesoKg + 496;
  if (edad < 60) return 8.7 * pesoKg + 829;
  return 10.5 * pesoKg + 596;
}

// Henry / Oxford (2005), peso + altura (m)
function calcularBMR_Henry(pesoKg: number, alturaCm: number, edad: number, sexo: string | null): number {
  const hM = alturaCm / 100;
  if (isMale(sexo)) {
    if (edad < 18) return 15.6 * pesoKg + 266 * hM + 299;
    if (edad < 30) return 14.4 * pesoKg + 313 * hM + 113;
    if (edad < 60) return 11.4 * pesoKg + 541 * hM - 137;
    return 11.4 * pesoKg + 541 * hM - 256;
  }
  if (edad < 18) return 9.40 * pesoKg + 249 * hM + 462;
  if (edad < 30) return 10.4 * pesoKg + 615 * hM - 282;
  if (edad < 60) return 8.18 * pesoKg + 502 * hM - 11.6;
  return 8.52 * pesoKg + 421 * hM + 10.7;
}

// Harris-Benedict original (1919)
function calcularBMR_HarrisBenedict(pesoKg: number, alturaCm: number, edad: number, sexo: string | null): number {
  return isMale(sexo)
    ? 66.5 + 13.75 * pesoKg + 5.003 * alturaCm - 6.755 * edad
    : 655.1 + 9.563 * pesoKg + 1.850 * alturaCm - 4.676 * edad;
}

// Harris-Benedict revisada (Roza & Shizgal, 1984)
function calcularBMR_HarrisBenedictRev(pesoKg: number, alturaCm: number, edad: number, sexo: string | null): number {
  return isMale(sexo)
    ? 88.362 + 13.397 * pesoKg + 4.799 * alturaCm - 5.677 * edad
    : 447.593 + 9.247 * pesoKg + 3.098 * alturaCm - 4.330 * edad;
}

// Mifflin-St Jeor (1990)
function calcularBMR_MifflinStJeor(pesoKg: number, alturaCm: number, edad: number, sexo: string | null): number {
  return 10 * pesoKg + 6.25 * alturaCm - 5 * edad + (isMale(sexo) ? 5 : -161);
}

// Katch-McArdle (1983) — necesita % grasa
function calcularBMR_KatchMcArdle(pesoKg: number, grasaPct: number | null): number | null {
  if (grasaPct == null) return null;
  const lbm = pesoKg * (1 - grasaPct / 100);
  return 370 + 21.6 * lbm;
}

// Cunningham (1980) — necesita % grasa
function calcularBMR_Cunningham(pesoKg: number, grasaPct: number | null): number | null {
  if (grasaPct == null) return null;
  const lbm = pesoKg * (1 - grasaPct / 100);
  return 500 + 22 * lbm;
}

// Black et al. (1996)
function calcularBMR_Black(pesoKg: number, alturaCm: number, edad: number, sexo: string | null): number {
  const hM = alturaCm / 100;
  const coef = isMale(sexo) ? 259 : 230;
  return coef * Math.pow(pesoKg, 0.48) * Math.pow(hM, 0.50) * Math.pow(Math.max(edad, 1), -0.13);
}

// Ten Haaf & Weijs (2014) — modelo peso (resultado en kJ, se convierte a kcal)
function calcularBMR_TenHaafPeso(pesoKg: number, alturaCm: number, edad: number, sexo: string | null): number {
  const kJ = 49.94 * pesoKg + 24.59 * alturaCm - 34.01 * edad + (isMale(sexo) ? 799.84 : 0) + 112.24;
  return kJ / 4.184;
}

// Ten Haaf & Weijs (2014) — modelo masa magra (resultado en kJ)
function calcularBMR_TenHaafLBM(pesoKg: number, grasaPct: number | null): number | null {
  if (grasaPct == null) return null;
  const ffm = pesoKg * (1 - grasaPct / 100);
  const kJ = 81.46 * ffm + 1886.1;
  return kJ / 4.184;
}

// Dispatcher — elige la fórmula según el ID
function calcularBMR(
  formulaId: string, pesoKg: number, alturaCm: number, edad: number, sexo: string | null, grasaPct: number | null
): number | null {
  const id = normalizeBmrId(formulaId);
  switch (id) {
    case BMR_IDS.OMS:                return calcularBMR_OMS(pesoKg, edad, sexo);
    case BMR_IDS.HENRY:              return calcularBMR_Henry(pesoKg, alturaCm, edad, sexo);
    case BMR_IDS.HARRIS_BENEDICT:    return calcularBMR_HarrisBenedict(pesoKg, alturaCm, edad, sexo);
    case BMR_IDS.HARRIS_BENEDICT_REV: return calcularBMR_HarrisBenedictRev(pesoKg, alturaCm, edad, sexo);
    case BMR_IDS.MIFFLIN_ST_JEOR:    return calcularBMR_MifflinStJeor(pesoKg, alturaCm, edad, sexo);
    case BMR_IDS.KATCH_MCARDLE:      return calcularBMR_KatchMcArdle(pesoKg, grasaPct);
    case BMR_IDS.CUNNINGHAM:         return calcularBMR_Cunningham(pesoKg, grasaPct);
    case BMR_IDS.BLACK:              return calcularBMR_Black(pesoKg, alturaCm, edad, sexo);
    case BMR_IDS.TEN_HAAF_PESO:      return calcularBMR_TenHaafPeso(pesoKg, alturaCm, edad, sexo);
    case BMR_IDS.TEN_HAAF_LBM:       return calcularBMR_TenHaafLBM(pesoKg, grasaPct);
    default:                          return calcularBMR_OMS(pesoKg, edad, sexo);
  }
}

/* ─── EER formulas ─── */

// IOM 2005 (Institute of Medicine)
function calcularEER_IOM2005(
  pesoKg: number,
  alturaCm: number,
  edad: number,
  sexo: string | null,
  pa: number
): number {
  const hM = alturaCm / 100;
  return isMale(sexo)
    ? 662 - 9.53 * edad + pa * (15.91 * pesoKg + 539.6 * hM)
    : 354 - 6.91 * edad + pa * (9.36 * pesoKg + 726 * hM);
}

// Dispatcher — elige EER según ID
function calcularEER(
  formulaId: string, bmr: number | null, pal: number,
  pesoKg: number, alturaCm: number, edad: number, sexo: string | null, paIom: number
): number | null {
  const id = normalizeEerId(formulaId);
  if (id === EER_IDS.TMB_PAL) return bmr != null ? bmr * pal : null;
  return calcularEER_IOM2005(pesoKg, alturaCm, edad, sexo, paIom);
}

function fmt1(n: number): string {
  return (Math.round(n * 10) / 10).toFixed(1);
}
function fmt2(n: number): string {
  return (Math.round(n * 100) / 100).toFixed(2);
}
function fmt3(n: number): string {
  return (Math.round(n * 1000) / 1000).toFixed(3);
}

function formatMonthYear(dateStr: string | null | undefined, locale: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  const localeMap: Record<string, string> = { es: "es-ES", pt: "pt-BR" };
  return new Intl.DateTimeFormat(localeMap[locale] ?? locale, { month: "long", year: "numeric" }).format(d);
}

/* ─── Reference data for macro sources ─── */

type MacroRefSource = {
  label: string;
  lipidos: string;
  carbohidratos: string;
  proteinas: string;
};

/* ─── Sub-components ─── */

type FormulaItem = { id: string; label: string };
type FormulaGroup = { title: string; items: FormulaItem[] };

function FormulaSelect({
  value,
  groups,
  onChange,
  searchPlaceholder,
  noResults,
}: {
  value: string;
  groups: FormulaGroup[];
  onChange: (next: string) => void;
  searchPlaceholder?: string;
  noResults?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const selectedLabel = useMemo(() => {
    for (const g of groups) {
      const found = g.items.find((it) => it.id === value);
      if (found) return found.label;
    }
    return value;
  }, [groups, value]);

  useEffect(() => {
    if (!open) return;
    function updatePos() {
      const el = anchorRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setPos({
        top: r.bottom + window.scrollY + 6,
        left: r.left + window.scrollX,
        width: r.width,
      });
    }
    updatePos();
    window.addEventListener("scroll", updatePos, { passive: true });
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos);
      window.removeEventListener("resize", updatePos);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleDown(e: MouseEvent) {
      const el = anchorRef.current;
      const dropdown = document.getElementById("formula-select-dropdown");
      const t = e.target as Node | null;
      if (!t) return;
      if (el && el.contains(t)) return;
      if (dropdown && dropdown.contains(t)) return;
      setOpen(false);
      setQuery("");
    }
    document.addEventListener("mousedown", handleDown);
    return () => document.removeEventListener("mousedown", handleDown);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((g) => ({ ...g, items: g.items.filter((it) => it.label.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length > 0);
  }, [groups, query]);

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full inline-flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-border bg-background text-sm hover:bg-muted/60 transition-colors"
      >
        <span className="truncate text-left">{selectedLabel}</span>
        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
      </button>

      {open && pos
        ? createPortal(
            <div
              id="formula-select-dropdown"
              className="rounded-xl border border-border bg-card shadow-xl"
              style={{ position: "absolute", top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
            >
              <div className="p-2 border-b border-border/60">
                <div className="flex items-center gap-2 px-2">
                  <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={searchPlaceholder ?? ""}
                    className="w-full bg-transparent outline-none text-sm"
                  />
                </div>
              </div>
              <div className="max-h-56 overflow-y-auto p-1">
                {filtered.length === 0 ? (
                  <div className="p-2 text-xs text-muted-foreground">{noResults ?? ""}</div>
                ) : (
                  filtered.map((g) => (
                    <div key={g.title}>
                      {g.title.trim().length > 0 && (
                        <div className="px-3 pt-2 pb-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                          {g.title}
                        </div>
                      )}
                      {g.items.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            onChange(opt.id);
                            setOpen(false);
                            setQuery("");
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted/60 transition-colors flex items-center justify-between gap-2"
                        >
                          <span className="text-sm">{opt.label}</span>
                          {opt.id === value && <Check className="w-4 h-4 text-primary shrink-0" />}
                        </button>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}

type ActivityOption = {
  label: string;
  pal: number;
  paIom: number;
};

function ActivitySelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: ActivityOption[];
  onChange: (next: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const anchorRef = useRef<HTMLButtonElement | null>(null);

  const selected = useMemo(() => options.find((o) => o.label === value) ?? options[0], [options, value]);

  useEffect(() => {
    if (!open) return;
    function updatePos() {
      const el = anchorRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setPos({
        top: r.bottom + window.scrollY + 6,
        left: r.left + window.scrollX,
        width: r.width,
      });
    }
    updatePos();
    window.addEventListener("scroll", updatePos, { passive: true });
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos);
      window.removeEventListener("resize", updatePos);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleDown(e: MouseEvent) {
      const el = anchorRef.current;
      const dropdown = document.getElementById("activity-select-dropdown");
      const t = e.target as Node | null;
      if (!t) return;
      if (el && el.contains(t)) return;
      if (dropdown && dropdown.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handleDown);
    return () => document.removeEventListener("mousedown", handleDown);
  }, [open]);

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full inline-flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-border bg-background text-sm hover:bg-muted/60 transition-colors"
      >
        <span className="truncate text-left">{selected.label}</span>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium shrink-0">
          PAL {fmt3(selected.pal)}
        </span>
      </button>

      {open && pos
        ? createPortal(
            <div
              id="activity-select-dropdown"
              style={{ position: "absolute", top: pos.top, left: pos.left, width: pos.width, zIndex: 9999 }}
              className="rounded-xl border border-border bg-card shadow-xl overflow-hidden"
            >
              <div className="max-h-56 overflow-y-auto p-1">
                {options.map((opt) => {
                  const active = opt.label === value;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => {
                        onChange(opt.label);
                        setOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted/60 transition-colors flex items-center justify-between gap-2"
                    >
                      <span className="text-sm">{opt.label}</span>
                      <span className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                          PAL {fmt3(opt.pal)}
                        </span>
                        {active && <Check className="w-4 h-4 text-primary shrink-0" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}

/* ─── Section header helper ─── */

function SectionTitle({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 text-base font-semibold text-primary">
      <Icon className="w-5 h-5" />
      {children}
    </h3>
  );
}

/* ─── Main component ─── */

export function PlanificacionPorDefectoTab({
  paciente,
  medidas,
  ficha,
  planificaciones: initialPlanificaciones = [],
  pacienteId,
}: {
  paciente: PacienteForPlanificacion;
  medidas: MedidaSerializada[];
  ficha: FichaInformacionData | null | undefined;
  planificaciones?: Planificacion[];
  pacienteId: string;
}) {
  const t = useTranslations("patients.planificacion");
  const tc = useTranslations("diets.comidaSlot.tipoLabels");
  const tDia = useTranslations("diets.editor.dayLabels");
  // Inicial de cada día: en español el miércoles es "X" para distinguirlo del martes.
  const tIni = useTranslations("patients.planificacion.diasIniciales");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const blockIfDemo = useDemoGuard();

  /* ─── Planificaciones state ─── */
  const [planificaciones, setPlanificaciones] = useState<Planificacion[]>(initialPlanificaciones);
  // Deep-link opcional: ?planificacion={id} abre directamente esa planificación (p. ej. desde el
  // banner "Datos de la planificación actual" al crear una dieta). Si no, la activa o la primera.
  const planiParam = searchParams.get("planificacion");
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    () =>
      (planiParam && initialPlanificaciones.some((p) => p.id === planiParam) ? planiParam : "") ||
      initialPlanificaciones.find((p) => p.estado === "activa")?.id ||
      initialPlanificaciones[0]?.id ||
      ""
  );
  const selectedPlan = useMemo(
    () => planificaciones.find((p) => p.id === selectedPlanId) ?? planificaciones[0] ?? null,
    [planificaciones, selectedPlanId]
  );
  const datos = selectedPlan?.datos ?? {};

  /* ─── Tab menu state ─── */
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{ top: number; right: number } | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement | null>(null);

  function closeMenu() {
    setMenuOpenId(null);
    setMenuAnchor(null);
  }

  /* Close menu on outside click / scroll / escape */
  useEffect(() => {
    if (!menuOpenId) return;
    function handleDown(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (target.closest("[data-menu-trigger]")) return;
      if (menuRef.current && !menuRef.current.contains(target)) closeMenu();
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") closeMenu();
    }
    function handleScroll() {
      closeMenu();
    }
    document.addEventListener("mousedown", handleDown);
    document.addEventListener("keydown", handleEsc);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleDown);
      document.removeEventListener("keydown", handleEsc);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [menuOpenId]);

  /* ─── Sort: activa first, then terminada/guardada grayed ─── */
  const sortedPlanificaciones = useMemo(() => {
    const activas = planificaciones.filter((p) => p.estado === "activa");
    const inactivas = planificaciones.filter((p) => p.estado !== "activa");
    return [...activas, ...inactivas];
  }, [planificaciones]);

  /* ─── Modal crear planificación ─── */
  const [showCrearModal, setShowCrearModal] = useState(false);
  const [crearNombre, setCrearNombre] = useState("");
  const [copiarDeId, setCopiarDeId] = useState<string>("");

  function openCrearModal() {
    setCrearNombre("");
    setCopiarDeId(planificaciones[0]?.id ?? "");
    setShowCrearModal(true);
  }

  async function handleCrearConfirm() {
    if (blockIfDemo()) return;
    if (!crearNombre.trim()) return;
    const datosCopiados = planificaciones.find((p) => p.id === copiarDeId)?.datos ?? {};
    startTransition(async () => {
      const newId = await crearPlanificacion(pacienteId, crearNombre.trim(), datosCopiados);
      const newPlan: Planificacion = {
        id: newId,
        pacienteId,
        nombre: crearNombre.trim(),
        estado: "activa",
        esDefecto: false,
        fechaInicio: new Date().toISOString(),
        fechaUltimoCambio: new Date().toISOString(),
        fechaFinPrevista: null,
        datos: datosCopiados,
      };
      setPlanificaciones((prev) => [...prev, newPlan]);
      setSelectedPlanId(newId);
      setShowCrearModal(false);
    });
  }

  async function handleRename(planId: string) {
    if (blockIfDemo()) return;
    if (!renameValue.trim()) return;
    startTransition(async () => {
      await renombrarPlanificacion(planId, renameValue.trim());
      setPlanificaciones((prev) =>
        prev.map((p) => (p.id === planId ? { ...p, nombre: renameValue.trim() } : p))
      );
      setRenamingId(null);
      setRenameValue("");
    });
  }

  async function handleCambiarEstado(planId: string, estado: "activa" | "terminada" | "guardada") {
    if (blockIfDemo()) return;
    startTransition(async () => {
      await cambiarEstadoPlanificacion(planId, estado);
      setPlanificaciones((prev) =>
        prev.map((p) => (p.id === planId ? { ...p, estado } : p))
      );
      setMenuOpenId(null);
    });
  }

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  function handleEliminarClick(planId: string) {
    closeMenu();
    setDeleteConfirmId(planId);
  }

  async function handleEliminarConfirm() {
    if (blockIfDemo()) return;
    if (!deleteConfirmId) return;
    const planId = deleteConfirmId;
    startTransition(async () => {
      await eliminarPlanificacion(planId, pacienteId);
      setPlanificaciones((prev) => prev.filter((p) => p.id !== planId));
      if (selectedPlanId === planId) {
        const remaining = planificaciones.filter((p) => p.id !== planId);
        setSelectedPlanId(remaining[0]?.id ?? "");
      }
      setDeleteConfirmId(null);
    });
  }
  /* --- Constants (using IDs + translated labels) --- */
  // Fórmulas de % masa grasa, sin duplicados. (Antes había grupos "Brozek" y "Siri" con
  // las MISMAS fórmulas repetidas — bug visual. Hoy el selector solo etiqueta qué método
  // declara el nutri; el % grasa proviene de la medida o se introduce a mano.)
  const FORMULAS_MASA_GRASA_GROUPS: FormulaGroup[] = [
    {
      title: "",
      items: [
        { id: GRASA_IDS.PETERSON, label: t("ecuacionPeterson") },
        { id: GRASA_IDS.DURNIN_WOMERSLEY, label: t("ecuacionDurninWomersley") },
        { id: GRASA_IDS.JACKSON_3, label: t("ecuacionJackson3") },
        { id: GRASA_IDS.JACKSON_7, label: t("ecuacionJackson7") },
      ],
    },
  ];

  const ACTIVIDAD_OPTS: ActivityOption[] = [
    { label: t("actividadSedentario"), pal: 1.195, paIom: 1.16 },
    { label: t("actividadPocoActivo"), pal: 1.495, paIom: 1.26 },
    { label: t("actividadActivo"), pal: 1.745, paIom: 1.38 },
    { label: t("actividadMuyActivo"), pal: 2.2, paIom: 1.55 },
    { label: t("actividadPersonalizado"), pal: 1.5, paIom: 1.3 },
  ];

  function mapActividad(raw: string) {
    const s = raw.trim().toLowerCase();
    if (!s) return null;
    for (const opt of ACTIVIDAD_OPTS) {
      if (s === opt.label.toLowerCase()) return opt.label;
    }
    if (s.includes("sedent")) return t("actividadSedentario");
    if (s.includes("poco")) return t("actividadPocoActivo");
    if (s.includes("muy activo")) return t("actividadMuyActivo");
    if (s.includes("activo")) return t("actividadActivo");
    return null;
  }

  const actividadRegistradaRaw = ficha?.personalSocial?.actividadFisica?.trim() || "";
  const actividadInicial = mapActividad(actividadRegistradaRaw) ?? t("actividadSedentario");

  const [actividadActualLabel, setActividadActualLabel] = useState<string>(
    datos.actividadActual ?? actividadInicial
  );
  const [actividadObjetivoLabel, setActividadObjetivoLabel] = useState<string>(
    datos.actividadObjetivo ?? t("actividadActivo")
  );
  const [palCustomActual, setPalCustomActual] = useState(
    datos.palCustomActual != null ? String(datos.palCustomActual) : "1.5"
  );
  const [palCustomObjetivo, setPalCustomObjetivo] = useState(
    datos.palCustomObjetivo != null ? String(datos.palCustomObjetivo) : "1.5"
  );

  const actividadActualOpt = useMemo(() => {
    const opt = ACTIVIDAD_OPTS.find((o) => o.label === actividadActualLabel) ?? ACTIVIDAD_OPTS[0];
    if (opt.label === t("actividadPersonalizado")) {
      const p = parseFloat(palCustomActual) || 1.5;
      return { ...opt, pal: p, paIom: p / 1.3 };
    }
    return opt;
  }, [ACTIVIDAD_OPTS, actividadActualLabel, palCustomActual]);

  const actividadObjetivoOpt = useMemo(() => {
    const opt = ACTIVIDAD_OPTS.find((o) => o.label === actividadObjetivoLabel) ?? ACTIVIDAD_OPTS[2];
    if (opt.label === t("actividadPersonalizado")) {
      const p = parseFloat(palCustomObjetivo) || 1.5;
      return { ...opt, pal: p, paIom: p / 1.3 };
    }
    return opt;
  }, [ACTIVIDAD_OPTS, actividadObjetivoLabel, palCustomObjetivo]);

  const [formulaMasaGrasa, setFormulaMasaGrasa] = useState(
    normalizeGrasaId(datos.formulaMasaGrasa ?? GRASA_IDS.PETERSON)
  );

  const BMR_FORMULA_GROUPS: FormulaGroup[] = [
    {
      title: "",
      items: [
        { id: BMR_IDS.OMS, label: t("ecuacionOms") },
        { id: BMR_IDS.HENRY, label: t("ecuacionHenry") },
        { id: BMR_IDS.BLACK, label: t("ecuacionBlack") },
        { id: BMR_IDS.CUNNINGHAM, label: t("ecuacionCunningham") },
        { id: BMR_IDS.HARRIS_BENEDICT, label: t("ecuacionHarrisBenedict") },
        { id: BMR_IDS.HARRIS_BENEDICT_REV, label: t("ecuacionRevisadaHarrisBenedict") },
        { id: BMR_IDS.MIFFLIN_ST_JEOR, label: t("ecuacionMifflinStJeor") },
        { id: BMR_IDS.KATCH_MCARDLE, label: t("ecuacionKatchMcArdle") },
        { id: BMR_IDS.TEN_HAAF_PESO, label: t("ecuacionTenHaafPeso") },
        { id: BMR_IDS.TEN_HAAF_LBM, label: t("ecuacionTenHaafMasaMagra") },
      ],
    },
  ];

  const EER_FORMULA_GROUPS: FormulaGroup[] = [
    {
      title: "",
      items: [
        { id: EER_IDS.IOM_2005, label: t("eerIom2005") },
        { id: EER_IDS.TMB_PAL, label: t("tmbXPal") },
      ],
    },
  ];

  const [bmrFormula, setBmrFormula] = useState<string>(normalizeBmrId(datos.formulaBmr ?? BMR_IDS.OMS));
  const [eerFormula, setEerFormula] = useState<string>(normalizeEerId(datos.formulaEer ?? EER_IDS.IOM_2005));
  const [eerObjetivoInput, setEerObjetivoInput] = useState(datos.eerObjetivo ?? "");
  // Ajuste por objetivo (déficit/superávit). Init: lo guardado o el por defecto del objetivo.
  // Ajuste de déficit/superávit MANUAL: empieza sin aplicar (null). El nutri lo activa
  // pulsando un botón (-10/-15/-20%…) o escribe el EER objetivo a mano.
  // Solo se considera un ajuste activo si hay un EER objetivo guardado: evita el botón "fantasma"
  // (ej. -20% marcado sin que el objetivo refleje el descuento porque el input está vacío).
  const [ajustePct, setAjustePct] = useState<number | null>(datos.eerObjetivo ? (datos.ajusteObjetivoPct ?? null) : null);

  /* --- Macro reference source --- */
  const gDia = t("unidadGDia");
  const MACRO_REF_SOURCES: MacroRefSource[] = useMemo(() => [
    {
      label: "Food and Nutrition Board / IOM",
      lipidos: "20 - 35%",
      carbohidratos: "45 - 65%",
      proteinas: "10 - 35%",
    },
    {
      label: "ANSES, 2016",
      lipidos: "35 - 40%",
      carbohidratos: "40 - 55%",
      proteinas: "10 - 20%",
    },
    {
      label: "SACN",
      lipidos: "35%",
      carbohidratos: "50%",
      proteinas: `45 ${gDia}`,
    },
    {
      label: "SINU, 2014",
      lipidos: "20 - 35%",
      carbohidratos: "45 - 65%",
      proteinas: `54 ${gDia}`,
    },
    {
      label: "NHMRC 2006",
      lipidos: "20 - 35%",
      carbohidratos: "45 - 65%",
      proteinas: `46 ${gDia}`,
    },
  ], [gDia]);
  const [macroRefIdx, setMacroRefIdx] = useState(datos.macroRefIdx ?? 0);
  const macroRef = MACRO_REF_SOURCES[macroRefIdx];

  /* --- Macro percentages (editable) --- */
  const [grasaPct, setGrasaPct] = useState(datos.grasaPct ?? 30);
  const [carbPct, setCarbPct] = useState(datos.carbPct ?? 50);
  const [protPct, setProtPct] = useState(datos.protPct ?? 20);
  // Edición directa de gramos por macro: buffer mientras se teclea; se aplica al salir del campo
  // (evita que el input "salte" al recalcularse el % en cada tecla).
  const [gramosEdit, setGramosEdit] = useState<{ macro: "grasa" | "carb" | "prot"; val: string } | null>(null);
  // #78 (g·kg) — edición de gramos por kilo de peso (buffer; al confirmar pasa a gramos → % como gramosEdit).
  const [gkgEdit, setGkgEdit] = useState<{ macro: "grasa" | "carb" | "prot"; val: string } | null>(null);

  /* --- #78-C: Reparto por comida (configuración avanzada) --- */
  // Solo estado INICIAL (montaje); al cambiar de planificación re-sincroniza el efecto de abajo.
  const [repartoActivo, setRepartoActivo] = useState(datos.repartoPorComida?.activo ?? false);
  const [reparto, setReparto] = useState<RepartoComida[]>(() => normalizeReparto(datos.repartoPorComida).comidas);
  // Fila expandida para editar el override de macros de esa comida (por tipo). null = todas plegadas.
  const [repartoExpandido, setRepartoExpandido] = useState<string | null>(null);
  // Panel desplegado (solo visual, independiente de si el reparto está activo). Arranca plegado:
  // la pestaña es larga y el resumen de la cabecera ya dice lo que hay guardado.
  const [repartoAbierto, setRepartoAbierto] = useState(false);
  // Edición directa de kcal / gramos por comida: buffer mientras se teclea, se aplica al salir del
  // campo (mismo patrón que gramosEdit/gkgEdit de la tabla del día — evita que el input "salte").
  const [mealKcalEdit, setMealKcalEdit] = useState<{ tipo: string; val: string } | null>(null);
  const [mealGramEdit, setMealGramEdit] = useState<{ tipo: string; macro: "grasa" | "carb" | "prot"; val: string } | null>(null);
  // Última comida cuyo % se tecleó: al "cuadrar el resto" se respeta ese valor y se reajustan las demás.
  const [ultimoPctTocado, setUltimoPctTocado] = useState<string | null>(null);
  // Formulario de "añadir comida" al reparto (nombre + hora).
  const [nuevaComidaAbierta, setNuevaComidaAbierta] = useState(false);
  const [nuevaComidaNombre, setNuevaComidaNombre] = useState("");
  const [nuevaComidaHora, setNuevaComidaHora] = useState("");
  // Hueco elegido para la comida nueva (índice en la lista de comidas ya ordenada por hora).
  const [nuevaComidaPos, setNuevaComidaPos] = useState(0);
  // Día que se muestra en la tabla: con comidas que no están todos los días, las kcal de cada día
  // son distintas (cada uno reparte su objetivo entre las comidas que tiene).
  const [diaVistaReparto, setDiaVistaReparto] = useState<string>(DIAS_SEMANA[0]);
  // Días en los que va la comida nueva (por defecto todos; se marcan en el propio formulario).
  const [nuevaComidaDias, setNuevaComidaDias] = useState<string[]>([...DIAS_SEMANA]);
  // Aviso de "no cuadra al 100%": se lee y se cierra a mano (no un toast que se escapa). Se guarda
  // la firma de lo avisado: si cambian los días o los %, vuelve a salir porque es info nueva.
  const [avisoRepartoVisto, setAvisoRepartoVisto] = useState<string | null>(null);
  // "No volver a avisar": se recuerda en el navegador, igual que el aviso de desvío al crear dieta.
  const [avisoRepartoSilenciado, setAvisoRepartoSilenciado] = useState(false);
  useEffect(() => {
    setAvisoRepartoSilenciado(localStorage.getItem("annonia-aviso-reparto-dias") === "off");
  }, []);

  /* --- Editable weight/body fat inputs --- */
  const pesoInicialActual = latestValue(medidas, "peso") ?? paciente.peso ?? null;
  const pesoInicialObjetivo = parseKgFromObjetivoDetalle(paciente.objetivoDetalle);
  const grasaInicialActual = latestValue(medidas, "grasaCorporal");

  const [pesoActualInput, setPesoActualInput] = useState(datos.pesoActual ?? (pesoInicialActual != null ? String(pesoInicialActual) : ""));
  const [pesoObjetivoInput, setPesoObjetivoInput] = useState(
    datos.pesoObjetivo ?? (pesoInicialObjetivo != null ? String(pesoInicialObjetivo) : "")
  );
  const [grasaActualInput, setGrasaActualInput] = useState(datos.grasaActual ?? (grasaInicialActual != null ? String(grasaInicialActual) : ""));
  const [grasaObjetivoInput, setGrasaObjetivoInput] = useState(datos.grasaObjetivo ?? "");
  const [imcObjetivoInput, setImcObjetivoInput] = useState(datos.imcObjetivo ?? "");

  /* --- Derived values (all logic preserved) --- */

  const pesoActual = pesoActualInput ? parseFloat(pesoActualInput) || null : null;
  const alturaActual = useMemo(
    () => latestValue(medidas, "altura") ?? paciente.altura ?? null,
    [medidas, paciente.altura]
  );
  const grasaActual = grasaInicialActual;

  const pesoObjetivo = pesoObjetivoInput ? parseFloat(pesoObjetivoInput) || null : null;

  const edad = useMemo(() => calcularEdad(paciente.fechaNacimiento), [paciente.fechaNacimiento]);

  const valores = useMemo(() => {
    const w = pesoActual;
    const h = alturaActual;
    const a = edad;
    if (!w || !h) return null;

    const imcActual = Number.isFinite(w) && Number.isFinite(h) ? calcularIMC(w, h) : null;
    const imcObjetivo =
      pesoObjetivo && Number.isFinite(pesoObjetivo) ? calcularIMC(pesoObjetivo, h) : null;

    const grasaActPct = grasaActualInput ? parseFloat(grasaActualInput) || null : null;
    const grasaObjPct = grasaObjetivoInput ? parseFloat(grasaObjetivoInput) || null : null;

    const bmrActual = a != null ? calcularBMR(bmrFormula, w, h, a, paciente.sexo, grasaActPct) : null;

    const eerActual = a != null
      ? calcularEER(eerFormula, bmrActual, actividadActualOpt.pal, w, h, a, paciente.sexo, actividadActualOpt.paIom)
      : null;

    // Referencia = mismo BMR actual pero con la actividad objetivo
    const eerReferencia = a != null
      ? calcularEER(eerFormula, bmrActual, actividadObjetivoOpt.pal, w, h, a, paciente.sexo, actividadObjetivoOpt.paIom)
      : null;

    return {
      imcActual,
      imcObjetivo,
      bmrActual,
      eerActual,
      eerReferencia,
    };
  }, [
    pesoActual,
    alturaActual,
    edad,
    pesoObjetivo,
    paciente.sexo,
    bmrFormula,
    eerFormula,
    grasaActualInput,
    actividadActualOpt.pal,
    actividadActualOpt.paIom,
    actividadObjetivoOpt.pal,
    actividadObjetivoOpt.paIom,
  ]);

  // EER objetivo "efectivo": si el nutri fijó un valor a mano, ese; si no, se deriva del
  // gasto actual aplicando el ajuste del objetivo (déficit/superávit). Así "sale ya calculado".
  // El valor objetivo es el del input. Los botones de ajuste escriben el valor calculado
  // directamente en el input, por eso se ve en negro (como si lo hubieras tecleado).
  const eerObjetivoEfectivo = useMemo<number | null>(() => {
    const v = parseFloat(eerObjetivoInput);
    return Number.isFinite(v) ? v : null;
  }, [eerObjetivoInput]);

  const macros = useMemo(() => {
    const w = pesoActual || 1;
    const kcal = Math.max(0, Math.round(eerObjetivoEfectivo ?? 0));
    const grasaG = Math.round((kcal * grasaPct) / 100 / 9);
    const carbG = Math.round((kcal * carbPct) / 100 / 4);
    const protG = Math.round((kcal * protPct) / 100 / 4);
    return {
      kcal,
      grasaG,
      carbG,
      protG,
      grasaGKg: pesoActual ? grasaG / pesoActual : 0,
      carbGKg: pesoActual ? carbG / pesoActual : 0,
      protGKg: pesoActual ? protG / pesoActual : 0,
    };
  }, [eerObjetivoEfectivo, pesoActual, grasaPct, carbPct, protPct]);

  /* ─── #78-C: presets de macros con nombre ─── */
  // Preset que coincide con la distribución actual del día (o "" = personalizada).
  const presetActivoId = useMemo(
    () => MACRO_PRESETS.find((p) => p.grasa === grasaPct && p.carb === carbPct && p.prot === protPct)?.id ?? "",
    [grasaPct, carbPct, protPct]
  );
  function aplicarPreset(id: string) {
    const p = MACRO_PRESETS.find((x) => x.id === id);
    if (!p) return;
    setGrasaPct(p.grasa);
    setCarbPct(p.carb);
    setProtPct(p.prot);
  }

  /* ─── #78-C: reparto por comida — mutadores y cálculo en vivo ─── */
  // Se identifica por CLAVE (tipo para las fijas, nombre para las añadidas): con varias comidas
  // propias en el reparto, emparejar por `tipo` las confundiría todas (todas son OTRA).
  function updateComida(clave: string, patch: Partial<RepartoComida>) {
    setReparto((prev) => setFila(prev, clave, patch));
  }
  function repartirEquitativamente() {
    setReparto(repartirEquitativo);
  }
  function heredarMacrosDia(clave: string) {
    setReparto((prev) => heredarMacrosFila(prev, clave));
  }

  /* ─── Estructura de comidas: la planificación define QUÉ comidas tendrá la dieta (#78-C/#104) ─── */

  // Añade una comida propia al reparto (pre-entreno, snack…). Se identifica por su nombre, así que
  // no se admiten nombres repetidos. Nace con un 10% y las demás se reajustan al cuadrar.
  function anadirComidaReparto(nombre: string, hora: string, dias: string[]) {
    // Nace con un 10% y NO se toca el % de las demás (el nutri ya los había decidido). El nombre es
    // su identidad, así que `anadirFila` devuelve null si ya hay una comida con ese nombre.
    const conNueva = anadirFila(reparto, { nombre, hora, dias });
    if (!conNueva) {
      if (nombre.trim()) toast.error(t("repartoComidaRepetida"));
      return;
    }
    setReparto(conNueva);
    setUltimoPctTocado(null);
  }

  // Huecos donde puede ir una comida nueva, en el orden real del día. Cada hueco lleva la hora que
  // le corresponde, así el nutri piensa en "entre el desayuno y la comida" y no en horas.
  const huecosComida = useMemo(() => {
    // Se calcula desde `reparto` (no de repartoCalc, que se declara más abajo): comidas incluidas
    // ordenadas por su hora efectiva, que es el orden real del día.
    const incluidas = [...reparto]
      .filter((c) => c.incluida)
      .sort((a, b) => minutosDeHora(horaEfectiva(a)) - minutosDeHora(horaEfectiva(b)))
      .map((c) => ({ ...c, etiqueta: (c.nombre ?? "").trim() || tc(c.tipo) }));
    const out: { label: string; hora: string }[] = [];
    out.push({
      label: incluidas.length > 0 ? t("repartoPosAntesDe", { comida: incluidas[0].etiqueta }) : t("repartoPosUnica"),
      hora: horaEntreComidas(null, incluidas[0] ? horaEfectiva(incluidas[0]) : null),
    });
    for (let i = 0; i < incluidas.length; i++) {
      const actual = incluidas[i];
      const siguiente = incluidas[i + 1];
      out.push({
        label: siguiente
          ? t("repartoPosEntre", { a: actual.etiqueta, b: siguiente.etiqueta })
          : t("repartoPosDespuesDe", { comida: actual.etiqueta }),
        hora: horaEntreComidas(horaEfectiva(actual), siguiente ? horaEfectiva(siguiente) : null),
      });
    }
    return out;
  }, [reparto, t, tc]);

  // Al elegir hueco se propone su hora (editable después: si la cambias, la comida se recoloca).
  function elegirHuecoComida(idx: number) {
    setNuevaComidaPos(idx);
    setNuevaComidaHora(huecosComida[idx]?.hora ?? "");
  }

  function confirmarNuevaComida() {
    if (!nuevaComidaNombre.trim()) return;
    // Nace en todos los días (se ajusta con los cuadraditos) y SIEMPRE con hora: la del hueco
    // elegido si no se tocó el campo, para que caiga en su sitio en vez de quedar descolocada.
    anadirComidaReparto(
      nuevaComidaNombre,
      nuevaComidaHora || huecosComida[nuevaComidaPos]?.hora || "",
      nuevaComidaDias,
    );
    setNuevaComidaNombre("");
    setNuevaComidaHora("");
    setNuevaComidaDias([...DIAS_SEMANA]);
    setNuevaComidaAbierta(false);
  }

  function quitarComidaReparto(clave: string) {
    setReparto((prev) => quitarFila(prev, clave));
  }

  // Alias visible de una comida FIJA ("Comida" para el Almuerzo): que el reparto hable el mismo
  // idioma que la dieta, y que la comida se cree ya con ese nombre.
  function renombrarComidaReparto(clave: string, nombre: string) {
    setReparto((prev) => renombrarFila(prev, clave, nombre));
  }

  // Días en los que existe una comida (vacío = todos). Permite "pre-entreno solo L-X-V".
  function toggleDiaComida(clave: string, dia: string) {
    setReparto((prev) => toggleDiaFila(prev, clave, dia));
  }
  // Aplica un preset de macros con nombre (la Zona, cetogénica…) SOLO a esta comida (crea su override).
  function aplicarPresetComida(clave: string, id: string) {
    setReparto((prev) => aplicarPresetMacrosFila(prev, clave, id));
  }

  // Preset de reparto de kcal que coincide con el estado actual ("" = personalizada). Solo compara
  // inclusión y % kcal; los overrides de macros por comida son independientes del preset.
  // Los presets solo hablan de las 6 comidas fijas: con comidas añadidas nunca hay coincidencia
  // exacta, así que se muestran como "Personalizada" (y no se compara contra ellas).
  const repartoPresetActivoId = useMemo(() => presetKcalActivo(reparto), [reparto]);
  function aplicarRepartoPreset(id: string) {
    setReparto((prev) => aplicarPresetKcal(prev, id));
  }

  /* ─── #78-C: edición bidireccional (misma interacción que la tabla de macros del día) ─── */

  // Macros EFECTIVOS de una comida: su override propio o, si hereda, la distribución del día.
  function macrosEfectivos(clave: string): { grasa: number; carb: number; prot: number } {
    const c = reparto.find((x) => claveComida(x) === clave);
    return { grasa: c?.grasaPct ?? grasaPct, carb: c?.carbPct ?? carbPct, prot: c?.protPct ?? protPct };
  }

  // Slider de % kcal de una comida: fija esa comida y re-equilibra las DEMÁS incluidas en
  // proporción a lo que tenían, cuadrando la suma en 100 exacto (los restos mayores se llevan
  // el punto sobrante). Equivalente por-comidas del handleSliderDrag de los macros del día.
  function handleMealSliderDrag(clave: string, newVal: number) {
    setReparto((prev) => fijarPctFila(prev, clave, newVal));
  }

  // "Cuadrar el resto": deja como está la comida que acabas de teclear y reajusta las demás para
  // llegar al 100%. Reutiliza el re-equilibrio del slider aplicándolo al valor que ya tiene.
  function cuadrarResto() {
    const incluidas = reparto.filter((c) => c.incluida);
    if (incluidas.length < 2) return;
    const fija =
      incluidas.find((c) => claveComida(c) === ultimoPctTocado) ??
      // Sin nada tecleado aún, se respeta la comida con más peso (suele ser la principal del día).
      incluidas.reduce((a, b) => (b.kcalPct > a.kcalPct ? b : a));
    handleMealSliderDrag(claveComida(fija), fija.kcalPct);
  }

  // kcal de una comida editables → se convierten a % del día y re-equilibran las demás.
  function handleMealKcalChange(clave: string, raw: string) {
    if (!macros.kcal || macros.kcal <= 0) return;
    const kcal = parseFloat(raw.replace(",", "."));
    if (!Number.isFinite(kcal) || kcal < 0) return;
    handleMealSliderDrag(clave, Math.round((kcal / macros.kcal) * 100));
  }
  function mealKcalValue(clave: string, calc: number): string {
    return mealKcalEdit?.tipo === clave ? mealKcalEdit.val : String(calc);
  }
  function commitMealKcal(clave: string) {
    if (mealKcalEdit?.tipo === clave) {
      handleMealKcalChange(clave, mealKcalEdit.val);
      setMealKcalEdit(null);
    }
  }

  // Fija un macro de una comida (crea el override desde los efectivos si heredaba). Con
  // rebalance, los otros dos macros se reparten el resto en proporción — igual que el día.
  function setMacroComida(clave: string, macro: "grasa" | "carb" | "prot", val: number, rebalance: boolean) {
    const eff = macrosEfectivos(clave);
    const clamped = Math.max(0, Math.min(100, val));
    const next = { ...eff, [macro]: clamped };
    if (rebalance) {
      const [o1, o2] = (["grasa", "carb", "prot"] as const).filter((m) => m !== macro);
      const remaining = 100 - clamped;
      const totalOtros = eff[o1] + eff[o2];
      if (totalOtros === 0) {
        const half = Math.round(remaining / 2);
        next[o1] = half;
        next[o2] = remaining - half;
      } else {
        next[o1] = Math.round((eff[o1] / totalOtros) * remaining);
        next[o2] = remaining - next[o1];
      }
    }
    updateComida(clave, { grasaPct: next.grasa, carbPct: next.carb, protPct: next.prot });
  }

  // Gramos de un macro de una comida editables → % sobre las kcal de ESA comida, y re-equilibra
  // sus otros dos macros (misma filosofía que editar los gramos en la tabla del día).
  function handleMealGramChange(clave: string, macro: "grasa" | "carb" | "prot", raw: string) {
    const kcalComida = repartoCalc.filas.find((f) => f.clave === clave)?.kcalComida ?? 0;
    if (kcalComida <= 0) return;
    const g = parseFloat(raw.replace(",", "."));
    if (!Number.isFinite(g) || g < 0) return;
    const kcalPorG = macro === "grasa" ? 9 : 4;
    setMacroComida(clave, macro, Math.round(((g * kcalPorG) / kcalComida) * 100), true);
  }
  function mealGramValue(clave: string, macro: "grasa" | "carb" | "prot", calc: number): string {
    return mealGramEdit && mealGramEdit.tipo === clave && mealGramEdit.macro === macro
      ? mealGramEdit.val
      : String(calc);
  }
  function commitMealGram(clave: string, macro: "grasa" | "carb" | "prot") {
    if (mealGramEdit && mealGramEdit.tipo === clave && mealGramEdit.macro === macro) {
      handleMealGramChange(clave, macro, mealGramEdit.val);
      setMealGramEdit(null);
    }
  }

  // Cálculo en vivo por comida a partir de los % y del objetivo del día.
  const repartoCalc = useMemo(() => {
    // Reparto exacto (restos mayores) sobre las comidas que participan: si los % suman 100, las kcal
    // de las filas suman el objetivo del día justo, sin el "2484 de 2482" del redondeo simple.
    // Solo las comidas que existen EL DÍA QUE SE ESTÁ VIENDO, con sus pesos normalizados a 100:
    // exactamente el mismo cálculo que hace el editor de dietas, para que los números coincidan.
    const enEsteDia = (c: RepartoComida) =>
      !c.dias || c.dias.length === 0 || c.dias.includes(diaVistaReparto);
    const idxActivas = reparto
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => c.incluida && c.kcalPct > 0 && enEsteDia(c));
    // % literales (sin re-escalar): la tabla debe mostrar exactamente lo que reparte el día, aunque
    // se pase o se quede corto. Así el total del pie cuadra con el % de arriba.
    const pesos = idxActivas.map(({ c }) => c.kcalPct);
    const kcalActivas = repartirKcal(macros.kcal, pesos);
    const kcalPorIdx = new Map(idxActivas.map(({ i }, n) => [i, kcalActivas[n]]));
    const cuotaPorIdx = new Map(idxActivas.map(({ i }, n) => [i, pesos[n]]));

    const ordenadas = [...reparto]
      .map((c, i) => ({ c, i }))
      .sort((a, b) => minutosDeHora(horaEfectiva(a.c)) - minutosDeHora(horaEfectiva(b.c)));
    const filas = ordenadas.map(({ c, i }) => {
      const mGrasa = c.grasaPct ?? grasaPct;
      const mCarb = c.carbPct ?? carbPct;
      const mProt = c.protPct ?? protPct;
      const kcalComida = kcalPorIdx.get(i) ?? 0;
      // Gramos con la fórmula compartida (`objetivoDeFila`), la misma que usan las pastillas
      // "llevas / objetivo" de cada comida en el editor de dietas: si aquí se calculara aparte, la
      // tabla y la dieta dirían gramos distintos para la misma comida.
      const obj = objetivoDeFila(kcalComida, cuotaPorIdx.get(i) ?? 0, c, {
        proteinas: macros.protG,
        carbohidratos: macros.carbG,
        grasas: macros.grasaG,
      });
      return {
        ...c,
        clave: claveComida(c),
        enDiaVisto: enEsteDia(c),
        cuotaReal: cuotaPorIdx.get(i) ?? 0,
        // Nombre que se muestra: el alias del nutri si lo hay; si no, la etiqueta del tipo.
        etiqueta: (c.nombre ?? "").trim() || tc(c.tipo),
        esAnadida: c.tipo === "OTRA",
        overrideActivo: c.grasaPct != null || c.carbPct != null || c.protPct != null,
        mGrasa,
        mCarb,
        mProt,
        macroSuma: mGrasa + mCarb + mProt,
        kcalComida,
        grasaG: obj.grasaG ?? 0,
        carbG: obj.carbG ?? 0,
        protG: obj.protG ?? 0,
      };
    });
    const incluidas = filas.filter((c) => c.incluida);
    const sumaKcalPct = incluidas.reduce((s, c) => s + c.kcalPct, 0);
    // Suma POR DÍA: solo cuentan las comidas que existen ese día. Con comidas que no están todos
    // los días (un pre-entreno los lunes), la suma global no significa nada: lo que importa es si
    // CADA día cuadra. Y ojo: con % globales es imposible que dos días con distinto nº de comidas
    // sumen 100 a la vez, por eso el editor renormaliza cada día.
    const sumaPorDia = DIAS_SEMANA.map((d) => ({
      dia: d,
      pct: incluidas.filter((c) => !c.dias || c.dias.length === 0 || c.dias.includes(d))
        .reduce((s, c) => s + c.kcalPct, 0),
    }));
    const hayComidasPorDias = incluidas.some((c) => c.dias && c.dias.length > 0 && c.dias.length < DIAS_SEMANA.length);
    const diasDescuadrados = sumaPorDia.filter((x) => x.pct !== 100);
    // Sumar las kcal YA redondeadas de las filas para que el pie cuadre siempre con la tabla.
    return {
      filas,
      sumaKcalPct,
      sumaPorDia,
      pctDiaVisto: sumaPorDia.find((x) => x.dia === diaVistaReparto)?.pct ?? sumaKcalPct,
      // "LMXJVS 110% · D 91%": los días con el mismo % se agrupan para que quepa de un vistazo.
      detallePorDia: [...new Set(sumaPorDia.map((x) => x.pct))]
        .sort((a, b) => b - a)
        .map((pct) => {
          const dias = sumaPorDia.filter((x) => x.pct === pct);
          return `${dias.length === DIAS_SEMANA.length ? "" : dias.map((x) => tIni(x.dia)).join("")} ${pct}%`.trim();
        })
        .join(" · "),
      hayComidasPorDias,
      diasDescuadrados,
      // Identifica ESTE aviso concreto: si cambia, el aviso descartado vuelve a mostrarse.
      firmaAviso: diasDescuadrados.map((x) => `${x.dia}:${x.pct}`).join("|"),
      // Detalle legible del descuadre: si son todos los días, no se listan los siete.
      detalleDescuadre: [...new Set(diasDescuadrados.map((x) => x.pct))]
        .sort((a, b) => b - a)
        .map((pct) => {
          const dias = diasDescuadrados.filter((x) => x.pct === pct);
          if (dias.length === DIAS_SEMANA.length) return `${pct}%`;
          return `${dias.map((x) => tDia(x.dia)).join(", ")}: ${pct}%`;
        })
        .join(" · "),
      todosLosDiasIgual: diasDescuadrados.length === DIAS_SEMANA.length,
      kcalAsignadas: incluidas.filter((c) => c.enDiaVisto).reduce((s, c) => s + c.kcalComida, 0),
    };
  }, [reparto, grasaPct, carbPct, protPct, macros.kcal, diaVistaReparto, tDia, tIni]);

  /* ─── Aplicar los objetivos calculados (kcal + macros) a una dieta del paciente (#9) ─── */
  const [aplicarAbierto, setAplicarAbierto] = useState(false);
  const [planesPaciente, setPlanesPaciente] = useState<
    { id: string; nombre: string; activo: boolean; caloriasObjetivo: number | null; planificacionIds: string[] }[] | null
  >(null);
  const [aplicandoPlanId, setAplicandoPlanId] = useState<string | null>(null);

  async function cargarPlanesPaciente() {
    if (planesPaciente !== null) return;
    try {
      const planes = await getPlanesPaciente(pacienteId);
      setPlanesPaciente(
        planes.map((p) => ({
          id: p.id,
          nombre: p.nombre,
          activo: p.activo,
          caloriasObjetivo: p.caloriasObjetivo,
          planificacionIds: p.planificacionIds ?? [],
        }))
      );
    } catch {
      setPlanesPaciente([]);
    }
  }

  async function abrirAplicarObjetivos() {
    if (blockIfDemo()) return;
    if (aplicarAbierto) { setAplicarAbierto(false); return; }
    setAplicarAbierto(true);
    await cargarPlanesPaciente();
  }

  async function aplicarObjetivosAPlan(planId: string, planNombre: string) {
    if (blockIfDemo()) return;
    setAplicandoPlanId(planId);
    try {
      await actualizarPlan(planId, {
        caloriasObjetivo: macros.kcal,
        proteinasObjetivo: macros.protG,
        carbohidratosObjetivo: macros.carbG,
        grasasObjetivo: macros.grasaG,
      });
      setPlanesPaciente((prev) =>
        prev?.map((p) => (p.id === planId ? { ...p, caloriasObjetivo: macros.kcal } : p)) ?? prev
      );
      toast.success(t("aplicarObjetivosOk", { plan: planNombre }));
      setAplicarAbierto(false);
    } catch {
      toast.error(t("aplicarObjetivosError"));
    } finally {
      setAplicandoPlanId(null);
    }
  }

  /* --- Fibra alimentaria --- */
  const FIBRA_SOURCES = [
    { id: "fnb_iom", label: "Food and Nutrition Board / IOM", ref: "25.3 g" },
    { id: "anses_2016", label: "ANSES, 2016", ref: "30 g" },
    { id: "sacn", label: "SACN", ref: "30 g" },
    { id: "sinu_2014", label: "SINU, 2014", ref: "26.5 g" },
    { id: "nhmrc_2006", label: t("fibraNhmrc2006"), ref: "25 g" },
  ] as const;
  const LEGACY_FIBRA_MAP: Record<string, string> = {
    "Food and Nutrition Board / IOM": "fnb_iom",
    "ANSES, 2016": "anses_2016",
    "SACN": "sacn",
    "SINU, 2014": "sinu_2014",
    "NHMRC 2006, (actualizado el 2017)": "nhmrc_2006",
  };
  function normalizeFibraId(raw: string): string {
    return LEGACY_FIBRA_MAP[raw] ?? raw;
  }
  const [fibraFuente, setFibraFuente] = useState(normalizeFibraId(datos.fibraFuente ?? "fnb_iom"));
  const [fibraInput, setFibraInput] = useState(datos.fibraCantidad ?? "");

  /* ─── Date state for duración section ─── */
  const [fechaInicioInput, setFechaInicioInput] = useState(
    selectedPlan?.fechaInicio ? selectedPlan.fechaInicio.slice(0, 7) : ""
  );
  const [fechaFinPrevistaInput, setFechaFinPrevistaInput] = useState(
    selectedPlan?.fechaFinPrevista ? selectedPlan.fechaFinPrevista.slice(0, 7) : ""
  );

  /* ─── Reset state when switching planification ─── */
  const prevPlanIdRef = useRef(selectedPlanId);
  // "Foto" de los campos editables tal como se cargaron del plan; sirve para detectar cambios sin
  // guardar (se compara con `camposActuales`, abajo). Se rehace al cargar un plan y al guardar.
  const baseCamposRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevPlanIdRef.current === selectedPlanId) return;
    prevPlanIdRef.current = selectedPlanId;
    if (!selectedPlan) return;
    const d = selectedPlan.datos ?? {};
    const aa = d.actividadActual ?? actividadInicial;
    const ao = d.actividadObjetivo ?? t("actividadActivo");
    const pca = d.palCustomActual != null ? String(d.palCustomActual) : "1.5";
    const pco = d.palCustomObjetivo != null ? String(d.palCustomObjetivo) : "1.5";
    const mg = normalizeGrasaId(d.formulaMasaGrasa ?? GRASA_IDS.PETERSON);
    const bmr = normalizeBmrId(d.formulaBmr ?? BMR_IDS.OMS);
    const eer = normalizeEerId(d.formulaEer ?? EER_IDS.IOM_2005);
    const eo = d.eerObjetivo ?? "";
    const aj = d.eerObjetivo ? (d.ajusteObjetivoPct ?? null) : null;
    const mri = d.macroRefIdx ?? 0;
    const g = d.grasaPct ?? 30;
    const c = d.carbPct ?? 50;
    const p = d.protPct ?? 20;
    const po = d.pesoObjetivo ?? (pesoInicialObjetivo != null ? String(pesoInicialObjetivo) : "");
    const go = d.grasaObjetivo ?? "";
    const io = d.imcObjetivo ?? "";
    const ff = normalizeFibraId(d.fibraFuente ?? "fnb_iom");
    const fi = d.fibraCantidad ?? "";
    const pa = d.pesoActual ?? (pesoInicialActual != null ? String(pesoInicialActual) : "");
    const ga = d.grasaActual ?? (grasaInicialActual != null ? String(grasaInicialActual) : "");
    const rep = normalizeReparto(d.repartoPorComida);
    setActividadActualLabel(aa);
    setActividadObjetivoLabel(ao);
    setPalCustomActual(pca);
    setPalCustomObjetivo(pco);
    setFormulaMasaGrasa(mg);
    setBmrFormula(bmr);
    setEerFormula(eer);
    setEerObjetivoInput(eo);
    setAjustePct(aj);
    setMacroRefIdx(mri);
    setGrasaPct(g);
    setCarbPct(c);
    setProtPct(p);
    setPesoObjetivoInput(po);
    setGrasaObjetivoInput(go);
    setImcObjetivoInput(io);
    setFibraFuente(ff);
    setFibraInput(fi);
    setPesoActualInput(pa);
    setGrasaActualInput(ga);
    setRepartoActivo(rep.activo);
    setReparto(rep.comidas);
    setRepartoExpandido(null);
    setRepartoAbierto(false);
    setFechaInicioInput(selectedPlan.fechaInicio ? selectedPlan.fechaInicio.slice(0, 7) : "");
    setFechaFinPrevistaInput(selectedPlan.fechaFinPrevista ? selectedPlan.fechaFinPrevista.slice(0, 7) : "");
    // Rehacer la "foto" con los valores recién cargados (mismas claves y orden que `camposActuales`).
    baseCamposRef.current = JSON.stringify({ aa, ao, pca, pco, bmr, eer, mg, eo, g, c, p, mri, ff, fi, po, go, io, aj, pa, ga, rc: JSON.stringify(rep) });
  }, [selectedPlanId, selectedPlan, actividadInicial, pesoInicialObjetivo, FORMULAS_MASA_GRASA_GROUPS]);

  /* ─── Dirty tracking + manual save ─── */
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  // Planificación a la que se quiere cambiar habiendo cambios sin guardar (abre el modal de aviso).
  const [cambioPlanPendiente, setCambioPlanPendiente] = useState<string | null>(null);

  // "Foto" de los campos editables AHORA. Comparada con `baseCamposRef` (lo cargado/guardado) decide
  // si hay cambios sin guardar. Es por comparación de VALORES: robusto con cualquier control (inputs,
  // sliders, dropdowns propios), independiente del orden de efectos, de StrictMode y de cambiar a un
  // plan con valores idénticos. (Mismas claves y orden que la "foto" del efecto de sincronización.)
  const camposActuales = JSON.stringify({
    aa: actividadActualLabel, ao: actividadObjetivoLabel,
    pca: palCustomActual, pco: palCustomObjetivo,
    bmr: bmrFormula, eer: eerFormula, mg: formulaMasaGrasa, eo: eerObjetivoInput,
    g: grasaPct, c: carbPct, p: protPct, mri: macroRefIdx,
    ff: fibraFuente, fi: fibraInput,
    po: pesoObjetivoInput, go: grasaObjetivoInput, io: imcObjetivoInput,
    aj: ajustePct,
    pa: pesoActualInput, ga: grasaActualInput,
    rc: JSON.stringify({ activo: repartoActivo, comidas: reparto }),
  });
  if (baseCamposRef.current === null) baseCamposRef.current = camposActuales; // foto inicial (montaje)

  useEffect(() => {
    setIsDirty(camposActuales !== baseCamposRef.current);
  }, [camposActuales]);

  // Aviso del navegador al cerrar/recargar la pestaña con cambios sin guardar.
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // Navegación interna (otra pestaña de la ficha, el menú lateral…) con cambios sin guardar:
  // `beforeunload` NO salta ahí (Next navega sin recargar), así que el trabajo se perdía en
  // silencio. Se intercepta el clic en el enlace y se pregunta qué hacer.
  const [navPendiente, setNavPendiente] = useState<string | null>(null);
  useEffect(() => {
    if (!isDirty) return;
    function onClickCapture(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
      const target = e.target as HTMLElement | null;
      const a = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.getAttribute("href") ?? "";
      // Enlaces externos, anclas o abrir en otra ventana: no son salidas de esta pantalla.
      if (!href || href.startsWith("#") || href.startsWith("http") || a.target === "_blank") return;
      // Volver a esta misma pestaña no es salir.
      if (href.includes("pestana=planificacion")) return;
      e.preventDefault();
      e.stopPropagation();
      setNavPendiente(href);
    }
    document.addEventListener("click", onClickCapture, true);
    return () => document.removeEventListener("click", onClickCapture, true);
  }, [isDirty]);

  function buildDatosSnapshot(): PlanificacionDatos {
    return {
      actividadActual: actividadActualLabel,
      actividadObjetivo: actividadObjetivoLabel,
      palCustomActual: parseFloat(palCustomActual) || undefined,
      palCustomObjetivo: parseFloat(palCustomObjetivo) || undefined,
      formulaBmr: bmrFormula,
      formulaEer: eerFormula,
      formulaMasaGrasa: formulaMasaGrasa,
      eerObjetivo: eerObjetivoInput || undefined,
      ajusteObjetivoPct: ajustePct,
      grasaPct,
      carbPct,
      protPct,
      macroRefIdx,
      fibraFuente,
      fibraCantidad: fibraInput || undefined,
      pesoActual: pesoActualInput || undefined,
      grasaActual: grasaActualInput || undefined,
      pesoObjetivo: pesoObjetivoInput || undefined,
      grasaObjetivo: grasaObjetivoInput || undefined,
      imcObjetivo: imcObjetivoInput || undefined,
      // #78-A: objetivos absolutos ya calculados, para heredarlos al crear la dieta/IA sin recalcular.
      kcalObjetivo: macros.kcal || undefined,
      protGObjetivo: macros.protG || undefined,
      carbGObjetivo: macros.carbG || undefined,
      grasaGObjetivo: macros.grasaG || undefined,
      // #78-C: reparto por comida. Se persiste SIEMPRE (también desactivado) para no perder la
      // configuración del nutri al apagar el toggle y guardar; la dieta solo lo usa si activo=true.
      repartoPorComida: { activo: repartoActivo, comidas: reparto },
    };
  }

  async function handleGuardar() {
    if (blockIfDemo()) return;
    if (!selectedPlan || !isDirty) return;
    setIsSaving(true);
    const snapshot = buildDatosSnapshot();
    await guardarPlanificacion(selectedPlan.id, snapshot);
    setPlanificaciones((prev) =>
      prev.map((p) =>
        p.id === selectedPlan.id
          ? { ...p, datos: snapshot, fechaUltimoCambio: new Date().toISOString() }
          : p
      )
    );
    baseCamposRef.current = camposActuales; // lo guardado pasa a ser la nueva "foto" base
    setIsDirty(false);
    setIsSaving(false);
    // Al guardar se pliega el reparto: confirma visualmente que quedó guardado y deja el resumen.
    setRepartoAbierto(false);
    setRepartoExpandido(null);
    // Aviso al guardar si el reparto no cuadra: guardar no falla (a veces se guarda a medias a
    // propósito), pero conviene decirlo. Con comidas por días la suma global no aplica, así que se
    // avisa solo del caso en que el 100% SÍ es alcanzable.
  }

  /* ─── Date save handlers ─── */
  function handleFechaInicioChange(val: string) {
    setFechaInicioInput(val);
    if (!selectedPlan || !val) return;
    const isoDate = new Date(val + "-01").toISOString();
    actualizarFechasPlanificacion(selectedPlan.id, { fechaInicio: isoDate });
    setPlanificaciones((prev) =>
      prev.map((p) => (p.id === selectedPlan.id ? { ...p, fechaInicio: isoDate } : p))
    );
  }

  function handleFechaFinPrevistaChange(val: string) {
    setFechaFinPrevistaInput(val);
    if (!selectedPlan) return;
    const isoDate = val ? new Date(val + "-01").toISOString() : null;
    actualizarFechasPlanificacion(selectedPlan.id, { fechaFinPrevista: isoDate });
    setPlanificaciones((prev) =>
      prev.map((p) => (p.id === selectedPlan.id ? { ...p, fechaFinPrevista: isoDate } : p))
    );
  }

  /* ─── Helpers for pct input clamping ─── */
  function handlePctChange(setter: (v: number) => void, raw: string) {
    const n = parseInt(raw, 10);
    if (Number.isNaN(n)) return;
    setter(Math.max(0, Math.min(100, n)));
  }

  /* ─── Slider drag: rebalance the other two to keep sum = 100% ─── */
  function handleSliderDrag(changed: "grasa" | "carb" | "prot", newVal: number) {
    const clamped = Math.max(0, Math.min(100, newVal));
    const remaining = 100 - clamped;

    let other1: number, other2: number;
    let setChanged: (v: number) => void;
    let setOther1: (v: number) => void;
    let setOther2: (v: number) => void;

    if (changed === "grasa") {
      setChanged = setGrasaPct; other1 = carbPct; other2 = protPct;
      setOther1 = setCarbPct; setOther2 = setProtPct;
    } else if (changed === "carb") {
      setChanged = setCarbPct; other1 = grasaPct; other2 = protPct;
      setOther1 = setGrasaPct; setOther2 = setProtPct;
    } else {
      setChanged = setProtPct; other1 = grasaPct; other2 = carbPct;
      setOther1 = setGrasaPct; setOther2 = setCarbPct;
    }

    setChanged(clamped);
    const otherTotal = other1 + other2;
    if (otherTotal === 0) {
      const half = Math.round(remaining / 2);
      setOther1(half);
      setOther2(remaining - half);
    } else {
      const newOther1 = Math.round((other1 / otherTotal) * remaining);
      setOther1(newOther1);
      setOther2(remaining - newOther1);
    }
  }

  /* ─── Editar gramos directamente → convierte a % y rebalancea (reusa la lógica del slider) ─── */
  function handleGramosChange(macro: "grasa" | "carb" | "prot", raw: string) {
    const kcalTotal = macros.kcal;
    if (!kcalTotal || kcalTotal <= 0) return; // sin EER objetivo no se puede derivar el %
    const g = parseFloat(raw.replace(",", "."));
    if (!Number.isFinite(g) || g < 0) return;
    const kcalPorG = macro === "grasa" ? 9 : 4;
    const nuevoPct = Math.round(((g * kcalPorG) / kcalTotal) * 100);
    handleSliderDrag(macro, nuevoPct);
  }

  // Valor a mostrar en el input de gramos (buffer de edición si está activo, si no el calculado).
  function gramosValue(macro: "grasa" | "carb" | "prot", calc: number): string {
    return gramosEdit?.macro === macro ? gramosEdit.val : String(calc);
  }
  function commitGramos(macro: "grasa" | "carb" | "prot") {
    if (gramosEdit?.macro === macro) {
      handleGramosChange(macro, gramosEdit.val);
      setGramosEdit(null);
    }
  }

  /* ─── Editar g/kg → pasa a gramos (× peso) y reusa la conversión a % ─── */
  function handleGkgChange(macro: "grasa" | "carb" | "prot", raw: string) {
    const w = pesoActual;
    if (!w || w <= 0) return; // sin peso del paciente no se puede derivar
    const gkg = parseFloat(raw.replace(",", "."));
    if (!Number.isFinite(gkg) || gkg < 0) return;
    handleGramosChange(macro, String(gkg * w));
  }
  function gkgValue(macro: "grasa" | "carb" | "prot", calc: number): string {
    return gkgEdit?.macro === macro ? gkgEdit.val : fmt2(calc);
  }
  function commitGkg(macro: "grasa" | "carb" | "prot") {
    if (gkgEdit?.macro === macro) {
      handleGkgChange(macro, gkgEdit.val);
      setGkgEdit(null);
    }
  }

  /* ─── Table header style (reused) ─── */
  const thClass = "text-left font-medium text-primary text-xs py-3 px-2 sm:px-4";
  const thBg = "bg-primary/10";
  const stickyCol = "sticky left-0 bg-card z-10 after:absolute after:right-0 after:top-0 after:bottom-0 after:w-px after:bg-border sm:static sm:after:hidden";
  const stickyColHead = "sticky left-0 bg-primary/10 z-10 sm:static";

  /* ─── Render ─── */

  // Bloquea "e"/"E"/"+" en los inputs numéricos: type=number los admite (notación científica) pero
  // aquí no tienen sentido y dejaban valores raros como "63e" que luego no se podían guardar.
  function bloquearExponencial(ev: React.KeyboardEvent) {
    const el = ev.target as HTMLElement;
    if (el instanceof HTMLInputElement && el.type === "number" && ["e", "E", "+"].includes(ev.key)) {
      ev.preventDefault();
    }
  }

  return (
    <div className="space-y-6" onKeyDown={bloquearExponencial}>
      {/* ====== Section 1: Informaciones del cliente ====== */}
      <section className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3">
          <SectionTitle icon={Scale}>{t("seccionCliente")}</SectionTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {paciente.nombre} {paciente.apellidos}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[580px] sm:min-w-[720px] w-full text-sm">
            <thead>
              <tr className={thBg}>
                <th className={`${thClass} w-[130px] sm:w-[220px] ${stickyColHead}`}></th>
                <th className={thClass}>{t("thFormula")}</th>
                <th className={thClass}>{t("thActual")}</th>
                <th className={thClass}>{t("thObjetivo")}</th>
                <th className={thClass}>{t("thReferencia")}</th>
              </tr>
            </thead>
            <tbody>
              {/* Peso */}
              <tr className="border-b border-border">
                <td className={`py-3 px-2 sm:px-4 ${stickyCol}`}>
                  <div className="font-medium flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                    <Scale className="w-4 h-4 text-primary/70 shrink-0" />
                    {t("peso")}
                  </div>
                </td>
                <td className="py-3 px-4 text-muted-foreground">—</td>
                <td className="py-3 px-4">
                  <div className="relative w-32">
                    <input type="number" inputMode="decimal" step="0.1" min="1" max="500" value={pesoActualInput} onChange={(e) => setPesoActualInput(e.target.value)} placeholder="—" className="w-full h-9 rounded-lg border border-border bg-background px-3 pr-8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">kg</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="relative w-32">
                    <input type="number" inputMode="decimal" step="0.1" min="1" max="500" value={pesoObjetivoInput} onChange={(e) => setPesoObjetivoInput(e.target.value)} placeholder="—" className="w-full h-9 rounded-lg border border-border bg-background px-3 pr-8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">kg</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="text-muted-foreground">
                    {pesoObjetivo != null ? `${fmt1(pesoObjetivo)} kg` : "—"}
                  </div>
                  {pesoActual != null && pesoObjetivo != null && pesoActual !== pesoObjetivo && (
                    <span className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full mt-1 ${
                      pesoActual > pesoObjetivo
                        ? "bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400"
                        : "bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400"
                    }`}>
                      {pesoActual > pesoObjetivo
                        ? t("pesoReduccion", { kg: fmt1(pesoActual - pesoObjetivo) })
                        : t("pesoGanancia", { kg: fmt1(pesoObjetivo - pesoActual) })}
                    </span>
                  )}
                </td>
              </tr>

              {/* Porcentaje de masa grasa */}
              <tr className="border-b border-border">
                <td className={`py-3 px-2 sm:px-4 ${stickyCol}`}>
                  <div className="font-medium flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                    <Percent className="w-4 h-4 text-primary/70 shrink-0" />
                    <span className="sm:hidden">{t("masaGrasaCorta")}</span>
                    <span className="hidden sm:inline">{t("masaGrasaLarga")}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <FormulaSelect value={formulaMasaGrasa} groups={FORMULAS_MASA_GRASA_GROUPS} onChange={setFormulaMasaGrasa} searchPlaceholder={t("buscarFormula")} noResults={t("sinResultados")} />
                </td>
                <td className="py-3 px-4">
                  <div className="relative w-32">
                    <input type="number" inputMode="decimal" step="0.01" min="0" max="100" value={grasaActualInput} onChange={(e) => setGrasaActualInput(e.target.value)} placeholder="—" className="w-full h-9 rounded-lg border border-border bg-background px-3 pr-8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">%</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="relative w-32">
                    <input type="number" inputMode="decimal" step="0.1" min="0" max="100" value={grasaObjetivoInput} onChange={(e) => setGrasaObjetivoInput(e.target.value)} placeholder={t("noDefinido")} className="w-full h-9 rounded-lg border border-border bg-background px-3 pr-8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-rose-400 placeholder:text-xs" />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">%</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-muted-foreground">23 - 38%</td>
              </tr>

              {/* IMC */}
              {(() => {
                const imcObj = imcObjetivoInput ? parseFloat(imcObjetivoInput) || null : valores?.imcObjetivo ?? null;
                return (
                  <tr className="border-b border-border">
                    <td className={`py-3 px-2 sm:px-4 ${stickyCol}`}>
                      <div className="font-medium flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                        <Activity className="w-4 h-4 text-primary/70 shrink-0" />
                        IMC
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">—</td>
                    <td className="py-3 px-4">
                      {valores?.imcActual != null ? (
                        <div>
                          <span className="font-medium">{fmt1(valores.imcActual)} kg/m²</span>
                          <div className="mt-1">
                            <span className={`inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full ${categoriaIMC(valores.imcActual).color}`}>
                              {t(categoriaIMC(valores.imcActual).labelKey)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <span className="text-muted-foreground">—</span>
                          <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">{t("imcAvisoPesoAltura")}</p>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="relative w-32">
                        <input type="number" inputMode="decimal" step="0.1" min="10" max="60" value={imcObjetivoInput || (valores?.imcObjetivo != null ? fmt1(valores.imcObjetivo) : "")} onChange={(e) => setImcObjetivoInput(e.target.value)} placeholder="—" className="w-full h-9 rounded-lg border border-border bg-background px-3 pr-14 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">kg/m²</span>
                      </div>
                      {imcObj != null && (
                        <div className="mt-1">
                          <span className={`inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full ${categoriaIMC(imcObj).color}`}>
                            {t(categoriaIMC(imcObj).labelKey)}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-muted-foreground">
                        {imcObj != null ? `${fmt1(imcObj)} kg/m²` : "—"}
                      </div>
                      {imcObj != null && (
                        <div className="mt-1">
                          <span className={`inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full ${categoriaIMC(imcObj).color}`}>
                            {t(categoriaIMC(imcObj).labelKey)}
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>
      </section>

      {/* ====== Planificación tabs ====== */}
      <div className="flex items-center gap-1 border-b border-border mb-6 overflow-x-auto pb-px -mx-1 px-1 scrollbar-thin">
        {sortedPlanificaciones.map((plan) => {
          const isActive = plan.id === selectedPlanId;
          const isInactive = plan.estado !== "activa";
          return (
            <div key={plan.id} className="relative flex items-center shrink-0">
              {renamingId === plan.id ? (
                <form
                  onSubmit={(e) => { e.preventDefault(); handleRename(plan.id); }}
                  className="flex items-center gap-1 px-2 py-1.5"
                >
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => { setRenamingId(null); setRenameValue(""); }}
                    className="w-32 h-7 px-2 rounded border border-primary bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    onKeyDown={(e) => { if (e.key === "Escape") { setRenamingId(null); setRenameValue(""); } }}
                  />
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (plan.id !== selectedPlanId && isDirty) { setCambioPlanPendiente(plan.id); return; }
                    setSelectedPlanId(plan.id);
                  }}
                  className={`whitespace-nowrap px-3 py-2 text-sm font-medium border-b-2 transition-colors rounded-t-lg ${
                    isActive
                      ? "border-primary text-primary bg-primary/5"
                      : isInactive
                        ? "border-transparent text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/30"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  {plan.nombre}
                  {isInactive && (
                    <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-normal">
                      {plan.estado}
                    </span>
                  )}
                </button>
              )}
              <button
                type="button"
                data-menu-trigger
                onClick={(e) => {
                  e.stopPropagation();
                  if (menuOpenId === plan.id) {
                    closeMenu();
                    return;
                  }
                  const rect = e.currentTarget.getBoundingClientRect();
                  setMenuAnchor({
                    top: rect.bottom + 4,
                    right: window.innerWidth - rect.right,
                  });
                  setMenuOpenId(plan.id);
                }}
                className="p-1 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
              >
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
        <button
          type="button"
          onClick={openCrearModal}
          className="shrink-0 inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5 rounded-t-lg border-b-2 border-transparent transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="sm:hidden">{t("crearCorta")}</span>
          <span className="hidden sm:inline">{t("crearPlanificacion")}</span>
        </button>
      </div>

      {/* ====== Menú flotante (editar / eliminar) ====== */}
      {menuOpenId && menuAnchor && typeof document !== "undefined" && (() => {
        const plan = sortedPlanificaciones.find((p) => p.id === menuOpenId);
        if (!plan) return null;
        return createPortal(
          <div
            ref={menuRef}
            style={{ position: "fixed", top: menuAnchor.top, right: menuAnchor.right }}
            className="z-[60] w-44 rounded-xl border border-border bg-card shadow-xl p-1"
          >
            <button
              type="button"
              onClick={() => {
                setRenamingId(plan.id);
                setRenameValue(plan.nombre);
                closeMenu();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg hover:bg-muted/60 transition-colors"
            >
              <Pencil className="w-4 h-4 text-muted-foreground" />
              {t("editar")}
            </button>
            {!plan.esDefecto && (
              <button
                type="button"
                onClick={() => handleEliminarClick(plan.id)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg hover:bg-red-50 dark:hover:bg-red-500/15 text-red-600 dark:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                {t("eliminar")}
              </button>
            )}
          </div>,
          document.body
        );
      })()}

      {/* ====== Modal crear planificación ====== */}
      {showCrearModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={() => setShowCrearModal(false)}>
          <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-lg mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">{t("crearNuevaPlanificacion")}</h3>
              <button type="button" onClick={() => setShowCrearModal(false)} className="p-1 rounded-lg hover:bg-muted transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <label className="block text-sm font-medium text-muted-foreground mb-2">{t("nombrePlanificacion")}</label>
            <input
              autoFocus
              value={crearNombre}
              onChange={(e) => setCrearNombre(e.target.value)}
              placeholder={t("crearPlaceholder")}
              className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 mb-5"
              onKeyDown={(e) => { if (e.key === "Enter") handleCrearConfirm(); }}
            />

            <label className="block text-sm font-medium text-muted-foreground mb-2">{t("copiarPlanificacion")}</label>
            <select
              value={copiarDeId}
              onChange={(e) => setCopiarDeId(e.target.value)}
              className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 mb-6"
            >
              {planificaciones.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
              <option value="">{t("sinCopiar")}</option>
            </select>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowCrearModal(false)}
                className="px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                {t("cancelar")}
              </button>
              <button
                type="button"
                onClick={handleCrearConfirm}
                disabled={!crearNombre.trim() || isPending}
                className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {t("crearPlanificacion")}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ====== Modal confirmar eliminación ====== */}
      {deleteConfirmId && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={() => setDeleteConfirmId(null)}>
          <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-bold">{t("confirmarEliminar")}</h3>
              </div>
              <button type="button" onClick={() => setDeleteConfirmId(null)} className="p-1 rounded-lg hover:bg-muted transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              {t("confirmarEliminarDesc")}
            </p>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                {t("cancelar")}
              </button>
              <button
                type="button"
                onClick={handleEliminarConfirm}
                disabled={isPending}
                className="px-5 py-2.5 rounded-lg bg-amber-400 text-white text-sm font-semibold hover:bg-amber-500 transition-colors disabled:opacity-50"
              >
                {t("borrar")}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {cambioPlanPendiente && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={() => setCambioPlanPendiente(null)}>
          <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-bold">{t("avisoCambiosTitulo")}</h3>
              </div>
              <button type="button" onClick={() => setCambioPlanPendiente(null)} className="p-1 rounded-lg hover:bg-muted transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              {t("avisoCambiosSinGuardar")}
            </p>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCambioPlanPendiente(null)}
                className="px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                {t("cancelar")}
              </button>
              <button
                type="button"
                onClick={() => { setSelectedPlanId(cambioPlanPendiente); setCambioPlanPendiente(null); }}
                className="px-5 py-2.5 rounded-lg bg-amber-400 text-white text-sm font-semibold hover:bg-amber-500 transition-colors"
              >
                {t("avisoCambiosDescartar")}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Salir de la pantalla con cambios sin guardar: se ofrece guardar antes de irse (el trabajo
          se perdía en silencio al pinchar otra pestaña, porque Next navega sin recargar). */}
      {navPendiente && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={() => setNavPendiente(null)}>
          <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2.5 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-bold">{t("salirTitulo")}</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-6">{t("salirTexto")}</p>
            <div className="flex flex-col sm:flex-row-reverse gap-2">
              <button
                type="button"
                disabled={isSaving}
                onClick={async () => {
                  const destino = navPendiente;
                  await handleGuardar();
                  setNavPendiente(null);
                  if (destino) router.push(destino);
                }}
                className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {isSaving ? t("guardando") : t("salirGuardando")}
              </button>
              <button
                type="button"
                onClick={() => {
                  const destino = navPendiente;
                  setIsDirty(false); // para no volver a interceptar al navegar
                  setNavPendiente(null);
                  if (destino) router.push(destino);
                }}
                className="px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                {t("salirSinGuardar")}
              </button>
              <button
                type="button"
                onClick={() => setNavPendiente(null)}
                className="px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors sm:mr-auto"
              >
                {t("salirSeguirEditando")}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ====== Botón guardar cambios ====== */}
      {isDirty && (
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={handleGuardar}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {isSaving ? (
              <>
                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                {t("guardando")}
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                {t("guardarCambios")}
              </>
            )}
          </button>
        </div>
      )}

      {/* ====== Section 2: Cálculos ====== */}
      <section className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3">
          <SectionTitle icon={Brain}>{t("seccionCalculos")}</SectionTitle>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[580px] sm:min-w-[900px] w-full text-sm">
            <thead>
              <tr className={thBg}>
                <th className={`${thClass} w-[130px] sm:w-[240px] ${stickyColHead}`}></th>
                <th className={thClass}>{t("thFormula")}</th>
                <th className={thClass}>{t("thActual")}</th>
                <th className={thClass}>{t("thObjetivo")}</th>
                <th className={thClass}>{t("thReferencia")}</th>
              </tr>
            </thead>
            <tbody>
              {/* Actividad física */}
              <tr className="border-b border-border">
                <td className={`py-3 px-2 sm:px-4 ${stickyCol}`}>
                  <div className="flex items-center gap-1.5 sm:gap-2 font-medium text-xs sm:text-sm">
                    <Dumbbell className="w-4 h-4 text-primary/70 shrink-0" />
                    <span className="sm:hidden">{t("actividadCorta")}</span>
                    <span className="hidden sm:inline">{t("actividadLarga")}</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-muted-foreground">—</td>
                <td className="py-3 px-4">
                  <ActivitySelect
                    value={actividadActualLabel}
                    options={ACTIVIDAD_OPTS}
                    onChange={setActividadActualLabel}
                  />
                  {actividadActualLabel === t("actividadPersonalizado") && (
                    <div className="mt-1.5 relative w-28">
                      <input type="number" inputMode="decimal" step="0.001" min="1" max="3" value={palCustomActual} onChange={(e) => setPalCustomActual(e.target.value)} className="w-full h-8 rounded-lg border border-border bg-background px-2 pr-12 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">PAL</span>
                    </div>
                  )}
                </td>
                <td className="py-3 px-4">
                  <ActivitySelect
                    value={actividadObjetivoLabel}
                    options={ACTIVIDAD_OPTS}
                    onChange={setActividadObjetivoLabel}
                  />
                  {actividadObjetivoLabel === t("actividadPersonalizado") && (
                    <div className="mt-1.5 relative w-28">
                      <input type="number" inputMode="decimal" step="0.001" min="1" max="3" value={palCustomObjetivo} onChange={(e) => setPalCustomObjetivo(e.target.value)} className="w-full h-8 rounded-lg border border-border bg-background px-2 pr-12 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">PAL</span>
                    </div>
                  )}
                </td>
                <td className="py-3 px-4 text-muted-foreground">—</td>
              </tr>

              {/* Metabolismo basal */}
              <tr className="border-b border-border">
                <td className={`py-3 px-2 sm:px-4 ${stickyCol}`}>
                  <div className="flex items-center gap-1.5 sm:gap-2 font-medium text-xs sm:text-sm">
                    <Flame className="w-4 h-4 text-primary/70 shrink-0" />
                    <span className="sm:hidden">{t("metabolismoCorta")}</span>
                    <span className="hidden sm:inline">{t("metabolismoLarga")}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <FormulaSelect
                    value={bmrFormula}
                    groups={BMR_FORMULA_GROUPS}
                    onChange={setBmrFormula}
                    searchPlaceholder={t("buscarFormula")}
                    noResults={t("sinResultados")}
                  />
                </td>
                <td className="py-3 px-4">
                  <span className="font-medium">
                    {valores?.bmrActual != null ? t("kcalDia", { val: Math.round(valores.bmrActual) }) : "—"}
                  </span>
                </td>
                <td className="py-3 px-4 text-muted-foreground">—</td>
                <td className="py-3 px-4">
                  <span className="font-medium">
                    {valores?.bmrActual != null ? t("kcalDia", { val: Math.round(valores.bmrActual) }) : "—"}
                  </span>
                </td>
              </tr>

              {/* Necesidades energéticas */}
              <tr className="border-b border-border">
                <td className={`py-3 px-2 sm:px-4 ${stickyCol}`}>
                  <div className="flex items-center gap-1.5 sm:gap-2 font-medium text-xs sm:text-sm">
                    <Zap className="w-4 h-4 text-primary/70 shrink-0" />
                    <span className="sm:hidden">{t("necesidadesCorta")}</span>
                    <span className="hidden sm:inline">{t("necesidadesLarga")}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <FormulaSelect
                    value={eerFormula}
                    groups={EER_FORMULA_GROUPS}
                    onChange={setEerFormula}
                    searchPlaceholder={t("buscarFormula")}
                    noResults={t("sinResultados")}
                  />
                </td>
                <td className="py-3 px-4">
                  <span className="font-medium">
                    {valores?.eerActual != null ? t("kcalDia", { val: Math.round(valores.eerActual) }) : "—"}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="w-44 space-y-1.5">
                    <div className="relative">
                      <input
                        type="number" inputMode="decimal"
                        step="1"
                        min="500"
                        max="10000"
                        value={eerObjetivoInput}
                        onChange={(e) => { setEerObjetivoInput(e.target.value); setAjustePct(null); }}
                        placeholder={eerObjetivoEfectivo != null ? String(eerObjetivoEfectivo) : (valores?.eerActual != null ? String(Math.round(valores.eerActual)) : "—")}
                        className="w-full h-9 rounded-lg border border-border bg-background px-3 pr-16 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">{t("unidadKcalDia")}</span>
                    </div>
                    {/* Botones rápidos de ajuste por objetivo (déficit/superávit). Al pulsar,
                        se vuelve al modo automático (input vacío) con el nuevo porcentaje. */}
                    <div className="flex flex-wrap gap-1">
                      {AJUSTE_OPCIONES.map((op) => {
                        const activo = ajustePct === op.value;
                        return (
                          <button
                            key={op.value}
                            type="button"
                            onClick={() => {
                              if (activo) {
                                setAjustePct(null);
                                setEerObjetivoInput("");
                              } else {
                                setAjustePct(op.value);
                                const base = valores?.eerActual;
                                setEerObjetivoInput(base != null ? String(Math.round(base * (1 + op.value / 100))) : "");
                              }
                            }}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium border transition-colors ${
                              activo
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
                            }`}
                          >
                            {op.label}
                          </button>
                        );
                      })}
                    </div>
                    {ajustePct != null && ajustePct !== 0 && valores?.eerActual != null && eerObjetivoEfectivo != null && (
                      <p className="text-[10px] text-muted-foreground leading-tight">
                        {t("ajusteCalculadoResumen", { base: Math.round(valores.eerActual), result: eerObjetivoEfectivo })}
                      </p>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="font-medium">
                    {valores?.eerReferencia != null ? t("kcalDia", { val: Math.round(valores.eerReferencia) }) : "—"}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ====== Section 3: Distribución de macronutrientes ====== */}
      <section className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <SectionTitle icon={Wheat}>{t("seccionMacronutrientes")}</SectionTitle>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            {/* Presets de macros con nombre (#78-C) */}
            <select
              value={presetActivoId}
              onChange={(e) => aplicarPreset(e.target.value)}
              className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              title={t("presetTitulo")}
            >
              {/* Estado, no acción: se muestra cuando los % no coinciden con ningún preset. */}
              <option value="" disabled>{t("presetPersonalizada")}</option>
              {MACRO_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {t(`preset_${p.id}` as never)}
                </option>
              ))}
            </select>
            <select
              value={macroRefIdx}
              onChange={(e) => setMacroRefIdx(Number(e.target.value))}
              className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {MACRO_REF_SOURCES.map((s, i) => (
                <option key={s.label} value={i}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
            <table className="min-w-[560px] sm:min-w-[780px] w-full text-sm">
              <thead>
                <tr className={thBg}>
                  <th className={`${thClass} w-[100px] sm:w-[180px] ${stickyColHead}`}></th>
                  <th className={thClass}>%</th>
                  <th className={thClass}>{t("thTotal")}</th>
                  <th className={thClass}>g/kg</th>
                  <th className={thClass}>{t("thReferencia")}</th>
                </tr>
              </thead>
              <tbody>
                {/* Lípidos */}
                <tr className="border-b border-border">
                  <td className={`py-3 px-2 sm:px-4 ${stickyCol}`}>
                    <div className="flex items-center gap-1.5 sm:gap-2 font-medium text-xs sm:text-sm">
                      <Droplets className="w-4 h-4 text-yellow-500 shrink-0" />
                      {t("lipidos")}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="number" inputMode="decimal"
                        min={0}
                        max={100}
                        value={grasaPct}
                        onChange={(e) => handlePctChange(setGrasaPct, e.target.value)}
                        className="w-16 h-8 px-2 rounded-lg border border-border bg-background text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <span className="text-muted-foreground">%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={grasaPct}
                      onChange={(e) => handleSliderDrag("grasa", parseInt(e.target.value, 10))}
                      className="macro-slider w-full mt-2"
                      style={{ "--slider-color": "#EAB308", "--slider-pct": `${grasaPct}%` } as React.CSSProperties}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number" inputMode="decimal" min={0}
                        value={gramosValue("grasa", macros.grasaG)}
                        onChange={(e) => setGramosEdit({ macro: "grasa", val: e.target.value })}
                        onBlur={() => commitGramos("grasa")}
                        onKeyDown={(e) => { if (e.key === "Enter") commitGramos("grasa"); }}
                        disabled={!macros.kcal}
                        className="w-16 h-8 px-2 rounded-lg border border-border bg-background text-sm text-center font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                      />
                      <span className="text-muted-foreground text-xs">g</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number" inputMode="decimal" step="0.1" min={0}
                        value={gkgValue("grasa", macros.grasaGKg)}
                        onChange={(e) => setGkgEdit({ macro: "grasa", val: e.target.value })}
                        onBlur={() => commitGkg("grasa")}
                        onKeyDown={(e) => { if (e.key === "Enter") commitGkg("grasa"); }}
                        disabled={!macros.kcal || !pesoActual}
                        className="w-16 h-8 px-2 rounded-lg border border-border bg-background text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                      />
                      <span className="text-muted-foreground text-xs">g/kg</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{macroRef.lipidos}</td>
                </tr>

                {/* Carbohidratos */}
                <tr className="border-b border-border">
                  <td className={`py-3 px-2 sm:px-4 ${stickyCol}`}>
                    <div className="flex items-center gap-1.5 sm:gap-2 font-medium text-xs sm:text-sm">
                      <Wheat className="w-4 h-4 text-orange-500 shrink-0" />
                      <span className="sm:hidden">{t("carbosCorta")}</span>
                      <span className="hidden sm:inline">{t("carbosLarga")}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="number" inputMode="decimal"
                        min={0}
                        max={100}
                        value={carbPct}
                        onChange={(e) => handlePctChange(setCarbPct, e.target.value)}
                        className="w-16 h-8 px-2 rounded-lg border border-border bg-background text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <span className="text-muted-foreground">%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={carbPct}
                      onChange={(e) => handleSliderDrag("carb", parseInt(e.target.value, 10))}
                      className="macro-slider w-full mt-2"
                      style={{ "--slider-color": "#F97316", "--slider-pct": `${carbPct}%` } as React.CSSProperties}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number" inputMode="decimal" min={0}
                        value={gramosValue("carb", macros.carbG)}
                        onChange={(e) => setGramosEdit({ macro: "carb", val: e.target.value })}
                        onBlur={() => commitGramos("carb")}
                        onKeyDown={(e) => { if (e.key === "Enter") commitGramos("carb"); }}
                        disabled={!macros.kcal}
                        className="w-16 h-8 px-2 rounded-lg border border-border bg-background text-sm text-center font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                      />
                      <span className="text-muted-foreground text-xs">g</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number" inputMode="decimal" step="0.1" min={0}
                        value={gkgValue("carb", macros.carbGKg)}
                        onChange={(e) => setGkgEdit({ macro: "carb", val: e.target.value })}
                        onBlur={() => commitGkg("carb")}
                        onKeyDown={(e) => { if (e.key === "Enter") commitGkg("carb"); }}
                        disabled={!macros.kcal || !pesoActual}
                        className="w-16 h-8 px-2 rounded-lg border border-border bg-background text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                      />
                      <span className="text-muted-foreground text-xs">g/kg</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{macroRef.carbohidratos}</td>
                </tr>

                {/* Proteínas */}
                <tr className="border-b border-border">
                  <td className={`py-3 px-2 sm:px-4 ${stickyCol}`}>
                    <div className="flex items-center gap-1.5 sm:gap-2 font-medium text-xs sm:text-sm">
                      <Beef className="w-4 h-4 text-blue-500 shrink-0" />
                      {t("proteinas")}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="number" inputMode="decimal"
                        min={0}
                        max={100}
                        value={protPct}
                        onChange={(e) => handlePctChange(setProtPct, e.target.value)}
                        className="w-16 h-8 px-2 rounded-lg border border-border bg-background text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <span className="text-muted-foreground">%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={protPct}
                      onChange={(e) => handleSliderDrag("prot", parseInt(e.target.value, 10))}
                      className="macro-slider w-full mt-2"
                      style={{ "--slider-color": "#3B82F6", "--slider-pct": `${protPct}%` } as React.CSSProperties}
                    />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number" inputMode="decimal" min={0}
                        value={gramosValue("prot", macros.protG)}
                        onChange={(e) => setGramosEdit({ macro: "prot", val: e.target.value })}
                        onBlur={() => commitGramos("prot")}
                        onKeyDown={(e) => { if (e.key === "Enter") commitGramos("prot"); }}
                        disabled={!macros.kcal}
                        className="w-16 h-8 px-2 rounded-lg border border-border bg-background text-sm text-center font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                      />
                      <span className="text-muted-foreground text-xs">g</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number" inputMode="decimal" step="0.1" min={0}
                        value={gkgValue("prot", macros.protGKg)}
                        onChange={(e) => setGkgEdit({ macro: "prot", val: e.target.value })}
                        onBlur={() => commitGkg("prot")}
                        onKeyDown={(e) => { if (e.key === "Enter") commitGkg("prot"); }}
                        disabled={!macros.kcal || !pesoActual}
                        className="w-16 h-8 px-2 rounded-lg border border-border bg-background text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                      />
                      <span className="text-muted-foreground text-xs">g/kg</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{macroRef.proteinas}</td>
                </tr>
              </tbody>
            </table>

            {/* Total pct warning */}
            {grasaPct + carbPct + protPct !== 100 && (
              <div className="px-5 py-2 text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-t border-amber-200 dark:border-amber-500/30">
                {t("sumaPorcentajes", { pct: grasaPct + carbPct + protPct })}
              </div>
            )}

            {/* Aplicar los objetivos calculados (kcal + macros) a una dieta del paciente */}
            <div className="px-5 py-3 border-t border-border">
              <button
                type="button"
                onClick={abrirAplicarObjetivos}
                disabled={macros.kcal <= 0}
                className="text-sm font-medium text-primary hover:underline disabled:text-muted-foreground disabled:no-underline disabled:cursor-not-allowed"
              >
                {t("aplicarObjetivosBtn")}
              </button>
              {macros.kcal <= 0 && (
                <p className="mt-1 text-xs text-muted-foreground">{t("aplicarObjetivosSinKcal")}</p>
              )}
              {aplicarAbierto && macros.kcal > 0 && (
                <div className="mt-2 max-w-sm space-y-1 rounded-lg border border-border bg-muted/30 p-2">
                  {planesPaciente === null ? (
                    <p className="px-2 py-1 text-xs text-muted-foreground">{t("aplicarObjetivosCargando")}</p>
                  ) : planesPaciente.length === 0 ? (
                    <p className="px-2 py-1 text-xs text-muted-foreground">{t("aplicarObjetivosSinDietas")}</p>
                  ) : (
                    planesPaciente.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => aplicarObjetivosAPlan(p.id, p.nombre)}
                        disabled={aplicandoPlanId != null}
                        className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-muted disabled:opacity-50"
                      >
                        <span className="truncate font-medium">
                          {p.nombre}{p.activo ? ` · ${t("dietaActiva")}` : ""}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {aplicandoPlanId === p.id
                            ? t("aplicarObjetivosAplicando")
                            : p.caloriasObjetivo != null
                              ? t("kcalDia", { val: Math.round(p.caloriasObjetivo) })
                              : t("aplicarObjetivosSinObjetivo")}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
      </section>

      {/* ====== Section 3.5: Reparto por comida (configuración avanzada · #78-C) ======
           La flecha PLIEGA el panel y el interruptor ACTIVA la función: son cosas distintas.
           Antes lo hacía todo el interruptor y para cerrar había que desactivar el reparto. */}
      <section className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <button
            type="button"
            onClick={() => setRepartoAbierto((v) => !v)}
            aria-expanded={repartoAbierto}
            className="flex items-start gap-2 text-left min-w-0 group"
          >
            <ChevronDown
              className={cn(
                "w-5 h-5 mt-0.5 shrink-0 text-muted-foreground transition-transform group-hover:text-foreground",
                repartoAbierto && "rotate-180"
              )}
            />
            <span className="min-w-0">
              <SectionTitle icon={Flame}>{t("repartoTitulo")}</SectionTitle>
              {/* Plegado y activo: resumen de una línea, para ver lo guardado sin desplegar. */}
              {!repartoAbierto && repartoActivo ? (
                <span className="mt-1 block text-xs text-muted-foreground">
                  {t("repartoResumenLinea", {
                    n: repartoCalc.filas.filter((c) => c.incluida).length,
                    pcts: repartoCalc.filas.filter((c) => c.incluida).map((c) => c.kcalPct).join("/"),
                  })}
                </span>
              ) : repartoAbierto ? (
                <span className="mt-1 block text-xs text-muted-foreground">{t("repartoDescripcion")}</span>
              ) : null}
            </span>
          </button>
          {/* Interruptor: solo activa/desactiva la función (al activar, abre el panel). */}
          <button
            type="button"
            onClick={() => {
              // Valor calculado FUERA de los updaters (deben ser puros: StrictMode los invoca dos veces).
              const activar = !repartoActivo;
              setRepartoActivo(activar);
              setRepartoAbierto(activar); // al activar se abre para configurarlo; al desactivar se pliega
            }}
            className={cn(
              "shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors",
              repartoActivo
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:bg-muted/60"
            )}
          >
            <span
              className={cn(
                "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                repartoActivo ? "bg-primary" : "bg-muted-foreground/30"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  repartoActivo ? "translate-x-4" : "translate-x-0.5"
                )}
              />
            </span>
            {repartoActivo ? t("repartoActivado") : t("repartoActivar")}
          </button>
        </div>

        {repartoAbierto && !repartoActivo && (
          <div className="px-4 sm:px-5 pb-4 text-xs text-muted-foreground">{t("repartoDesactivado")}</div>
        )}

        {repartoAbierto && repartoActivo && (
          <>
            {macros.kcal <= 0 && (
              <div className="mx-4 sm:mx-5 mb-3 rounded-lg border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                {t("repartoSinKcal")}
              </div>
            )}

            <div className="px-4 sm:px-5 pb-2 flex flex-wrap items-center gap-3">
              {/* Distribuciones de kcal por comida con nombre propio (tradicional, 3 comidas…) */}
              <select
                value={repartoPresetActivoId}
                onChange={(e) => aplicarRepartoPreset(e.target.value)}
                className="h-[30px] px-2.5 rounded-lg border border-border bg-background text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                title={t("repartoPresetTitulo")}
              >
                <option value="" disabled>{t("presetPersonalizada")}</option>
                {REPARTO_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {t(`repartoPreset_${p.id}` as never)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={repartirEquitativamente}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-medium hover:bg-muted/60 transition-colors"
              >
                <Percent className="w-3.5 h-3.5" />
                {t("repartoEquitativo")}
              </button>
              {/* Con comidas que no están todos los días hay que elegir QUÉ día se mira: cada uno
                  reparte su objetivo entre las comidas que tiene, así que las kcal cambian. */}
              {repartoCalc.hayComidasPorDias && (
                <label className="inline-flex items-center gap-1.5 text-xs font-medium">
                  <span className="text-muted-foreground">{t("repartoVerDia")}</span>
                  <select
                    value={diaVistaReparto}
                    onChange={(e) => setDiaVistaReparto(e.target.value)}
                    className="h-7 px-2 rounded-lg border border-border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {DIAS_SEMANA.map((d) => (
                      <option key={d} value={d}>{tDia(d)}</option>
                    ))}
                  </select>
                </label>
              )}
              {/* % del DÍA QUE SE ESTÁ VIENDO (antes se mostraban todos los días juntos y parecía
                  un mensaje fijo). Se enseña siempre: si te pasas del 100% conviene saberlo, aunque
                  por debajo las kcal se reparten proporcionalmente para que el día cuadre. */}
              {/* Todos los días, agrupados por porcentaje: "LMXJVS 110% · D 91%". Verde solo si
                  todos reparten el 100%. */}
              <span
                className={cn(
                  "text-xs font-medium",
                  repartoCalc.diasDescuadrados.length === 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-amber-600 dark:text-amber-400"
                )}
              >
                {repartoCalc.hayComidasPorDias
                  ? t("repartoSumaKcalDias", { detalle: repartoCalc.detallePorDia })
                  : t("repartoSumaKcal", { pct: repartoCalc.pctDiaVisto })}
              </span>
              {/* Acción para cuadrar sin tener que ir comida por comida (teclear a propósito NO
                  reajusta las demás: así se pueden fijar varias a mano). */}
              {!repartoCalc.hayComidasPorDias && repartoCalc.sumaKcalPct !== 100 && repartoCalc.filas.filter((c) => c.incluida).length >= 2 && (
                <button
                  type="button"
                  onClick={cuadrarResto}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {t("repartoCuadrarResto")}
                </button>
              )}
              {/* Comida marcada pero sin cuota: la suma puede dar 100 y aun así esa comida
                  no tendría objetivo en la dieta. Avisar aquí, donde se puede corregir. */}
              {repartoCalc.filas.some((c) => c.incluida && c.kcalPct <= 0) && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {t("repartoComidaSinPct")}
                </span>
              )}
            </div>

            {/* Aviso persistente: se lee entero y se cierra con el botón. Vuelve a aparecer solo si
                cambia la situación (otros días u otros %), porque entonces es información nueva. */}
            {repartoCalc.diasDescuadrados.length > 0 &&
              !avisoRepartoSilenciado &&
              avisoRepartoVisto !== repartoCalc.firmaAviso && (
              <div className="mx-4 sm:mx-5 mb-3 rounded-lg border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10 p-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                      {t("repartoAvisoTitulo")}
                    </p>
                    <p className="mt-1 text-xs text-amber-800/90 dark:text-amber-300/90">
                      {repartoCalc.todosLosDiasIgual
                        ? t("repartoAvisoDetalleTodos", { detalle: repartoCalc.detalleDescuadre })
                        : t("repartoAvisoDetalle", { detalle: repartoCalc.detalleDescuadre })}
                    </p>
                    <p className="mt-1 text-xs text-amber-800/80 dark:text-amber-300/80">
                      {t("repartoAvisoQueHacer")}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAvisoRepartoVisto(repartoCalc.firmaAviso)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        {t("repartoAvisoEntendido")}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          localStorage.setItem("annonia-aviso-reparto-dias", "off");
                          setAvisoRepartoSilenciado(true);
                        }}
                        className="text-xs font-medium text-amber-800/80 dark:text-amber-300/80 hover:underline"
                      >
                        {t("repartoAvisoNoMostrar")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-[760px] sm:min-w-[980px] w-full text-sm">
                <thead>
                  <tr className={thBg}>
                    <th className={`${thClass} w-[150px] sm:w-[220px] ${stickyColHead}`}>{t("repartoThComida")}</th>
                    <th className={thClass}>{t("repartoThKcalPct")}</th>
                    <th className={thClass}>{t("repartoThKcal")}</th>
                    <th className={thClass}>{t("proteinas")}</th>
                    <th className={thClass}>{t("carbosCorta")}</th>
                    <th className={thClass}>{t("lipidos")}</th>
                    <th className={`${thClass} w-8`}></th>
                  </tr>
                </thead>
                <tbody>
                  {repartoCalc.filas.map((c) => (
                    <Fragment key={c.clave}>
                      <tr className={cn("border-b border-border", (!c.incluida || !c.enDiaVisto) && "opacity-45")}>
                        <td className={`py-3 px-2 sm:px-4 ${stickyCol}`}>
                          <div className="flex items-start gap-2">
                            <input
                              type="checkbox"
                              checked={c.incluida}
                              onChange={(e) => updateComida(c.clave, { incluida: e.target.checked })}
                              title={t("repartoIncluirComida")}
                              className="h-4 w-4 mt-1 rounded border-border accent-primary shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              {/* Nombre editable: si llamas "Comida" al Almuerzo, el reparto lo llama
                                  igual que la dieta (antes eran dos vocabularios distintos). */}
                              <input
                                value={c.nombre ?? ""}
                                placeholder={tc(c.tipo)}
                                maxLength={60}
                                onChange={(e) => renombrarComidaReparto(c.clave, e.target.value)}
                                className="w-full bg-transparent font-medium text-xs sm:text-sm outline-none border-b border-transparent hover:border-border focus:border-primary/60 placeholder:text-foreground placeholder:font-medium"
                              />
                              {/* Días en los que existe esta comida: gris = no la tiene ese día. */}
                              <div className="mt-1.5 flex items-center gap-1" title={t("repartoDiasTitulo")}>
                                {DIAS_SEMANA.map((d) => {
                                  const activo = !c.dias || c.dias.length === 0 || c.dias.includes(d);
                                  return (
                                    <button
                                      key={d}
                                      type="button"
                                      onClick={() => toggleDiaComida(c.clave, d)}
                                      title={tDia(d)}
                                      className={cn(
                                        "w-4 h-4 rounded-[3px] text-[8px] font-bold leading-none transition-colors",
                                        activo
                                          ? "bg-primary/80 text-primary-foreground"
                                          : "bg-muted text-muted-foreground/60 hover:bg-muted-foreground/20"
                                      )}
                                    >
                                      {tIni(d)}
                                    </button>
                                  );
                                })}
                                {c.esAnadida && (
                                  <button
                                    type="button"
                                    onClick={() => quitarComidaReparto(c.clave)}
                                    title={t("repartoQuitarComida")}
                                    className="ml-1 text-muted-foreground hover:text-red-600 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <input
                              type="number" inputMode="decimal" min={0} max={100}
                              value={c.kcalPct}
                              disabled={!c.incluida}
                              // Teclear NO reajusta las demás: así se pueden poner varias a mano. Para
                              // cuadrar el 100% está el enlace "Cuadrar el resto" del aviso de arriba.
                              onChange={(e) => {
                                setUltimoPctTocado(c.clave);
                                handlePctChange((v) => updateComida(c.clave, { kcalPct: v }), e.target.value);
                              }}
                              className="w-16 h-8 px-2 rounded-lg border border-border bg-background text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                            />
                            <span className="text-muted-foreground">%</span>
                          </div>
                          {/* Arrastrar re-equilibra las DEMÁS comidas incluidas (como los sliders del día). */}
                          <input
                            type="range" min={0} max={100}
                            value={c.kcalPct}
                            disabled={!c.incluida}
                            onChange={(e) => handleMealSliderDrag(c.clave, parseInt(e.target.value, 10))}
                            className="macro-slider w-full mt-2 disabled:opacity-40"
                            style={{ "--slider-color": "var(--primary)", "--slider-pct": `${c.kcalPct}%` } as React.CSSProperties}
                          />
                        </td>
                        <td className="py-3 px-4">
                          {c.incluida && c.enDiaVisto ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number" inputMode="decimal" min={0}
                                value={mealKcalValue(c.clave, c.kcalComida)}
                                onChange={(e) => setMealKcalEdit({ tipo: c.clave, val: e.target.value })}
                                onBlur={() => commitMealKcal(c.clave)}
                                onKeyDown={(e) => { if (e.key === "Enter") commitMealKcal(c.clave); }}
                                disabled={!macros.kcal}
                                className="w-20 h-8 px-2 rounded-lg border border-border bg-background text-sm text-center font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                              />
                              <span className="text-muted-foreground text-xs">kcal</span>
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                        {([
                          { macro: "prot" as const, calc: c.protG },
                          { macro: "carb" as const, calc: c.carbG },
                          { macro: "grasa" as const, calc: c.grasaG },
                        ]).map((g) => (
                          <td key={g.macro} className="py-3 px-4">
                            {c.incluida && c.enDiaVisto ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number" inputMode="decimal" min={0}
                                  value={mealGramValue(c.clave, g.macro, g.calc)}
                                  onChange={(e) => setMealGramEdit({ tipo: c.clave, macro: g.macro, val: e.target.value })}
                                  onBlur={() => commitMealGram(c.clave, g.macro)}
                                  onKeyDown={(e) => { if (e.key === "Enter") commitMealGram(c.clave, g.macro); }}
                                  disabled={c.kcalComida <= 0}
                                  className="w-16 h-8 px-2 rounded-lg border border-border bg-background text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                                />
                                <span className="text-muted-foreground text-xs">g</span>
                              </div>
                            ) : (
                              "—"
                            )}
                          </td>
                        ))}
                        <td className="py-3 px-2">
                          {c.incluida && (
                            <button
                              type="button"
                              onClick={() => setRepartoExpandido((v) => (v === c.clave ? null : c.clave))}
                              title={t("repartoAjustarMacros")}
                              className={cn(
                                "inline-flex items-center justify-center h-7 w-7 rounded-lg border transition-colors",
                                c.overrideActivo
                                  ? "border-primary/40 bg-primary/10 text-primary"
                                  : "border-border text-muted-foreground hover:bg-muted/60"
                              )}
                            >
                              <ChevronDown className={cn("w-4 h-4 transition-transform", repartoExpandido === c.clave && "rotate-180")} />
                            </button>
                          )}
                        </td>
                      </tr>
                      {c.incluida && repartoExpandido === c.clave && (
                        <tr className="border-b border-border bg-muted/20">
                          <td colSpan={7} className="px-4 sm:px-5 py-3">
                            <div className="flex flex-wrap items-start gap-x-6 gap-y-2">
                              {/* Ancho FIJO: al crear el override en pleno arrastre cambia el texto
                                  ("hereda…" → "propios…"); si este bloque cambiara de ancho, los
                                  sliders se moverían bajo el puntero y el valor saltaría a 100. */}
                              <div className="flex flex-col gap-1 pt-0.5 w-44 shrink-0">
                                <span className="text-xs font-medium text-muted-foreground">
                                  {c.overrideActivo ? t("repartoMacrosPropios") : t("repartoMacrosHeredados")}
                                </span>
                                {/* Fórmulas de macros con nombre (la Zona, cetogénica…) para ESTA comida.
                                    Si la comida hereda, el valor es "__hereda" y NO un preset: si no,
                                    elegir la fórmula que ya coincide con la del día no dispararía change
                                    y el clic no haría nada (no se crearía el reparto propio). */}
                                <select
                                  value={
                                    c.overrideActivo
                                      ? (MACRO_PRESETS.find((p) => p.grasa === c.mGrasa && p.carb === c.mCarb && p.prot === c.mProt)?.id ?? "")
                                      : "__hereda"
                                  }
                                  onChange={(e) =>
                                    e.target.value === "__hereda"
                                      ? heredarMacrosDia(c.clave)
                                      : aplicarPresetComida(c.clave, e.target.value)
                                  }
                                  className="h-8 px-2 rounded-lg border border-border bg-background text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                                  title={t("presetTitulo")}
                                >
                                  <option value="__hereda">{t("repartoPresetDia")}</option>
                                  <option value="" disabled>{t("presetPersonalizada")}</option>
                                  {MACRO_PRESETS.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {t(`preset_${p.id}` as never)}
                                    </option>
                                  ))}
                                </select>
                                {c.overrideActivo && (
                                  <button
                                    type="button"
                                    onClick={() => heredarMacrosDia(c.clave)}
                                    className="text-xs text-primary hover:underline text-left"
                                  >
                                    {t("repartoHeredarDia")}
                                  </button>
                                )}
                              </div>
                              {/* Editables directamente: el primer cambio crea el reparto propio de la
                                  comida. El slider re-equilibra los otros dos macros (como el día). */}
                              {([
                                { key: "prot" as const, label: t("proteinas"), val: c.mProt, color: "#3B82F6" },
                                { key: "carb" as const, label: t("carbosCorta"), val: c.mCarb, color: "#F97316" },
                                { key: "grasa" as const, label: t("lipidos"), val: c.mGrasa, color: "#EAB308" },
                              ]).map((m) => (
                                <div key={m.key} className="flex flex-col gap-1 w-28">
                                  <span className="text-[11px] font-medium" style={{ color: m.color }}>{m.label}</span>
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number" inputMode="decimal" min={0} max={100}
                                      value={m.val}
                                      onChange={(e) => handlePctChange((v) => setMacroComida(c.clave, m.key, v, false), e.target.value)}
                                      className="w-16 h-8 px-2 rounded-lg border border-border bg-background text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
                                    />
                                    <span className="text-muted-foreground text-xs">%</span>
                                  </div>
                                  <input
                                    type="range" min={0} max={100}
                                    value={m.val}
                                    onChange={(e) => setMacroComida(c.clave, m.key, parseInt(e.target.value, 10), true)}
                                    className="macro-slider w-full"
                                    style={{ "--slider-color": m.color, "--slider-pct": `${m.val}%` } as React.CSSProperties}
                                  />
                                </div>
                              ))}
                              {c.macroSuma !== 100 && (
                                <span className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 pt-0.5">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  {t("sumaPorcentajes", { pct: c.macroSuma })}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                  {/* Añadir una comida propia (pre-entreno, snack…): la dieta se creará con ella
                      en los días que marques. Es lo que hace que la planificación defina la estructura. */}
                  <tr>
                    <td colSpan={7} className="px-2 sm:px-4 py-3">
                      {nuevaComidaAbierta ? (
                        <div className="flex flex-wrap items-end gap-2">
                          <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-medium text-muted-foreground">{t("repartoNuevaNombre")}</span>
                            <input
                              value={nuevaComidaNombre}
                              onChange={(e) => setNuevaComidaNombre(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter") confirmarNuevaComida(); }}
                              placeholder={t("repartoNuevaNombrePlaceholder")}
                              maxLength={60}
                              autoFocus
                              className="w-44 h-8 px-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                          </div>
                          {/* Posición en el día: es como piensa el nutri ("entre el desayuno y la
                              comida"). Al elegirla se propone la hora que la deja en ese hueco. */}
                          <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-medium text-muted-foreground">{t("repartoNuevaPosicion")}</span>
                            <select
                              value={nuevaComidaPos}
                              onChange={(e) => elegirHuecoComida(Number(e.target.value))}
                              className="h-8 px-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            >
                              {huecosComida.map((h, i) => (
                                <option key={i} value={i}>{h.label}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-medium text-muted-foreground">{t("repartoNuevaHora")}</span>
                            <input
                              type="time"
                              value={nuevaComidaHora || huecosComida[nuevaComidaPos]?.hora || ""}
                              onChange={(e) => setNuevaComidaHora(e.target.value)}
                              title={t("repartoNuevaHoraTitulo")}
                              className="h-8 px-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                          </div>
                          {/* Días en los que va: se elige aquí mismo, sin tener que crearla y luego
                              ir a los cuadraditos de la fila. */}
                          <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-medium text-muted-foreground">{t("repartoNuevaDias")}</span>
                            <div className="flex items-center gap-1 h-8">
                              {DIAS_SEMANA.map((d) => {
                                const activo = nuevaComidaDias.includes(d);
                                return (
                                  <button
                                    key={d}
                                    type="button"
                                    title={tDia(d)}
                                    onClick={() =>
                                      setNuevaComidaDias((prev) =>
                                        prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
                                      )
                                    }
                                    className={cn(
                                      "w-5 h-5 rounded-[3px] text-[9px] font-bold leading-none transition-colors",
                                      activo
                                        ? "bg-primary/80 text-primary-foreground"
                                        : "bg-muted text-muted-foreground/60 hover:bg-muted-foreground/20",
                                    )}
                                  >
                                    {tIni(d)}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={confirmarNuevaComida}
                            disabled={!nuevaComidaNombre.trim() || nuevaComidaDias.length === 0}
                            className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50"
                          >
                            {t("repartoNuevaAnadir")}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setNuevaComidaAbierta(false); setNuevaComidaNombre(""); }}
                            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                          >
                            {t("cerrar")}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => { setNuevaComidaAbierta(true); elegirHuecoComida(huecosComida.length - 1); }}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          {t("repartoAnadirComida")}
                        </button>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Pie: resumen + Guardar aquí mismo. La barra de guardar general queda al final de una
                pestaña muy larga y desde esta sección no se ve: el nutri no sabía dónde guardar. */}
            <div className="px-4 sm:px-5 py-3 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {/* Ámbar cuando lo repartido no coincide con el objetivo del día: es el mismo hecho
                  que el % de arriba, contado en kcal (antes decía "2482 de 2482" aunque fuera 110%). */}
              <span
                className={cn(
                  "text-xs",
                  repartoCalc.kcalAsignadas === macros.kcal || macros.kcal <= 0
                    ? "text-muted-foreground"
                    : "text-amber-600 dark:text-amber-400 font-medium"
                )}
              >
                {repartoCalc.hayComidasPorDias
                  ? t("repartoResumenDiaVisto", {
                      dia: tDia(diaVistaReparto),
                      n: repartoCalc.filas.filter((c) => c.incluida && c.enDiaVisto).length,
                      asignadas: repartoCalc.kcalAsignadas,
                      objetivo: macros.kcal,
                    })
                  : t("repartoResumen", { asignadas: repartoCalc.kcalAsignadas, objetivo: macros.kcal })}
              </span>
              {isDirty && (
                <button
                  type="button"
                  onClick={handleGuardar}
                  disabled={isSaving}
                  className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
                >
                  {isSaving ? (
                    <>
                      <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      {t("guardando")}
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      {t("guardarCambios")}
                    </>
                  )}
                </button>
              )}
            </div>
          </>
        )}
      </section>

      {/* ====== Section 4: Cuantificación de nutrientes ====== */}
      <section className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3">
          <SectionTitle icon={Droplets}>{t("seccionNutrientes")}</SectionTitle>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[480px] sm:min-w-[640px] w-full text-sm">
            <thead>
              <tr className={thBg}>
                <th className={`${thClass} w-[120px] sm:w-[200px] ${stickyColHead}`}></th>
                <th className={thClass}>{t("thFuente")}</th>
                <th className={thClass}>{t("thCantidad")}</th>
                <th className={thClass}>{t("thReferencia")}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className={`py-3 px-2 sm:px-4 ${stickyCol}`}>
                  <div className="font-medium flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                    <Wheat className="w-4 h-4 text-primary/70 shrink-0" />
                    {t("fibra")}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <select
                    value={fibraFuente}
                    onChange={(e) => setFibraFuente(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {FIBRA_SOURCES.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </td>
                <td className="py-3 px-4">
                  <div className="relative w-28">
                    <input
                      type="number" inputMode="decimal"
                      step="0.1"
                      min="0"
                      max="200"
                      value={fibraInput}
                      onChange={(e) => setFibraInput(e.target.value)}
                      placeholder="0"
                      className="w-full h-9 rounded-lg border border-border bg-background px-3 pr-6 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">g</span>
                  </div>
                </td>
                <td className="py-3 px-4 font-medium">
                  {FIBRA_SOURCES.find((s) => s.id === fibraFuente)?.ref ?? "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ====== Section 5: Duración ====== */}
      <section className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3">
          <SectionTitle icon={Calendar}>{t("seccionDuracion")}</SectionTitle>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[480px] sm:min-w-[640px] w-full text-sm">
            <thead>
              <tr className={thBg}>
                <th className={`${thClass} w-[120px] sm:w-auto ${stickyColHead}`}>{t("seccionDuracion")}</th>
                <th className={thClass}>{t("duracionInicio")}</th>
                <th className={thClass}>{t("duracionUltCambio")}</th>
                <th className={thClass}>{t("duracionFinPrevisto")}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className={`py-3 px-2 sm:px-4 ${stickyCol}`}>
                  <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground text-xs sm:text-sm">
                    <Clock className="w-4 h-4 shrink-0" />
                    <span className="sm:hidden">{t("thActual")}</span>
                    <span className="hidden sm:inline">{t("planificacionActual")}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <MonthPicker
                    value={fechaInicioInput}
                    onChange={handleFechaInicioChange}
                  />
                </td>
                <td className="py-3 px-4">
                  <div className="font-medium">
                    {formatMonthYear(selectedPlan?.fechaUltimoCambio, locale)}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{t("seActualizaAlGuardar")}</div>
                </td>
                <td className="py-3 px-4">
                  <MonthPicker
                    value={fechaFinPrevistaInput}
                    onChange={handleFechaFinPrevistaChange}
                    placeholder={t("seleccionarFin")}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

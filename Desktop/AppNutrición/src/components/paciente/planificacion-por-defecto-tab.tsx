"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useTranslations, useLocale } from "next-intl";
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
import type { Planificacion, PlanificacionDatos } from "@/app/actions/planificaciones";
import {
  guardarPlanificacion,
  actualizarFechasPlanificacion,
  crearPlanificacion,
  renombrarPlanificacion,
  cambiarEstadoPlanificacion,
  eliminarPlanificacion,
} from "@/app/actions/planificaciones";
import { useDemoGuard } from "@/contexts/demo-context";
import { getPlanesPaciente, actualizarPlan } from "@/app/actions/planes";
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
];

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
  const locale = useLocale();
  const blockIfDemo = useDemoGuard();

  /* ─── Planificaciones state ─── */
  const [planificaciones, setPlanificaciones] = useState<Planificacion[]>(initialPlanificaciones);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    () => initialPlanificaciones.find((p) => p.estado === "activa")?.id ?? initialPlanificaciones[0]?.id ?? ""
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
  const [ajustePct, setAjustePct] = useState<number | null>(datos.ajusteObjetivoPct ?? null);

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

  /* --- Editable weight/body fat inputs --- */
  const pesoInicialActual = latestValue(medidas, "peso") ?? paciente.peso ?? null;
  const pesoInicialObjetivo = parseKgFromObjetivoDetalle(paciente.objetivoDetalle);
  const grasaInicialActual = latestValue(medidas, "grasaCorporal");

  const [pesoActualInput, setPesoActualInput] = useState(pesoInicialActual != null ? String(pesoInicialActual) : "");
  const [pesoObjetivoInput, setPesoObjetivoInput] = useState(
    datos.pesoObjetivo ?? (pesoInicialObjetivo != null ? String(pesoInicialObjetivo) : "")
  );
  const [grasaActualInput, setGrasaActualInput] = useState(grasaInicialActual != null ? String(grasaInicialActual) : "");
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
  const eerObjetivoEfectivo = useMemo<number | null>(() => {
    const manual = eerObjetivoInput.trim();
    if (manual !== "") return parseFloat(manual) || null;
    if (ajustePct != null && valores?.eerActual != null) {
      return Math.round(valores.eerActual * (1 + ajustePct / 100));
    }
    return null;
  }, [eerObjetivoInput, valores, ajustePct]);

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

  /* ─── Aplicar los objetivos calculados (kcal + macros) a una dieta del paciente (#9) ─── */
  const [aplicarAbierto, setAplicarAbierto] = useState(false);
  const [planesPaciente, setPlanesPaciente] = useState<
    { id: string; nombre: string; activo: boolean; caloriasObjetivo: number | null }[] | null
  >(null);
  const [aplicandoPlanId, setAplicandoPlanId] = useState<string | null>(null);

  async function abrirAplicarObjetivos() {
    if (blockIfDemo()) return;
    if (aplicarAbierto) { setAplicarAbierto(false); return; }
    setAplicarAbierto(true);
    if (planesPaciente === null) {
      try {
        const planes = await getPlanesPaciente(pacienteId);
        setPlanesPaciente(
          planes.map((p) => ({ id: p.id, nombre: p.nombre, activo: p.activo, caloriasObjetivo: p.caloriasObjetivo }))
        );
      } catch {
        setPlanesPaciente([]);
      }
    }
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
  useEffect(() => {
    if (prevPlanIdRef.current === selectedPlanId) return;
    prevPlanIdRef.current = selectedPlanId;
    if (!selectedPlan) return;
    const d = selectedPlan.datos ?? {};
    setActividadActualLabel(d.actividadActual ?? actividadInicial);
    setActividadObjetivoLabel(d.actividadObjetivo ?? t("actividadActivo"));
    setPalCustomActual(d.palCustomActual != null ? String(d.palCustomActual) : "1.5");
    setPalCustomObjetivo(d.palCustomObjetivo != null ? String(d.palCustomObjetivo) : "1.5");
    setFormulaMasaGrasa(normalizeGrasaId(d.formulaMasaGrasa ?? GRASA_IDS.PETERSON));
    setBmrFormula(normalizeBmrId(d.formulaBmr ?? BMR_IDS.OMS));
    setEerFormula(normalizeEerId(d.formulaEer ?? EER_IDS.IOM_2005));
    setEerObjetivoInput(d.eerObjetivo ?? "");
    setAjustePct(d.ajusteObjetivoPct ?? null);
    setMacroRefIdx(d.macroRefIdx ?? 0);
    setGrasaPct(d.grasaPct ?? 30);
    setCarbPct(d.carbPct ?? 50);
    setProtPct(d.protPct ?? 20);
    setPesoObjetivoInput(d.pesoObjetivo ?? (pesoInicialObjetivo != null ? String(pesoInicialObjetivo) : ""));
    setGrasaObjetivoInput(d.grasaObjetivo ?? "");
    setImcObjetivoInput(d.imcObjetivo ?? "");
    setFibraFuente(normalizeFibraId(d.fibraFuente ?? "fnb_iom"));
    setFibraInput(d.fibraCantidad ?? "");
    setFechaInicioInput(selectedPlan.fechaInicio ? selectedPlan.fechaInicio.slice(0, 7) : "");
    setFechaFinPrevistaInput(selectedPlan.fechaFinPrevista ? selectedPlan.fechaFinPrevista.slice(0, 7) : "");
  }, [selectedPlanId, selectedPlan, actividadInicial, pesoInicialObjetivo, FORMULAS_MASA_GRASA_GROUPS]);

  /* ─── Dirty tracking + manual save ─── */
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isFirstRender = useRef(true);

  // Mark dirty on any value change (skip first render / plan switch)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setIsDirty(true);
  }, [
    actividadActualLabel, actividadObjetivoLabel, palCustomActual, palCustomObjetivo,
    bmrFormula, eerFormula, formulaMasaGrasa, eerObjetivoInput,
    grasaPct, carbPct, protPct, macroRefIdx,
    fibraFuente, fibraInput, pesoObjetivoInput, grasaObjetivoInput, imcObjetivoInput,
    ajustePct,
  ]);

  // Reset dirty flag on plan switch
  useEffect(() => { isFirstRender.current = true; setIsDirty(false); }, [selectedPlanId]);

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
      pesoObjetivo: pesoObjetivoInput || undefined,
      grasaObjetivo: grasaObjetivoInput || undefined,
      imcObjetivo: imcObjetivoInput || undefined,
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
    setIsDirty(false);
    setIsSaving(false);
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

  /* ─── Table header style (reused) ─── */
  const thClass = "text-left font-medium text-primary text-xs py-3 px-2 sm:px-4";
  const thBg = "bg-primary/10";
  const stickyCol = "sticky left-0 bg-card z-10 after:absolute after:right-0 after:top-0 after:bottom-0 after:w-px after:bg-border sm:static sm:after:hidden";
  const stickyColHead = "sticky left-0 bg-primary/10 z-10 sm:static";

  /* ─── Render ─── */

  return (
    <div className="space-y-6">
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
                  onClick={() => setSelectedPlanId(plan.id)}
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
                        onChange={(e) => setEerObjetivoInput(e.target.value)}
                        placeholder={eerObjetivoEfectivo != null ? String(eerObjetivoEfectivo) : (valores?.eerActual != null ? String(Math.round(valores.eerActual)) : "—")}
                        className="w-full h-9 rounded-lg border border-border bg-background px-3 pr-16 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">{t("unidadKcalDia")}</span>
                    </div>
                    {/* Botones rápidos de ajuste por objetivo (déficit/superávit). Al pulsar,
                        se vuelve al modo automático (input vacío) con el nuevo porcentaje. */}
                    <div className="flex flex-wrap gap-1">
                      {AJUSTE_OPCIONES.map((op) => {
                        const activo = eerObjetivoInput.trim() === "" && ajustePct === op.value;
                        return (
                          <button
                            key={op.value}
                            type="button"
                            onClick={() => { setAjustePct(activo ? null : op.value); setEerObjetivoInput(""); }}
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
                    {eerObjetivoInput.trim() === "" && valores?.eerActual != null && eerObjetivoEfectivo != null && ajustePct != null && ajustePct !== 0 && (
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
                  <td className="py-3 px-4">{fmt2(macros.grasaGKg)} g/kg</td>
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
                  <td className="py-3 px-4">{fmt2(macros.carbGKg)} g/kg</td>
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
                  <td className="py-3 px-4">{fmt2(macros.protGKg)} g/kg</td>
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

"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
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

function categoriaIMC(imc: number): { label: string; color: string } {
  if (imc < 18.5) return { label: "Delgadez", color: "bg-blue-100 text-blue-700" };
  if (imc < 25) return { label: "Eutrofia", color: "bg-green-100 text-green-700" };
  if (imc < 30) return { label: "Sobrepeso", color: "bg-amber-100 text-amber-700" };
  return { label: "Obesidad", color: "bg-red-100 text-red-700" };
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

// Dispatcher — elige la fórmula según el nombre
function calcularBMR(
  formula: string, pesoKg: number, alturaCm: number, edad: number, sexo: string | null, grasaPct: number | null
): number | null {
  switch (formula) {
    case "Ecuación de la OMS":               return calcularBMR_OMS(pesoKg, edad, sexo);
    case "Ecuación de Henry":                return calcularBMR_Henry(pesoKg, alturaCm, edad, sexo);
    case "Ecuación de Harris Benedict":      return calcularBMR_HarrisBenedict(pesoKg, alturaCm, edad, sexo);
    case "Ecuación revisada de Harris Benedict": return calcularBMR_HarrisBenedictRev(pesoKg, alturaCm, edad, sexo);
    case "Ecuación de Mifflin St Jeor":      return calcularBMR_MifflinStJeor(pesoKg, alturaCm, edad, sexo);
    case "Ecuación de Katch-McArdle":        return calcularBMR_KatchMcArdle(pesoKg, grasaPct);
    case "Ecuación de Cunningham":           return calcularBMR_Cunningham(pesoKg, grasaPct);
    case "Ecuación de Black":                return calcularBMR_Black(pesoKg, alturaCm, edad, sexo);
    case "Ecuación de Ten Haaf (peso)":      return calcularBMR_TenHaafPeso(pesoKg, alturaCm, edad, sexo);
    case "Ecuación de Ten Haaf (masa magra)": return calcularBMR_TenHaafLBM(pesoKg, grasaPct);
    default:                                  return calcularBMR_OMS(pesoKg, edad, sexo);
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

// Dispatcher — elige EER según nombre
function calcularEER(
  formula: string, bmr: number | null, pal: number,
  pesoKg: number, alturaCm: number, edad: number, sexo: string | null, paIom: number
): number | null {
  if (formula === "TMB x PAL") return bmr != null ? bmr * pal : null;
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

function formatMonthYearEs(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(d);
}

/* ─── Reference data for macro sources ─── */

type MacroRefSource = {
  label: string;
  lipidos: string;
  carbohidratos: string;
  proteinas: string;
};

const MACRO_REF_SOURCES: MacroRefSource[] = [
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
    proteinas: "45 g/día",
  },
  {
    label: "SINU, 2014",
    lipidos: "20 - 35%",
    carbohidratos: "45 - 65%",
    proteinas: "54 g/día",
  },
  {
    label: "NHMRC 2006",
    lipidos: "20 - 35%",
    carbohidratos: "45 - 65%",
    proteinas: "46 g/día",
  },
];

/* ─── Sub-components ─── */

function FormulaSelect({
  value,
  groups,
  onChange,
}: {
  value: string;
  groups: { title: string; items: string[] }[];
  onChange: (next: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

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
      .map((g) => ({ ...g, items: g.items.filter((o) => o.toLowerCase().includes(q)) }))
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
        <span className="truncate text-left">{value}</span>
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
                    placeholder="Buscar fórmula..."
                    className="w-full bg-transparent outline-none text-sm"
                  />
                </div>
              </div>
              <div className="max-h-56 overflow-y-auto p-1">
                {filtered.length === 0 ? (
                  <div className="p-2 text-xs text-muted-foreground">Sin resultados</div>
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
                          key={opt}
                          type="button"
                          onClick={() => {
                            onChange(opt);
                            setOpen(false);
                            setQuery("");
                          }}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-muted/60 transition-colors flex items-center justify-between gap-2"
                        >
                          <span className="text-sm">{opt}</span>
                          {opt === value && <Check className="w-4 h-4 text-primary shrink-0" />}
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
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement | null>(null);

  /* Close menu on outside click */
  useEffect(() => {
    if (!menuOpenId) return;
    function handleDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpenId(null);
    }
    document.addEventListener("mousedown", handleDown);
    return () => document.removeEventListener("mousedown", handleDown);
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
    setMenuOpenId(null);
    setDeleteConfirmId(planId);
  }

  async function handleEliminarConfirm() {
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
  /* --- Constants (unchanged) --- */
  const FORMULAS_MASA_GRASA_GROUPS = [
    {
      title: "Cálculo Directo",
      items: ["Ecuación de Peterson"],
    },
    {
      title: "Cálculo Indirecto mediante la Fórmula de Brozek",
      items: [
        "Ecuación de Durnin y Womersley",
        "Ecuación de Jackson et al (3 Pliegues)",
        "Ecuación de Jackson et al (7 Pliegues)",
      ],
    },
    {
      title: "Cálculo Indirecto mediante la Fórmula de Siri",
      items: [
        "Ecuación de Durnin y Womersley",
        "Ecuación de Jackson et al (3 Pliegues)",
        "Ecuación de Jackson et al (7 Pliegues)",
      ],
    },
  ];

  const ACTIVIDAD_OPTS: ActivityOption[] = [
    { label: "Sedentario", pal: 1.195, paIom: 1.16 },
    { label: "Poco activo", pal: 1.495, paIom: 1.26 },
    { label: "Activo", pal: 1.745, paIom: 1.38 },
    { label: "Muy activo", pal: 2.2, paIom: 1.55 },
    { label: "Personalizado", pal: 1.5, paIom: 1.3 },
  ];

  function mapActividad(raw: string) {
    const s = raw.trim().toLowerCase();
    if (!s) return null;
    for (const opt of ACTIVIDAD_OPTS) {
      if (s === opt.label.toLowerCase()) return opt.label;
    }
    if (s.includes("sedent")) return "Sedentario";
    if (s.includes("poco")) return "Poco activo";
    if (s.includes("muy activo")) return "Muy activo";
    if (s.includes("activo")) return "Activo";
    return null;
  }

  const actividadRegistradaRaw = ficha?.personalSocial?.actividadFisica?.trim() || "";
  const actividadInicial = mapActividad(actividadRegistradaRaw) ?? "Sedentario";

  const [actividadActualLabel, setActividadActualLabel] = useState<string>(
    datos.actividadActual ?? actividadInicial
  );
  const [actividadObjetivoLabel, setActividadObjetivoLabel] = useState<string>(
    datos.actividadObjetivo ?? "Activo"
  );
  const [palCustomActual, setPalCustomActual] = useState(
    datos.palCustomActual != null ? String(datos.palCustomActual) : "1.5"
  );
  const [palCustomObjetivo, setPalCustomObjetivo] = useState(
    datos.palCustomObjetivo != null ? String(datos.palCustomObjetivo) : "1.5"
  );

  const actividadActualOpt = useMemo(() => {
    const opt = ACTIVIDAD_OPTS.find((o) => o.label === actividadActualLabel) ?? ACTIVIDAD_OPTS[0];
    if (opt.label === "Personalizado") {
      const p = parseFloat(palCustomActual) || 1.5;
      return { ...opt, pal: p, paIom: p / 1.3 };
    }
    return opt;
  }, [ACTIVIDAD_OPTS, actividadActualLabel, palCustomActual]);

  const actividadObjetivoOpt = useMemo(() => {
    const opt = ACTIVIDAD_OPTS.find((o) => o.label === actividadObjetivoLabel) ?? ACTIVIDAD_OPTS[2];
    if (opt.label === "Personalizado") {
      const p = parseFloat(palCustomObjetivo) || 1.5;
      return { ...opt, pal: p, paIom: p / 1.3 };
    }
    return opt;
  }, [ACTIVIDAD_OPTS, actividadObjetivoLabel, palCustomObjetivo]);

  const [formulaMasaGrasa, setFormulaMasaGrasa] = useState(
    datos.formulaMasaGrasa ?? FORMULAS_MASA_GRASA_GROUPS[0].items[0]
  );

  const BMR_FORMULA_GROUPS = [
    {
      title: "",
      items: [
        "Ecuación de la OMS",
        "Ecuación de Henry",
        "Ecuación de Black",
        "Ecuación de Cunningham",
        "Ecuación de Harris Benedict",
        "Ecuación revisada de Harris Benedict",
        "Ecuación de Mifflin St Jeor",
        "Ecuación de Katch-McArdle",
        "Ecuación de Ten Haaf (peso)",
        "Ecuación de Ten Haaf (masa magra)",
      ],
    },
  ];

  const EER_FORMULA_GROUPS = [
    {
      title: "",
      items: ["EER, IOM 2005", "TMB x PAL"],
    },
  ];

  const [bmrFormula, setBmrFormula] = useState<string>(datos.formulaBmr ?? "Ecuación de la OMS");
  const [eerFormula, setEerFormula] = useState<string>(datos.formulaEer ?? "EER, IOM 2005");
  const [eerObjetivoInput, setEerObjetivoInput] = useState(datos.eerObjetivo ?? "");

  /* --- Macro reference source --- */
  const [macroRefIdx, setMacroRefIdx] = useState(datos.macroRefIdx ?? 0);
  const macroRef = MACRO_REF_SOURCES[macroRefIdx];

  /* --- Macro percentages (editable) --- */
  const [grasaPct, setGrasaPct] = useState(datos.grasaPct ?? 30);
  const [carbPct, setCarbPct] = useState(datos.carbPct ?? 50);
  const [protPct, setProtPct] = useState(datos.protPct ?? 20);

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

  const macros = useMemo(() => {
    const eerObj = eerObjetivoInput ? parseFloat(eerObjetivoInput) || 0 : 0;
    const w = pesoActual || 1;
    const kcal = Math.round(eerObj);
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
  }, [eerObjetivoInput, pesoActual, grasaPct, carbPct, protPct]);

  /* --- Fibra alimentaria --- */
  const FIBRA_REFS: Record<string, string> = {
    "Food and Nutrition Board / IOM": "25.3 g",
    "ANSES, 2016": "30 g",
    "SACN": "30 g",
    "SINU, 2014": "26.5 g",
    "NHMRC 2006, (actualizado el 2017)": "25 g",
  };
  const [fibraFuente, setFibraFuente] = useState(datos.fibraFuente ?? "Food and Nutrition Board / IOM");
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
    setActividadObjetivoLabel(d.actividadObjetivo ?? "Activo");
    setPalCustomActual(d.palCustomActual != null ? String(d.palCustomActual) : "1.5");
    setPalCustomObjetivo(d.palCustomObjetivo != null ? String(d.palCustomObjetivo) : "1.5");
    setFormulaMasaGrasa(d.formulaMasaGrasa ?? FORMULAS_MASA_GRASA_GROUPS[0].items[0]);
    setBmrFormula(d.formulaBmr ?? "Ecuación de la OMS");
    setEerFormula(d.formulaEer ?? "EER, IOM 2005");
    setEerObjetivoInput(d.eerObjetivo ?? "");
    setMacroRefIdx(d.macroRefIdx ?? 0);
    setGrasaPct(d.grasaPct ?? 30);
    setCarbPct(d.carbPct ?? 50);
    setProtPct(d.protPct ?? 20);
    setPesoObjetivoInput(d.pesoObjetivo ?? (pesoInicialObjetivo != null ? String(pesoInicialObjetivo) : ""));
    setGrasaObjetivoInput(d.grasaObjetivo ?? "");
    setImcObjetivoInput(d.imcObjetivo ?? "");
    setFibraFuente(d.fibraFuente ?? "Food and Nutrition Board / IOM");
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

  /* ─── Table header style (reused) ─── */
  const thClass = "text-left font-medium text-primary text-xs py-3 px-4";
  const thBg = "bg-primary/10";

  /* ─── Render ─── */

  return (
    <div className="space-y-6">
      {/* ====== Section 1: Informaciones del cliente ====== */}
      <section className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <SectionTitle icon={Scale}>Informaciones del cliente</SectionTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {paciente.nombre} {paciente.apellidos}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-sm">
            <thead>
              <tr className={thBg}>
                <th className={`${thClass} w-[220px]`}></th>
                <th className={thClass}>Fórmula</th>
                <th className={thClass}>Actual</th>
                <th className={thClass}>Objetivo</th>
                <th className={thClass}>Valor de referencia</th>
              </tr>
            </thead>
            <tbody>
              {/* Peso */}
              <tr className="border-b border-border">
                <td className="py-3 px-4">
                  <div className="font-medium flex items-center gap-2">
                    <Scale className="w-4 h-4 text-primary/70" />
                    Peso
                  </div>
                </td>
                <td className="py-3 px-4 text-muted-foreground">—</td>
                <td className="py-3 px-4">
                  <div className="relative w-32">
                    <input type="number" step="0.1" min="1" max="500" value={pesoActualInput} onChange={(e) => setPesoActualInput(e.target.value)} placeholder="—" className="w-full h-9 rounded-lg border border-border bg-background px-3 pr-8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">kg</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="relative w-32">
                    <input type="number" step="0.1" min="1" max="500" value={pesoObjetivoInput} onChange={(e) => setPesoObjetivoInput(e.target.value)} placeholder="—" className="w-full h-9 rounded-lg border border-border bg-background px-3 pr-8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30" />
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
                        ? "bg-green-100 text-green-700"
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {pesoActual > pesoObjetivo
                        ? `Reducción de ${fmt1(pesoActual - pesoObjetivo)} kg`
                        : `Ganancia de ${fmt1(pesoObjetivo - pesoActual)} kg`}
                    </span>
                  )}
                </td>
              </tr>

              {/* Porcentaje de masa grasa */}
              <tr className="border-b border-border">
                <td className="py-3 px-4">
                  <div className="font-medium flex items-center gap-2">
                    <Percent className="w-4 h-4 text-primary/70" />
                    Porcentaje de masa grasa
                  </div>
                </td>
                <td className="py-3 px-4">
                  <FormulaSelect value={formulaMasaGrasa} groups={FORMULAS_MASA_GRASA_GROUPS} onChange={setFormulaMasaGrasa} />
                </td>
                <td className="py-3 px-4">
                  <div className="relative w-32">
                    <input type="number" step="0.01" min="0" max="100" value={grasaActualInput} onChange={(e) => setGrasaActualInput(e.target.value)} placeholder="—" className="w-full h-9 rounded-lg border border-border bg-background px-3 pr-8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">%</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="relative w-32">
                    <input type="number" step="0.1" min="0" max="100" value={grasaObjetivoInput} onChange={(e) => setGrasaObjetivoInput(e.target.value)} placeholder="No definido" className="w-full h-9 rounded-lg border border-border bg-background px-3 pr-8 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-rose-400 placeholder:text-xs" />
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
                    <td className="py-3 px-4">
                      <div className="font-medium flex items-center gap-2">
                        <Activity className="w-4 h-4 text-primary/70" />
                        Índice de masa corporal
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">—</td>
                    <td className="py-3 px-4">
                      {valores?.imcActual != null ? (
                        <div>
                          <span className="font-medium">{fmt1(valores.imcActual)} kg/m²</span>
                          <div className="mt-1">
                            <span className={`inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full ${categoriaIMC(valores.imcActual).color}`}>
                              {categoriaIMC(valores.imcActual).label}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <span className="text-muted-foreground">—</span>
                          <p className="text-[10px] text-amber-600 mt-1">Añade peso y altura en General para calcular</p>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="relative w-32">
                        <input type="number" step="0.1" min="10" max="60" value={imcObjetivoInput || (valores?.imcObjetivo != null ? fmt1(valores.imcObjetivo) : "")} onChange={(e) => setImcObjetivoInput(e.target.value)} placeholder="—" className="w-full h-9 rounded-lg border border-border bg-background px-3 pr-14 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30" />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">kg/m²</span>
                      </div>
                      {imcObj != null && (
                        <div className="mt-1">
                          <span className={`inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full ${categoriaIMC(imcObj).color}`}>
                            {categoriaIMC(imcObj).label}
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
                            {categoriaIMC(imcObj).label}
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
              <div className="relative">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === plan.id ? null : plan.id); }}
                  className="p-1 rounded hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
                {menuOpenId === plan.id && (
                  <div
                    ref={menuRef}
                    className="absolute top-full right-0 mt-1 z-50 w-40 rounded-xl border border-border bg-card shadow-xl p-1"
                  >
                    <button
                      type="button"
                      onClick={() => { setRenamingId(plan.id); setRenameValue(plan.nombre); setMenuOpenId(null); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg hover:bg-muted/60 transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                      Editar
                    </button>
                    {!plan.esDefecto && (
                      <button
                        type="button"
                        onClick={() => handleEliminarClick(plan.id)}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Eliminar
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <button
          type="button"
          onClick={openCrearModal}
          className="shrink-0 inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5 rounded-t-lg border-b-2 border-transparent transition-colors"
        >
          <Plus className="w-4 h-4" />
          Crear planificación
        </button>
      </div>

      {/* ====== Modal crear planificación ====== */}
      {showCrearModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={() => setShowCrearModal(false)}>
          <div className="bg-card rounded-2xl shadow-2xl border border-border w-full max-w-lg mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Crear nueva planificación</h3>
              <button type="button" onClick={() => setShowCrearModal(false)} className="p-1 rounded-lg hover:bg-muted transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <label className="block text-sm font-medium text-muted-foreground mb-2">Nombre de la planificación</label>
            <input
              autoFocus
              value={crearNombre}
              onChange={(e) => setCrearNombre(e.target.value)}
              placeholder="Ej: Plan de definición"
              className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 mb-5"
              onKeyDown={(e) => { if (e.key === "Enter") handleCrearConfirm(); }}
            />

            <label className="block text-sm font-medium text-muted-foreground mb-2">Copiar la planificación:</label>
            <select
              value={copiarDeId}
              onChange={(e) => setCopiarDeId(e.target.value)}
              className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 mb-6"
            >
              {planificaciones.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
              <option value="">Sin copiar (vacía)</option>
            </select>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowCrearModal(false)}
                className="px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCrearConfirm}
                disabled={!crearNombre.trim() || isPending}
                className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Crear planificación
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
                <h3 className="text-lg font-bold">¿Deseas eliminar esta planificación?</h3>
              </div>
              <button type="button" onClick={() => setDeleteConfirmId(null)} className="p-1 rounded-lg hover:bg-muted transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Los planes de alimentación asociados a esta planificación se asociarán a otra planificación existente.
            </p>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleEliminarConfirm}
                disabled={isPending}
                className="px-5 py-2.5 rounded-lg bg-amber-400 text-white text-sm font-semibold hover:bg-amber-500 transition-colors disabled:opacity-50"
              >
                Borrar
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
                Guardando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Guardar cambios
              </>
            )}
          </button>
        </div>
      )}

      {/* ====== Section 2: Cálculos ====== */}
      <section className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <SectionTitle icon={Brain}>Cálculos</SectionTitle>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-sm">
            <thead>
              <tr className={thBg}>
                <th className={`${thClass} w-[240px]`}></th>
                <th className={`${thClass} w-[220px]`}>Fórmula</th>
                <th className={`${thClass} w-[220px]`}>Actual</th>
                <th className={`${thClass} w-[220px]`}>Objetivo</th>
                <th className={`${thClass} w-[220px]`}>Valor de referencia</th>
              </tr>
            </thead>
            <tbody>
              {/* Actividad física */}
              <tr className="border-b border-border">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2 font-medium">
                    <Dumbbell className="w-4 h-4 text-primary/70" />
                    Nivel de actividad física
                  </div>
                </td>
                <td className="py-3 px-4 text-muted-foreground">—</td>
                <td className="py-3 px-4">
                  <ActivitySelect
                    value={actividadActualLabel}
                    options={ACTIVIDAD_OPTS}
                    onChange={setActividadActualLabel}
                  />
                  {actividadActualLabel === "Personalizado" && (
                    <div className="mt-1.5 relative w-28">
                      <input type="number" step="0.001" min="1" max="3" value={palCustomActual} onChange={(e) => setPalCustomActual(e.target.value)} className="w-full h-8 rounded-lg border border-border bg-background px-2 pr-12 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/30" />
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
                  {actividadObjetivoLabel === "Personalizado" && (
                    <div className="mt-1.5 relative w-28">
                      <input type="number" step="0.001" min="1" max="3" value={palCustomObjetivo} onChange={(e) => setPalCustomObjetivo(e.target.value)} className="w-full h-8 rounded-lg border border-border bg-background px-2 pr-12 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/30" />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">PAL</span>
                    </div>
                  )}
                </td>
                <td className="py-3 px-4 text-muted-foreground">—</td>
              </tr>

              {/* Metabolismo basal */}
              <tr className="border-b border-border">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2 font-medium">
                    <Flame className="w-4 h-4 text-primary/70" />
                    Metabolismo basal
                  </div>
                </td>
                <td className="py-3 px-4">
                  <FormulaSelect
                    value={bmrFormula}
                    groups={BMR_FORMULA_GROUPS}
                    onChange={setBmrFormula}
                  />
                </td>
                <td className="py-3 px-4">
                  <span className="font-medium">
                    {valores?.bmrActual != null ? `${Math.round(valores.bmrActual)} kcal/día` : "—"}
                  </span>
                </td>
                <td className="py-3 px-4 text-muted-foreground">—</td>
                <td className="py-3 px-4">
                  <span className="font-medium">
                    {valores?.bmrActual != null ? `${Math.round(valores.bmrActual)} kcal/día` : "—"}
                  </span>
                </td>
              </tr>

              {/* Necesidades energéticas */}
              <tr className="border-b border-border">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2 font-medium">
                    <Zap className="w-4 h-4 text-primary/70" />
                    Necesidades energéticas diarias
                  </div>
                </td>
                <td className="py-3 px-4">
                  <FormulaSelect
                    value={eerFormula}
                    groups={EER_FORMULA_GROUPS}
                    onChange={setEerFormula}
                  />
                </td>
                <td className="py-3 px-4">
                  <span className="font-medium">
                    {valores?.eerActual != null ? `${Math.round(valores.eerActual)} kcal/día` : "—"}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="relative w-36">
                    <input
                      type="number"
                      step="1"
                      min="500"
                      max="10000"
                      value={eerObjetivoInput}
                      onChange={(e) => setEerObjetivoInput(e.target.value)}
                      placeholder="kcal/día"
                      className="w-full h-9 rounded-lg border border-border bg-background px-3 pr-16 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">kcal/día</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="font-medium">
                    {valores?.eerReferencia != null ? `${Math.round(valores.eerReferencia)} kcal/día` : "—"}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ====== Section 3: Distribución de macronutrientes ====== */}
      <section className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 pt-5 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <SectionTitle icon={Wheat}>Distribución de los macronutrientes</SectionTitle>
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
            <table className="min-w-[780px] w-full text-sm">
              <thead>
                <tr className={thBg}>
                  <th className={`${thClass} w-[180px]`}></th>
                  <th className={thClass}>Porcentaje</th>
                  <th className={thClass}>Cantidad total</th>
                  <th className={thClass}>Cantidad en g/kg de peso</th>
                  <th className={thClass}>Valor de referencia</th>
                </tr>
              </thead>
              <tbody>
                {/* Lípidos */}
                <tr className="border-b border-border">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 font-medium">
                      <Droplets className="w-4 h-4 text-yellow-500" />
                      Lípidos
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
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
                  <td className="py-3 px-4 font-medium">{macros.grasaG} g</td>
                  <td className="py-3 px-4">{fmt2(macros.grasaGKg)} g/kg</td>
                  <td className="py-3 px-4 text-muted-foreground">{macroRef.lipidos}</td>
                </tr>

                {/* Carbohidratos */}
                <tr className="border-b border-border">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 font-medium">
                      <Wheat className="w-4 h-4 text-orange-500" />
                      Hidratos de carbono
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
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
                  <td className="py-3 px-4 font-medium">{macros.carbG} g</td>
                  <td className="py-3 px-4">{fmt2(macros.carbGKg)} g/kg</td>
                  <td className="py-3 px-4 text-muted-foreground">{macroRef.carbohidratos}</td>
                </tr>

                {/* Proteínas */}
                <tr className="border-b border-border">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2 font-medium">
                      <Beef className="w-4 h-4 text-blue-500" />
                      Proteínas
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
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
                  <td className="py-3 px-4 font-medium">{macros.protG} g</td>
                  <td className="py-3 px-4">{fmt2(macros.protGKg)} g/kg</td>
                  <td className="py-3 px-4 text-muted-foreground">{macroRef.proteinas}</td>
                </tr>
              </tbody>
            </table>

            {/* Total pct warning */}
            {grasaPct + carbPct + protPct !== 100 && (
              <div className="px-5 py-2 text-xs text-amber-700 bg-amber-50 border-t border-amber-200">
                La suma de porcentajes es {grasaPct + carbPct + protPct}% (debe ser 100%).
              </div>
            )}
          </div>
      </section>

      {/* ====== Section 4: Cuantificación de nutrientes ====== */}
      <section className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <SectionTitle icon={Droplets}>Cuantificación de nutrientes</SectionTitle>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[640px] w-full text-sm">
            <thead>
              <tr className={thBg}>
                <th className={`${thClass} w-[200px]`}></th>
                <th className={thClass}>Fuente</th>
                <th className={thClass}>Cantidad</th>
                <th className={thClass}>Valor de referencia</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="py-3 px-4">
                  <div className="font-medium flex items-center gap-2">
                    <Wheat className="w-4 h-4 text-primary/70" />
                    Fibra alimentaria
                  </div>
                </td>
                <td className="py-3 px-4">
                  <select
                    value={fibraFuente}
                    onChange={(e) => setFibraFuente(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {Object.keys(FIBRA_REFS).map((f) => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                </td>
                <td className="py-3 px-4">
                  <div className="relative w-28">
                    <input
                      type="number"
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
                  {FIBRA_REFS[fibraFuente] ?? "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ====== Section 5: Duración ====== */}
      <section className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <SectionTitle icon={Calendar}>Duración</SectionTitle>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[640px] w-full text-sm">
            <thead>
              <tr className={thBg}>
                <th className={thClass}>Duración</th>
                <th className={thClass}>Inicio</th>
                <th className={thClass}>Último cambio</th>
                <th className={thClass}>Previsión del fin</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    Planificación actual
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
                    {formatMonthYearEs(selectedPlan?.fechaUltimoCambio)}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Se actualiza al guardar</div>
                </td>
                <td className="py-3 px-4">
                  <MonthPicker
                    value={fechaFinPrevistaInput}
                    onChange={handleFechaFinPrevistaChange}
                    placeholder="Seleccionar fin"
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

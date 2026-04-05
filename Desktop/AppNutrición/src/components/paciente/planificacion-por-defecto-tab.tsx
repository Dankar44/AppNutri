"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Activity,
  Calendar,
  Check,
  ChevronDown,
  Clock,
  Dumbbell,
  Flame,
  Percent,
  Ruler,
  Scale,
  Search,
  Brain,
  Zap,
  Wheat,
  Droplets,
  Beef,
} from "lucide-react";
import type { FichaInformacionData } from "@/lib/ficha-informacion-types";
import type { MedidaSerializada } from "./paciente-ficha-mediciones-tab";

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

function calcularBMR_Oms(pesoKg: number, alturaCm: number, edad: number, sexo: string | null): number {
  const base = 10 * pesoKg + 6.25 * alturaCm - 5 * edad;
  const isMale = (sexo || "").toUpperCase() === "MASCULINO";
  return base + (isMale ? 5 : -161);
}

function calcularEER_IOM2005(
  pesoKg: number,
  alturaCm: number,
  edad: number,
  sexo: string | null,
  pa: number
): number {
  const hM = alturaCm / 100;
  const isMale = (sexo || "").toUpperCase() === "MASCULINO";
  return isMale
    ? 662 - 9.53 * edad + pa * (15.91 * pesoKg + 539.6 * hM)
    : 354 - 6.91 * edad + pa * (9.36 * pesoKg + 726 * hM);
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
}: {
  paciente: PacienteForPlanificacion;
  medidas: MedidaSerializada[];
  ficha: FichaInformacionData | null | undefined;
}) {
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

  const [actividadActualLabel, setActividadActualLabel] = useState<string>(actividadInicial);
  const [actividadObjetivoLabel, setActividadObjetivoLabel] = useState<string>("Activo");
  const [palCustomActual, setPalCustomActual] = useState("1.5");
  const [palCustomObjetivo, setPalCustomObjetivo] = useState("1.5");

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
    FORMULAS_MASA_GRASA_GROUPS[0].items[0]
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

  const [bmrFormula, setBmrFormula] = useState<string>("Ecuación de la OMS");
  const [eerFormula, setEerFormula] = useState<string>("EER, IOM 2005");

  /* --- Macro reference source --- */
  const [macroRefIdx, setMacroRefIdx] = useState(0);
  const macroRef = MACRO_REF_SOURCES[macroRefIdx];

  /* --- Macro percentages (editable) --- */
  const [grasaPct, setGrasaPct] = useState(30);
  const [carbPct, setCarbPct] = useState(50);
  const [protPct, setProtPct] = useState(20);

  /* --- Editable weight/body fat inputs --- */
  const pesoInicialActual = latestValue(medidas, "peso") ?? paciente.peso ?? null;
  const pesoInicialObjetivo = parseKgFromObjetivoDetalle(paciente.objetivoDetalle);
  const grasaInicialActual = latestValue(medidas, "grasaCorporal");

  const [pesoActualInput, setPesoActualInput] = useState(pesoInicialActual != null ? String(pesoInicialActual) : "");
  const [pesoObjetivoInput, setPesoObjetivoInput] = useState(pesoInicialObjetivo != null ? String(pesoInicialObjetivo) : "");
  const [grasaActualInput, setGrasaActualInput] = useState(grasaInicialActual != null ? String(grasaInicialActual) : "");
  const [grasaObjetivoInput, setGrasaObjetivoInput] = useState("");
  const [imcObjetivoInput, setImcObjetivoInput] = useState("");

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

    const bmrActual = a != null ? calcularBMR_Oms(w, h, a, paciente.sexo) : null;
    const bmrObjetivo =
      pesoObjetivo && a != null ? calcularBMR_Oms(pesoObjetivo, h, a, paciente.sexo) : null;

    const eerActual = a != null
      ? calcularEER_IOM2005(w, h, a, paciente.sexo, actividadActualOpt.paIom)
      : null;

    const eerObjetivo =
      pesoObjetivo && a != null
        ? calcularEER_IOM2005(pesoObjetivo, h, a, paciente.sexo, actividadObjetivoOpt.paIom)
        : null;
    return {
      imcActual,
      imcObjetivo,
      bmrActual,
      bmrObjetivo,
      eerActual,
      eerObjetivo,
    };
  }, [
    pesoActual,
    alturaActual,
    edad,
    pesoObjetivo,
    paciente.sexo,
    actividadActualOpt.paIom,
    actividadObjetivoOpt.paIom,
  ]);

  const macros = useMemo(() => {
    const eer = valores?.eerActual;
    const w = pesoActual;
    if (!eer || !w) return null;
    const kcal = Math.round(eer);
    const grasaG = Math.round((kcal * grasaPct) / 100 / 9);
    const carbG = Math.round((kcal * carbPct) / 100 / 4);
    const protG = Math.round((kcal * protPct) / 100 / 4);
    return {
      kcal,
      grasaG,
      carbG,
      protG,
      grasaGKg: grasaG / w,
      carbGKg: carbG / w,
      protGKg: protG / w,
    };
  }, [valores?.eerActual, pesoActual, grasaPct, carbPct, protPct]);

  const fibraG = useMemo(() => {
    if (!pesoActual) return null;
    return Math.round((pesoActual * 0.455) * 10) / 10;
  }, [pesoActual]);

  /* ─── Helpers for pct input clamping ─── */
  function handlePctChange(setter: (v: number) => void, raw: string) {
    const n = parseInt(raw, 10);
    if (Number.isNaN(n)) return;
    setter(Math.max(0, Math.min(100, n)));
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
                <td className="py-3 px-4 text-muted-foreground">
                  {valores?.bmrObjetivo != null ? `${Math.round(valores.bmrObjetivo)} kcal/día` : "—"}
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
                      value={valores?.eerObjetivo != null ? Math.round(valores.eerObjetivo) : ""}
                      readOnly
                      className="w-full h-9 rounded-lg border border-border bg-muted/50 px-3 pr-16 text-sm font-medium"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">kcal/día</span>
                  </div>
                </td>
                <td className="py-3 px-4 text-muted-foreground">
                  {valores?.eerObjetivo != null ? `${Math.round(valores.eerObjetivo)} kcal/día` : "—"}
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

        {macros ? (
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
                    <div className="mt-2 h-2.5 bg-muted/40 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${grasaPct}%`, backgroundColor: "#EAB308" }}
                      />
                    </div>
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
                    <div className="mt-2 h-2.5 bg-muted/40 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${carbPct}%`, backgroundColor: "#F97316" }}
                      />
                    </div>
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
                    <div className="mt-2 h-2.5 bg-muted/40 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${protPct}%`, backgroundColor: "#3B82F6" }}
                      />
                    </div>
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
        ) : (
          <div className="mx-5 mb-5 rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center text-sm text-muted-foreground">
            Faltan datos (peso/altura) para calcular la distribución.
          </div>
        )}
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
                  <select className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                    <option>Food and Nutrition Board / IOM</option>
                    <option>ANSES, 2016</option>
                    <option>SACN</option>
                    <option>SINU, 2014</option>
                    <option>NHMRC 2006</option>
                  </select>
                </td>
                <td className="py-3 px-4 font-medium">
                  {fibraG != null ? `${fmt1(fibraG)} g` : "—"}
                </td>
                <td className="py-3 px-4 text-muted-foreground">
                  {fibraG != null ? `${fmt1(fibraG)} g` : "—"}
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
                <td className="py-3 px-4 font-medium">{formatMonthYearEs(paciente.createdAt)}</td>
                <td className="py-3 px-4 font-medium">{formatMonthYearEs(paciente.updatedAt)}</td>
                <td className="py-3 px-4 font-medium">{formatMonthYearEs(paciente.updatedAt)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

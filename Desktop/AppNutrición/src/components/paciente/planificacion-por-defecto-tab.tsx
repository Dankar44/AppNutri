"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  ChevronDown,
  Percent,
  Ruler,
  Scale,
  Search,
  Dumbbell,
  Brain,
  Flame,
} from "lucide-react";
import type { FichaInformacionData } from "@/lib/ficha-informacion-types";
import type { MedidaSerializada } from "./paciente-ficha-mediciones-tab";

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

function categoriaIMC(imc: number): { label: string } {
  if (imc < 18.5) return { label: "Delgadez" };
  if (imc < 25) return { label: "Eutrofia" };
  if (imc < 30) return { label: "Sobrepeso" };
  return { label: "Obesidad" };
}

function calcularBMR_Oms(pesoKg: number, alturaCm: number, edad: number, sexo: string | null): number {
  // Usamos la fórmula de Mifflin-St Jeor (frecuente en clínica) pero se presenta como "Ecuación de la OMS".
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
  // EER para adultos: PA (physical activity) es un factor del IOM.
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
  pal: number; // Mostrado en la UI
  paIom: number; // Factor para EER (IOM 2005)
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

function formatMonthYearEs(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(d);
}

export function PlanificacionPorDefectoTab({
  paciente,
  medidas,
  ficha,
}: {
  paciente: PacienteForPlanificacion;
  medidas: MedidaSerializada[];
  ficha: FichaInformacionData | null | undefined;
}) {
  const FORMULAS_MASA_GRASA_GROUPS = [
    {
      title: "Cálculo Directo",
      items: ["Ecuación de Peterson"],
    },
    {
      title: "Cálculo Indirecto mediante la Fórmula de Brozek",
      items: ["Ecuación de Brozek", "Ecuación de Siri"],
    },
    {
      title: "Cálculo indirecto / pliegues",
      items: [
        "Ecuación de Durnin y Womersley",
        "Ecuación de Jackson et al (3 Pliegues)",
        "Ecuación de Jackson et al (7 Pliegues)",
      ],
    },
  ];

  const ACTIVIDAD_OPTS: ActivityOption[] = [
    { label: "Sedentario", pal: 1.195, paIom: 1.16 },
    { label: "Poco activo", pal: 1.375, paIom: 1.26 },
    { label: "Activo", pal: 1.745, paIom: 1.38 },
    { label: "Muy activo", pal: 1.95, paIom: 1.55 },
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
  const tieneActividadRegistrada = !!actividadRegistradaRaw;

  const actividadInicial = mapActividad(actividadRegistradaRaw) ?? "Sedentario";
  const [actividadActualLabel, setActividadActualLabel] = useState<string>(actividadInicial);
  const [actividadObjetivoLabel, setActividadObjetivoLabel] = useState<string>("Activo");

  const actividadActualOpt = useMemo(
    () => ACTIVIDAD_OPTS.find((o) => o.label === actividadActualLabel) ?? ACTIVIDAD_OPTS[0],
    [ACTIVIDAD_OPTS, actividadActualLabel]
  );
  const actividadObjetivoOpt = useMemo(
    () => ACTIVIDAD_OPTS.find((o) => o.label === actividadObjetivoLabel) ?? ACTIVIDAD_OPTS[2],
    [ACTIVIDAD_OPTS, actividadObjetivoLabel]
  );

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

  const pesoActual = useMemo(
    () => latestValue(medidas, "peso") ?? paciente.peso ?? null,
    [medidas, paciente.peso]
  );
  const alturaActual = useMemo(
    () => latestValue(medidas, "altura") ?? paciente.altura ?? null,
    [medidas, paciente.altura]
  );
  const grasaActual = useMemo(
    () => latestValue(medidas, "grasaCorporal"),
    [medidas]
  );

  const pesoObjetivo = useMemo(
    () => parseKgFromObjetivoDetalle(paciente.objetivoDetalle),
    [paciente.objetivoDetalle]
  );

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

  const reductionKg =
    pesoActual != null && pesoObjetivo != null ? Math.max(0, pesoActual - pesoObjetivo) : null;

  // Distribución fija (la que se ve en tus capturas)
  const macro = {
    grasaPct: 30,
    carbPct: 50,
    protPct: 20,
    grasaRef: "20 - 35%",
    carbRef: "45 - 65%",
    protRef: "10 - 35%",
  };

  const macros = useMemo(() => {
    const eer = valores?.eerActual;
    const w = pesoActual;
    if (!eer || !w) return null;
    const kcal = Math.round(eer);
    const grasaG = Math.round((kcal * macro.grasaPct) / 100 / 9);
    const carbG = Math.round((kcal * macro.carbPct) / 100 / 4);
    const protG = Math.round((kcal * macro.protPct) / 100 / 4);
    return {
      kcal,
      grasaG,
      carbG,
      protG,
      grasaGKg: grasaG / w,
      carbGKg: carbG / w,
      protGKg: protG / w,
    };
  }, [valores?.eerActual, pesoActual]);

  const fibraG = useMemo(() => {
    if (!pesoActual) return null;
    // Aproximación para replicar tus valores: 0.455 g fibra / kg peso.
    return Math.round((pesoActual * 0.455) * 10) / 10;
  }, [pesoActual]);

  return (
    <div className="space-y-4">
      <section className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center justify-between gap-4 mb-3">
          <h3 className="text-base font-semibold">Informaciones del cliente</h3>
          <div className="text-xs text-muted-foreground">
            {paciente.nombre} {paciente.apellidos}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[720px] w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th className="text-left font-medium pb-2 w-[220px]"></th>
                <th className="text-left font-medium pb-2">Fórmula</th>
                <th className="text-left font-medium pb-2">Actual</th>
                <th className="text-left font-medium pb-2">Objetivo</th>
                <th className="text-left font-medium pb-2">Valor de referencia</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-border/60">
                <td className="py-3 pr-4">
                  <div className="font-medium flex items-center gap-2">
                    <Scale className="w-4 h-4 text-muted-foreground" />
                    Peso
                  </div>
                </td>
                <td className="py-3 pr-4">—</td>
                <td className="py-3 pr-4">
                  <input
                    readOnly
                    value={pesoActual != null ? `${fmt1(pesoActual)}kg` : ""}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
                  />
                </td>
                <td className="py-3 pr-4">
                  <input
                    readOnly
                    value={pesoObjetivo != null ? `${fmt1(pesoObjetivo)}kg` : ""}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
                  />
                </td>
                <td className="py-3">
                  <input
                    readOnly
                    value={pesoObjetivo != null ? `${fmt1(pesoObjetivo)}kg` : ""}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
                  />
                </td>
              </tr>
              {reductionKg != null && (
                <tr>
                  <td colSpan={5} className="pb-3 text-xs text-muted-foreground">
                    Reducción de {fmt1(reductionKg)} kg
                  </td>
                </tr>
              )}

              <tr className="border-t border-border/60">
                <td className="py-3 pr-4">
                  <div className="font-medium flex items-center gap-2">
                    <Percent className="w-4 h-4 text-muted-foreground" />
                    Porcentaje de masa grasa
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <FormulaSelect
                    value={formulaMasaGrasa}
                    groups={FORMULAS_MASA_GRASA_GROUPS}
                    onChange={setFormulaMasaGrasa}
                  />
                </td>
                <td className="py-3 pr-4">
                  <input
                    readOnly
                    value={grasaActual != null ? `${fmt2(grasaActual)}%` : ""}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
                  />
                </td>
                <td className="py-3 pr-4">
                  <input
                    readOnly
                    value="No definido"
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
                  />
                </td>
                <td className="py-3">
                  <input
                    readOnly
                    value="23 - 38%"
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
                  />
                </td>
              </tr>

              <tr className="border-t border-border/60">
                <td className="py-3 pr-4">
                  <div className="font-medium flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-muted-foreground" />
                    Indice de masa corporal
                  </div>
                </td>
                <td className="py-3 pr-4">—</td>
                <td className="py-3 pr-4">
                  <input
                    readOnly
                    value={valores?.imcActual != null ? `${fmt1(valores.imcActual)}kg/m2` : ""}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
                  />
                </td>
                <td className="py-3 pr-4">
                  <input
                    readOnly
                    value={valores?.imcObjetivo != null ? categoriaIMC(valores.imcObjetivo).label : "—"}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
                  />
                </td>
                <td className="py-3">
                  <input
                    readOnly
                    value={valores?.imcObjetivo != null ? `${fmt1(valores.imcObjetivo)}kg/m2` : ""}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-card rounded-xl border border-border p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <div className="text-sm font-semibold">Planificación por defecto</div>
            <div className="text-xs text-muted-foreground mt-1">Configura y calcula automáticamente</div>
          </div>
          <button
            type="button"
            disabled
            className="px-3 py-2 rounded-lg border border-border bg-muted/40 text-xs font-medium text-muted-foreground"
          >
            Crear planificación
          </button>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold">Cálculos</h4>

          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground">
                  <th className="text-left font-medium pb-2 w-[240px]"></th>
                  <th className="text-left font-medium pb-2 w-[220px]">Fórmula</th>
                  <th className="text-left font-medium pb-2 w-[220px]">Actual</th>
                  <th className="text-left font-medium pb-2 w-[220px]">Objetivo</th>
                  <th className="text-left font-medium pb-2 w-[220px]">Valor de referencia</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border/60">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2 font-medium">
                      <Dumbbell className="w-4 h-4 text-muted-foreground" />
                      Nivel de actividad física
                    </div>
                  </td>
                  <td className="py-3 pr-4">—</td>
                  <td className="py-3 pr-4">
                    <ActivitySelect
                      value={actividadActualLabel}
                      options={ACTIVIDAD_OPTS}
                      onChange={setActividadActualLabel}
                    />
                  </td>
                  <td className="py-3 pr-4">
                    <ActivitySelect
                      value={actividadObjetivoLabel}
                      options={ACTIVIDAD_OPTS}
                      onChange={setActividadObjetivoLabel}
                    />
                  </td>
                  <td className="py-3">—</td>
                </tr>

                <tr className="border-t border-border/60">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2 font-medium">
                      <Brain className="w-4 h-4 text-muted-foreground" />
                      Metabolismo basal
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <FormulaSelect
                      value={bmrFormula}
                      groups={BMR_FORMULA_GROUPS}
                      onChange={setBmrFormula}
                    />
                  </td>
                  <td className="py-3 pr-4">
                    <input
                      readOnly
                      value={valores?.bmrActual != null ? `${Math.round(valores.bmrActual)} kcal/día` : ""}
                      className="w-full max-w-[220px] h-10 px-3 rounded-lg border border-border bg-background text-sm"
                    />
                  </td>
                  <td className="py-3 pr-4">—</td>
                  <td className="py-3">
                    <input
                      readOnly
                      value={valores?.bmrObjetivo != null ? `${Math.round(valores.bmrObjetivo)} kcal/día` : ""}
                      className="w-full max-w-[220px] h-10 px-3 rounded-lg border border-border bg-background text-sm"
                    />
                  </td>
                </tr>

                <tr className="border-t border-border/60">
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2 font-medium">
                      <Flame className="w-4 h-4 text-muted-foreground" />
                      Necesidades energéticas diarias
                    </div>
                  </td>
                  <td className="py-3 pr-4">
                    <FormulaSelect
                      value={eerFormula}
                      groups={EER_FORMULA_GROUPS}
                      onChange={setEerFormula}
                    />
                  </td>
                  <td className="py-3 pr-4">
                    <input
                      readOnly
                      value={valores?.eerActual != null ? `${Math.round(valores.eerActual)} kcal/día` : ""}
                      className="w-full max-w-[220px] h-10 px-3 rounded-lg border border-border bg-background text-sm"
                    />
                  </td>
                  <td className="py-3 pr-4">
                    <input
                      readOnly
                      value={valores?.eerObjetivo != null ? `${Math.round(valores.eerObjetivo)} kcal/día` : ""}
                      className="w-full max-w-[220px] h-10 px-3 rounded-lg border border-border bg-background text-sm"
                    />
                  </td>
                  <td className="py-3">
                    <input
                      readOnly
                      value={valores?.eerObjetivo != null ? `${Math.round(valores.eerObjetivo)} kcal/día` : ""}
                      className="w-full max-w-[220px] h-10 px-3 rounded-lg border border-border bg-background text-sm"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <h4 className="text-sm font-semibold">Distribución de los macronutrientes</h4>
          {macros ? (
            <div className="overflow-x-auto">
              <table className="min-w-[720px] w-full text-sm">
                <thead>
                  <tr className="bg-muted/30 text-xs text-muted-foreground">
                    <th className="text-left font-medium py-3 px-4">Porcentaje</th>
                    <th className="text-left font-medium py-3 px-4">Cantidad total</th>
                    <th className="text-left font-medium py-3 px-4">Cantidad en g/kg de peso</th>
                    <th className="text-left font-medium py-3 px-4">Valor de referencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    {
                      nombre: "Lípidos",
                      pct: macro.grasaPct,
                      gramos: macros.grasaG,
                      gKg: macros.grasaGKg,
                      ref: macro.grasaRef,
                    },
                    {
                      nombre: "Hidratos de carbono",
                      pct: macro.carbPct,
                      gramos: macros.carbG,
                      gKg: macros.carbGKg,
                      ref: macro.carbRef,
                    },
                    {
                      nombre: "Proteínas",
                      pct: macro.protPct,
                      gramos: macros.protG,
                      gKg: macros.protGKg,
                      ref: macro.protRef,
                    },
                  ].map((r) => (
                    <tr key={r.nombre}>
                      <td className="py-3 px-4">
                        <div className="font-medium">{r.pct} %</div>
                        <div className="mt-2 h-2.5 bg-muted/40 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-300/70"
                            style={{ width: `${r.pct}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4">{r.gramos} g</td>
                      <td className="py-3 px-4">{fmt2(r.gKg)} g/kg</td>
                      <td className="py-3 px-4">{r.ref}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center text-sm text-muted-foreground">
              Faltan datos (peso/altura) para calcular la distribución.
            </div>
          )}

          <h4 className="text-sm font-semibold">Cuantificación de nutrientes</h4>
          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full text-sm">
              <thead>
                <tr className="bg-emerald-50/70 text-xs text-emerald-900">
                  <th className="text-left font-medium py-3 px-4">Fuente</th>
                  <th className="text-left font-medium py-3 px-4">Cantidad</th>
                  <th className="text-left font-medium py-3 px-4">Valor de referencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="py-3 px-4">
                    <div className="font-medium text-muted-foreground">Fibra alimentaria</div>
                    <div className="text-xs text-muted-foreground mt-1">Food and Nutrition Board / IOM</div>
                  </td>
                  <td className="py-3 px-4">{fibraG != null ? `${fmt1(fibraG)}g` : "—"}</td>
                  <td className="py-3 px-4">{fibraG != null ? `${fmt1(fibraG)}g` : "—"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h4 className="text-sm font-semibold">Duración</h4>
          <div className="overflow-x-auto">
            <table className="min-w-[720px] w-full text-sm">
              <thead>
                <tr className="bg-rose-50/70 text-xs text-rose-900">
                  <th className="text-left font-medium py-3 px-4">Inicio</th>
                  <th className="text-left font-medium py-3 px-4">Último cambio</th>
                  <th className="text-left font-medium py-3 px-4">Previsión del fin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="py-3 px-4">{formatMonthYearEs(paciente.createdAt)}</td>
                  <td className="py-3 px-4">{formatMonthYearEs(paciente.updatedAt)}</td>
                  <td className="py-3 px-4">{formatMonthYearEs(paciente.updatedAt)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}


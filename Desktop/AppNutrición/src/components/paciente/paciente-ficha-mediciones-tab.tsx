"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Download,
  Printer,
  Settings,
  User,
  TrendingDown,
  TrendingUp,
  Minus,
  Calculator,
  Plus,
  Pencil,
  Save,
  X,
  Trash2,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
} from "recharts";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import { intlTag, type Locale } from "@/i18n/config";
import {
  actualizarNotasMedida,
  actualizarValorMedida,
  crearMedida,
  eliminarMedida,
  type MedidaFormData,
} from "@/app/actions/medidas";
import { CantidadInput } from "@/components/cantidad-input";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useDemoGuard } from "@/contexts/demo-context";

export type MedidaSerializada = {
  id: string;
  fecha: string;
  notas: string | null;
  peso: number | null;
  altura: number | null;
  imc: number | null;
  grasaCorporal: number | null;
  masaMuscular: number | null;
  perimetroCintura: number | null;
  perimetroCadera: number | null;
  perimetroBrazo: number | null;
  grasaSubcutanea: number | null;
  musculoEsqueletico: number | null;
  agua: number | null;
  masaOsea: number | null;
  perimetroAbdomen: number | null;
  grasaVisceral: number | null;
  pliegueAbdominal: number | null;
  pliegueAxilar: number | null;
  plieguePectoral: number | null;
  pliegueSubescapular: number | null;
  pliegueSuprailiaco: number | null;
  pliegueTricipital: number | null;
  pliegueMuslo: number | null;
  colesterolHDL: number | null;
  colesterolLDL: number | null;
  colesterolTotal: number | null;
  presionDiastolica: number | null;
  presionSistolica: number | null;
  trigliceridos: number | null;
};

type MetricaDb =
  | "peso"
  | "altura"
  | "perimetroCintura"
  | "perimetroCadera"
  | "perimetroBrazo"
  | "grasaSubcutanea"
  | "musculoEsqueletico"
  | "agua"
  | "masaOsea"
  | "perimetroAbdomen"
  | "grasaVisceral"
  | "grasaCorporal"
  | "masaMuscular"
  | "pliegueAbdominal"
  | "pliegueAxilar"
  | "plieguePectoral"
  | "pliegueSubescapular"
  | "pliegueSuprailiaco"
  | "pliegueTricipital"
  | "pliegueMuslo"
  | "colesterolHDL"
  | "colesterolLDL"
  | "colesterolTotal"
  | "presionDiastolica"
  | "presionSistolica"
  | "trigliceridos";

type VistaMedicion = MetricaDb | "pliegues" | "analiticos";

const PLIEGUES_KEYS: { key: MetricaDb; labelKey: string }[] = [
  { key: "pliegueAbdominal", labelKey: "metricaPliegueAbdominal" },
  { key: "pliegueAxilar", labelKey: "metricaPliegueAxilar" },
  { key: "plieguePectoral", labelKey: "metricaPlieguePectoral" },
  { key: "pliegueSubescapular", labelKey: "metricaPliegueSubescapular" },
  { key: "pliegueSuprailiaco", labelKey: "metricaPliegueSuprailiaco" },
  { key: "pliegueTricipital", labelKey: "metricaPliegueTricipital" },
  { key: "pliegueMuslo", labelKey: "metricaPliegueMuslo" },
];

const ANALITICOS_KEYS: { key: MetricaDb; labelKey: string }[] = [
  { key: "colesterolHDL", labelKey: "metricaColesterolHdl" },
  { key: "colesterolLDL", labelKey: "metricaColesterolLdl" },
  { key: "colesterolTotal", labelKey: "metricaColesterolTotal" },
  { key: "presionDiastolica", labelKey: "metricaPresionDiastolica" },
  { key: "presionSistolica", labelKey: "metricaPresionSistolica" },
  { key: "trigliceridos", labelKey: "metricaTrigliceridos" },
];

const METRIC_META: Record<
  MetricaDb,
  {
    labelKey: string;
    unit: string;
    inputStep: string;
    inputMin: number;
    inputMax: number;
  }
> = {
  peso: { labelKey: "metricaPeso", unit: "kg", inputStep: "0.1", inputMin: 0.1, inputMax: 500 },
  altura: { labelKey: "metricaAltura", unit: "cm", inputStep: "0.1", inputMin: 30, inputMax: 300 },
  perimetroCintura: {
    labelKey: "metricaCintura",
    unit: "cm",
    inputStep: "0.1",
    inputMin: 0,
    inputMax: 300,
  },
  perimetroCadera: {
    labelKey: "metricaCadera",
    unit: "cm",
    inputStep: "0.1",
    inputMin: 0,
    inputMax: 300,
  },
  perimetroBrazo: {
    labelKey: "metricaBrazo",
    unit: "cm",
    inputStep: "0.1",
    inputMin: 0,
    inputMax: 300,
  },
  grasaCorporal: {
    labelKey: "metricaGrasaCorporal",
    unit: "%",
    inputStep: "0.1",
    inputMin: 0,
    inputMax: 100,
  },
  masaMuscular: {
    labelKey: "metricaMasaMuscular",
    unit: "kg",
    inputStep: "0.1",
    inputMin: 0,
    inputMax: 200,
  },
  grasaSubcutanea: {
    labelKey: "metricaGrasaSubcutanea",
    unit: "%",
    inputStep: "0.1",
    inputMin: 0,
    inputMax: 100,
  },
  musculoEsqueletico: {
    labelKey: "metricaMusculoEsqueletico",
    unit: "%",
    inputStep: "0.1",
    inputMin: 0,
    inputMax: 100,
  },
  agua: {
    labelKey: "metricaAgua",
    unit: "%",
    inputStep: "0.1",
    inputMin: 0,
    inputMax: 100,
  },
  masaOsea: {
    labelKey: "metricaMasaOsea",
    unit: "kg",
    inputStep: "0.1",
    inputMin: 0,
    inputMax: 50,
  },
  perimetroAbdomen: {
    labelKey: "metricaAbdomen",
    unit: "cm",
    inputStep: "0.1",
    inputMin: 0,
    inputMax: 300,
  },
  grasaVisceral: {
    labelKey: "metricaGrasaVisceral",
    unit: "",
    inputStep: "1",
    inputMin: 0,
    inputMax: 60,
  },
  pliegueAbdominal: { labelKey: "metricaPliegueAbdominal", unit: "mm", inputStep: "0.1", inputMin: 0, inputMax: 100 },
  pliegueAxilar: { labelKey: "metricaPliegueAxilar", unit: "mm", inputStep: "0.1", inputMin: 0, inputMax: 100 },
  plieguePectoral: { labelKey: "metricaPlieguePectoral", unit: "mm", inputStep: "0.1", inputMin: 0, inputMax: 100 },
  pliegueSubescapular: { labelKey: "metricaPliegueSubescapular", unit: "mm", inputStep: "0.1", inputMin: 0, inputMax: 100 },
  pliegueSuprailiaco: { labelKey: "metricaPliegueSuprailiaco", unit: "mm", inputStep: "0.1", inputMin: 0, inputMax: 100 },
  pliegueTricipital: { labelKey: "metricaPliegueTricipital", unit: "mm", inputStep: "0.1", inputMin: 0, inputMax: 100 },
  pliegueMuslo: { labelKey: "metricaPliegueMuslo", unit: "mm", inputStep: "0.1", inputMin: 0, inputMax: 100 },
  colesterolHDL: { labelKey: "metricaColesterolHdl", unit: "mg/dL", inputStep: "1", inputMin: 0, inputMax: 500 },
  colesterolLDL: { labelKey: "metricaColesterolLdl", unit: "mg/dL", inputStep: "1", inputMin: 0, inputMax: 500 },
  colesterolTotal: { labelKey: "metricaColesterolTotal", unit: "mg/dL", inputStep: "1", inputMin: 0, inputMax: 500 },
  presionDiastolica: { labelKey: "metricaPresionDiastolica", unit: "mmHg", inputStep: "1", inputMin: 0, inputMax: 300 },
  presionSistolica: { labelKey: "metricaPresionSistolica", unit: "mmHg", inputStep: "1", inputMin: 0, inputMax: 300 },
  trigliceridos: { labelKey: "metricaTrigliceridos", unit: "mg/dL", inputStep: "1", inputMin: 0, inputMax: 1000 },
};

function contarMedicionesDelRegistro(medida: MedidaSerializada): number {
  return (Object.keys(METRIC_META) as MetricaDb[]).filter(
    (key) => typeof medida[key] === "number"
  ).length;
}

function fmt(v: number | null | undefined, unit: string, digits = 1): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  const n = Number(v);
  const s =
    unit === "%"
      ? n.toFixed(digits)
      : unit === "kg" || unit === "cm"
        ? n % 1 === 0
          ? String(Math.round(n))
          : n.toFixed(digits)
        : n.toFixed(digits);
  return unit ? `${s} ${unit}` : s;
}

function latestValue(
  medidas: MedidaSerializada[],
  key: keyof MedidaSerializada
): number | null {
  for (const m of medidas) {
    const v = m[key];
    if (typeof v === "number" && !Number.isNaN(v)) return v;
  }
  return null;
}

function masaGrasaKg(peso: number | null, pct: number | null): number | null {
  if (peso == null || pct == null) return null;
  return Math.round(peso * (pct / 100) * 10) / 10;
}

function pctMuscular(peso: number | null, masaMusc: number | null): number | null {
  if (peso == null || masaMusc == null || peso <= 0) return null;
  return Math.round((masaMusc / peso) * 1000) / 10;
}

export function PacienteFichaMedicionesTab({
  pacienteId,
  medidas,
  pacientePeso,
  pacienteAltura,
}: {
  pacienteId: string;
  medidas: MedidaSerializada[];
  pacientePeso: number | null;
  pacienteAltura: number | null;
}) {
  const t = useTranslations("patients.mediciones");
  const locale = useLocale() as Locale;
  const tag = intlTag(locale);
  const router = useRouter();
  const blockIfDemo = useDemoGuard();
  const [vista, setVista] = useState<VistaMedicion>("peso");
  const [valorNuevo, setValorNuevo] = useState("");
  const [notaNueva, setNotaNueva] = useState("");
  const [mostrarNota, setMostrarNota] = useState(false);
  const [notaEditandoId, setNotaEditandoId] = useState<string | null>(null);
  const [notaEditada, setNotaEditada] = useState("");
  const [notasOptimistas, setNotasOptimistas] = useState<Record<string, string | null>>({});
  const [medidaEditando, setMedidaEditando] = useState<{
    id: string;
    metrica: MetricaDb;
  } | null>(null);
  const [valorMedidaEditada, setValorMedidaEditada] = useState(0);
  const [valoresOptimistas, setValoresOptimistas] = useState<
    Record<string, Partial<Record<MetricaDb, number>>>
  >({});
  const [medidaEliminando, setMedidaEliminando] = useState<MedidaSerializada | null>(null);
  const [fechaNueva, setFechaNueva] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [pending, startTransition] = useTransition();
  const [guardandoNota, startGuardandoNota] = useTransition();
  const [guardandoMedida, startGuardandoMedida] = useTransition();
  const [eliminandoMedida, startEliminandoMedida] = useTransition();

  const medidasConCambios = useMemo(
    () =>
      medidas.map((medida) => ({
        ...medida,
        ...valoresOptimistas[medida.id],
        ...(Object.prototype.hasOwnProperty.call(notasOptimistas, medida.id)
          ? { notas: notasOptimistas[medida.id] }
          : {}),
      })),
    [medidas, notasOptimistas, valoresOptimistas]
  );

  const ordenadas = useMemo(
    () =>
      [...medidasConCambios].sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      ),
    [medidasConCambios]
  );

  const ultimoPeso = latestValue(ordenadas, "peso") ?? pacientePeso ?? null;
  const ultimaAltura =
    latestValue(ordenadas, "altura") ?? pacienteAltura ?? null;
  const ultGrasa = latestValue(ordenadas, "grasaCorporal");
  const ultMasaMusc = latestValue(ordenadas, "masaMuscular");
  const ultCintura = latestValue(ordenadas, "perimetroCintura");
  const ultCadera = latestValue(ordenadas, "perimetroCadera");
  const ultAbdomen = latestValue(ordenadas, "perimetroAbdomen");
  const ultBrazo = latestValue(ordenadas, "perimetroBrazo");
  const ultGrasaSubcutanea = latestValue(ordenadas, "grasaSubcutanea");
  const ultMusculoEsqueletico = latestValue(ordenadas, "musculoEsqueletico");
  const ultAgua = latestValue(ordenadas, "agua");
  const ultMasaOsea = latestValue(ordenadas, "masaOsea");
  const ultGrasaVisceral = latestValue(ordenadas, "grasaVisceral");

  const masaGrasaKgVal = masaGrasaKg(ultimoPeso, ultGrasa);
  const pctMusculoVal = pctMuscular(ultimoPeso, ultMasaMusc);

  function registrarUna() {
    if (blockIfDemo()) return;
    const v = parseFloat(valorNuevo.replace(",", "."));
    if (Number.isNaN(v) || !METRIC_META[vista as MetricaDb]) {
      toast.error(t("introduceValorValido"));
      return;
    }
    const meta = METRIC_META[vista as MetricaDb];
    if (v < 0 || v > meta.inputMax) {
      toast.error(t("valorFueraRango"));
      return;
    }

    startTransition(async () => {
      try {
        const key = vista as keyof MedidaFormData;
        if (!(key in METRIC_META)) return;
        const payload: MedidaFormData = { pacienteId, fecha: fechaNueva, [key]: v };
        if (notaNueva.trim()) payload.notas = notaNueva.trim();
        await crearMedida(payload);
        toast.success(t("medicionRegistrada"));
        setValorNuevo("");
        setNotaNueva("");
        setMostrarNota(false);
        router.refresh();
      } catch {
        toast.error(t("noSePudoRegistrar"));
      }
    });
  }

  const filtradasMetrica = useMemo(() => {
    if (!METRIC_META[vista as MetricaDb]) return [];
    const key = vista as keyof MedidaSerializada;
    return ordenadas.filter(
      (m) => m[key] !== null && typeof m[key] === "number"
    );
  }, [ordenadas, vista]);

  const chartData = useMemo(() => {
    if (!METRIC_META[vista as MetricaDb]) return [];
    const key = vista as MetricaDb;
    return [...medidasConCambios]
      .filter((m) => m[key] !== null && typeof m[key] === "number")
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
      .map((m) => ({
        fecha: new Date(m.fecha).toLocaleDateString(tag, {
          day: "numeric",
          month: "short",
        }),
        valor: m[key] as number,
      }));
  }, [medidasConCambios, vista]);

  function empezarEdicionNota(medida: MedidaSerializada) {
    setNotaEditandoId(medida.id);
    setNotaEditada(medida.notas ?? "");
  }

  function cancelarEdicionNota() {
    setNotaEditandoId(null);
    setNotaEditada("");
  }

  function guardarNota(medida: MedidaSerializada) {
    if (blockIfDemo()) return;

    const notaActualizada = notaEditada.trim() || null;
    if (notaActualizada === medida.notas) {
      cancelarEdicionNota();
      return;
    }

    const teniaNotaOptimista = Object.prototype.hasOwnProperty.call(
      notasOptimistas,
      medida.id
    );
    const notaOptimistaAnterior = notasOptimistas[medida.id];

    setNotasOptimistas((actuales) => ({
      ...actuales,
      [medida.id]: notaActualizada,
    }));
    cancelarEdicionNota();

    startGuardandoNota(async () => {
      try {
        const resultado = await actualizarNotasMedida(
          medida.id,
          notaActualizada ?? ""
        );
        if (!resultado.ok) {
          throw new Error(resultado.error);
        }
        toast.success(t(notaActualizada ? "notaActualizada" : "notaEliminada"));
        router.refresh();
      } catch (error) {
        setNotasOptimistas((actuales) => {
          const siguientes = { ...actuales };
          if (teniaNotaOptimista) {
            siguientes[medida.id] = notaOptimistaAnterior ?? null;
          } else {
            delete siguientes[medida.id];
          }
          return siguientes;
        });
        setNotaEditandoId(medida.id);
        setNotaEditada(notaActualizada ?? "");
        toast.error(
          error instanceof Error && error.message
            ? error.message
            : t("noSePudoActualizarNota")
        );
      }
    });
  }

  function empezarEdicionMedida(
    medida: MedidaSerializada,
    metrica: MetricaDb
  ) {
    const valor = medida[metrica];
    if (typeof valor !== "number") return;

    setMedidaEditando({ id: medida.id, metrica });
    setValorMedidaEditada(valor);
  }

  function cancelarEdicionMedida() {
    setMedidaEditando(null);
    setValorMedidaEditada(0);
  }

  function cambiarVista(nuevaVista: VistaMedicion) {
    cancelarEdicionMedida();
    setVista(nuevaVista);
  }

  function guardarMedida(
    medida: MedidaSerializada,
    metrica: MetricaDb
  ) {
    if (blockIfDemo()) return;

    const valorAnterior = medida[metrica];
    if (typeof valorAnterior !== "number") return;
    if (valorMedidaEditada === valorAnterior) {
      cancelarEdicionMedida();
      return;
    }

    const valoresAnteriores = valoresOptimistas[medida.id];
    const teniaValorOptimista = Object.prototype.hasOwnProperty.call(
      valoresAnteriores ?? {},
      metrica
    );
    const valorOptimistaAnterior = valoresAnteriores?.[metrica];

    setValoresOptimistas((actuales) => ({
      ...actuales,
      [medida.id]: {
        ...actuales[medida.id],
        [metrica]: valorMedidaEditada,
      },
    }));
    const valorActualizado = valorMedidaEditada;
    cancelarEdicionMedida();

    startGuardandoMedida(async () => {
      try {
        const resultado = await actualizarValorMedida(
          medida.id,
          metrica,
          valorActualizado
        );
        if (!resultado.ok) {
          throw new Error(resultado.error);
        }
        toast.success(t("medicionActualizada"));
        router.refresh();
      } catch (error) {
        setValoresOptimistas((actuales) => {
          const siguientes = { ...actuales };
          const valoresMedida = { ...siguientes[medida.id] };
          if (teniaValorOptimista && valorOptimistaAnterior !== undefined) {
            valoresMedida[metrica] = valorOptimistaAnterior;
          } else {
            delete valoresMedida[metrica];
          }

          if (Object.keys(valoresMedida).length > 0) {
            siguientes[medida.id] = valoresMedida;
          } else {
            delete siguientes[medida.id];
          }
          return siguientes;
        });
        setMedidaEditando({ id: medida.id, metrica });
        setValorMedidaEditada(valorActualizado);
        toast.error(
          error instanceof Error && error.message
            ? error.message
            : t("noSePudoActualizarMedicion")
        );
      }
    });
  }

  function confirmarEliminarMedida() {
    if (!medidaEliminando || blockIfDemo()) return;

    const medida = medidaEliminando;
    startEliminandoMedida(async () => {
      try {
        await eliminarMedida(medida.id);
        setMedidaEliminando(null);
        toast.success(t("medicionEliminada"));
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error && error.message
            ? error.message
            : t("noSePudoEliminarMedicion")
        );
      }
    });
  }

  function formularioEdicionNota(medida: MedidaSerializada) {
    return (
      <div className="mt-2 space-y-2">
        <textarea
          value={notaEditada}
          onChange={(e) => setNotaEditada(e.target.value)}
          rows={3}
          maxLength={1000}
          autoFocus
          aria-label={t("editarNota")}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-y"
        />
        <p className="text-xs text-muted-foreground">
          {t("notaVaciaElimina")}
        </p>
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={cancelarEdicionNota}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted"
          >
            <X className="w-3.5 h-3.5" />
            {t("cancelarEdicionNota")}
          </button>
          <button
            type="button"
            onClick={() => guardarNota(medida)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Save className="w-3.5 h-3.5" />
            {t("guardarNota")}
          </button>
        </div>
      </div>
    );
  }

  const tituloPrincipal =
    vista === "pliegues"
      ? t("plieguesCutaneos")
      : vista === "analiticos"
        ? t("datosAnaliticos")
        : METRIC_META[vista as MetricaDb] ? t(METRIC_META[vista as MetricaDb].labelKey) : vista;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 sm:justify-between">
        <Link
          href={`/pacientes/${pacienteId}/medidas`}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors flex-1 sm:flex-none"
        >
          <span className="sm:hidden">{t("registrarMedicionesMultiples")}</span>
          <span className="hidden sm:inline">{t("registrarVariasSimultaneamente")}</span>
        </Link>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() =>
              toast.message(t("proximamente"), {
                description: t("exportacionMediciones"),
              })
            }
            className="p-2 rounded-lg border border-border hover:bg-muted text-muted-foreground"
            title={t("descargar")}
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="p-2 rounded-lg border border-border hover:bg-muted text-muted-foreground"
            title={t("imprimir")}
          >
            <Printer className="w-4 h-4" />
          </button>
          <Link
            href={`/pacientes/${pacienteId}/medidas`}
            className="p-2 rounded-lg border border-border hover:bg-muted text-muted-foreground"
            title={t("vistaDetalladaHistorial")}
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] xl:grid-cols-[min(100%,320px)_1fr] gap-3 sm:gap-4 lg:gap-6 items-start">
        <aside className="space-y-4 shrink-0">
          <SidebarCard title={t("medicionesBasicas")}>
            <SidebarRow
              label={t("metricaPeso")}
              value={fmt(ultimoPeso, "kg")}
              active={vista === "peso"}
              onClick={() => cambiarVista("peso")}
            />
            <SidebarRow
              label={t("metricaAltura")}
              value={fmt(ultimaAltura, "cm", 0)}
              active={vista === "altura"}
              onClick={() => cambiarVista("altura")}
            />
            <SidebarRow
              label={t("metricaCintura")}
              value={fmt(ultCintura, "cm")}
              active={vista === "perimetroCintura"}
              onClick={() => cambiarVista("perimetroCintura")}
            />
            <SidebarRow
              label={t("metricaAbdomen")}
              value={fmt(ultAbdomen, "cm")}
              active={vista === "perimetroAbdomen"}
              onClick={() => cambiarVista("perimetroAbdomen")}
            />
            <SidebarRow
              label={t("metricaCadera")}
              value={fmt(ultCadera, "cm")}
              active={vista === "perimetroCadera"}
              onClick={() => cambiarVista("perimetroCadera")}
            />
            <SidebarRow
              label={t("metricaBrazo")}
              value={fmt(ultBrazo, "cm")}
              active={vista === "perimetroBrazo"}
              onClick={() => cambiarVista("perimetroBrazo")}
            />
          </SidebarCard>

          <SidebarCard title={t("composicionCorporal")}>
            <SidebarRow
              label={t("metricaGrasaSubcutanea")}
              value={fmt(ultGrasaSubcutanea, "%")}
              active={vista === "grasaSubcutanea"}
              onClick={() => cambiarVista("grasaSubcutanea")}
            />
            <SidebarRow
              label={t("metricaMusculoEsqueletico")}
              value={fmt(ultMusculoEsqueletico, "%")}
              active={vista === "musculoEsqueletico"}
              onClick={() => cambiarVista("musculoEsqueletico")}
            />
            <SidebarRow
              label={t("metricaMasaMuscular")}
              value={fmt(ultMasaMusc, "kg")}
              active={vista === "masaMuscular"}
              onClick={() => cambiarVista("masaMuscular")}
            />
            <SidebarRow
              label={t("metricaAgua")}
              value={fmt(ultAgua, "%")}
              active={vista === "agua"}
              onClick={() => cambiarVista("agua")}
            />
            <SidebarRow
              label={t("metricaMasaOsea")}
              value={fmt(ultMasaOsea, "kg")}
              active={vista === "masaOsea"}
              onClick={() => cambiarVista("masaOsea")}
            />
            <SidebarRow
              label={t("metricaGrasaCorporal")}
              value={fmt(ultGrasa, "%")}
              active={vista === "grasaCorporal"}
              onClick={() => cambiarVista("grasaCorporal")}
            />
            <SidebarRow
              label={t("metricaGrasaVisceral")}
              value={fmt(ultGrasaVisceral, "", 0)}
              active={vista === "grasaVisceral"}
              onClick={() => cambiarVista("grasaVisceral")}
            />
          </SidebarCard>

          <SidebarCard
            title={t("plieguesCutaneos")}
            footer={
              <button
                type="button"
                onClick={() => cambiarVista("pliegues")}
                className="w-full text-center text-xs font-medium text-primary py-2 hover:bg-muted/50"
              >
                {t("infoPliegues")}
              </button>
            }
          >
            {PLIEGUES_KEYS.map(({ key, labelKey }) => (
              <SidebarRow key={key} label={t(labelKey)} value={fmt(latestValue(medidasConCambios, key), "mm")} active={vista === key} onClick={() => cambiarVista(key)} />
            ))}
          </SidebarCard>

          <SidebarCard
            title={t("datosAnaliticos")}
            footer={
              <button
                type="button"
                onClick={() => cambiarVista("analiticos")}
                className="w-full text-center text-xs font-medium text-primary py-2 hover:bg-muted/50"
              >
                {t("infoAnalitica")}
              </button>
            }
          >
            {ANALITICOS_KEYS.map(({ key, labelKey }) => {
              const unit = key.startsWith("presion") ? "mmHg" : "mg/dL";
              return <SidebarRow key={key} label={t(labelKey)} value={fmt(latestValue(medidasConCambios, key), unit)} active={vista === key} onClick={() => cambiarVista(key)} />;
            })}
          </SidebarCard>
        </aside>

        <main className="min-w-0 space-y-6">
          <h2 className="text-xl font-bold text-foreground">{tituloPrincipal}</h2>

          {vista === "pliegues" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PLIEGUES_KEYS.map(({ key, labelKey }) => (
                <button key={key} type="button" onClick={() => cambiarVista(key)} className="flex items-center justify-between rounded-lg border border-border px-4 py-3 hover:bg-muted/40 text-left text-sm">
                  <span>{t(labelKey)}</span>
                  <span className="font-medium text-muted-foreground">{fmt(latestValue(medidasConCambios, key), "mm")}</span>
                </button>
              ))}
            </div>
          )}
          {vista === "analiticos" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ANALITICOS_KEYS.map(({ key, labelKey }) => {
                const unit = key.startsWith("presion") ? "mmHg" : "mg/dL";
                return (
                  <button key={key} type="button" onClick={() => cambiarVista(key)} className="flex items-center justify-between rounded-lg border border-border px-4 py-3 hover:bg-muted/40 text-left text-sm">
                    <span>{t(labelKey)}</span>
                    <span className="font-medium text-muted-foreground">{fmt(latestValue(medidasConCambios, key), unit)}</span>
                  </button>
                );
              })}
            </div>
          )}

          {vista !== "pliegues" && vista !== "analiticos" && (
            <>
              <div className="rounded-xl border border-[#c5efd4] bg-[#DEF7E5] p-4 space-y-3 dark:border-emerald-800/45 dark:bg-emerald-950/35">
                <h3 className="text-sm font-semibold text-foreground">
                  {t("nuevaMedicion", { label: t(METRIC_META[vista].labelKey).toLowerCase() })}
                </h3>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div className="flex-1 min-w-[8rem]">
                    <label className="text-xs font-medium text-muted-foreground block mb-1">
                      {t("fecha")}
                    </label>
                    <input
                      type="date"
                      value={fechaNueva}
                      onChange={(e) => setFechaNueva(e.target.value)}
                      className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                    />
                  </div>
                  <div className="flex-1 min-w-[6rem]">
                    <label className="text-xs font-medium text-muted-foreground block mb-1">
                      {t("valor")}
                    </label>
                    <input
                      type="number" inputMode="decimal"
                      step={METRIC_META[vista].inputStep}
                      min={0}
                      max={METRIC_META[vista].inputMax}
                      value={valorNuevo}
                      onChange={(e) => setValorNuevo(e.target.value)}
                      placeholder="0"
                      className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm"
                    />
                  </div>
                  <div className="w-full sm:w-40">
                    <label className="text-xs font-medium text-muted-foreground block mb-1">
                      {t("unidad")}
                    </label>
                    <div className="h-10 flex items-center px-3 rounded-lg border border-input bg-background text-sm">
                      {METRIC_META[vista].unit || t("unidadNivel")}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={registrarUna}
                    disabled={pending}
                    className="h-10 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 shrink-0"
                  >
                    {pending ? "..." : t("registrar")}
                  </button>
                </div>
                {mostrarNota ? (
                  <textarea
                    value={notaNueva}
                    onChange={(e) => setNotaNueva(e.target.value)}
                    rows={2}
                    maxLength={1000}
                    autoFocus
                    placeholder={t("notasPlaceholder")}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-y"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setMostrarNota(true)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {t("anadirNota")}
                  </button>
                )}
              </div>

              <div className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="divide-y divide-border">
                  {filtradasMetrica.length === 0 ? (
                    <p className="p-6 text-sm text-muted-foreground text-center">
                      {t("sinRegistros")}
                    </p>
                  ) : (
                    filtradasMetrica.map((m, i) => {
                      const key = vista as MetricaDb;
                      const val = m[key] as number;
                      const prev = filtradasMetrica[i + 1];
                      const prevVal =
                        prev && prev[key] != null ? (prev[key] as number) : null;
                      let delta: number | null = null;
                      if (prevVal != null) delta = val - prevVal;
                      const unit = METRIC_META[vista].unit;
                      const editandoEstaMedida =
                        medidaEditando?.id === m.id &&
                        medidaEditando.metrica === key;
                      return (
                        <div
                          key={m.id}
                          className="flex items-center gap-3 p-4 hover:bg-muted/30"
                        >
                          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium capitalize">
                              {formatDate(m.fecha)}
                            </p>
                            {editandoEstaMedida ? (
                              <div className="mt-1 flex items-center gap-2">
                                <CantidadInput
                                  value={valorMedidaEditada}
                                  onChange={setValorMedidaEditada}
                                  min={METRIC_META[key].inputMin}
                                  max={METRIC_META[key].inputMax}
                                  redondearA={Number(METRIC_META[key].inputStep)}
                                  autoFocus
                                  aria-label={t("editarMedicionLabel", {
                                    label: t(METRIC_META[key].labelKey),
                                  })}
                                  className="h-10 w-24 rounded-lg border border-input bg-background px-3 text-sm font-semibold"
                                />
                                <span className="text-sm text-muted-foreground">
                                  {unit || t("unidadNivel")}
                                </span>
                              </div>
                            ) : (
                              <p className="text-base font-semibold">
                                {val} {unit}
                              </p>
                            )}
                          </div>
                          {!editandoEstaMedida && delta !== null && (
                            <DeltaBadge delta={delta} unit={unit} />
                          )}
                          {!editandoEstaMedida &&
                            delta === null &&
                            i < filtradasMetrica.length - 1 && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Minus className="w-3 h-3" />
                            </span>
                          )}
                          {editandoEstaMedida ? (
                            <div className="flex shrink-0 items-center gap-1">
                              <button
                                type="button"
                                onClick={cancelarEdicionMedida}
                                disabled={guardandoMedida}
                                className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted disabled:opacity-50"
                                title={t("cancelarEdicionMedicion")}
                                aria-label={t("cancelarEdicionMedicion")}
                              >
                                <X className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => guardarMedida(m, key)}
                                disabled={guardandoMedida}
                                className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                                title={t("guardarMedicion")}
                                aria-label={t("guardarMedicion")}
                              >
                                <Save className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex shrink-0 items-center gap-1">
                              <button
                                type="button"
                                onClick={() => empezarEdicionMedida(m, key)}
                                disabled={
                                  guardandoMedida ||
                                  eliminandoMedida ||
                                  guardandoNota ||
                                  medidaEditando !== null ||
                                  notaEditandoId !== null
                                }
                                className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary disabled:opacity-50"
                                title={t("editarMedicion")}
                                aria-label={t("editarMedicion")}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setMedidaEliminando(m)}
                                disabled={
                                  eliminandoMedida ||
                                  guardandoNota ||
                                  guardandoMedida ||
                                  medidaEditando !== null ||
                                  notaEditandoId !== null
                                }
                                className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                                title={t("eliminarMedicion")}
                                aria-label={t("eliminarMedicion")}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {chartData.length >= 2 && (
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-4">
                    <span className="text-emerald-600 dark:text-emerald-400">▲</span>
                    {t("progreso")}
                  </h3>
                  <div className="h-[180px] sm:h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart
                        data={chartData}
                        margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorMed" x1="0" y1="0" x2="0" y2="1">
                            <stop
                              offset="5%"
                              stopColor="hsl(142 76% 36%)"
                              stopOpacity={0.25}
                            />
                            <stop
                              offset="95%"
                              stopColor="hsl(142 76% 36%)"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="fecha" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} domain={["auto", "auto"]} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="valor"
                          name={t(METRIC_META[vista].labelKey)}
                          stroke="transparent"
                          fill="url(#colorMed)"
                        />
                        <Line
                          type="monotone"
                          dataKey="valor"
                          stroke="hsl(142 76% 36%)"
                          strokeWidth={2}
                          dot={{ r: 3, fill: "hsl(142 76% 36%)" }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </>
          )}

          {medidasConCambios.some((m) => m.notas) && (
            <div className="rounded-xl border border-border bg-card p-5 mt-4">
              <h3 className="text-sm font-semibold mb-3">{t("notasTitulo")}</h3>
              <div className="space-y-3">
                {medidasConCambios
                  .filter((m) => m.notas)
                  .map((m) => (
                    <div key={m.id} className="text-sm border-l-2 border-primary/30 pl-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-xs font-medium text-muted-foreground">
                          {new Date(m.fecha).toLocaleDateString(tag, { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                        {notaEditandoId !== m.id && (
                          <button
                            type="button"
                            onClick={() => empezarEdicionNota(m)}
                            disabled={
                              guardandoNota ||
                              eliminandoMedida ||
                              guardandoMedida ||
                              medidaEditando !== null ||
                              notaEditandoId !== null
                            }
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 disabled:opacity-50"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            {t("editarNota")}
                          </button>
                        )}
                      </div>
                      {notaEditandoId === m.id ? (
                        formularioEdicionNota(m)
                      ) : (
                        <p className="whitespace-pre-wrap text-foreground">{m.notas}</p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {medidaEliminando && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="eliminar-medicion-titulo"
        >
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 id="eliminar-medicion-titulo" className="text-lg font-semibold">
                  {contarMedicionesDelRegistro(medidaEliminando) > 1
                    ? t("confirmarEliminarGrupoTitulo")
                    : t("confirmarEliminarMedicionTitulo")}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {contarMedicionesDelRegistro(medidaEliminando) > 1
                    ? t("confirmarEliminarGrupoDescripcion", {
                        count: contarMedicionesDelRegistro(medidaEliminando),
                      })
                    : t("confirmarEliminarMedicionDescripcion")}
                </p>
              </div>
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setMedidaEliminando(null)}
                disabled={eliminandoMedida}
                autoFocus
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                {t("cancelarEdicionNota")}
              </button>
              <button
                type="button"
                onClick={confirmarEliminarMedida}
                disabled={eliminandoMedida}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
              >
                {eliminandoMedida ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {t("eliminarMedicion")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DeltaBadge({ delta, unit }: { delta: number; unit: string }) {
  const down = delta < 0;
  const up = delta > 0;
  const abs = Math.abs(delta);
  const num = abs.toFixed(1);
  const sign = delta > 0 ? "+" : "";
  return (
    <span
      className={cn(
        "text-xs font-semibold px-2 py-1 rounded-full shrink-0 inline-flex items-center gap-0.5",
        down && unit === "kg"
          ? "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 dark:bg-emerald-950 dark:text-emerald-200"
          : up && unit === "kg"
            ? "bg-amber-100 dark:bg-amber-500/15 text-amber-900 dark:text-amber-200 dark:bg-amber-950 dark:text-amber-200"
            : "bg-blue-50 dark:bg-blue-500/10 text-blue-800 dark:text-blue-300 dark:bg-blue-950 dark:text-blue-200"
      )}
    >
      {down && <TrendingDown className="w-3 h-3" />}
      {up && <TrendingUp className="w-3 h-3" />}
      <span>
        {sign}
        {num} {unit}
      </span>
    </span>
  );
}

function SidebarCard({
  title,
  children,
  footer,
}: {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide px-3 py-2 border-b border-border bg-muted/30">
        {title}
      </p>
      <div className="p-1.5 space-y-1">{children}</div>
      {footer}
    </div>
  );
}

function SidebarRow({
  label,
  value,
  active,
  onClick,
  suffix,
}: {
  label: string;
  value: string;
  active: boolean;
  onClick: () => void;
  suffix?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
        active
          ? "bg-primary/10 border border-primary/30 text-foreground"
          : "hover:bg-muted/60 border border-transparent"
      )}
    >
      <span className="font-medium truncate">{label}</span>
      <span className="flex items-center gap-1 shrink-0 text-muted-foreground tabular-nums">
        {suffix}
        {value}
      </span>
    </button>
  );
}


function PlaceholderPanel({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

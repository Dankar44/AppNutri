"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { asignarPlanComoActual, copiarComidaADias, copiarDiaADias, pegarAlimentoEnComida, juntarDias, separarDia, asignarPlanificacionADia, agregarComida, guardarRepartoDePlan, sincronizarComidasDeDia, eliminarComida, type ModoCopia } from "@/app/actions/planes";
import {
  Plus,
  UtensilsCrossed,
  Scale,
  Flame,
  Droplets,
  Circle,
  Diamond,
  Triangle,
  ClipboardList,
  LayoutGrid,
  PieChart as PieChartIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  FileDown,
  Copy,
  Download,
  ClipboardPaste,
  Link2,
  Unlink,
} from "lucide-react";
import { cn, isNextNavigation } from "@/lib/utils";
import { calcularMacrosPorcion, sumarMacros, convertirAGramos } from "@/lib/macros";
import { ordenarComidasPorHora } from "@/lib/comida-horas";
import {
  objetivosPorComidaDia,
  claveComida,
  normalizeReparto,
  anadirFila,
  filasParaDia,
  repartoParaPlani,
  esRepartoV2,
  firmaReparto,
  type ObjetivoComida,
  type RepartoPorComida,
  type RepartoGuardado,
} from "@/lib/reparto-comidas";

/** Clave del slot de los días SIN planificación asignada, que es el caso normal cuando la dieta usa
 *  una sola (`crearPlan` no le pone `planificacionId` a ningún día en ese caso). */
const SLOT_GLOBAL = "__global";
import { PlanEditor } from "@/components/dieta/plan-editor";
import { RepartoPanel } from "@/components/dieta/reparto-panel";
import { HoraSelect } from "@/components/dieta/hora-select";
import { CopiarADiasModal, type DiaOption } from "@/components/dieta/copiar-comida-modal";
import { ImportarPlanModal } from "@/components/dieta/importar-plan-modal";
import { FoodHoverCard, type InteractionMode } from "@/components/food-hover-card";
export type { InteractionMode };
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Sector,
  ResponsiveContainer,
} from "recharts";

type MicronutrientesOpcionales = {
  vitaminaA?: number | null;
  vitaminaB6?: number | null;
  vitaminaB12?: number | null;
  vitaminaC?: number | null;
  vitaminaD?: number | null;
  vitaminaE?: number | null;
  vitaminaK?: number | null;
  tiamina?: number | null;
  riboflavina?: number | null;
  niacina?: number | null;
  folato?: number | null;
  acidoPantotenico?: number | null;
  colina?: number | null;
  calcio?: number | null;
  hierro?: number | null;
  magnesio?: number | null;
  fosforo?: number | null;
  potasio?: number | null;
  sodio?: number | null;
  cinc?: number | null;
  cobre?: number | null;
  manganeso?: number | null;
  selenio?: number | null;
  fluor?: number | null;
};

export type PlanVisualItem = {
  id: string;
  cantidad: number;
  unidad: string;
  /** Alias visual editado por el nutri (solo presentación). */
  nombrePersonalizado?: string | null;
  alimento: ({
    id: string;
    nombre: string;
    calorias: number;
    proteinas: number;
    carbohidratos: number;
    grasas: number;
    fibra: number;
    porcion?: number;
    categoria?: string;
    enlaceProducto?: string | null;
    imagenUrl?: string | null;
    esPropio?: boolean;
  } & MicronutrientesOpcionales) | null;
  receta: {
    id: string;
    nombre: string;
    calorias: number;
    proteinas: number;
    carbohidratos: number;
    grasas: number;
    fibra: number;
    porciones: number;
    descripcion?: string | null;
    ingredientes?: { nombre: string; cantidad: number; unidad: string }[];
    esPropio?: boolean;
  } | null;
  alternativas?: {
    id: string;
    nombre: string;
    cantidad: number;
    unidad: string;
    esReceta: boolean;
    realId?: string | null;
    calorias?: number;
    proteinas?: number;
    carbohidratos?: number;
    grasas?: number;
    fibra?: number;
    porcion?: number;
    recetaPorciones?: number;
    recetaDescripcion?: string | null;
    recetaIngredientes?: { nombre: string; cantidad: number; unidad: string }[];
  }[];
};

export type PlanVisualComida = {
  id: string;
  tipo: string;
  descripcion?: string | null;
  nombre?: string | null;
  hora?: string | null;
  alimentos: PlanVisualItem[];
};

export type PlanVisualDia = {
  id: string;
  dia: string;
  grupoId?: string | null;
  comidas: PlanVisualComida[];
};

export type PlanVisualDetalle = {
  id: string;
  nombre: string;
  caloriasObjetivo: number | null;
  activo: boolean;
  proteinasObjetivo: number | null;
  carbohidratosObjetivo: number | null;
  grasasObjetivo: number | null;
  createdAt?: string | Date;
  dias: PlanVisualDia[];
};

const DIA_KEYS = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"] as const;

const MACRO_COLORS = {
  grasas: "#f0b845",
  carbohidratos: "#d9956a",
  proteinas: "#7eaadf",
  fibra: "#4ec4a0",
};

export function PlanVisual({
  plan,
  pacienteId,
  pacienteNombre,
  pacientePeso,
  pacienteObjetivo,
  showPlanSelector = true,
  showPdfButton = true,
  showAsignarButton = true,
  showNuevaDietaButton = true,
  showAguaEjercicio = true,
  showFoodTable = true,
  readOnly = false,
  ocultarCalorias = false,
  vistaInicial = "resumen",
  interactionMode = "dashboard",
  planificaciones = [],
  objetivosPorDia,
  repartoPropio = null,
  repartoFallback = null,
  localCallbacks,
}: {
  plan: PlanVisualDetalle;
  pacienteId: string;
  pacienteNombre: string;
  pacientePeso?: number | null;
  pacienteObjetivo?: string | null;
  showPlanSelector?: boolean;
  showPdfButton?: boolean;
  showAsignarButton?: boolean;
  showNuevaDietaButton?: boolean;
  showAguaEjercicio?: boolean;
  showFoodTable?: boolean;
  readOnly?: boolean;
  /** Si true (decisión del dietista por paciente), oculta kcal y macros en la vista del paciente. */
  ocultarCalorias?: boolean;
  vistaInicial?: "resumen" | "plan" | "analisis";
  interactionMode?: InteractionMode;
  /** #78 (1B) — Planificaciones del paciente (para asignar una a cada día) y objetivos resultantes por día.
   *  kcal/macros opcionales: si vienen, la barra de objetivos cambia al instante al reasignar (optimista).
   *  `datos.repartoPorComida` (#78-C): reparto por comida de la planificación, para el cumplimiento en el editor. */
  planificaciones?: { id: string; nombre: string; kcal?: number | null; proteinas?: number | null; carbohidratos?: number | null; grasas?: number | null; datos?: { repartoPorComida?: RepartoPorComida } | null }[];
  objetivosPorDia?: Record<string, { planificacionId: string; nombre: string; kcal: number | null; proteinas: number | null; carbohidratos: number | null; grasas: number | null }>;
  /** #78-C — Copia PROPIA del reparto de esta dieta (snapshot hecho al crearla). Si existe, MANDA
   *  sobre el reparto de la planificación: cambiar la planificación no debe alterar dietas ya creadas.
   *  Lleva un reparto por planificación (y el `global`, para los días sin ninguna asignada); las
   *  dietas anteriores al cambio de formato guardan uno solo y se leen igual. */
  repartoPropio?: RepartoGuardado | null;
  /** #78-C — Reparto de la planificación: solo para dietas anteriores a la feature (sin copia propia). */
  repartoFallback?: RepartoPorComida | null;
  localCallbacks?: {
    onAdd: (comidaId: string, item: { alimentoId: string | null; recetaId: string | null; nombre: string; cantidad: number; unidad: string; calorias: number; proteinas: number; carbohidratos: number; grasas: number; fibra?: number; porcion?: number }) => void;
    onRemove: (alimentoEnComidaId: string) => void;
    onCantidadChange: (alimentoEnComidaId: string, cantidad: number) => void;
    onMove: (alimentoEnComidaId: string, comidaId: string) => void;
  };
}) {
  const t = useTranslations("patients.planVisual");
  const router = useRouter();
  const [isPendingAssign, startAssign] = useTransition();

  const [selectedDayKey, setSelectedDayKey] = useState<"TODOS" | string>(
    vistaInicial === "plan" ? "LUNES" : "TODOS",
  );
  const [planSelectOpen, setPlanSelectOpen] = useState(false);
  const planSelectWrapRef = useRef<HTMLDivElement | null>(null);
  const [vista, setVista] = useState<"resumen" | "plan" | "analisis">(
    ocultarCalorias ? "plan" : vistaInicial,
  );
  const [hoveredMacro, setHoveredMacro] = useState<number | null>(null);
  const [comidaChartOffset, setComidaChartOffset] = useState(0);
  const [foodTablePage, setFoodTablePage] = useState(0);

  const selectedPlan = plan;

  // ── Copiar / importar comidas y días (#31) — solo en modo dietista editable ──
  const tDiets = useTranslations("diets");
  const esEditable = !readOnly && interactionMode === "dashboard";
  const [isPendingCopia, startCopia] = useTransition();
  // #104 Fase 2 — modal para añadir una comida (pide nombre y hora) + scroll a la nueva.
  const [nuevaComidaModal, setNuevaComidaModal] = useState<{ diaId: string } | null>(null);
  // #78-C — Aviso antes de cambiar la planificación de un día: qué comidas dejan de estar previstas.
  const [cambioPlaniModal, setCambioPlaniModal] = useState<{
    diaIds: string[];
    planiId: string | null;
    sobran: { id: string; etiqueta: string; alimentos: number }[];
  } | null>(null);
  const [nuevaComidaNombre, setNuevaComidaNombre] = useState("");
  const [nuevaComidaHora, setNuevaComidaHora] = useState("12:00");
  const [scrollComidaId, setScrollComidaId] = useState<string | null>(null);
  // Comidas añadidas optimista por día (aparecen al instante; se podan cuando el servidor las confirma).
  const [comidasNuevasDia, setComidasNuevasDia] = useState<Record<string, Array<PlanVisualComida & { realId?: string | null }>>>({});

  // Tras crear, desplaza la vista a la comida recién añadida (ya visible por el optimismo).
  useEffect(() => {
    if (!scrollComidaId) return;
    const el = document.getElementById(`comida-slot-${scrollComidaId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setScrollComidaId(null);
    }
  }, [scrollComidaId, selectedPlan.dias, comidasNuevasDia]);

  // Poda: cuando el servidor ya trae la comida real (su realId aparece), se retira la optimista.
  useEffect(() => {
    const ids = new Set<string>();
    for (const d of selectedPlan.dias) for (const c of d.comidas) ids.add(c.id);
    setComidasNuevasDia((prev) => {
      if (Object.keys(prev).length === 0) return prev;
      const next: Record<string, Array<PlanVisualComida & { realId?: string | null }>> = {};
      for (const [diaId, lista] of Object.entries(prev)) {
        const rest = lista.filter((c) => !(c.realId && ids.has(c.realId)));
        if (rest.length) next[diaId] = rest;
      }
      return next;
    });
  }, [selectedPlan.dias]);
  const [copiaModal, setCopiaModal] = useState<{
    tipo: "comida" | "dia";
    sourceId: string;
    excluirDiaId?: string;
    titulo: string;
    subtitulo?: string;
    tipoOrigen?: string;
    conTipoDestino?: boolean;
  } | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  // "Portapapeles" para copiar/pegar un alimento suelto en cualquier comida.
  // Guarda una COPIA de los datos al copiar (no el id del origen) para que la
  // cantidad pegada sea siempre la original aunque se pegue sobre el propio origen.
  const [portapapeles, setPortapapeles] = useState<{
    alimentoId: string | null;
    recetaId: string | null;
    cantidad: number;
    unidad: string;
    nombre: string;
    origenId: string;
  } | null>(null);

  const diasOptions: DiaOption[] = useMemo(
    () =>
      [...plan.dias]
        .sort(
          (a, b) =>
            DIA_KEYS.indexOf(a.dia as (typeof DIA_KEYS)[number]) -
            DIA_KEYS.indexOf(b.dia as (typeof DIA_KEYS)[number]),
        )
        .map((d) => ({ id: d.id, key: d.dia, label: t(`dias.${d.dia}` as never) })),
    [plan.dias, t],
  );

  const tiposComidaOpciones = useMemo(
    () =>
      (["DESAYUNO", "MEDIA_MANANA", "ALMUERZO", "MERIENDA", "CENA", "RECENA"] as const).map((k) => ({
        key: k as string,
        label: tDiets(`comidaSlot.tipoLabels.${k}` as never) as string,
      })),
    [tDiets],
  );

  function handleCopiarComida(comidaId: string) {
    let tipo = "";
    let diaKey = "";
    let diaId = "";
    for (const d of plan.dias) {
      for (const c of d.comidas) {
        if (c.id === comidaId) {
          tipo = c.tipo;
          diaKey = d.dia;
          diaId = d.id;
        }
      }
    }
    setCopiaModal({
      tipo: "comida",
      sourceId: comidaId,
      excluirDiaId: diaId,
      titulo: tDiets("copiar.copiarComida"),
      subtitulo: `${tDiets(`comidaSlot.tipoLabels.${tipo}` as never)} · ${t(`dias.${diaKey}` as never)}`,
      tipoOrigen: tipo,
      conTipoDestino: true,
    });
  }

  function handleCopiarDia(diaId: string, diaKey: string) {
    setCopiaModal({
      tipo: "dia",
      sourceId: diaId,
      excluirDiaId: diaId,
      titulo: tDiets("copiar.copiarDia"),
      subtitulo: t(`dias.${diaKey}` as never),
    });
  }

  // #104 Fase 2 — abrir el modal de nueva comida (pide nombre y hora).
  function handleAgregarComidaDia(diaId: string) {
    setNuevaComidaNombre("");
    setNuevaComidaHora("12:00");
    setNuevaComidaModal({ diaId });
  }

  // Crea la comida con UI optimista: aparece al instante (colocada por hora) y se persiste por
  // detrás; si falla, se revierte. El botón queda bloqueado durante el guardado (1 sola creación).
  function confirmarNuevaComida() {
    if (!nuevaComidaModal || isPendingCopia) return;
    const { diaId } = nuevaComidaModal;
    const nombre = nuevaComidaNombre.trim();
    // Con el reparto activo la comida necesita nombre para tener su objetivo (es su identidad).
    if (!nombre && repartoDelDia(diaId)?.activo) {
      toast.error(tDiets("reparto.necesitaNombre"));
      return;
    }
    const hora = nuevaComidaHora;
    setNuevaComidaModal(null);
    const tempId = `tmp-comida-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    const optim: PlanVisualComida & { realId?: string | null } = {
      id: tempId, realId: null, tipo: "OTRA", descripcion: null, nombre: nombre || null, hora, alimentos: [],
    };
    setComidasNuevasDia((prev) => ({ ...prev, [diaId]: [...(prev[diaId] ?? []), optim] }));
    setScrollComidaId(tempId); // ya visible por el optimismo → scroll inmediato
    startCopia(async () => {
      try {
        const res = await agregarComida(diaId, { nombre: nombre || undefined, hora });
        // Nombre repetido en ese día: se retira la comida optimista o quedaría de fantasma.
        if (res && "error" in res && res.error) {
          setComidasNuevasDia((prev) => ({
            ...prev,
            [diaId]: (prev[diaId] ?? []).filter((c) => c.id !== tempId),
          }));
          toast.error(res.error);
          return;
        }
        if (res && "id" in res && res.id) {
          setComidasNuevasDia((prev) => ({
            ...prev,
            [diaId]: (prev[diaId] ?? []).map((c) => (c.id === tempId ? { ...c, realId: res.id } : c)),
          }));
        }
        // Con el reparto activo, la comida nueva entra en él AL 0%: así aparece en la tabla y en su
        // pastilla ("137 / 0 kcal") y el nutri le pone el % que quiera. No se le inventa una cuota,
        // que además descuadraría el día que acababa de cuadrar.
        const repartoDia = repartoDelDia(diaId);
        if (repartoDia?.activo && nombre) {
          const conNueva = anadirFila(repartoDia.comidas, {
            nombre,
            hora,
            dias: [diaDeId(diaId)].filter(Boolean) as string[],
            kcalPct: 0,
          });
          if (conNueva) {
            const slot = planiDelDia(diaId);
            // Si el panel tenía un guardado en cola para este slot, se vuelca primero: si no, llegaba
            // después con el reparto de antes y se llevaba por delante la comida recién añadida.
            volcarRepartoPendiente(slot || SLOT_GLOBAL);
            await guardarRepartoDePlan(selectedPlan.id, slot || null, {
              activo: true,
              comidas: conNueva,
            });
          }
        }
        router.refresh();
      } catch (error) {
        if (isNextNavigation(error)) throw error;
        setComidasNuevasDia((prev) => ({ ...prev, [diaId]: (prev[diaId] ?? []).filter((c) => c.id !== tempId) }));
      }
    });
  }

  // Inyecta las comidas optimistas de un día para pasarlas al editor (que las coloca por hora).
  function conComidasNuevas<T extends { id: string; comidas: PlanVisualComida[] }>(dia: T): T {
    const extra = comidasNuevasDia[dia.id];
    if (!extra || extra.length === 0) return dia;
    return { ...dia, comidas: [...dia.comidas, ...extra] };
  }

  function handleCopiarAlimento(alimentoEnComidaId: string) {
    let snap: {
      alimentoId: string | null;
      recetaId: string | null;
      cantidad: number;
      unidad: string;
      nombre: string;
      origenId: string;
    } | null = null;
    for (const d of plan.dias) {
      for (const c of d.comidas) {
        for (const a of c.alimentos) {
          if (a.id === alimentoEnComidaId) {
            snap = {
              alimentoId: a.alimento?.id ?? null,
              recetaId: a.receta?.id ?? null,
              cantidad: a.cantidad,
              unidad: a.unidad,
              nombre: a.nombrePersonalizado || a.alimento?.nombre || a.receta?.nombre || "",
              origenId: a.id,
            };
          }
        }
      }
    }
    if (!snap) return;
    setPortapapeles(snap);
    toast.success(tDiets("copiar.toastAlimentoCopiado", { nombre: snap.nombre }));
  }

  function handlePegarAlimento(comidaDestinoId: string) {
    if (!portapapeles) return;
    const snap = portapapeles;
    startCopia(async () => {
      try {
        await pegarAlimentoEnComida(comidaDestinoId, {
          alimentoId: snap.alimentoId,
          recetaId: snap.recetaId,
          cantidad: snap.cantidad,
          unidad: snap.unidad,
        }, snap.origenId);
        router.refresh();
        toast.success(tDiets("copiar.toastPegado"));
      } catch (e) {
        if (isNextNavigation(e)) throw e;
        toast.error(tDiets("copiar.toastCopiarError"));
      }
    });
  }

  function handleConfirmCopia(ids: string[], modo: ModoCopia, tipoDestino?: string) {
    if (!copiaModal) return;
    const m = copiaModal;
    startCopia(async () => {
      try {
        if (m.tipo === "comida") await copiarComidaADias(m.sourceId, ids, modo, tipoDestino);
        else await copiarDiaADias(m.sourceId, ids, modo);
        router.refresh();
        toast.success(
          m.tipo === "comida"
            ? tDiets("copiar.toastCopiadoComida", { n: ids.length })
            : tDiets("copiar.toastCopiadoDia", { n: ids.length }),
        );
      } catch (e) {
        if (isNextNavigation(e)) throw e;
        toast.error(tDiets("copiar.toastCopiarError"));
      } finally {
        setCopiaModal(null);
      }
    });
  }

  // #75 — Juntar/separar días en el editor.
  const [juntarModal, setJuntarModal] = useState<{ origenId: string; origenLabel: string } | null>(null);
  const [separarModal, setSepararModal] = useState<{ grupoDias: PlanVisualDia[] } | null>(null);
  // UI optimista de juntar/separar: override del grupoId por día (string = grupo local recién creado;
  // null = recién separado). Se ve AL INSTANTE; el refresh del servidor lo confirma o, si falla, revierte.
  const [gruposOptimistas, setGruposOptimistas] = useState<Record<string, string | null>>({});
  // #78 (1B) — UI optimista del selector de planificación por día (valor local hasta el refresh del servidor).
  const [planiOptimista, setPlaniOptimista] = useState<Record<string, string | null>>({});
  // grupoId "efectivo" de un día (optimista si hay override; real si no). Para agrupar y decidir botones.
  const grupoEfectivo = (d: PlanVisualDia): string | null =>
    d.id in gruposOptimistas ? gruposOptimistas[d.id] : (d.grupoId ?? null);

  function handleConfirmJuntar(ids: string[]) {
    if (!juntarModal || !selectedPlan) return;
    const todos = [juntarModal.origenId, ...ids];
    const grupoLocal = `optg-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    const prev = gruposOptimistas;
    const prevPlani = planiOptimista;
    // La planificación del día de ORIGEN manda en todo el grupo (comen igual → mismo objetivo).
    const planiOrigen = planiDelDia(juntarModal.origenId) || null;
    setGruposOptimistas((p) => {
      const n = { ...p };
      for (const id of todos) n[id] = grupoLocal;
      return n;
    });
    setPlaniOptimista((p) => {
      const n = { ...p };
      for (const id of todos) n[id] = planiOrigen;
      return n;
    });
    setJuntarModal(null); // cerrar el modal AL INSTANTE; el cambio ya se ve por el optimista
    startCopia(async () => {
      try {
        await juntarDias(selectedPlan.id, todos);
        router.refresh();
        toast.success(tDiets("copiar.toastJuntado"));
      } catch (e) {
        if (isNextNavigation(e)) throw e;
        setGruposOptimistas(prev); // revertir
        setPlaniOptimista(prevPlani);
        toast.error(tDiets("copiar.toastJuntarError"));
      }
    });
  }

  // Separa los días elegidos del grupo (cada uno recibe su copia del menú); el resto sigue junto.
  // Optimista: se sueltan al instante y, si el servidor falla, se revierte.
  function handleSepararDias(diaIds: string[]) {
    if (diaIds.length === 0) return;
    const prev = gruposOptimistas;
    setGruposOptimistas((p) => {
      const n = { ...p };
      for (const id of diaIds) n[id] = null;
      return n;
    });
    setSepararModal(null); // cerrar el modal AL INSTANTE
    startCopia(async () => {
      try {
        for (const id of diaIds) await separarDia(id);
        router.refresh();
        toast.success(tDiets("copiar.toastSeparado"));
      } catch (e) {
        if (isNextNavigation(e)) throw e;
        setGruposOptimistas(prev); // revertir
        toast.error(tDiets("copiar.toastJuntarError"));
      }
    });
  }

  // Botón "Separar": con 2 días los suelta directo; con 3+ abre el modal para elegir cuáles.
  function handleSepararClick(grupoDias: PlanVisualDia[]) {
    if (grupoDias.length <= 2) {
      handleSepararDias(grupoDias.map((d) => d.id));
    } else {
      setSepararModal({ grupoDias });
    }
  }

  // #78 (1B) — planificación asignada a un día (optimista si se acaba de cambiar; si no, la del servidor).
  const planiDelDia = (diaId: string): string =>
    diaId in planiOptimista ? (planiOptimista[diaId] ?? "") : (objetivosPorDia?.[diaId]?.planificacionId ?? "");

  /** Día de la semana (LUNES…) de un día del plan. */
  function diaDeId(diaId: string): string {
    return (selectedPlan?.dias ?? []).find((d) => d.id === diaId)?.dia ?? "";
  }

  /** Objetivo (kcal y gramos) de un día. Misma prioridad que la barra de objetivos (`objDe`):
   *  primero lo que viaja en el prop `planificaciones` (así al reasignar la planificación de un día
   *  cambia al instante, sin esperar al refresh), luego el dato del servidor para ese día, y por
   *  último el del plan. Lo comparten el cumplimiento por comida y el panel del reparto, para que no
   *  haya dos verdades sobre las kcal del día. */
  function objetivoDelDia(diaId: string): {
    kcal?: number | null;
    proteinas?: number | null;
    carbohidratos?: number | null;
    grasas?: number | null;
  } {
    const pid = planiDelDia(diaId);
    const p = pid ? planificaciones.find((x) => x.id === pid) : undefined;
    if (p && (p.kcal != null || p.proteinas != null || p.carbohidratos != null || p.grasas != null)) {
      return { kcal: p.kcal, proteinas: p.proteinas, carbohidratos: p.carbohidratos, grasas: p.grasas };
    }
    const o = objetivosPorDia?.[diaId];
    if (o && o.planificacionId === pid) {
      return { kcal: o.kcal, proteinas: o.proteinas, carbohidratos: o.carbohidratos, grasas: o.grasas };
    }
    return {
      kcal: selectedPlan?.caloriasObjetivo,
      proteinas: selectedPlan?.proteinasObjetivo,
      carbohidratos: selectedPlan?.carbohidratosObjetivo,
      grasas: selectedPlan?.grasasObjetivo,
    };
  }

  // #78-C Fase 2 — objetivo por comida de un día: reparto de SU planificación (o el de la principal
  // si no tiene asignada) aplicado a los objetivos de ese día. Solo en el dashboard del nutri.
  // Se pasan las comidas REALES del día: el reparto se renormaliza entre las que existen (si falta
  // el desayuno o hay un pre-entreno extra, el día sigue cuadrando) y se emparejan por identidad.
  function objetivosComidaDia(diaId: string): Record<string, ObjetivoComida> | null {
    if (interactionMode !== "dashboard") return null;
    const pid = planiDelDia(diaId);
    const p = pid ? planificaciones.find((x) => x.id === pid) : undefined;
    // Prioridad: la COPIA propia de la dieta manda siempre (es el snapshot de #78-C, y por eso
    // cambiar la planificación no altera esta dieta). Solo las dietas anteriores a la feature no la
    // tienen: esas leen el reparto de la planificación del día, o el de la principal si no resuelve.
    // `repartoOptimista` es lo que el nutri acaba de añadir desde una comida (se ve al instante).
    const reparto = repartoDelDia(diaId);
    const dia = objetivoDelDia(diaId);
    const diaPlan = (selectedPlan?.dias ?? []).find((d) => d.id === diaId);
    if (!diaPlan) return null;
    // Comidas REALES del día (incluidas las recién añadidas de forma optimista): el reparto se
    // renormaliza entre ellas, así el día cuadra aunque falten o sobren comidas.
    const comidas = conComidasNuevas(diaPlan).comidas.map((c) => ({
      id: c.id,
      tipo: c.tipo,
      nombre: c.nombre,
    }));
    return objetivosPorComidaDia(dia, reparto, comidas, diaPlan.dia);
  }

  /* ─── #78-C — Reparto por comida de ESTA dieta (su propia copia, nunca la planificación) ─── */
  // Un borrador por SLOT (planificación o `global`): dos días con planificaciones distintas tienen
  // repartos distintos y no pueden compartir un único optimista.
  const [repartoOptimista, setRepartoOptimista] = useState<Record<string, RepartoPorComida>>({});
  useEffect(() => {
    // Otra dieta, otros repartos: y el panel no puede quedarse abierto sobre el slot de la anterior.
    // Lo que estuviera pendiente se guarda antes (lleva su propio planId, así que va a su dieta).
    for (const clave of Object.keys(repartoSaveRef.current)) volcarRepartoPendiente(clave);
    setRepartoOptimista({});
    setRepartoPanelAbierto(false);
    setRepartoSlot("");
    setRepartoDiaVisto("");
  }, [selectedPlan.id]);
  // Poda por VALOR (firma estable), no por identidad del objeto: `repartoPropio` es un objeto nuevo
  // en cada render del servidor, así que comparar referencias hacía que cualquier router.refresh()
  // de otra acción (añadir un alimento, asignar una planificación) borrara el borrador a medias.
  useEffect(() => {
    setRepartoOptimista((prev) => {
      const claves = Object.keys(prev);
      if (claves.length === 0) return prev;
      const pendientes: Record<string, RepartoPorComida> = {};
      for (const k of claves) {
        const delServidor = repartoParaPlani(repartoPropio, k === SLOT_GLOBAL ? null : k);
        if (firmaReparto(delServidor) !== firmaReparto(prev[k])) pendientes[k] = prev[k];
      }
      return Object.keys(pendientes).length === claves.length ? prev : pendientes;
    });
  }, [repartoPropio]);

  /** Reparto que le toca a un día: el borrador de su slot si hay uno, la copia de la dieta si no, y
   *  solo en las dietas anteriores a la feature (sin copia) el de la planificación en vivo. */
  function repartoDelDia(diaId: string): RepartoPorComida | null {
    const pid = planiDelDia(diaId);
    const enEdicion = repartoOptimista[pid || SLOT_GLOBAL];
    if (enEdicion) return enEdicion;
    const propio = repartoParaPlani(repartoPropio, pid || null);
    if (propio) return propio;
    const p = pid ? planificaciones.find((x) => x.id === pid) : undefined;
    return p ? (p.datos?.repartoPorComida ?? null) : repartoFallback;
  }

  // Una comida que quedó fuera del reparto: se le crea su fila AL 0% y se abre el panel para ponerle
  // el % que toque. Antes se le metía un 10% a secas, que descuadraba el día sin decir nada.
  function handleAnadirComidaAlReparto(comidaId: string, diaId: string) {
    if (!selectedPlan) return;
    const diaPlan = (selectedPlan.dias ?? []).find((d) => d.id === diaId);
    const comida = diaPlan ? conComidasNuevas(diaPlan).comidas.find((c) => c.id === comidaId) : null;
    if (!comida) return;

    if (comida.tipo === "OTRA" && !(comida.nombre ?? "").trim()) {
      // Sin nombre no hay identidad posible: dos comidas propias sin nombre serían la misma fila.
      toast.error(tDiets("reparto.necesitaNombre"));
      return;
    }
    const pid = planiDelDia(diaId);
    const partida = normalizeReparto(repartoDelDia(diaId));
    const clave = claveComida(comida);
    const idx = partida.comidas.findIndex((c) => claveComida(c) === clave);
    if (idx >= 0) {
      // Estaba excluida: se reactiva, pero sin cuota, para no descuadrar el día por su cuenta.
      partida.comidas[idx] = { ...partida.comidas[idx], incluida: true };
    } else {
      // Los días se deducen de la dieta: si el pre-entreno solo está el lunes y el miércoles, la
      // fila queda marcada con esos días (así una dieta nueva no lo creará los siete).
      const diasConEstaComida = (selectedPlan.dias ?? [])
        .filter((d) => conComidasNuevas(d).comidas.some((c) => claveComida(c) === clave))
        .map((d) => d.dia);
      const conNueva = anadirFila(partida.comidas, {
        nombre: (comida.nombre ?? "").trim(),
        hora: comida.hora ?? undefined,
        dias: diasConEstaComida,
        kcalPct: 0,
      });
      partida.comidas =
        conNueva ??
        // Comida fija que no tenía fila: se añade directamente (las propias ya pasaron por anadirFila).
        [
          ...partida.comidas,
          {
            tipo: comida.tipo,
            nombre: comida.nombre ?? undefined,
            hora: comida.hora ?? undefined,
            incluida: true,
            kcalPct: 0,
          },
        ];
    }
    const nuevo: RepartoPorComida = { activo: true, comidas: partida.comidas };
    const slot = pid || SLOT_GLOBAL;
    volcarRepartoPendiente(slot); // que no llegue después un guardado con el reparto de antes
    setRepartoOptimista((prev) => ({ ...prev, [slot]: nuevo }));
    setRepartoSlot(pid);
    setRepartoDiaVisto(diaPlan?.dia ?? "");
    setRepartoPanelAbierto(true);
    startCopia(async () => {
      try {
        const res = await guardarRepartoDePlan(selectedPlan.id, pid || null, nuevo);
        if (res?.ok === false) throw new Error(res.error);
        router.refresh();
      } catch (e) {
        if (isNextNavigation(e)) throw e;
        setRepartoOptimista((prev) => {
          const n = { ...prev };
          delete n[slot];
          return n;
        });
        toast.error(t("repartoComidaAnadidaError"));
      }
    });
  }

  // Asigna una planificación (o ninguna) a los días dados; se ve al instante y el refresh lo confirma.
  /** Comidas del día que la planificación destino NO prevé. Se preguntan antes de cambiar: borrarlas
   *  a la callada se llevaría un pre-entreno con alimentos dentro, y no hay vuelta atrás. */
  function comidasQueSobran(diaIds: string[], planiId: string | null) {
    // El reparto que va a mandar en esos días: el slot que la dieta ya tenga para esa planificación
    // y, si no lo tiene, el de la planificación (que es lo que el servidor sembrará). NO se cae al
    // global: eso comparaba contra un reparto que no tiene nada que ver con el destino.
    const destino = planiId
      ? ((esRepartoV2(repartoPropio) ? repartoPropio.porPlani?.[planiId] : null) ??
        planificaciones.find((p) => p.id === planiId)?.datos?.repartoPorComida ??
        null)
      : repartoParaPlani(repartoPropio, null);
    // Sin reparto activo en el destino, ese día no tiene estructura definida: no sobra nada.
    if (!destino?.activo) return [];
    // Con días juntados (#75) las comidas viven en el representante, así que varios días del grupo
    // devolverían LA MISMA comida: se recorren representantes únicos y se deduplica por id, o
    // "Quitarlas" llamaba dos veces a eliminarComida y la segunda abortaba el cambio a medias.
    const porId = new Map<string, { id: string; etiqueta: string; alimentos: number }>();
    const vistos = new Set<string>();
    for (const diaId of diaIds) {
      const dia = (selectedPlan?.dias ?? []).find((d) => d.id === diaId);
      if (!dia) continue;
      const rep = representanteDeDia(dia);
      if (vistos.has(rep.id)) continue;
      vistos.add(rep.id);
      const previstas = new Set(filasParaDia(destino, rep.dia).map((f) => claveComida(f)));
      for (const c of conComidasNuevas(rep).comidas) {
        if (previstas.has(claveComida(c))) continue;
        // Las comidas optimistas todavía no existen en la BD: no se pueden borrar por id temporal.
        if (c.id.startsWith("tmp-")) continue;
        porId.set(c.id, {
          id: c.id,
          etiqueta: (c.nombre ?? "").trim() || tDiets(`comidaSlot.tipoLabels.${c.tipo}` as never),
          alimentos: c.alimentos?.length ?? 0,
        });
      }
    }
    return [...porId.values()];
  }

  function handleAsignarPlani(diaIds: string[], planiId: string | null) {
    if (diaIds.length === 0) return;
    const sobran = comidasQueSobran(diaIds, planiId);
    if (sobran.length > 0) {
      setCambioPlaniModal({ diaIds, planiId, sobran });
      return;
    }
    aplicarAsignarPlani(diaIds, planiId, []);
  }

  /** Asigna la planificación, crea las comidas que el nuevo reparto prevé y no existen, y borra solo
   *  las que el nutri haya decidido quitar en el aviso. */
  function aplicarAsignarPlani(diaIds: string[], planiId: string | null, quitarComidaIds: string[]) {
    const prev = planiOptimista;
    setPlaniOptimista((p) => {
      const n = { ...p };
      for (const id of diaIds) n[id] = planiId;
      return n;
    });
    startCopia(async () => {
      try {
        // Lo único que revierte el cambio en pantalla si falla: la asignación.
        for (const id of diaIds) await asignarPlanificacionADia(id, planiId);
      } catch (e) {
        if (isNextNavigation(e)) throw e;
        setPlaniOptimista(prev);
        toast.error(tDiets("copiar.toastJuntarError"));
        return;
      }
      // El resto va aparte: la planificación YA está asignada, así que si algo de esto falla no
      // tiene sentido deshacerlo en pantalla (quedaría mostrando la planificación anterior).
      try {
        for (const comidaId of new Set(quitarComidaIds)) {
          // Tolerante: si la comida ya no existe (otra pestaña, doble clic), no se aborta el resto.
          try {
            await eliminarComida(comidaId);
          } catch (e) {
            if (isNextNavigation(e)) throw e;
          }
        }
        // Crear las que falten. Una sola llamada por GRUPO: la action resuelve el día representante,
        // así que llamarla con los 4 días de un grupo haría el mismo trabajo cuatro veces.
        const representantes = new Set(
          diaIds
            .map((id) => (selectedPlan?.dias ?? []).find((d) => d.id === id))
            .filter((d): d is PlanVisualDia => !!d)
            .map((d) => representanteDeDia(d).id),
        );
        const creadas: string[] = [];
        for (const id of representantes) {
          const res = await sincronizarComidasDeDia(id);
          if (res.ok && res.creadas?.length) creadas.push(...res.creadas);
        }
        if (creadas.length > 0) {
          // La action devuelve el nombre o, si no tiene, el tipo: se traduce aquí para no mostrar el
          // enum en crudo ("MEDIA_MANANA").
          const etiquetas = [...new Set(creadas)].map((c) =>
            /^[A-Z_]+$/.test(c) ? tDiets(`comidaSlot.tipoLabels.${c}` as never) : c,
          );
          toast.success(tDiets("reparto.comidasCreadas", { comidas: etiquetas.join(", ") }));
        }
      } catch (e) {
        if (isNextNavigation(e)) throw e;
        toast.error(tDiets("copiar.toastJuntarError"));
      }
      router.refresh();
    });
  }

  useEffect(() => {
    setSelectedDayKey("TODOS");
  }, [plan.id]);

  // Poda del estado optimista: cuando el refresh trae el grupoId real, quita los overrides que ya
  // coinciden (separado→real null, juntado→real no-null). Igual idea que la poda optimista de alimentos.
  useEffect(() => {
    setGruposOptimistas((prev) => {
      if (Object.keys(prev).length === 0) return prev;
      const next = { ...prev };
      let changed = false;
      for (const d of selectedPlan?.dias ?? []) {
        if (d.id in next && (next[d.id] === null) === ((d.grupoId ?? null) === null)) {
          delete next[d.id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlan]);

  // Poda del optimista de planificación: cuando el refresh trae la planificación real del día, quita el override.
  useEffect(() => {
    setPlaniOptimista((prev) => {
      if (Object.keys(prev).length === 0) return prev;
      const next = { ...prev };
      let changed = false;
      for (const [diaId, opt] of Object.entries(prev)) {
        const real = objetivosPorDia?.[diaId]?.planificacionId ?? null;
        if ((opt ?? null) === real) { delete next[diaId]; changed = true; }
      }
      return changed ? next : prev;
    });
  }, [objetivosPorDia]);

  async function handleAsignarComoActual() {
    if (!selectedPlan || isPendingAssign) return;
    startAssign(async () => {
      try {
        await asignarPlanComoActual(selectedPlan.id);
        toast.success(t("toastDietaAsignada"));
        router.refresh();
      } catch {
        toast.error(t("toastDietaAsignadaError"));
      }
    });
  }

  useEffect(() => {
    if (!planSelectOpen) return;
    function onDocMouseDown(e: MouseEvent) {
      const el = planSelectWrapRef.current;
      if (!el) return;
      if (e.target instanceof Node && el.contains(e.target)) return;
      setPlanSelectOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [planSelectOpen]);

  const isTodos = selectedDayKey === "TODOS";

  const diasDisponibles = useMemo(() => {
    if (!selectedPlan) return [] as PlanVisualDia[];
    return selectedPlan.dias;
  }, [selectedPlan]);

  // #75 — Pestañas de día agrupadas: los días juntos (mismo grupoId) salen como UNA pestaña
  // ("Lun·Mar"); los sueltos, individuales. La key de cada pestaña es el día representante.
  const tabsDias = useMemo(() => {
    const dias = selectedPlan?.dias ?? [];
    const idx = (d: string) => DIA_KEYS.indexOf(d as (typeof DIA_KEYS)[number]);
    const porGrupo = new Map<string, PlanVisualDia[]>();
    const sueltos: PlanVisualDia[] = [];
    for (const d of dias) {
      const g = d.id in gruposOptimistas ? gruposOptimistas[d.id] : (d.grupoId ?? null);
      if (g) porGrupo.set(g, [...(porGrupo.get(g) ?? []), d]);
      else sueltos.push(d);
    }
    type Tab = { key: string; label: string; diaKeys: string[] };
    const tabs: Tab[] = sueltos.map((d) => ({ key: d.dia, label: t(`dias.${d.dia}`), diaKeys: [d.dia] }));
    for (const [, ds] of porGrupo) {
      const ord = [...ds].sort((a, b) => idx(a.dia) - idx(b.dia));
      tabs.push({
        key: ord[0].dia,
        label: ord.map((d) => t(`dias.${d.dia}`).slice(0, 3)).join("·"),
        diaKeys: ord.map((d) => d.dia),
      });
    }
    return tabs.sort((a, b) => idx(a.diaKeys[0]) - idx(b.diaKeys[0]));
  }, [selectedPlan, t, gruposOptimistas]);

  const diasVisible = useMemo(() => {
    if (!selectedPlan) return [] as PlanVisualDia[];
    if (isTodos) return selectedPlan.dias;
    const found = selectedPlan.dias.find((d) => d.dia === selectedDayKey);
    return found ? [found] : [];
  }, [selectedPlan, selectedDayKey, isTodos]);

  // #75 — Agrupa los días visibles en bloques: los días con el mismo grupoId (que "comen igual")
  // forman un solo bloque; el representante (menor orden) aporta el menú (ya reflejado al cargar).
  const bloquesDias = useMemo(() => {
    type Bloque = { key: string; dias: PlanVisualDia[]; representante: PlanVisualDia };
    const porGrupo = new Map<string, PlanVisualDia[]>();
    const sueltos: PlanVisualDia[] = [];
    for (const d of diasVisible) {
      const g = d.id in gruposOptimistas ? gruposOptimistas[d.id] : (d.grupoId ?? null);
      if (g) {
        const arr = porGrupo.get(g) ?? [];
        arr.push(d);
        porGrupo.set(g, arr);
      } else {
        sueltos.push(d);
      }
    }
    const ord = (s: string) => DIA_KEYS.indexOf(s as (typeof DIA_KEYS)[number]);
    const bloques: Bloque[] = sueltos.map((d) => ({ key: d.id, dias: [d], representante: d }));
    for (const [g, dias] of porGrupo) {
      const ds = [...dias].sort((a, b) => ord(a.dia) - ord(b.dia));
      bloques.push({ key: g, dias: ds, representante: ds[0] });
    }
    return bloques.sort((a, b) => ord(a.representante.dia) - ord(b.representante.dia));
  }, [diasVisible, gruposOptimistas]);

  /* ─── #78-C — Panel del reparto DENTRO de la dieta ───────────────────────────────────────────
   * Edita la copia de esta dieta (un reparto por planificación). Nunca escribe en la planificación:
   * el nutri puede activarlo, añadir comidas y mover los % sin tocar la pauta.
   */
  const [repartoPanelAbierto, setRepartoPanelAbierto] = useState(false);
  const [repartoSlot, setRepartoSlot] = useState<string>("");
  const [repartoDiaVisto, setRepartoDiaVisto] = useState<string>("");
  // Un temporizador y un borrador pendiente POR SLOT: con uno compartido, editar el reparto de una
  // planificación y pasar a otra cancelaba el guardado de la primera sin decir nada.
  const repartoSaveRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const repartoPendienteRef = useRef<
    Record<string, { planId: string; slot: string | null; reparto: RepartoPorComida }>
  >({});

  /** Día que manda en un grupo (#75): las comidas viven solo en el representante, así que crear una
   *  comida en un día miembro la dejaría invisible y el siguiente reagrupado se la llevaría. */
  function representanteDeDia(d: PlanVisualDia): PlanVisualDia {
    const grupoDe = (x: PlanVisualDia) =>
      x.id in gruposOptimistas ? gruposOptimistas[x.id] : (x.grupoId ?? null);
    const g = grupoDe(d);
    if (!g) return d;
    const delGrupo = (selectedPlan?.dias ?? []).filter((x) => grupoDe(x) === g);
    const ord = (k: string) => DIA_KEYS.indexOf(k as (typeof DIA_KEYS)[number]);
    return [...delGrupo].sort((a, b) => ord(a.dia) - ord(b.dia))[0] ?? d;
  }

  /** El panel solo tiene sentido sobre una dieta REAL del nutri: las plantillas de dieta no tienen
   *  paciente y su `plan.id` no es una fila de planes_alimenticios (guardar ahí no encontraría nada),
   *  y el portal del paciente ni ve objetivos por comida. */
  const puedeEditarReparto =
    interactionMode === "dashboard" && !readOnly && !!pacienteId && !localCallbacks;

  /** Slots que existen de verdad en esta dieta: las planificaciones que algún día usa, más el
   *  "sin planificación" si algún día no tiene ninguna (que es el caso normal con una sola). */
  const repartoSlots = useMemo(() => {
    const usados = new Set((selectedPlan?.dias ?? []).map((d) => planiDelDia(d.id)));
    const out: { id: string; nombre: string }[] = [];
    if (usados.has("")) out.push({ id: "", nombre: tDiets("reparto.sinPlani") });
    for (const p of planificaciones) if (usados.has(p.id)) out.push({ id: p.id, nombre: p.nombre });
    return out;
  }, [selectedPlan?.dias, planiOptimista, objetivosPorDia, planificaciones, tDiets]);

  /** Días de la dieta que usan el slot abierto, con las comidas reales de su día representante. */
  const repartoDiasDelSlot = useMemo(() => {
    return (selectedPlan?.dias ?? [])
      .filter((d) => planiDelDia(d.id) === repartoSlot)
      .map((d) => {
        const rep = representanteDeDia(d);
        return {
          id: rep.id,
          dia: d.dia,
          comidas: conComidasNuevas(rep).comidas.map((c) => ({
            id: c.id,
            tipo: c.tipo,
            nombre: c.nombre,
            hora: c.hora,
          })),
        };
      });
  }, [selectedPlan?.dias, repartoSlot, planiOptimista, objetivosPorDia, comidasNuevasDia, gruposOptimistas]);

  /** Día cuyo reparto y objetivos muestra el panel: el visto si sigue en el slot, o el primero. */
  const diaIdPanel =
    repartoDiasDelSlot.find((d) => d.dia === repartoDiaVisto)?.id ?? repartoDiasDelSlot[0]?.id ?? "";

  /** ¿El día que se está viendo en el editor tiene reparto activo? Es lo que dice el botón. */
  const repartoActivoAqui = (() => {
    const dia = diasVisible[0] ?? (selectedPlan?.dias ?? [])[0];
    return dia ? !!repartoDelDia(dia.id)?.activo : false;
  })();

  function abrirRepartoPanel() {
    const dia = diasVisible[0] ?? (selectedPlan?.dias ?? [])[0];
    const slot = dia ? planiDelDia(dia.id) : "";
    setRepartoSlot(slot);
    setRepartoDiaVisto(dia?.dia ?? "");
    setRepartoPanelAbierto(true);
  }

  function cambiarRepartoSlot(slot: string) {
    volcarRepartoPendiente(repartoSlot || SLOT_GLOBAL);
    setRepartoSlot(slot);
    const primero = (selectedPlan?.dias ?? []).find((d) => planiDelDia(d.id) === slot);
    setRepartoDiaVisto(primero?.dia ?? "");
  }

  /** Cambiar de día en el panel. Si ese día usa otra planificación, el panel cambia de reparto con
   *  él: así los siete días están siempre a la vista y no hay que ir al selector de planificación
   *  para ver el de un día concreto. */
  function cambiarRepartoDiaVisto(dia: string) {
    const delDia = (selectedPlan?.dias ?? []).find((d) => d.dia === dia);
    const slot = delDia ? planiDelDia(delDia.id) : repartoSlot;
    if (slot !== repartoSlot) {
      volcarRepartoPendiente(repartoSlot || SLOT_GLOBAL);
      setRepartoSlot(slot);
    }
    setRepartoDiaVisto(dia);
  }

  /** Con el panel abierto, seguir la pestaña de día del editor: si el nutri pasa del lunes al martes
   *  y el martes usa otra planificación, el panel se quedaba mirando el reparto del lunes. */
  useEffect(() => {
    if (!repartoPanelAbierto || isTodos) return;
    const dia = (selectedPlan?.dias ?? []).find((d) => d.dia === selectedDayKey);
    if (!dia) return;
    const slot = planiDelDia(dia.id);
    setRepartoSlot((prev) => {
      if (prev !== slot) volcarRepartoPendiente(prev || SLOT_GLOBAL);
      return slot;
    });
    setRepartoDiaVisto(dia.dia);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDayKey, repartoPanelAbierto, isTodos]);

  /** Guarda el reparto del slot abierto: se ve al instante y se persiste con un pequeño retardo (un
   *  arrastre de slider son decenas de cambios y no hacen falta decenas de escrituras). */
  /** Persiste ya el borrador pendiente de un slot (si hay). Hay que llamarlo antes de cualquier otra
   *  escritura del reparto y al cambiar de slot: con un único temporizador compartido, el cambio
   *  anterior se cancelaba y se quedaba en pantalla como si estuviera guardado. */
  function volcarRepartoPendiente(clave: string) {
    const pend = repartoPendienteRef.current[clave];
    const timer = repartoSaveRef.current[clave];
    if (timer) {
      clearTimeout(timer);
      delete repartoSaveRef.current[clave];
    }
    if (!pend) return;
    delete repartoPendienteRef.current[clave];
    persistirReparto(clave, pend.planId, pend.slot, pend.reparto);
  }

  function persistirReparto(
    clave: string,
    planId: string,
    slot: string | null,
    nuevo: RepartoPorComida,
  ) {
    const revertir = () =>
      setRepartoOptimista((prev) => {
        const n = { ...prev };
        delete n[clave];
        return n;
      });
    guardarRepartoDePlan(planId, slot, nuevo)
      .then((res) => {
        if (res?.ok === false) {
          // Demo o error real: se retira el borrador para no dejar en pantalla algo sin guardar.
          revertir();
          toast.error(res.error ?? tDiets("reparto.guardadoError"));
          return;
        }
        router.refresh();
      })
      .catch((e) => {
        if (isNextNavigation(e)) throw e;
        revertir();
        toast.error(tDiets("reparto.guardadoError"));
      });
  }

  function guardarRepartoPanel(nuevo: RepartoPorComida) {
    if (!selectedPlan) return;
    const slot = repartoSlot;
    const clave = slot || SLOT_GLOBAL;
    // El planId se captura AQUÍ: si el nutri cambia de dieta antes de que salte el temporizador, el
    // guardado tiene que ir a la dieta en la que estaba editando, no a la nueva.
    const planId = selectedPlan.id;
    setRepartoOptimista((prev) => ({ ...prev, [clave]: nuevo }));
    repartoPendienteRef.current[clave] = { planId, slot: slot || null, reparto: nuevo };
    if (repartoSaveRef.current[clave]) clearTimeout(repartoSaveRef.current[clave]);
    repartoSaveRef.current[clave] = setTimeout(() => volcarRepartoPendiente(clave), 700);
  }

  // #78 — Objetivos a mostrar en la barra superior. En vista de un día: el objetivo de ESE día (su
  // planificación o el global del plan). En "Todas": agrupado por planificación (qué días usan cada
  // objetivo). Un solo grupo → barra simple; varios → una fila por planificación (opción B).
  type ObjBarra = { nombre: string | null; dias: string[]; kcal: number | null; proteinas: number | null; carbohidratos: number | null; grasas: number | null };
  const objetivosBarra = useMemo<ObjBarra[]>(() => {
    if (!selectedPlan) return [];
    const global: ObjBarra = {
      nombre: null, dias: [],
      kcal: selectedPlan.caloriasObjetivo, proteinas: selectedPlan.proteinasObjetivo,
      carbohidratos: selectedPlan.carbohidratosObjetivo, grasas: selectedPlan.grasasObjetivo,
    };
    // Objetivo de un día según su planificación EFECTIVA (optimista). Si el prop planificaciones trae
    // kcal/macros, la barra cambia al instante al reasignar; si no (readonly), cae al dato del servidor.
    const objDe = (d: PlanVisualDia): ObjBarra => {
      const pid = planiDelDia(d.id);
      if (!pid) return { ...global };
      const p = planificaciones.find((x) => x.id === pid);
      if (p && (p.kcal != null || p.proteinas != null || p.carbohidratos != null || p.grasas != null)) {
        return { nombre: p.nombre, dias: [], kcal: p.kcal ?? null, proteinas: p.proteinas ?? null, carbohidratos: p.carbohidratos ?? null, grasas: p.grasas ?? null };
      }
      const o = objetivosPorDia?.[d.id];
      if (o && o.planificacionId === pid) return { nombre: o.nombre, dias: [], kcal: o.kcal, proteinas: o.proteinas, carbohidratos: o.carbohidratos, grasas: o.grasas };
      return p ? { nombre: p.nombre, dias: [], kcal: null, proteinas: null, carbohidratos: null, grasas: null } : { ...global };
    };
    const idx = (s: string) => DIA_KEYS.indexOf(s as (typeof DIA_KEYS)[number]);
    if (!isTodos) {
      const d = selectedPlan.dias.find((x) => x.dia === selectedDayKey);
      return d ? [objDe(d)] : [];
    }
    const grupos = new Map<string, { obj: ObjBarra; dias: PlanVisualDia[] }>();
    for (const d of selectedPlan.dias) {
      const firma = planiDelDia(d.id) || "global";
      const g = grupos.get(firma);
      if (g) g.dias.push(d);
      else grupos.set(firma, { obj: objDe(d), dias: [d] });
    }
    return [...grupos.values()]
      .map((g) => ({ ...g.obj, dias: [...g.dias].sort((a, b) => idx(a.dia) - idx(b.dia)).map((d) => d.dia) }))
      .sort((a, b) => (a.dias[0] ? idx(a.dias[0]) : 99) - (b.dias[0] ? idx(b.dias[0]) : 99));
  }, [selectedPlan, objetivosPorDia, isTodos, selectedDayKey, planiOptimista, planificaciones]);

  const diaVista = useMemo<PlanVisualDia | null>(() => {
    if (!selectedPlan) return null;
    if (isTodos) {
      const aggregated: PlanVisualComida[] = [];
      for (const d of selectedPlan.dias) {
        for (const c of d.comidas) aggregated.push(c);
      }
      return { id: "__TODOS__", dia: "TODOS", comidas: aggregated };
    }
    return selectedPlan.dias.find((d) => d.dia === selectedDayKey) ?? selectedPlan.dias[0] ?? null;
  }, [selectedPlan, selectedDayKey, isTodos]);

  const diasCount = Math.max(1, selectedPlan?.dias.length ?? 1);
  const avgDivisor = isTodos ? diasCount : 1;

  const totals = useMemo(() => {
    if (!selectedPlan || !diaVista) return null;

    const macroList = [];
    for (const comida of diaVista.comidas) {
      for (const item of comida.alimentos) {
        if (item.alimento) {
          const gramos = convertirAGramos(item.cantidad, item.unidad, item.alimento.porcion || 100);
          macroList.push(
            calcularMacrosPorcion(
              {
                calorias: item.alimento.calorias,
                proteinas: item.alimento.proteinas,
                carbohidratos: item.alimento.carbohidratos,
                grasas: item.alimento.grasas,
                fibra: item.alimento.fibra,
              },
              gramos
            )
          );
          continue;
        }

        if (item.receta) {
          macroList.push({
            calorias: Math.round(item.receta.calorias * item.cantidad * 10) / 10,
            proteinas: Math.round(item.receta.proteinas * item.cantidad * 10) / 10,
            carbohidratos: Math.round(item.receta.carbohidratos * item.cantidad * 10) / 10,
            grasas: Math.round(item.receta.grasas * item.cantidad * 10) / 10,
            fibra: Math.round(item.receta.fibra * item.cantidad * 10) / 10,
          });
        }
      }
    }

    const tRaw = sumarMacros(macroList);
    const totals = {
      calorias: Math.round((tRaw.calorias / avgDivisor) * 10) / 10,
      proteinas: Math.round((tRaw.proteinas / avgDivisor) * 10) / 10,
      carbohidratos: Math.round((tRaw.carbohidratos / avgDivisor) * 10) / 10,
      grasas: Math.round((tRaw.grasas / avgDivisor) * 10) / 10,
      fibra: Math.round((tRaw.fibra / avgDivisor) * 10) / 10,
    };

    const MICRO_KEYS = [
      "vitaminaA","vitaminaB6","vitaminaB12","vitaminaC","vitaminaD",
      "vitaminaE","vitaminaK","tiamina","riboflavina","niacina",
      "folato","acidoPantotenico","colina","calcio","hierro",
      "magnesio","fosforo","potasio","sodio","cinc",
      "cobre","manganeso","selenio","fluor",
    ] as const;
    const microTotals: Record<string, number> = {};
    for (const key of MICRO_KEYS) microTotals[key] = 0;
    for (const comida of diaVista.comidas) {
      for (const item of comida.alimentos) {
        if (item.alimento) {
          const factor = convertirAGramos(item.cantidad, item.unidad, item.alimento.porcion || 100) / 100;
          for (const key of MICRO_KEYS) {
            const val = (item.alimento as Record<string, unknown>)[key];
            if (typeof val === "number") microTotals[key] += val * factor;
          }
        } else if (item.receta) {
          // #90 — micros de receta: guardados por porción; se escalan por las porciones servidas (item.cantidad), igual que sus macros.
          for (const key of MICRO_KEYS) {
            const val = (item.receta as Record<string, unknown>)[key];
            if (typeof val === "number") microTotals[key] += val * item.cantidad;
          }
        }
      }
    }
    for (const key of MICRO_KEYS) microTotals[key] = Math.round((microTotals[key] / avgDivisor) * 10) / 10;

    const grasaKcal = totals.grasas * 9;
    const carbKcal = totals.carbohidratos * 4;
    const protKcal = totals.proteinas * 4;
    const fibraKcal = totals.fibra * 2;
    const energyTotal = grasaKcal + carbKcal + protKcal + fibraKcal;

    const TIPO_LABELS: Record<string, string> = {
      DESAYUNO: t("comidas.DESAYUNO"), MEDIA_MANANA: t("comidas.MEDIA_MANANA"), ALMUERZO: t("comidas.ALMUERZO"),
      MERIENDA: t("comidas.MERIENDA"), CENA: t("comidas.CENA"), RECENA: t("comidas.RECENA"),
    };
    const comidasAgg = new Map<string, { gF: number; cF: number; pF: number }>();
    for (const comida of diaVista.comidas) {
      let gF = 0, cF = 0, pF = 0;
      for (const item of comida.alimentos) {
        if (item.alimento) {
          const f = convertirAGramos(item.cantidad, item.unidad, item.alimento.porcion || 100) / 100;
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
    const comidasMacros = Array.from(comidasAgg.entries()).map(([tipo, v]) => {
      const gF = v.gF / avgDivisor;
      const cF = v.cF / avgDivisor;
      const pF = v.pF / avgDivisor;
      const calTotal = gF * 9 + cF * 4 + pF * 4;
      return {
        tipo,
        label: TIPO_LABELS[tipo] || tipo,
        grasasG: Math.round(gF * 10) / 10,
        carbG: Math.round(cF * 10) / 10,
        protG: Math.round(pF * 10) / 10,
        grasasKcal: Math.round(gF * 9),
        carbKcal: Math.round(cF * 4),
        protKcal: Math.round(pF * 4),
        calTotal: Math.round(calTotal),
        grasasPct: calTotal > 0 ? Math.round((gF * 9 / calTotal) * 100) : 0,
        carbPct: calTotal > 0 ? Math.round((cF * 4 / calTotal) * 100) : 0,
        protPct: calTotal > 0 ? Math.round((pF * 4 / calTotal) * 100) : 0,
      };
    });

    return {
      macros: totals,
      micro: microTotals,
      comidasMacros,
      energy: {
        grasasKcal: grasaKcal,
        carbKcal: carbKcal,
        protKcal: protKcal,
        fibraKcal: fibraKcal,
        energyTotal: energyTotal || 1,
      },
    };
  }, [diaVista, selectedPlan, avgDivisor]);

  if (!selectedPlan) {
    return (
      <section className="space-y-4">
        <div className="bg-card rounded-xl border border-border p-10 text-center">
          <UtensilsCrossed className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium">{t("sinPlan")}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {t("sinDatos")}
          </p>
        </div>
      </section>
    );
  }

  const anyTopButton = showNuevaDietaButton || showAsignarButton || showPdfButton;

  void pacienteNombre;

  return (
    <section className="space-y-4">

      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        {/* Vista tabs — en móvil va primero. Ocultas cuando ocultarCalorias: solo queda la vista plan. */}
        {!ocultarCalorias && (
        <div className="order-first sm:order-last inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card p-1 shrink-0 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setVista("resumen")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              vista === "resumen"
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-muted-foreground hover:bg-muted/60"
            )}
          >
            <LayoutGrid className="w-4 h-4" />
            {t("vistaResumen")}
          </button>
          <button
            type="button"
            onClick={() => setVista("plan")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              vista === "plan"
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-muted-foreground hover:bg-muted/60"
            )}
          >
            <ClipboardList className="w-4 h-4" />
            {t("vistaPlan")}
          </button>
          <button
            type="button"
            onClick={() => setVista("analisis")}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              vista === "analisis"
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-muted-foreground hover:bg-muted/60"
            )}
          >
            <PieChartIcon className="w-4 h-4" />
            {t("vistaAnalisis")}
          </button>
        </div>
        )}

        {/* Day selector — en móvil va segundo y se oculta en resumen */}
        <div
          className={cn(
            "order-2 sm:order-first flex-1 min-w-0 overflow-hidden transition-all duration-300 ease-in-out",
            vista === "resumen" ? "max-h-0 opacity-0 sm:max-h-none sm:opacity-100" : "max-h-20 opacity-100"
          )}
        >
          <div className="flex items-stretch rounded-xl border border-border bg-card p-1 overflow-x-auto scrollbar-thin touch-scroll-x">
            <button
              type="button"
              onClick={(e) => {
                if (vista === "resumen") {
                  setSelectedDayKey("TODOS");
                  setVista("plan");
                } else {
                  setSelectedDayKey("TODOS");
                }
                e.currentTarget.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
              }}
              className={cn(
                "flex-1 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                isTodos && vista !== "resumen"
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              {t("todas")}
            </button>
            {tabsDias.map((tab) => {
              const isActive = !isTodos && tab.diaKeys.includes(selectedDayKey) && vista !== "resumen";
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={(e) => {
                    setSelectedDayKey(tab.key);
                    if (vista === "resumen") setVista("plan");
                    e.currentTarget.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
                  }}
                  className={cn(
                    "flex-1 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {anyTopButton && (
          <div className="flex items-center gap-2 shrink-0 order-3 sm:order-none">
            {showNuevaDietaButton && (
              <Link
                href={`/dietas/nuevo?pacienteId=${pacienteId}`}
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border hover:bg-muted transition-colors"
                title={t("crearNuevaDieta")}
              >
                <Plus className="w-4 h-4" />
              </Link>
            )}

            {showAsignarButton && (
              <button
                type="button"
                onClick={handleAsignarComoActual}
                disabled={!selectedPlan || selectedPlan.activo || isPendingAssign}
                className={cn(
                  "inline-flex items-center justify-center w-9 h-9 rounded-lg border transition-colors",
                  !selectedPlan || selectedPlan.activo || isPendingAssign
                    ? "border-border bg-muted/30 text-muted-foreground cursor-not-allowed"
                    : "border-border bg-card hover:bg-muted transition-colors"
                )}
                title={selectedPlan?.activo ? t("asignadaComoActual") : t("asignarComoActual")}
              >
                <Check className="w-4 h-4" />
              </button>
            )}

            {showPdfButton && (
              <Link
                href={selectedPlan ? `/dietas/${selectedPlan.id}` : "#"}
                onClick={(e) => {
                  if (!selectedPlan) e.preventDefault();
                }}
                className={cn(
                  "inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border hover:bg-muted transition-colors",
                  !selectedPlan && "pointer-events-none opacity-50"
                )}
                title={t("crearPdf")}
              >
                <FileDown className="w-4 h-4" />
              </Link>
            )}
          </div>
        )}

      </div>

      {/* #78 — Objetivos: del día seleccionado, o agrupados por planificación en "Todas". Solo desktop. */}
      {!ocultarCalorias && selectedPlan && (() => {
        const bloques = objetivosBarra.filter((b) => b.kcal != null || b.proteinas != null || b.carbohidratos != null || b.grasas != null);
        if (bloques.length === 0) return null;
        const chips = (b: ObjBarra) => (
          <>
            {b.kcal != null && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium">
                <Flame className="w-3 h-3" />{b.kcal} kcal
              </span>
            )}
            {b.proteinas != null && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium">
                {b.proteinas}g {t("macros.proteinas")}
              </span>
            )}
            {b.carbohidratos != null && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 font-medium">
                {b.carbohidratos}g {t("macros.carbos")}
              </span>
            )}
            {b.grasas != null && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 font-medium">
                {b.grasas}g {t("macros.grasas")}
              </span>
            )}
          </>
        );
        if (bloques.length === 1) {
          return (
            <div className="hidden sm:flex items-center gap-3 flex-wrap text-xs">
              <span className="font-semibold text-muted-foreground uppercase tracking-wide">{t("objetivos")}</span>
              {bloques[0].nombre && <span className="font-medium text-foreground">{bloques[0].nombre}</span>}
              {chips(bloques[0])}
            </div>
          );
        }
        return (
          <div className="hidden sm:block text-xs space-y-1.5">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-semibold text-muted-foreground uppercase tracking-wide">{t("objetivos")}</span>
            </div>
            {bloques.map((b, i) => (
              <div key={i} className="flex items-center gap-3 flex-wrap">
                <span className="text-muted-foreground min-w-[7rem]">
                  {b.nombre && <span className="font-medium text-foreground">{b.nombre}</span>}
                  {b.nombre && b.dias.length > 0 && " · "}
                  {b.dias.map((d) => t(`dias.${d}`).slice(0, 3)).join("·")}
                </span>
                {chips(b)}
              </div>
            ))}
          </div>
        );
      })()}

      {selectedPlan && totals ? (
        vista === "resumen" ? (
          <ResumenSemanal
            plan={selectedPlan}
            onSelectDay={(dayKey) => {
              setSelectedDayKey(dayKey);
              setVista("plan");
            }}
          />
        ) : vista === "plan" ? (
        <div className={cn("grid grid-cols-1 gap-4", !ocultarCalorias && "lg:grid-cols-[1fr_400px]")}>
            <div className="bg-card rounded-xl border border-border p-4">
              {showPlanSelector && (
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-muted-foreground mb-1.5">{t("dietaDelPaciente")}</p>
                    <div ref={planSelectWrapRef} className="relative">
                      <button
                        type="button"
                        onClick={() => setPlanSelectOpen((v) => !v)}
                        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-border/50 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="truncate font-semibold">{selectedPlan?.nombre || "—"}</span>
                          {!ocultarCalorias && selectedPlan?.caloriasObjetivo != null && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-medium shrink-0">
                              <Flame className="w-3 h-3" />{selectedPlan.caloriasObjetivo}
                            </span>
                          )}
                        </div>
                        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                      </button>
                      {planSelectOpen && (
                        <div className="absolute left-0 right-0 mt-1 z-50 bg-card border border-border rounded-lg shadow-lg overflow-y-auto max-h-64">
                          <button
                            type="button"
                            onClick={() => setPlanSelectOpen(false)}
                            className="w-full px-3 py-2 text-left flex items-center justify-between gap-2 hover:bg-muted/60 text-sm bg-primary/5"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="truncate">{selectedPlan.nombre}</span>
                              {!ocultarCalorias && selectedPlan.caloriasObjetivo != null && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"><Flame className="w-2.5 h-2.5 inline" /> {selectedPlan.caloriasObjetivo}</span>
                              )}
                            </div>
                            <Check className="w-4 h-4 text-primary shrink-0" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/dietas/${selectedPlan.id}`}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium shrink-0 self-end"
                  >
                    {t("abrir")}
                  </Link>
                </div>
              )}


              <div className="space-y-4">
                {esEditable && (
                  <div className="flex flex-wrap justify-end gap-2">
                    {/* #78-C — Puerta de entrada al reparto por comidas. Visible siempre (también en
                        móvil) y diciendo si está activo: si no se ve, para el nutri no existe. */}
                    {puedeEditarReparto && (
                      <button
                        type="button"
                        onClick={() => (repartoPanelAbierto ? setRepartoPanelAbierto(false) : abrirRepartoPanel())}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors",
                          repartoActivoAqui
                            ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/15"
                            : "border-border text-foreground hover:bg-muted"
                        )}
                      >
                        <Scale className="w-3.5 h-3.5" />
                        {repartoActivoAqui ? tDiets("reparto.botonActivo") : tDiets("reparto.boton")}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setImportOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {tDiets("copiar.importarDeOtroPlan")}
                    </button>
                  </div>
                )}
                {puedeEditarReparto && repartoPanelAbierto && (
                  <RepartoPanel
                    // `repartoDelDia` y no `repartoParaPlani` a secas: así el panel ve lo MISMO que el
                    // resto de la pantalla, incluido el reparto heredado de la planificación en las
                    // dietas anteriores a la feature. Con el otro decía "sin activar" mientras el
                    // botón decía "Reparto activo", y activarlo cambiaba todos los objetivos.
                    reparto={repartoDelDia(diaIdPanel)}
                    onChange={guardarRepartoPanel}
                    slots={repartoSlots}
                    slotActivo={repartoSlot}
                    onSlotChange={cambiarRepartoSlot}
                    dias={repartoDiasDelSlot}
                    // Mismos bloques que las pestañas de arriba: los días juntados van como uno.
                    gruposDia={tabsDias.map((tb) => ({ label: tb.label, dias: tb.diaKeys }))}
                    diaVisto={repartoDiaVisto || repartoDiasDelSlot[0]?.dia || ""}
                    onDiaVistoChange={cambiarRepartoDiaVisto}
                    objetivoDia={objetivoDelDia(diaIdPanel)}
                    onAnadirComida={handleAgregarComidaDia}
                    onCerrar={() => setRepartoPanelAbierto(false)}
                  />
                )}
                {esEditable && portapapeles && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-primary/40 bg-primary/5 text-sm">
                    <ClipboardPaste className="w-4 h-4 text-primary shrink-0" />
                    <span className="min-w-0 flex-1 truncate">
                      <span className="text-muted-foreground">{tDiets("copiar.enPortapapeles")} </span>
                      <span className="font-medium">{portapapeles.nombre}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setPortapapeles(null)}
                      className="text-xs font-medium text-muted-foreground hover:text-foreground shrink-0"
                    >
                      {tDiets("copiar.cancelarCopia")}
                    </button>
                  </div>
                )}
                {diasVisible.length > 0 ? (
                  isTodos ? (
                    bloquesDias.map((bloque) => (
                      <div key={bloque.key}>
                        <div className="flex items-center justify-between mb-3 gap-2">
                          <h2 className="text-base font-semibold text-foreground flex items-center gap-2 min-w-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                            <span className="truncate">{bloque.dias.map((d) => t(`dias.${d.dia}`)).join(" · ")}</span>
                          </h2>
                          {esEditable && (
                            <div className="flex items-center gap-1.5 shrink-0">
                              {planificaciones.length >= 2 && (
                                <select
                                  value={planiDelDia(bloque.representante.id)}
                                  onChange={(e) => handleAsignarPlani(bloque.dias.map((d) => d.id), e.target.value || null)}
                                  disabled={isPendingCopia}
                                  title={tDiets("copiar.planificacionDia")}
                                  className="px-2.5 py-1 rounded-lg border border-border bg-background text-xs text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                                >
                                  <option value="">{tDiets("copiar.sinPlani")}</option>
                                  {planificaciones.map((p) => (
                                    <option key={p.id} value={p.id}>{p.nombre}</option>
                                  ))}
                                </select>
                              )}
                              {bloque.dias.length > 1 ? (
                                <button
                                  type="button"
                                  disabled={isPendingCopia}
                                  onClick={() => handleSepararClick(bloque.dias)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-primary hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Unlink className="w-3.5 h-3.5" />
                                  {tDiets("copiar.separarGrupo")}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={isPendingCopia}
                                  onClick={() => setJuntarModal({ origenId: bloque.representante.id, origenLabel: t(`dias.${bloque.representante.dia}`) })}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-primary hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Link2 className="w-3.5 h-3.5" />
                                  {tDiets("copiar.juntarCon")}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleCopiarDia(bloque.representante.id, bloque.representante.dia)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                              >
                                <Copy className="w-3.5 h-3.5" />
                                {tDiets("copiar.copiarDia")}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAgregarComidaDia(bloque.representante.id)}
                                disabled={isPendingCopia}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-primary hover:bg-muted transition-colors disabled:opacity-50"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                {tDiets("editor.anadirComidaDia")}
                              </button>
                            </div>
                          )}
                        </div>
                        <PlanEditor
                          showHeader={false}
                          compactHeader
                          showDayHeader={false}
                          showAnalisis={false}
                          readOnly={readOnly}
                          interactionMode={interactionMode}
                          ocultarCalorias={ocultarCalorias}
                          localCallbacks={localCallbacks}
                          onCopiarComida={esEditable ? handleCopiarComida : undefined}
                          onCopiarAlimento={esEditable ? handleCopiarAlimento : undefined}
                          pegarAlimentoLabel={esEditable ? (portapapeles?.nombre ?? null) : null}
                          onPegarAlimento={esEditable ? handlePegarAlimento : undefined}
                          planId={selectedPlan.id}
                          planNombre={selectedPlan.nombre}
                          dias={[conComidasNuevas(bloque.representante) as any]}
                          objetivos={{
                            calorias: selectedPlan.caloriasObjetivo ?? undefined,
                            proteinas: selectedPlan.proteinasObjetivo ?? undefined,
                            carbohidratos: selectedPlan.carbohidratosObjetivo ?? undefined,
                            grasas: selectedPlan.grasasObjetivo ?? undefined,
                          }}
                          objetivosComida={objetivosComidaDia(bloque.representante.id)}
                          onAnadirComidaAlReparto={
                            esEditable
                              ? (comidaId) => handleAnadirComidaAlReparto(comidaId, bloque.representante.id)
                              : undefined
                          }
                        />
                      </div>
                    ))
                  ) : (
                    <div>
                      {esEditable && diasVisible[0] && (
                        <div className="flex items-center justify-end gap-2 mb-3">
                          <div className="flex items-center gap-1.5 shrink-0">
                            {planificaciones.length >= 2 && (
                              <select
                                value={planiDelDia(diasVisible[0].id)}
                                onChange={(e) => {
                                  const g = grupoEfectivo(diasVisible[0]);
                                  const ids = g ? (selectedPlan?.dias ?? []).filter((d) => grupoEfectivo(d) === g).map((d) => d.id) : [diasVisible[0].id];
                                  handleAsignarPlani(ids, e.target.value || null);
                                }}
                                disabled={isPendingCopia}
                                title={tDiets("copiar.planificacionDia")}
                                className="px-2.5 py-1 rounded-lg border border-border bg-background text-xs text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                              >
                                <option value="">{tDiets("copiar.sinPlani")}</option>
                                {planificaciones.map((p) => (
                                  <option key={p.id} value={p.id}>{p.nombre}</option>
                                ))}
                              </select>
                            )}
                            {grupoEfectivo(diasVisible[0]) ? (
                              <button
                                type="button"
                                disabled={isPendingCopia}
                                onClick={() => handleSepararClick((selectedPlan?.dias ?? []).filter((d) => grupoEfectivo(d) && grupoEfectivo(d) === grupoEfectivo(diasVisible[0])))}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-primary hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Unlink className="w-3.5 h-3.5" />
                                {tDiets("copiar.separarGrupo")}
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={isPendingCopia}
                                onClick={() => setJuntarModal({ origenId: diasVisible[0].id, origenLabel: t(`dias.${diasVisible[0].dia}`) })}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-primary hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Link2 className="w-3.5 h-3.5" />
                                {tDiets("copiar.juntarCon")}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleCopiarDia(diasVisible[0].id, diasVisible[0].dia)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              {tDiets("copiar.copiarDia")}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAgregarComidaDia(diasVisible[0].id)}
                              disabled={isPendingCopia}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-primary hover:bg-muted transition-colors disabled:opacity-50"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              {tDiets("editor.anadirComidaDia")}
                            </button>
                          </div>
                        </div>
                      )}
                      <PlanEditor
                        showHeader={false}
                        compactHeader
                        showDayHeader={false}
                        showAnalisis={false}
                        readOnly={readOnly}
                        interactionMode={interactionMode}
                        ocultarCalorias={ocultarCalorias}
                        localCallbacks={localCallbacks}
                        onCopiarComida={esEditable ? handleCopiarComida : undefined}
                        onCopiarAlimento={esEditable ? handleCopiarAlimento : undefined}
                        pegarAlimentoLabel={esEditable ? (portapapeles?.nombre ?? null) : null}
                        onPegarAlimento={esEditable ? handlePegarAlimento : undefined}
                        planId={selectedPlan.id}
                        planNombre={selectedPlan.nombre}
                        dias={[conComidasNuevas(diasVisible[0]) as any]}
                        objetivos={{
                          calorias: selectedPlan.caloriasObjetivo ?? undefined,
                          proteinas: selectedPlan.proteinasObjetivo ?? undefined,
                          carbohidratos: selectedPlan.carbohidratosObjetivo ?? undefined,
                          grasas: selectedPlan.grasasObjetivo ?? undefined,
                        }}
                        objetivosComida={objetivosComidaDia(diasVisible[0].id)}
                        onAnadirComidaAlReparto={
                          esEditable
                            ? (comidaId) => handleAnadirComidaAlReparto(comidaId, diasVisible[0].id)
                            : undefined
                        }
                      />
                    </div>
                  )
                ) : (
                  <div className="text-sm text-muted-foreground">{t("sinDias")}</div>
                )}
              </div>

              {esEditable && (
                <>
                  <CopiarADiasModal
                    open={!!copiaModal}
                    onClose={() => setCopiaModal(null)}
                    titulo={copiaModal?.titulo ?? ""}
                    subtitulo={copiaModal?.subtitulo}
                    dias={diasOptions}
                    excluirDiaId={copiaModal?.excluirDiaId}
                    tipoOrigen={copiaModal?.tipoOrigen}
                    tipoDestinoInicial={copiaModal?.tipoOrigen}
                    tiposComida={copiaModal?.conTipoDestino ? tiposComidaOpciones : undefined}
                    pending={isPendingCopia}
                    onConfirm={handleConfirmCopia}
                  />
                  <CopiarADiasModal
                    open={!!juntarModal}
                    onClose={() => setJuntarModal(null)}
                    titulo={tDiets("copiar.juntarTitulo")}
                    subtitulo={juntarModal ? tDiets("copiar.juntarSubtitulo", { dia: juntarModal.origenLabel }) : undefined}
                    dias={diasOptions}
                    excluirDiaId={juntarModal?.origenId}
                    mostrarModo={false}
                    confirmLabel={tDiets("copiar.juntarConfirmar")}
                    pending={isPendingCopia}
                    onConfirm={(ids) => handleConfirmJuntar(ids)}
                  />
                  <CopiarADiasModal
                    open={!!separarModal}
                    onClose={() => setSepararModal(null)}
                    titulo={tDiets("copiar.separarTitulo")}
                    subtitulo={tDiets("copiar.separarSubtitulo")}
                    tituloDias={tDiets("copiar.diasDelGrupo")}
                    dias={(separarModal?.grupoDias ?? []).map((d) => ({ id: d.id, key: d.dia, label: t(`dias.${d.dia}`) }))}
                    mostrarModo={false}
                    confirmLabel={tDiets("copiar.separarGrupo")}
                    pending={isPendingCopia}
                    onConfirm={(ids) => handleSepararDias(ids)}
                  />
                  <ImportarPlanModal
                    open={importOpen}
                    onClose={() => setImportOpen(false)}
                    pacienteActualId={pacienteId}
                    pacienteActualNombre={pacienteNombre}
                    planActualId={plan.id}
                    diasDelPlanActual={diasOptions}
                    onImported={() => {
                      router.refresh();
                      toast.success(tDiets("copiar.toastImportado"));
                    }}
                  />
                  {/* #78-C — Cambiar la planificación de un día puede dejar comidas fuera de lo
                      previsto. Se listan con lo que tienen dentro y el nutri decide: nunca se borra
                      nada por iniciativa propia (eliminarComida borra en cascada y no hay vuelta). */}
                  {cambioPlaniModal && (
                    <div
                      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
                      onClick={() => setCambioPlaniModal(null)}
                    >
                      <div
                        className="bg-card rounded-xl border border-border shadow-xl w-full max-w-md p-5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <h3 className="text-lg font-semibold mb-2">{tDiets("reparto.cambioPlaniTitulo")}</h3>
                        <p className="text-sm text-muted-foreground">
                          {tDiets("reparto.cambioPlaniTexto", {
                            plani:
                              planificaciones.find((p) => p.id === cambioPlaniModal.planiId)?.nombre ??
                              tDiets("copiar.sinPlani"),
                          })}
                        </p>
                        <ul className="mt-3 space-y-1 text-sm">
                          {cambioPlaniModal.sobran.map((c) => (
                            <li key={c.id} className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                              <span className="font-medium">{c.etiqueta}</span>
                              {c.alimentos > 0 && (
                                <span className="text-xs text-amber-600 dark:text-amber-400">
                                  {tDiets("reparto.conAlimentos", { n: c.alimentos })}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                        <div className="flex flex-wrap justify-end gap-2 mt-5">
                          <button
                            type="button"
                            onClick={() => setCambioPlaniModal(null)}
                            className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                          >
                            {tDiets("copiar.cancelar")}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const m = cambioPlaniModal;
                              setCambioPlaniModal(null);
                              aplicarAsignarPlani(m.diaIds, m.planiId, m.sobran.map((c) => c.id));
                            }}
                            className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
                          >
                            {tDiets("reparto.quitarlas")}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const m = cambioPlaniModal;
                              setCambioPlaniModal(null);
                              aplicarAsignarPlani(m.diaIds, m.planiId, []);
                            }}
                            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                          >
                            {tDiets("reparto.mantenerlas")}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  {/* #104 Fase 2 — modal para añadir una comida (nombre + hora). */}
                  {nuevaComidaModal && (
                    <div
                      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
                      onClick={() => setNuevaComidaModal(null)}
                    >
                      <div
                        className="bg-card rounded-xl border border-border shadow-xl w-full max-w-sm p-5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <h3 className="text-lg font-semibold mb-4">{tDiets("editor.anadirComidaDia")}</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">
                              {tDiets("editor.nombreComidaLabel")}
                            </label>
                            <input
                              autoFocus
                              value={nuevaComidaNombre}
                              onChange={(e) => setNuevaComidaNombre(e.target.value)}
                              maxLength={60}
                              placeholder={tDiets("editor.nombreComidaPlaceholder")}
                              onKeyDown={(e) => { if (e.key === "Enter") confirmarNuevaComida(); }}
                              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">
                              {tDiets("editor.horaComidaLabel")}
                            </label>
                            <HoraSelect value={nuevaComidaHora} onChange={setNuevaComidaHora} />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-5">
                          <button
                            type="button"
                            onClick={() => setNuevaComidaModal(null)}
                            className="px-4 py-2 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
                          >
                            {tDiets("copiar.cancelar")}
                          </button>
                          <button
                            type="button"
                            onClick={confirmarNuevaComida}
                            disabled={isPendingCopia}
                            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                          >
                            {isPendingCopia ? tDiets("copiar.copiando") : tDiets("editor.anadirComida")}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {!ocultarCalorias && (
            <div className="space-y-4">
            <div className="bg-card rounded-xl border border-border p-5">
              <h4 className="text-base font-semibold mb-4">{t("analisisGlobal")}</h4>

              {(() => {
                const calObj = selectedPlan.caloriasObjetivo;
                const calActual = totals.macros.calorias;
                const overCal = calObj != null && calActual > calObj;
                const calPct = calObj != null ? Math.min(100, (calActual / calObj) * 100) : Math.min(100, (calActual / (calActual * 1.15 || 1)) * 100);
                return (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-foreground font-medium flex items-center gap-1.5"><Flame className="w-3.5 h-3.5" /> {t("energia")}</span>
                      <span className="font-bold tabular-nums text-sm">
                        <span className={overCal ? "text-red-500" : ""}>{Math.round(calActual)}</span>
                        {calObj != null ? <span className="text-muted-foreground font-normal text-xs"> / {calObj} kcal</span> : <span className="text-muted-foreground font-normal text-xs"> kcal</span>}
                      </span>
                    </div>
                    <div className="h-3 bg-purple-100/60 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${calPct}%`, background: overCal ? "#ef4444" : "#d8b4fe" }} />
                    </div>
                  </div>
                );
              })()}

              {(() => {
                const energySinFibra = totals.energy.grasasKcal + totals.energy.carbKcal + totals.energy.protKcal || 1;
                const pieData = [
                  { name: t("macros.grasa"), value: totals.energy.grasasKcal, color: MACRO_COLORS.grasas, actualG: totals.macros.grasas, actualKcal: Math.round(totals.energy.grasasKcal), pctActual: Math.round((totals.energy.grasasKcal / energySinFibra) * 100), planG: selectedPlan.grasasObjetivo, planKcal: selectedPlan.grasasObjetivo ? Math.round(selectedPlan.grasasObjetivo * 9) : null, pctPlan: selectedPlan.grasasObjetivo && selectedPlan.caloriasObjetivo ? Math.round((selectedPlan.grasasObjetivo * 9 / selectedPlan.caloriasObjetivo) * 100) : null },
                  { name: t("macros.hidratos"), value: totals.energy.carbKcal, color: MACRO_COLORS.carbohidratos, actualG: totals.macros.carbohidratos, actualKcal: Math.round(totals.energy.carbKcal), pctActual: Math.round((totals.energy.carbKcal / energySinFibra) * 100), planG: selectedPlan.carbohidratosObjetivo, planKcal: selectedPlan.carbohidratosObjetivo ? Math.round(selectedPlan.carbohidratosObjetivo * 4) : null, pctPlan: selectedPlan.carbohidratosObjetivo && selectedPlan.caloriasObjetivo ? Math.round((selectedPlan.carbohidratosObjetivo * 4 / selectedPlan.caloriasObjetivo) * 100) : null },
                  { name: t("macros.proteina"), value: totals.energy.protKcal, color: MACRO_COLORS.proteinas, actualG: totals.macros.proteinas, actualKcal: Math.round(totals.energy.protKcal), pctActual: Math.round((totals.energy.protKcal / energySinFibra) * 100), planG: selectedPlan.proteinasObjetivo, planKcal: selectedPlan.proteinasObjetivo ? Math.round(selectedPlan.proteinasObjetivo * 4) : null, pctPlan: selectedPlan.proteinasObjetivo && selectedPlan.caloriasObjetivo ? Math.round((selectedPlan.proteinasObjetivo * 4 / selectedPlan.caloriasObjetivo) * 100) : null },
                ];
                return (
              <div className="flex items-start gap-4">
                <div className="w-[150px] h-[150px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart onMouseLeave={() => setHoveredMacro(null)}>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        innerRadius={65}
                        outerRadius={72}
                        paddingAngle={1}
                        startAngle={90}
                        endAngle={-270}
                        isAnimationActive={false}
                        style={{ pointerEvents: "none" }}
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={`outer-${i}`} fill={entry.color} opacity={0.2} style={{ pointerEvents: "none" }} />
                        ))}
                      </Pie>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        innerRadius={18}
                        outerRadius={58}
                        paddingAngle={2}
                        startAngle={90}
                        endAngle={-270}
                        activeShape={(props: any) => {
                          const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
                          return <Sector cx={cx} cy={cy} innerRadius={innerRadius - 2} outerRadius={outerRadius + 3} startAngle={startAngle} endAngle={endAngle} fill={fill} />;
                        }}
                        onMouseEnter={(_: any, index: number) => setHoveredMacro(index)}
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} opacity={hoveredMacro === null ? 1 : hoveredMacro === i ? 1 : 0.25} />
                        ))}
                      </Pie>
                      <Tooltip
                        position={{ x: -30, y: 140 }}
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          const d = payload[0].payload;
                          return (
                            <div className="bg-card border border-border/30 rounded-2xl shadow-xl py-2.5 px-4 text-xs whitespace-nowrap space-y-1.5">
                              <div className="flex items-center gap-2.5">
                                <span className="w-5 h-5 rounded-full border-2 shrink-0" style={{ borderColor: d.color }} />
                                <span className="font-semibold px-2 py-0.5 rounded-full text-[11px]" style={{ color: d.color, background: d.color + "22" }}>{t("actual")}</span>
                                <span className="tabular-nums font-semibold">{d.pctActual}%</span>
                                <span className="tabular-nums">{d.actualKcal} kcal</span>
                                <span className="tabular-nums">{Math.round(d.actualG)} g</span>
                              </div>
                              {d.planG != null && (
                                <div className="flex items-center gap-2.5">
                                  <span className="w-5 h-5 rounded-full border-2 opacity-30 shrink-0" style={{ borderColor: d.color }} />
                                  <span className="font-semibold text-muted-foreground text-[11px]">{t("planeado")}</span>
                                  <span className="tabular-nums font-semibold text-muted-foreground">{d.pctPlan ?? "—"}%</span>
                                  <span className="tabular-nums text-muted-foreground">{d.planKcal ?? "—"} kcal</span>
                                  <span className="tabular-nums text-muted-foreground">{d.planG} g</span>
                                </div>
                              )}
                            </div>
                          );
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex-1 space-y-3 pt-1">
                  {[
                    { key: "grasas", label: t("macros.grasa"), value: totals.macros.grasas, kcal: totals.energy.grasasKcal, color: MACRO_COLORS.grasas, bgColor: "bg-yellow-50 dark:bg-yellow-500/10", objetivo: selectedPlan.grasasObjetivo },
                    { key: "carbohidratos", label: t("macros.hCarbono"), value: totals.macros.carbohidratos, kcal: totals.energy.carbKcal, color: MACRO_COLORS.carbohidratos, bgColor: "bg-orange-50 dark:bg-orange-500/10", objetivo: selectedPlan.carbohidratosObjetivo },
                    { key: "proteinas", label: t("macros.proteina"), value: totals.macros.proteinas, kcal: totals.energy.protKcal, color: MACRO_COLORS.proteinas, bgColor: "bg-blue-50 dark:bg-blue-500/10", objetivo: selectedPlan.proteinasObjetivo },
                    { key: "fibra", label: t("macros.fibra"), value: totals.macros.fibra, kcal: totals.energy.fibraKcal, color: MACRO_COLORS.fibra, bgColor: "bg-emerald-50 dark:bg-emerald-500/10", objetivo: null },
                  ].map((row, rowIdx) => {
                    const hasObj = row.objetivo != null && row.objetivo > 0;
                    const overObj = hasObj && row.value > row.objetivo!;
                    const barPct = hasObj
                      ? Math.min(100, (row.value / row.objetivo!) * 100)
                      : (row.kcal / totals.energy.energyTotal) * 100;
                    return (
                      <div key={row.key} style={{ transition: "opacity 0.2s", opacity: hoveredMacro === null ? 1 : hoveredMacro === rowIdx ? 1 : 0.25 }}>
                        <div className="flex items-center justify-between gap-2 text-xs mb-0.5">
                          <span className="text-foreground font-medium flex items-center gap-1.5 whitespace-nowrap">
                            {row.key === "grasas" && <Droplets className="w-3 h-3" />}
                            {row.key === "carbohidratos" && <Circle className="w-3 h-3" />}
                            {row.key === "proteinas" && <Diamond className="w-3 h-3" />}
                            {row.key === "fibra" && <Triangle className="w-3 h-3" />}
                            {row.label}
                          </span>
                          <span className="font-bold tabular-nums whitespace-nowrap">
                            <span className={overObj ? "text-red-500" : ""}>{row.value.toFixed(1)}</span>
                            {hasObj ? <span className="text-muted-foreground font-normal"> / {row.objetivo} g</span> : <span> g</span>}
                          </span>
                        </div>
                        <div className={`h-3 ${row.bgColor} rounded-full overflow-hidden`}>
                          <div className="h-full rounded-full" style={{ width: `${barPct}%`, background: overObj ? "#ef4444" : row.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
                );
              })()}
            </div>

            {(() => {
              const meals = totals.comidasMacros.filter(
                (c) => c.grasasKcal + c.carbKcal + c.protKcal > 0
              );
              const VISIBLE = 4;
              const offset = comidaChartOffset;
              const setOffset = setComidaChartOffset;
              const canPrev = offset > 0;
              const canNext = offset + VISIBLE < meals.length;
              const visible = meals.slice(offset, offset + VISIBLE);

              return meals.length > 0 ? (
                <div className="bg-card rounded-xl border border-border p-4 mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold">{t("comidas.titulo")}</h4>
                    {meals.length > VISIBLE && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setOffset(Math.max(0, offset - 1))}
                          disabled={!canPrev}
                          className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-20 transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setOffset(Math.min(meals.length - VISIBLE, offset + 1))}
                          disabled={!canNext}
                          className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-20 transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="grid" style={{ gridTemplateColumns: `repeat(${Math.min(visible.length, VISIBLE)}, 1fr)` }}>
                    {visible.map((meal) => (
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
                              <span className="font-semibold px-2 py-0.5 rounded-full" style={{ color: MACRO_COLORS.grasas, background: MACRO_COLORS.grasas + "22" }}>{t("macros.grasa")}</span>
                              <span className="tabular-nums text-right">{meal.grasasKcal} kcal</span>
                              <span className="tabular-nums text-right">{meal.grasasPct}%</span>
                              <span className="tabular-nums text-right">{meal.grasasG} g</span>

                              <span className="font-semibold px-2 py-0.5 rounded-full" style={{ color: MACRO_COLORS.carbohidratos, background: MACRO_COLORS.carbohidratos + "22" }}>{t("macros.hCarbono")}</span>
                              <span className="tabular-nums text-right">{meal.carbKcal} kcal</span>
                              <span className="tabular-nums text-right">{meal.carbPct}%</span>
                              <span className="tabular-nums text-right">{meal.carbG} g</span>

                              <span className="font-semibold px-2 py-0.5 rounded-full" style={{ color: MACRO_COLORS.proteinas, background: MACRO_COLORS.proteinas + "22" }}>{t("macros.proteina")}</span>
                              <span className="tabular-nums text-right">{meal.protKcal} kcal</span>
                              <span className="tabular-nums text-right">{meal.protPct}%</span>
                              <span className="tabular-nums text-right">{meal.protG} g</span>
                            </div>
                            <div className="flex items-center gap-3 pt-2 mt-2 border-t border-border/30">
                              <span className="font-semibold text-muted-foreground">{t("energia")}</span>
                              <span className="tabular-nums font-semibold">{meal.calTotal} kcal</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null;
            })()}

            <div className="bg-card rounded-xl border border-border p-4 mt-4">
              <div className="flex items-center justify-center mb-3">
                <span className="text-xs font-semibold text-muted-foreground border border-border rounded-full px-3 py-1">
                  ↑ DDR
                </span>
              </div>
              <div className="space-y-0">
                {[
                  { key: "acidoPantotenico", labelKey: "micro.acidoPantotenico", ddr: 5, unit: "mg" },
                  { key: "calcio", labelKey: "micro.calcio", ddr: 1000, unit: "mg" },
                  { key: "cinc", labelKey: "micro.cinc", ddr: 8, unit: "mg" },
                  { key: "cobre", labelKey: "micro.cobre", ddr: 0.9, unit: "mg" },
                  { key: "colina", labelKey: "micro.colina", ddr: 425, unit: "mg" },
                  { key: "fluor", labelKey: "micro.fluor", ddr: 3000, unit: "ug" },
                  { key: "folato", labelKey: "micro.folato", ddr: 400, unit: "ug" },
                  { key: "fosforo", labelKey: "micro.fosforo", ddr: 700, unit: "mg" },
                  { key: "hierro", labelKey: "micro.hierro", ddr: 18, unit: "mg" },
                  { key: "magnesio", labelKey: "micro.magnesio", ddr: 320, unit: "mg" },
                  { key: "manganeso", labelKey: "micro.manganeso", ddr: 1.8, unit: "mg" },
                  { key: "niacina", labelKey: "micro.niacina", ddr: 14, unit: "mg" },
                  { key: "potasio", labelKey: "micro.potasio", ddr: 4700, unit: "mg" },
                  { key: "riboflavina", labelKey: "micro.riboflavina", ddr: 1.1, unit: "mg" },
                  { key: "selenio", labelKey: "micro.selenio", ddr: 55, unit: "ug" },
                  { key: "sodio", labelKey: "micro.sodio", ddr: 1500, unit: "mg" },
                  { key: "tiamina", labelKey: "micro.tiamina", ddr: 1.1, unit: "mg" },
                  { key: "vitaminaA", labelKey: "micro.vitaminaA", ddr: 700, unit: "ug" },
                  { key: "vitaminaB12", labelKey: "micro.vitaminaB12", ddr: 2.4, unit: "ug" },
                  { key: "vitaminaB6", labelKey: "micro.vitaminaB6", ddr: 1.3, unit: "mg" },
                  { key: "vitaminaC", labelKey: "micro.vitaminaC", ddr: 75, unit: "mg" },
                  { key: "vitaminaD", labelKey: "micro.vitaminaD", ddr: 15, unit: "ug" },
                  { key: "vitaminaE", labelKey: "micro.vitaminaE", ddr: 15, unit: "mg" },
                  { key: "vitaminaK", labelKey: "micro.vitaminaK", ddr: 90, unit: "ug" },
                ].map((row) => {
                  const actual = totals.micro[row.key] || 0;
                  const pct = row.ddr > 0 ? Math.min((actual / row.ddr) * 100, 200) : 0;
                  return (
                    <div
                      key={row.key}
                      className="flex items-center gap-1.5 px-2 py-2.5 border-b border-border/40 last:border-0"
                    >
                      <span className="text-xs text-muted-foreground w-20 shrink-0">{t(row.labelKey)}</span>
                      <span className="text-xs font-bold tabular-nums w-10 text-right shrink-0">
                        {actual.toFixed(1)}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0 w-16">
                        / {row.ddr} {row.unit}
                      </span>
                      <div className="flex-1 relative h-2.5 bg-muted/40 rounded-full overflow-hidden">
                        <div className="absolute left-1/2 top-0 h-full w-px border-l border-dashed border-muted-foreground/30 z-10" />
                        <div
                          className="h-full rounded-full bg-primary/70"
                          style={{ width: `${Math.min(pct / 2, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {isTodos && (
              <p className="hidden sm:block text-xs italic text-muted-foreground text-center">
                {t("mediaDiaria")}
              </p>
            )}
            </div>
            )}
          </div>
        ) : (
          (() => {
            const calObj = selectedPlan.caloriasObjetivo;
            const protObj = selectedPlan.proteinasObjetivo;
            const carbObj = selectedPlan.carbohidratosObjetivo;
            const grasObj = selectedPlan.grasasObjetivo;

            const MEAL_COLORS = ["#60a5fa","#93c5fd","#fdba74","#fbbf24","#fde68a","#d9f99d"];
            const mealsWithEnergy = totals.comidasMacros.filter(c => c.calTotal > 0);
            const mealsWithProtein = totals.comidasMacros.filter(c => c.protG > 0);

            const energySinFibra = totals.energy.grasasKcal + totals.energy.carbKcal + totals.energy.protKcal || 1;
            const macroPieData = [
              { name: t("macros.grasa"), value: totals.energy.grasasKcal, color: MACRO_COLORS.grasas },
              { name: t("macros.hidratos"), value: totals.energy.carbKcal, color: MACRO_COLORS.carbohidratos },
              { name: t("macros.proteina"), value: totals.energy.protKcal, color: MACRO_COLORS.proteinas },
            ];

            const CATEGORIA_LABELS: Record<string, string> = {
              FRUTAS: t("categorias.FRUTAS"), VERDURAS: t("categorias.VERDURAS"), CEREALES: t("categorias.CEREALES"),
              LEGUMBRES: t("categorias.LEGUMBRES"), CARNES: t("categorias.CARNES"), PESCADOS: t("categorias.PESCADOS"),
              LACTEOS: t("categorias.LACTEOS"), HUEVOS: t("categorias.HUEVOS"), FRUTOS_SECOS: t("categorias.FRUTOS_SECOS"),
              ACEITES: t("categorias.ACEITES"), BEBIDAS: t("categorias.BEBIDAS"), CONDIMENTOS: t("categorias.CONDIMENTOS"),
              DULCES: t("categorias.DULCES"), PANADERIA: t("categorias.PANADERIA"), OTROS: t("categorias.OTROS"),
            };
            const CAT_COLORS = ["#93c5fd","#bfdbfe","#fbbf24","#fde68a","#10b981","#6ee7b7","#c4b5fd","#fdba74","#f9a8d4","#86efac","#67e8f9","#a78bfa","#fb923c","#fca5a5"];
            const catMap = new Map<string, number>();
            if (diaVista) {
              for (const comida of diaVista.comidas) {
                for (const item of comida.alimentos) {
                  const cat = (item.alimento as Record<string, unknown> | null)?.categoria as string | undefined;
                  if (cat) {
                    catMap.set(cat, (catMap.get(cat) || 0) + 1);
                  }
                }
              }
            }
            const catPieData = Array.from(catMap.entries())
              .map(([cat, count], i) => ({ name: CATEGORIA_LABELS[cat] || cat, value: count, color: CAT_COLORS[i % CAT_COLORS.length] }))
              .sort((a, b) => b.value - a.value);

            const TIPO_LABELS_TABLE: Record<string, string> = {
              DESAYUNO: t("comidas.DESAYUNO"), MEDIA_MANANA: t("comidas.MEDIA_MANANA"), ALMUERZO: t("comidas.ALMUERZO"),
              MERIENDA: t("comidas.MERIENDA"), CENA: t("comidas.CENA"), RECENA: t("comidas.RECENA"),
            };
            type FoodRow = {
              nombre: string; calorias: number; comida: string;
              itemCalorias: number; itemProteinas: number; itemCarbohidratos: number; itemGrasas: number; itemFibra: number;
              cantidad: number; unidad: string; porcion?: number;
              esReceta?: boolean; esPropio?: boolean; href?: string;
              recetaIngredientes?: { nombre: string; cantidad: number; unidad: string }[];
              recetaDescripcion?: string | null; recetaPorciones?: number;
              imagenUrl?: string | null;
            };
            const allFoods: FoodRow[] = [];
            if (diaVista) {
              for (const comida of diaVista.comidas) {
                for (const item of comida.alimentos) {
                  if (item.alimento) {
                    const kcal = Math.round((item.alimento.calorias * convertirAGramos(item.cantidad, item.unidad, item.alimento.porcion || 100)) / 100);
                    allFoods.push({
                      nombre: item.nombrePersonalizado || item.alimento.nombre, calorias: kcal, comida: TIPO_LABELS_TABLE[comida.tipo] || comida.tipo,
                      itemCalorias: item.alimento.calorias, itemProteinas: item.alimento.proteinas, itemCarbohidratos: item.alimento.carbohidratos, itemGrasas: item.alimento.grasas, itemFibra: item.alimento.fibra,
                      cantidad: item.cantidad, unidad: item.unidad, porcion: item.alimento.porcion,
                      esPropio: item.alimento.esPropio,
                      imagenUrl: item.alimento.imagenUrl,
                      href: interactionMode === "dashboard" ? `/alimentos/${item.alimento.id}?cantidad=${Math.round(convertirAGramos(item.cantidad, item.unidad, item.alimento.porcion || 100))}` : undefined,
                    });
                  } else if (item.receta) {
                    const kcal = Math.round(item.receta.calorias * item.cantidad);
                    allFoods.push({
                      nombre: item.nombrePersonalizado || item.receta.nombre, calorias: kcal, comida: TIPO_LABELS_TABLE[comida.tipo] || comida.tipo,
                      itemCalorias: item.receta.calorias, itemProteinas: item.receta.proteinas, itemCarbohidratos: item.receta.carbohidratos, itemGrasas: item.receta.grasas, itemFibra: item.receta.fibra,
                      cantidad: item.cantidad, unidad: item.unidad,
                      esReceta: true, esPropio: item.receta.esPropio,
                      recetaIngredientes: item.receta.ingredientes, recetaDescripcion: item.receta.descripcion, recetaPorciones: item.receta.porciones,
                      href: interactionMode === "dashboard" ? `/recetas/${item.receta.id}?porciones=${item.cantidad}` : undefined,
                    });
                  }
                }
              }
            }
            allFoods.sort((a, b) => b.calorias - a.calorias);
            const FOODS_PER_PAGE = 6;
            const foodPages = Math.max(1, Math.ceil(allFoods.length / FOODS_PER_PAGE));
            const foodsVisible = allFoods.slice(foodTablePage * FOODS_PER_PAGE, (foodTablePage + 1) * FOODS_PER_PAGE);

            const DDR_TABLE = [
              { key: "acidoPantotenico", labelKey: "micro.acidoPantotenico" as const, ddr: 5, unit: "mg" },
              { key: "calcio", labelKey: "micro.calcio" as const, ddr: 1000, unit: "mg" },
              { key: "cinc", labelKey: "micro.cinc" as const, ddr: 8, unit: "mg" },
              { key: "cobre", labelKey: "micro.cobre" as const, ddr: 0.9, unit: "mg" },
              { key: "colina", labelKey: "micro.colina" as const, ddr: 425, unit: "mg" },
              { key: "fluor", labelKey: "micro.fluor" as const, ddr: 3000, unit: "ug" },
              { key: "folato", labelKey: "micro.folato" as const, ddr: 400, unit: "ug" },
              { key: "fosforo", labelKey: "micro.fosforo" as const, ddr: 700, unit: "mg" },
              { key: "hierro", labelKey: "micro.hierro" as const, ddr: 18, unit: "mg" },
              { key: "magnesio", labelKey: "micro.magnesio" as const, ddr: 320, unit: "mg" },
              { key: "manganeso", labelKey: "micro.manganeso" as const, ddr: 1.8, unit: "mg" },
              { key: "niacina", labelKey: "micro.niacina" as const, ddr: 14, unit: "mg" },
              { key: "potasio", labelKey: "micro.potasio" as const, ddr: 4700, unit: "mg" },
              { key: "riboflavina", labelKey: "micro.riboflavina" as const, ddr: 1.1, unit: "mg" },
              { key: "selenio", labelKey: "micro.selenio" as const, ddr: 55, unit: "ug" },
              { key: "sodio", labelKey: "micro.sodio" as const, ddr: 1500, unit: "mg" },
              { key: "tiamina", labelKey: "micro.tiamina" as const, ddr: 1.1, unit: "mg" },
              { key: "vitaminaA", labelKey: "micro.vitaminaA" as const, ddr: 700, unit: "ug" },
              { key: "vitaminaB12", labelKey: "micro.vitaminaB12" as const, ddr: 2.4, unit: "ug" },
              { key: "vitaminaB6", labelKey: "micro.vitaminaB6" as const, ddr: 1.3, unit: "mg" },
              { key: "vitaminaC", labelKey: "micro.vitaminaC" as const, ddr: 75, unit: "mg" },
              { key: "vitaminaD", labelKey: "micro.vitaminaD" as const, ddr: 15, unit: "ug" },
              { key: "vitaminaE", labelKey: "micro.vitaminaE" as const, ddr: 15, unit: "mg" },
              { key: "vitaminaK", labelKey: "micro.vitaminaK" as const, ddr: 90, unit: "ug" },
            ];
            const microLeft = DDR_TABLE.slice(0, 12);
            const microRight = DDR_TABLE.slice(12);

            return (
          <div className="space-y-4">
            {isTodos && (
              <p className="hidden sm:block text-xs italic text-muted-foreground text-right">
                {t("mediaDiaria")}
              </p>
            )}
            <div className="bg-card rounded-xl border border-border p-5">
              <h4 className="text-base font-semibold mb-4">{t("analisisGlobal")}</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {[
                  { icon: <Flame className="w-4 h-4" />, label: t("energia"), value: Math.round(totals.macros.calorias), obj: calObj != null ? Math.round(calObj) : null, unit: "kcal", color: "#b197fc", bg: "bg-purple-50 dark:bg-purple-500/10" },
                  { icon: <Droplets className="w-4 h-4" />, label: t("macros.grasa"), value: Math.round(totals.macros.grasas * 10) / 10, obj: grasObj != null ? Math.round(grasObj * 10) / 10 : null, unit: "g", color: MACRO_COLORS.grasas, bg: "bg-yellow-50 dark:bg-yellow-500/10" },
                  { icon: <Circle className="w-4 h-4" />, label: t("macros.hCarbono"), value: Math.round(totals.macros.carbohidratos * 10) / 10, obj: carbObj != null ? Math.round(carbObj * 10) / 10 : null, unit: "g", color: MACRO_COLORS.carbohidratos, bg: "bg-orange-50 dark:bg-orange-500/10" },
                  { icon: <Diamond className="w-4 h-4" />, label: t("macros.proteina"), value: Math.round(totals.macros.proteinas * 10) / 10, obj: protObj != null ? Math.round(protObj * 10) / 10 : null, unit: "g", color: MACRO_COLORS.proteinas, bg: "bg-blue-50 dark:bg-blue-500/10" },
                  { icon: <Triangle className="w-4 h-4" />, label: t("macros.fibra"), value: Math.round(totals.macros.fibra * 10) / 10, obj: null, unit: "g", color: MACRO_COLORS.fibra, bg: "bg-emerald-50 dark:bg-emerald-500/10" },
                ].map((m) => {
                  const hasObj = m.obj != null && m.obj > 0;
                  const over = hasObj && m.value > m.obj!;
                  const pct = hasObj ? Math.min((m.value / m.obj!) * 100, 100) : 85;
                  return (
                    <div key={m.label} className="space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        {m.icon} {m.label}
                      </div>
                      <div className={`h-2.5 ${m.bg} rounded-full overflow-hidden`}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: over ? "#ef4444" : m.color }} />
                      </div>
                      <div className="text-xs tabular-nums">
                        <span className={cn("font-bold", over && "text-red-500")}>{m.value}</span>
                        {hasObj ? <span className="text-muted-foreground"> / {m.obj} {m.unit}</span> : <span className="text-muted-foreground"> {m.unit}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card rounded-xl border border-border p-5">
                <h4 className="text-sm font-semibold mb-3">{t("distMacronutrientes")}</h4>
                <div className="flex items-center gap-4">
                  <div className="w-[120px] h-[120px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={macroPieData} dataKey="value" innerRadius={30} outerRadius={55} paddingAngle={2} startAngle={90} endAngle={-270} isAnimationActive={false}>
                          {macroPieData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2">
                    {macroPieData.map((entry) => {
                      const pct = energySinFibra > 0 ? Math.round((entry.value / energySinFibra) * 100) : 0;
                      return (
                        <div key={entry.name} className="flex items-center gap-2 text-xs">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: entry.color }} />
                          <span className="text-muted-foreground flex-1">{entry.name}</span>
                          <span className="font-bold tabular-nums">{pct}%</span>
                          <span className="text-muted-foreground tabular-nums">{Math.round(entry.value)} kcal</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border p-5">
                <h4 className="text-sm font-semibold mb-3">{t("distEnergetica")}</h4>
                <div className="flex items-center gap-4">
                  <div className="w-[120px] h-[120px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={mealsWithEnergy.map((m, i) => ({ name: m.label, value: m.calTotal, color: MEAL_COLORS[i % MEAL_COLORS.length] }))} dataKey="value" innerRadius={30} outerRadius={55} paddingAngle={2} startAngle={90} endAngle={-270} isAnimationActive={false}>
                          {mealsWithEnergy.map((_, i) => (
                            <Cell key={i} fill={MEAL_COLORS[i % MEAL_COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2 max-h-[120px] overflow-y-auto">
                    {mealsWithEnergy.map((meal, i) => {
                      const totalEnergy = mealsWithEnergy.reduce((s, m) => s + m.calTotal, 0) || 1;
                      const pct = Math.round((meal.calTotal / totalEnergy) * 100);
                      return (
                        <div key={meal.tipo} className="flex items-center gap-2 text-xs">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: MEAL_COLORS[i % MEAL_COLORS.length] }} />
                          <span className="text-muted-foreground flex-1 truncate">{meal.label}</span>
                          <span className="font-bold tabular-nums">{pct}%</span>
                          <span className="text-muted-foreground tabular-nums">{meal.calTotal} kcal</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border p-5">
                <h4 className="text-sm font-semibold mb-3">{t("distProteica")}</h4>
                <div className="flex items-center gap-4">
                  <div className="w-[120px] h-[120px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={mealsWithProtein.map((m, i) => ({ name: m.label, value: Math.round(m.protG * 10) / 10, color: MEAL_COLORS[i % MEAL_COLORS.length] }))} dataKey="value" innerRadius={30} outerRadius={55} paddingAngle={2} startAngle={90} endAngle={-270} isAnimationActive={false}>
                          {mealsWithProtein.map((_, i) => (
                            <Cell key={i} fill={MEAL_COLORS[i % MEAL_COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-2 max-h-[120px] overflow-y-auto">
                    {mealsWithProtein.map((meal, i) => {
                      const totalProt = mealsWithProtein.reduce((s, m) => s + m.protG, 0) || 1;
                      const pct = Math.round((meal.protG / totalProt) * 100);
                      return (
                        <div key={meal.tipo} className="flex items-center gap-2 text-xs">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: MEAL_COLORS[i % MEAL_COLORS.length] }} />
                          <span className="text-muted-foreground flex-1 truncate">{meal.label}</span>
                          <span className="font-bold tabular-nums">{pct}%</span>
                          <span className="text-muted-foreground tabular-nums">{meal.protG} g</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-card rounded-xl border border-border p-5">
                <h4 className="text-sm font-semibold mb-3">{t("distGrasas")}</h4>
                <div className="flex items-center gap-4">
                  <div className="w-[100px] h-[100px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={mealsWithEnergy.filter(m => m.grasasG > 0).map((m, i) => ({ name: m.label, value: m.grasasG, color: MEAL_COLORS[i % MEAL_COLORS.length] }))}
                          dataKey="value" innerRadius={25} outerRadius={45} paddingAngle={2} startAngle={90} endAngle={-270} isAnimationActive={false}
                        >
                          {mealsWithEnergy.filter(m => m.grasasG > 0).map((_, i) => (
                            <Cell key={i} fill={MEAL_COLORS[i % MEAL_COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="text-2xl font-bold tabular-nums">{totals.macros.grasas.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">g</span></div>
                    <div className="text-xs text-muted-foreground">{Math.round(totals.energy.grasasKcal)} kcal ({energySinFibra > 0 ? Math.round((totals.energy.grasasKcal / energySinFibra) * 100) : 0}%)</div>
                    <div className="space-y-1 mt-2">
                      {mealsWithEnergy.filter(m => m.grasasG > 0).map((meal, i) => (
                        <div key={meal.tipo} className="flex items-center gap-2 text-[11px]">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: MEAL_COLORS[i % MEAL_COLORS.length] }} />
                          <span className="text-muted-foreground flex-1 truncate">{meal.label}</span>
                          <span className="tabular-nums font-medium">{meal.grasasG} g</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border p-5">
                <h4 className="text-sm font-semibold mb-3">{t("distHidratos")}</h4>
                <div className="flex items-center gap-4">
                  <div className="w-[100px] h-[100px] shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={mealsWithEnergy.filter(m => m.carbG > 0).map((m, i) => ({ name: m.label, value: m.carbG, color: MEAL_COLORS[i % MEAL_COLORS.length] }))}
                          dataKey="value" innerRadius={25} outerRadius={45} paddingAngle={2} startAngle={90} endAngle={-270} isAnimationActive={false}
                        >
                          {mealsWithEnergy.filter(m => m.carbG > 0).map((_, i) => (
                            <Cell key={i} fill={MEAL_COLORS[i % MEAL_COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="text-2xl font-bold tabular-nums">{totals.macros.carbohidratos.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">g</span></div>
                    <div className="text-xs text-muted-foreground">{Math.round(totals.energy.carbKcal)} kcal ({energySinFibra > 0 ? Math.round((totals.energy.carbKcal / energySinFibra) * 100) : 0}%)</div>
                    <div className="space-y-1 mt-2">
                      {mealsWithEnergy.filter(m => m.carbG > 0).map((meal, i) => (
                        <div key={meal.tipo} className="flex items-center gap-2 text-[11px]">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: MEAL_COLORS[i % MEAL_COLORS.length] }} />
                          <span className="text-muted-foreground flex-1 truncate">{meal.label}</span>
                          <span className="tabular-nums font-medium">{meal.carbG} g</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl border border-border p-5">
                <h4 className="text-sm font-semibold mb-3">{t("gruposAlimentos")}</h4>
                {catPieData.length > 0 ? (
                  <div className="flex items-start gap-5">
                    <div className="w-[130px] h-[130px] shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={catPieData} dataKey="value" innerRadius={30} outerRadius={60} paddingAngle={2} startAngle={90} endAngle={-270} isAnimationActive={false}>
                            {catPieData.map((entry, i) => (
                              <Cell key={i} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-2 pt-1">
                      {catPieData.map((entry) => (
                        <div key={entry.name} className="flex items-center gap-2 text-xs">
                          <span className="w-3 h-3 rounded shrink-0" style={{ background: entry.color }} />
                          <span className="text-muted-foreground">{entry.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">{t("sinDatosCategorias")}</p>
                )}
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-5">
              <h4 className="text-base font-semibold mb-4">{t("micronutrientes")}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0">
                {[microLeft, microRight].map((col, colIdx) => (
                  <div key={colIdx} className="space-y-0">
                    {col.map((row) => {
                      const actual = totals.micro[row.key] || 0;
                      const pct = row.ddr > 0 ? (actual / row.ddr) * 100 : 0;
                      const maxScale = 220;
                      const barW = Math.min((pct / maxScale) * 100, 100);
                      const ddrLinePos = (100 / maxScale) * 100;
                      return (
                        <div key={row.key} className="flex items-center gap-2 py-1.5 border-b border-border/30 last:border-0">
                          <span className="text-[11px] text-muted-foreground w-28 shrink-0 truncate">{t(row.labelKey)}</span>
                          <div className="flex-1 relative h-3 bg-muted/30 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${barW}%`, background: pct >= 100 ? "#818cf8" : "#a5b4fc" }}
                            />
                            <div
                              className="absolute top-0 h-full w-px border-l border-dashed border-muted-foreground/50 z-10"
                              style={{ left: `${Math.min(ddrLinePos, 100)}%` }}
                            />
                          </div>
                          <span className="text-[11px] tabular-nums font-medium w-14 text-right shrink-0">{Math.round(pct)}%</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className={showAguaEjercicio ? "grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-4" : "grid grid-cols-1 gap-4"}>
              <div className="bg-card rounded-xl border border-border p-5">
                <h4 className="text-sm font-semibold mb-4">{t("distMacrosPorComida")}</h4>
                <div className={showAguaEjercicio ? "grid grid-cols-2 sm:grid-cols-3 gap-4" : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6"}>
                  {totals.comidasMacros.filter(m => m.calTotal > 0).map((meal) => {
                    const big = !showAguaEjercicio;
                    const size = big ? 140 : 70;
                    const innerR = big ? 38 : 16;
                    const outerR = big ? 66 : 30;
                    return (
                    <div key={meal.tipo} className="flex flex-col items-center gap-2">
                      <div style={{ width: size, height: size }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { value: meal.grasasKcal || 0.01 },
                                { value: meal.carbKcal || 0.01 },
                                { value: meal.protKcal || 0.01 },
                              ]}
                              dataKey="value" innerRadius={innerR} outerRadius={outerR} paddingAngle={2} startAngle={90} endAngle={-270} isAnimationActive={false}
                            >
                              <Cell fill={MACRO_COLORS.grasas} />
                              <Cell fill={MACRO_COLORS.carbohidratos} />
                              <Cell fill={MACRO_COLORS.proteinas} />
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <span className={`font-medium text-center leading-tight ${big ? "text-sm" : "text-xs"}`}>{meal.label}</span>
                      <span className={`text-muted-foreground tabular-nums ${big ? "text-xs" : "text-[10px]"}`}>{meal.calTotal} kcal</span>
                      <div className={`flex items-center gap-2 text-muted-foreground tabular-nums ${big ? "text-xs" : "text-[10px]"}`}>
                        <span style={{ color: MACRO_COLORS.grasas }}>G {meal.grasasPct}%</span>
                        <span style={{ color: MACRO_COLORS.carbohidratos }}>C {meal.carbPct}%</span>
                        <span style={{ color: MACRO_COLORS.proteinas }}>P {meal.protPct}%</span>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>

              {showAguaEjercicio && (
              <div className="space-y-4">
                <div className="bg-card rounded-xl border border-border p-5">
                  <h4 className="text-sm font-semibold mb-4">{t("agua.titulo")}</h4>
                  {(() => {
                    const pesoKg = pacientePeso || 70;
                    const aguaTotal = Math.round((pesoKg * 35) / 10) / 100;
                    const aguaComidas = Math.round(aguaTotal * 0.1 * 100) / 100;
                    const aguaEntre = Math.round((aguaTotal - aguaComidas) * 100) / 100;
                    return (
                      <div className="flex items-center gap-4">
                        <div className="w-[70px] h-[70px] shrink-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={[{ value: aguaEntre }, { value: aguaComidas }]} dataKey="value" innerRadius={18} outerRadius={30} startAngle={90} endAngle={-270} isAnimationActive={false}>
                                <Cell fill="#93c5fd" />
                                <Cell fill="#dbeafe" />
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex-1 flex items-center justify-between gap-3 text-center">
                          <div>
                            <p className="text-lg font-bold">{aguaEntre} L</p>
                            <p className="text-[10px] text-muted-foreground">{t("agua.entreComidas")}</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold">{aguaComidas} L</p>
                            <p className="text-[10px] text-muted-foreground">{t("agua.enComidas")}</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold">{aguaTotal} L</p>
                            <p className="text-[10px] text-muted-foreground">{t("agua.total")}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="bg-card rounded-xl border border-border p-5">
                  <h4 className="text-sm font-semibold mb-4">{t("ejercicio.titulo")}</h4>
                  {(() => {
                    const pesoKg = pacientePeso || 70;
                    const objetivo = pacienteObjetivo || "MANTENIMIENTO";
                    const tmb = Math.round(pesoKg * 24);
                    const factorActividad = objetivo === "DEPORTIVO" ? 1.7 : objetivo === "GANAR_MASA" ? 1.5 : 1.3;
                    const gastoTotal = Math.round(tmb * factorActividad);
                    const minutos = objetivo === "DEPORTIVO" ? 60 : objetivo === "GANAR_MASA" ? 45 : 0;
                    return (
                      <div className="flex items-center gap-4">
                        <div className="w-[70px] h-[70px] shrink-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={[{ value: minutos || 1 }, { value: Math.max(60 - minutos, 1) }]} dataKey="value" innerRadius={18} outerRadius={30} startAngle={90} endAngle={-270} isAnimationActive={false}>
                                <Cell fill="#6ee7b7" />
                                <Cell fill="#ecfdf5" />
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="flex-1 flex items-center justify-between gap-3">
                          <div className="text-center">
                            <p className="text-lg font-bold">{minutos} {t("ejercicio.minutos")}</p>
                            <p className="text-[10px] text-muted-foreground">{t("ejercicio.actividadFisica")}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-bold">{gastoTotal} kcal</p>
                            <p className="text-[10px] text-muted-foreground">{t("ejercicio.gastoEnergetico")}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
              )}
            </div>

            {showFoodTable && (
            <div className="bg-card rounded-xl border border-border p-5">
              <h4 className="text-sm font-semibold mb-4">{t("alimentosPorEnergia")}</h4>
              {allFoods.length > 0 ? (
                <>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left py-2 font-medium">{t("tabla.nombre")}</th>
                        <th className="text-right py-2 font-medium pr-3">{t("tabla.energiaKcal")}</th>
                        <th className="text-left py-2 font-medium">{t("tabla.comida")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {foodsVisible.map((food, i) => (
                        <tr key={`${food.nombre}-${i}`} className="border-b border-border/30 last:border-0">
                          <td className="py-2.5 pr-2">
                            <FoodHoverCard
                              nombre={food.nombre}
                              calorias={food.itemCalorias} proteinas={food.itemProteinas} carbohidratos={food.itemCarbohidratos} grasas={food.itemGrasas} fibra={food.itemFibra}
                              cantidad={food.cantidad} unidad={food.unidad} porcion={food.porcion}
                              esReceta={food.esReceta} esPropio={food.esPropio}
                              recetaIngredientes={food.recetaIngredientes} recetaDescripcion={food.recetaDescripcion} recetaPorciones={food.recetaPorciones}
                              imagenUrl={food.imagenUrl} href={food.href} interactionMode={interactionMode}
                            >
                              <span className={cn(
                                interactionMode === "dashboard" && "hover:underline",
                                food.esReceta ? "text-purple-600 dark:text-purple-400" : food.esPropio ? "text-emerald-600 dark:text-emerald-400" : "",
                              )}>{food.nombre}</span>
                            </FoodHoverCard>
                          </td>
                          <td className="py-2.5 text-right tabular-nums font-medium pr-3">{food.calorias}</td>
                          <td className="py-2.5 text-muted-foreground">{food.comida}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {foodPages > 1 && (
                    <div className="flex items-center justify-end mt-3 pt-3 border-t border-border/30 gap-1">
                      <button onClick={() => setFoodTablePage(Math.max(0, foodTablePage - 1))} disabled={foodTablePage <= 0} className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-20"><ChevronLeft className="w-4 h-4" /></button>
                      {Array.from({ length: Math.min(foodPages, 6) }, (_, i) => (
                        <button key={i} onClick={() => setFoodTablePage(i)} className={`w-7 h-7 rounded text-xs font-medium ${i === foodTablePage ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}>{i + 1}</button>
                      ))}
                      {foodPages > 6 && <span className="text-xs text-muted-foreground px-1">...</span>}
                      <button onClick={() => setFoodTablePage(Math.min(foodPages - 1, foodTablePage + 1))} disabled={foodTablePage >= foodPages - 1} className="p-1 rounded hover:bg-muted text-muted-foreground disabled:opacity-20"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-muted-foreground">{t("sinAlimentosDia")}</p>
              )}
            </div>
            )}
          </div>
            );
          })()
        )
      ) : null}
    </section>
  );
}

// TIPO_LABELS removed — now derived from t() inside ResumenSemanal

function macrosDeItem(a: PlanVisualItem) {
  if (a.receta) {
    return {
      calorias: Math.round(a.receta.calorias * a.cantidad * 10) / 10,
      proteinas: Math.round(a.receta.proteinas * a.cantidad * 10) / 10,
      carbohidratos: Math.round(a.receta.carbohidratos * a.cantidad * 10) / 10,
      grasas: Math.round(a.receta.grasas * a.cantidad * 10) / 10,
      fibra: Math.round((a.receta.fibra || 0) * a.cantidad * 10) / 10,
    };
  }
  if (a.alimento) {
    return calcularMacrosPorcion(
      {
        calorias: a.alimento.calorias,
        proteinas: a.alimento.proteinas,
        carbohidratos: a.alimento.carbohidratos,
        grasas: a.alimento.grasas,
        fibra: a.alimento.fibra || 0,
      },
      convertirAGramos(a.cantidad, a.unidad, a.alimento.porcion || 100)
    );
  }
  return { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0, fibra: 0 };
}

function ResumenSemanal({
  plan,
  onSelectDay,
}: {
  plan: PlanVisualDetalle;
  onSelectDay: (dayKey: string) => void;
}) {
  const t = useTranslations("patients.planVisual");
  const diasOrdenados = useMemo(
    () => [...plan.dias].sort((a, b) => DIA_KEYS.indexOf(a.dia as typeof DIA_KEYS[number]) - DIA_KEYS.indexOf(b.dia as typeof DIA_KEYS[number])),
    [plan.dias]
  );

  // #75 — Agrupa los días juntos (mismo grupoId) en UNA sola tarjeta ("Mié·Jue·Vie·Dom").
  const bloques = useMemo(() => {
    const idx = (d: string) => DIA_KEYS.indexOf(d as (typeof DIA_KEYS)[number]);
    const porGrupo = new Map<string, PlanVisualDia[]>();
    const sueltos: PlanVisualDia[] = [];
    for (const d of diasOrdenados) {
      if (d.grupoId) porGrupo.set(d.grupoId, [...(porGrupo.get(d.grupoId) ?? []), d]);
      else sueltos.push(d);
    }
    type B = { key: string; label: string; rep: PlanVisualDia };
    const bs: B[] = sueltos.map((d) => ({ key: d.id, label: t(`dias.${d.dia}`), rep: d }));
    for (const [g, ds] of porGrupo) {
      const ord = [...ds].sort((a, b) => idx(a.dia) - idx(b.dia));
      bs.push({ key: g, label: ord.map((d) => t(`dias.${d.dia}`).slice(0, 3)).join("·"), rep: ord[0] });
    }
    return bs.sort((a, b) => idx(a.rep.dia) - idx(b.rep.dia));
  }, [diasOrdenados, t]);

  const TIPO_LABELS: Record<string, string> = {
    DESAYUNO: t("comidasCorto.DESAYUNO"),
    MEDIA_MANANA: t("comidasCorto.MEDIA_MANANA"),
    ALMUERZO: t("comidasCorto.ALMUERZO"),
    MERIENDA: t("comidasCorto.MERIENDA"),
    CENA: t("comidasCorto.CENA"),
    RECENA: t("comidasCorto.RECENA"),
  };

  const semanal = useMemo(() => {
    const allMacros = diasOrdenados.flatMap((d) => d.comidas.flatMap((c) => c.alimentos.map(macrosDeItem)));
    const total = sumarMacros(allMacros);
    const n = Math.max(diasOrdenados.length, 1);
    return {
      calorias: Math.round(total.calorias / n),
      proteinas: Math.round(total.proteinas / n),
      carbohidratos: Math.round(total.carbohidratos / n),
      grasas: Math.round(total.grasas / n),
    };
  }, [diasOrdenados]);

  return (
    <div className="space-y-5">
      {/* Banner de media semanal */}
      <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-card p-3 sm:p-5">
        <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          {t("mediaDiariaSemana")}
        </p>
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-bold tabular-nums">{semanal.calorias}</span>
            <span className="text-xs sm:text-sm text-muted-foreground">kcal</span>
            {plan.caloriasObjetivo != null && (
              <span className="text-[10px] sm:text-xs text-muted-foreground">/ {plan.caloriasObjetivo}</span>
            )}
          </div>
          <div className="flex gap-1.5 sm:gap-2">
            <span className="inline-flex items-center px-1.5 sm:px-3 py-0.5 sm:py-1.5 rounded-full bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 text-[10px] sm:text-sm font-medium">
              G {semanal.grasas}g
            </span>
            <span className="inline-flex items-center px-1.5 sm:px-3 py-0.5 sm:py-1.5 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 text-[10px] sm:text-sm font-medium">
              C {semanal.carbohidratos}g
            </span>
            <span className="inline-flex items-center px-1.5 sm:px-3 py-0.5 sm:py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] sm:text-sm font-medium">
              P {semanal.proteinas}g
            </span>
          </div>
        </div>
      </div>

      {/* Grid de días */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
        {bloques.map((bloque) => {
          const dia = bloque.rep;
          const macrosList = dia.comidas.flatMap((c) => c.alimentos.map(macrosDeItem));
          const diaTotales = sumarMacros(macrosList);
          const pctCalorias = plan.caloriasObjetivo
            ? Math.min(120, Math.round((diaTotales.calorias / plan.caloriasObjetivo) * 100))
            : null;

          return (
            <button
              key={bloque.key}
              type="button"
              onClick={() => onSelectDay(dia.dia)}
              className="group text-left rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all overflow-hidden"
            >
              <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <h3 className="font-semibold text-foreground">
                    {bloque.label}
                  </h3>
                </div>
                <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
                  {t("verDia")} →
                </span>
              </div>

              <div className="px-5 py-4 space-y-3">
                <div>
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-xs font-medium text-muted-foreground">{t("energia")}</span>
                    <span className="text-sm font-bold tabular-nums">
                      {Math.round(diaTotales.calorias)}
                      <span className="text-xs font-normal text-muted-foreground ml-1">kcal</span>
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-400 to-primary rounded-full"
                      style={{
                        width: `${
                          pctCalorias ??
                          Math.min(100, Math.round((diaTotales.calorias / Math.max(diaTotales.calorias * 1.1, 1)) * 100))
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  <div className="rounded-lg bg-yellow-50 dark:bg-yellow-500/10 px-2 py-1.5 text-center">
                    <p className="text-[10px] font-medium text-yellow-700 dark:text-yellow-400 uppercase">{t("macros.grasa")}</p>
                    <p className="text-sm font-bold text-yellow-700 dark:text-yellow-400 tabular-nums">
                      {diaTotales.grasas.toFixed(0)}g
                    </p>
                  </div>
                  <div className="rounded-lg bg-orange-50 dark:bg-orange-500/10 px-2 py-1.5 text-center">
                    <p className="text-[10px] font-medium text-orange-700 dark:text-orange-400 uppercase">{t("macros.hc")}</p>
                    <p className="text-sm font-bold text-orange-700 dark:text-orange-400 tabular-nums">
                      {diaTotales.carbohidratos.toFixed(0)}g
                    </p>
                  </div>
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-500/10 px-2 py-1.5 text-center">
                    <p className="text-[10px] font-medium text-blue-700 dark:text-blue-400 uppercase">{t("macros.prot")}</p>
                    <p className="text-sm font-bold text-blue-700 dark:text-blue-400 tabular-nums">
                      {diaTotales.proteinas.toFixed(0)}g
                    </p>
                  </div>
                </div>

                <div className="pt-1 space-y-1.5">
                  {ordenarComidasPorHora(dia.comidas.filter((c) => c.alimentos.length > 0)).map((comida) => {
                    const previews = comida.alimentos
                      .map((a) => a.nombrePersonalizado || a.alimento?.nombre || a.receta?.nombre || "")
                      .filter(Boolean)
                      .slice(0, 3)
                      .join(", ");
                    return (
                      <div key={comida.id} className="flex items-start gap-2 text-xs">
                        <span className="font-semibold text-muted-foreground w-20 shrink-0">
                          {comida.nombre?.trim() || TIPO_LABELS[comida.tipo] || comida.tipo}
                        </span>
                        <span className="text-foreground/80 flex-1 line-clamp-1">{previews}</span>
                      </div>
                    );
                  })}
                  {dia.comidas.filter((c) => c.alimentos.length === 0).length > 0 && (
                    <p className="text-[10px] text-muted-foreground italic">
                      {t("comidasSinAlimentos", { count: dia.comidas.filter((c) => c.alimentos.length === 0).length })}
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

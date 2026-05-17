export interface TourStep {
  id: string;
  title: string;
  description: string;
  target?: string;       // data-tour attribute selector
  route?: string;        // navigate to this route before showing
  position?: "top" | "bottom" | "left" | "right";
}

export interface Tour {
  id: string;
  name: string;
  description: string;
  icon: string;
  audience: "dietista" | "paciente";
  steps: TourStep[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TFunc = (key: string, values?: Record<string, any>) => string;

/** Tour structural data — only ids, targets, routes, positions, and icons */
interface TourDef {
  id: string;
  /** JSON key under settings.tours.data.* */
  dataKey: string;
  icon: string;
  audience: "dietista" | "paciente";
  steps: {
    id: string;
    target?: string;
    route?: string;
    position?: "top" | "bottom" | "left" | "right";
  }[];
}

// ─── TOURS DIETISTA ───

const DIETISTA_TOUR_DEFS: TourDef[] = [
  {
    id: "dietista-dashboard", dataKey: "dietistaDashboard", icon: "LayoutDashboard", audience: "dietista",
    steps: [
      { id: "d1-1", target: "sidebar", route: "/dashboard", position: "right" },
      { id: "d1-2", target: "dashboard-proxima-cita", position: "bottom" },
      { id: "d1-3", target: "dashboard-notificacion", position: "left" },
      { id: "d1-4", target: "activity-chart", position: "top" },
      { id: "d1-5", target: "dashboard-quick-access", position: "left" },
    ],
  },
  {
    id: "dietista-pacientes", dataKey: "dietistaPacientes", icon: "Users", audience: "dietista",
    steps: [
      { id: "d2-1", route: "/pacientes", target: "patient-list", position: "top" },
      { id: "d2-2", target: "new-patient-btn", position: "bottom" },
      { id: "d2-3", target: "patient-search", position: "bottom" },
    ],
  },
  {
    id: "dietista-ficha-paciente", dataKey: "dietistaFichaPaciente", icon: "User", audience: "dietista",
    steps: [
      { id: "d2b-1", route: "/tour-demo" },
      { id: "d2b-2", target: "patient-personal-data", position: "bottom" },
      { id: "d2b-3", target: "patient-medical", position: "bottom" },
      { id: "d2b-4", target: "patient-lifestyle", position: "bottom" },
      { id: "d2b-5", target: "patient-schedule", position: "bottom" },
      { id: "d2b-6", target: "patient-measures", position: "left" },
      { id: "d2b-7", target: "patient-recommendations", position: "left" },
      { id: "d2b-8", target: "patient-plans", position: "top" },
    ],
  },
  {
    id: "dietista-planes-lista", dataKey: "dietistaPlanes", icon: "UtensilsCrossed", audience: "dietista",
    steps: [
      { id: "dpl-1", route: "/tour-demo-planes", target: "planes-lista", position: "top" },
      { id: "dpl-2", target: "planes-buscador", position: "bottom" },
      { id: "dpl-3", target: "plan-card", position: "bottom" },
      { id: "dpl-4", target: "plantillas-btn", position: "bottom" },
      { id: "dpl-5", target: "nuevo-plan-btn", position: "bottom" },
    ],
  },
  {
    id: "dietista-dietas", dataKey: "dietistaDietas", icon: "UtensilsCrossed", audience: "dietista",
    steps: [
      { id: "d3-1", route: "/tour-demo-dieta" },
      { id: "d3-2", target: "plan-actions", position: "bottom" },
      { id: "d3-3", target: "plan-macros", position: "bottom" },
      { id: "d3-4", target: "plan-editor", position: "top" },
      { id: "d3-5", target: "ia-btn", position: "bottom" },
      { id: "d3-6", target: "pdf-btn", position: "bottom" },
      { id: "d3-7", target: "share-btn", position: "bottom" },
    ],
  },
  {
    id: "dietista-ia", dataKey: "dietistaIA", icon: "Sparkles", audience: "dietista",
    steps: [
      { id: "dia-1", route: "/tour-demo-ia", target: "ia-config", position: "right" },
      { id: "dia-2", target: "ia-fase", position: "bottom" },
      { id: "dia-3", target: "ia-tipo-dieta", position: "bottom" },
      { id: "dia-4", target: "ia-macros", position: "bottom" },
      { id: "dia-5", target: "ia-preferencias", position: "bottom" },
      { id: "dia-6", target: "ia-paciente-info", position: "left" },
      { id: "dia-7", target: "ia-instrucciones", position: "left" },
      { id: "dia-8", target: "ia-generar-btn", position: "top" },
    ],
  },
  {
    id: "dietista-alimentos", dataKey: "dietistaAlimentos", icon: "Apple", audience: "dietista",
    steps: [
      { id: "d4-1", route: "/alimentos", target: "food-list", position: "bottom" },
      { id: "d4-2", target: "food-filters", position: "bottom" },
      { id: "d4-3", target: "import-btn", position: "bottom" },
    ],
  },
  {
    id: "dietista-agenda", dataKey: "dietistaAgenda", icon: "CalendarDays", audience: "dietista",
    steps: [
      { id: "d5-1", route: "/tour-demo-agenda" },
      { id: "d5-2", target: "agenda-nueva-cita", position: "bottom" },
      { id: "d5-3", target: "agenda-controles", position: "bottom" },
      { id: "d5-4", target: "agenda-vistas", position: "bottom" },
      { id: "d5-5", target: "agenda-semana", position: "top" },
      { id: "d5-6", target: "agenda-detalle-dia", position: "top" },
      { id: "d5-7", target: "agenda-estado-cita", position: "left" },
      { id: "d5-8", target: "agenda-acciones-cita", position: "top" },
    ],
  },
  {
    id: "dietista-reportes", dataKey: "dietistaReportes", icon: "FileBarChart", audience: "dietista",
    steps: [
      { id: "d6-1", route: "/reportes", target: "reports-kpis", position: "bottom" },
      { id: "d6-2", target: "patient-reports", position: "top" },
    ],
  },
];

// ─── TOURS PACIENTE ───

const PACIENTE_TOUR_DEFS: TourDef[] = [
  {
    id: "paciente-dashboard", dataKey: "pacienteDashboard", icon: "LayoutDashboard", audience: "paciente",
    steps: [
      { id: "p1-1", target: "sidebar", route: "/paciente/portal", position: "right" },
      { id: "p1-2", target: "portal-hoy-card", position: "bottom" },
      { id: "p1-3", target: "portal-progreso-card", position: "top" },
    ],
  },
  {
    id: "paciente-dieta", dataKey: "pacienteDieta", icon: "UtensilsCrossed", audience: "paciente",
    steps: [
      { id: "p2-1", route: "/paciente/portal/dieta", target: "diet-plan", position: "bottom" },
      { id: "p2-2", target: "shopping-list-link", position: "bottom" },
    ],
  },
  {
    id: "paciente-evolucion", dataKey: "pacienteEvolucion", icon: "TrendingUp", audience: "paciente",
    steps: [
      { id: "p4-1", route: "/paciente/portal/evolucion", target: "evolution-charts", position: "bottom" },
    ],
  },
];

// ─── Resolve tours using translations ───

function resolveTour(def: TourDef, t?: TFunc): Tour {
  const prefix = `settings.tours.data.${def.dataKey}`;
  const tt = t ?? ((key: string) => key.split(".").pop() ?? key);
  return {
    id: def.id,
    name: tt(`${prefix}.name`),
    description: tt(`${prefix}.description`),
    icon: def.icon,
    audience: def.audience,
    steps: def.steps.map((s) => ({
      id: s.id,
      title: tt(`${prefix}.steps.${s.id}.title`),
      description: tt(`${prefix}.steps.${s.id}.description`),
      target: s.target,
      route: s.route,
      position: s.position,
    })),
  };
}

// ─── Funciones de acceso ───

export function getToursByAudience(audience: "dietista" | "paciente", t?: TFunc): Tour[] {
  const defs = audience === "dietista" ? DIETISTA_TOUR_DEFS : PACIENTE_TOUR_DEFS;
  return defs.map((d) => resolveTour(d, t));
}

export function getTourById(id: string, t?: TFunc): Tour | undefined {
  const all = [...DIETISTA_TOUR_DEFS, ...PACIENTE_TOUR_DEFS];
  const def = all.find((d) => d.id === id);
  return def ? resolveTour(def, t) : undefined;
}

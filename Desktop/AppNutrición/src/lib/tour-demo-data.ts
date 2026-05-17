// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TFunc = (key: string, values?: Record<string, any>) => string;

export const AVATAR_DEMO =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIiBmaWxsPSJub25lIj4KICA8Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjEwMCIgZmlsbD0iI0U4RjVFOSIvPgogIDxjaXJjbGUgY3g9IjEwMCIgY3k9IjcyIiByPSIyOCIgZmlsbD0iIzY2QkI2QSIvPgogIDxwYXRoIGQ9Ik0xMDAgMTA4Yy0zMCAwLTU0IDE2LTU0IDM2djhjMCA0IDIgNyA2IDkgMTIgNiAzMCA5IDQ4IDlzMzYtMyA0OC05YzQtMiA2LTUgNi05di04YzAtMjAtMjQtMzYtNTQtMzZ6IiBmaWxsPSIjNjZCQjZBIi8+Cjwvc3ZnPgo=";

// ─── Structural data (Spanish defaults) ─────────────────────────────

const PATIENT_BASE = {
  nombre: "Paciente",
  apellidos: "Prueba",
  email: "paciente.prueba@demo.annonia.com",
  telefono: "+34 600 123 456",
  fechaNacimiento: "15/06/1992",
  edad: 33,
  peso: 78,
  altura: 175,
  imc: "25.5",
};

const PLAN_MACROS = [
  { kcal: 2000, prot: 150, carb: 220, grasa: 70, activo: true },
  { kcal: 2200, prot: 140, carb: 260, grasa: 75, activo: false },
  { kcal: 2600, prot: 180, carb: 320, grasa: 75, activo: false },
  { kcal: 1800, prot: 160, carb: 100, grasa: 95, activo: false },
  { kcal: 1900, prot: 120, carb: 230, grasa: 65, activo: false },
];

interface DemoFood {
  nombre: string;
  g: number;
}

const DIETA_COMIDAS: { comidas: { tipo: string; items: DemoFood[] }[] }[] = [
  {
    comidas: [
      { tipo: "DESAYUNO", items: [{ nombre: "Avena", g: 60 }, { nombre: "Plátano", g: 100 }, { nombre: "Leche entera", g: 200 }] },
      { tipo: "MEDIA MAÑANA", items: [] },
      { tipo: "ALMUERZO", items: [{ nombre: "Pollo", g: 150 }, { nombre: "Arroz", g: 80 }, { nombre: "Brócoli", g: 150 }, { nombre: "Aceite de oliva", g: 10 }] },
      { tipo: "MERIENDA", items: [{ nombre: "Manzana", g: 180 }, { nombre: "Yogur", g: 125 }, { nombre: "Nueces", g: 20 }] },
      { tipo: "CENA", items: [{ nombre: "Pollo", g: 120 }, { nombre: "Brócoli", g: 200 }, { nombre: "Aceite de oliva", g: 8 }] },
    ],
  },
  {
    comidas: [
      { tipo: "DESAYUNO", items: [{ nombre: "Pan integral", g: 60 }, { nombre: "Huevo", g: 100 }, { nombre: "Aguacate", g: 50 }] },
      { tipo: "MEDIA MAÑANA", items: [] },
      { tipo: "ALMUERZO", items: [{ nombre: "Pasta integral", g: 100 }, { nombre: "Ternera", g: 120 }, { nombre: "Tomate", g: 100 }, { nombre: "Aceite de oliva", g: 10 }] },
      { tipo: "MERIENDA", items: [{ nombre: "Naranja", g: 150 }, { nombre: "Almendras", g: 25 }] },
      { tipo: "CENA", items: [{ nombre: "Merluza", g: 150 }, { nombre: "Patata", g: 200 }, { nombre: "Espinacas", g: 100 }] },
    ],
  },
  {
    comidas: [
      { tipo: "DESAYUNO", items: [{ nombre: "Avena", g: 80 }, { nombre: "Plátano", g: 120 }, { nombre: "Huevo", g: 150 }] },
      { tipo: "MEDIA MAÑANA", items: [] },
      { tipo: "ALMUERZO", items: [{ nombre: "Ternera", g: 180 }, { nombre: "Boniato", g: 250 }, { nombre: "Pimiento", g: 100 }, { nombre: "Aceite de oliva", g: 12 }] },
      { tipo: "MERIENDA", items: [{ nombre: "Yogur", g: 200 }, { nombre: "Fresas", g: 100 }, { nombre: "Almendras", g: 30 }] },
      { tipo: "CENA", items: [{ nombre: "Salmón", g: 180 }, { nombre: "Quinoa", g: 80 }, { nombre: "Espinacas", g: 150 }] },
    ],
  },
];

const CITAS_BASE = [
  { dia: 0, hora: "10:00", duracion: 45, estado: "COMPLETADA", motivoKey: "motivo1" },
  { dia: 0, hora: "15:00", duracion: 30, estado: "PENDIENTE", motivoKey: "motivo2" },
  { dia: 1, hora: "17:00", duracion: 30, estado: "CANCELADA", motivoKey: "motivo3" },
  { dia: 2, hora: "11:30", duracion: 30, estado: "CONFIRMADA", motivoKey: "motivo4" },
  { dia: 3, hora: "16:00", duracion: 60, estado: "CONFIRMADA", motivoKey: "motivo5" },
  { dia: 4, hora: "10:30", duracion: 30, estado: "COMPLETADA", motivoKey: "motivo6" },
];

// ─── Default Spanish strings (used as fallbacks) ─────────────────────

const DEFAULTS = {
  sexo: "Masculino",
  objetivo: "Perder peso",
  objetivoDetalle: "Perder 5 kg de forma saludable en 3 meses",
  alergias: ["Frutos secos (almendras)", "Polen estacional"],
  intolerancias: ["Lactosa (parcial)"],
  patologias: ["Hipertensión controlada", "Hipotiroidismo subclínico leve"],
  medicamentos: ["Enalapril 10 mg cada 24 h", "Levotiroxina 50 mcg en ayunas"],
  suplementos: ["Vitamina D3 1000 UI", "Omega-3 EPA/DHA", "Magnesio bisglicinato"],
  ocupacion: "Oficina",
  nivelActividad: "Moderado (3 veces/sem)",
  tipoEjercicio: "Entrenamiento de fuerza y cardio",
  horarioTrabajo: "09:00 – 18:00",
  horarioEjercicio: "L/X/V 19:00",
  horasDescanso: "7-8 horas",
  preferencias: ["Mediterránea", "Pescado azul", "Verduras de temporada", "Sin ultraprocesados"],
  recomendaciones: "Beber al menos 2L de agua al día. Cenar ligero 2h antes de dormir. Incluir más verduras de hoja verde.",
  notas: "Paciente de prueba preconfigurado para que explores las funciones de la app. Puedes editarlo o eliminarlo cuando quieras.",
  planNames: [
    "Plan inicial — ejemplo",
    "Plan de mantenimiento",
    "Plan deportivo — alto volumen",
    "Plan low-carb",
    "Plan mediterráneo — legumbres",
  ],
  dayNames: ["Lunes", "Martes", "Miércoles"],
  motivos: {
    motivo1: "Segunda revisión de seguimiento",
    motivo2: "Revisión medidas",
    motivo3: "Consulta puntual",
    motivo4: "Tercera revisión mensual",
    motivo5: "Revisión plan deportivo",
    motivo6: "Control peso quincenal",
  },
};

const PLAN_KEYS = ["plan1", "plan2", "plan3", "plan4", "plan5"] as const;
const DAY_KEYS = ["lunes", "martes", "miercoles"] as const;

// ─── Resolved exports ────────────────────────────────────────────────

function tt(t: TFunc | undefined, key: string, fallback: string): string {
  if (!t) return fallback;
  try { return t(key); } catch { return fallback; }
}

function ttArr(t: TFunc | undefined, key: string, fallback: string[]): string[] {
  if (!t) return fallback;
  try {
    // next-intl returns arrays via rich() or raw(), but for simple string arrays
    // we resolve each index individually
    return fallback.map((_, i) => {
      try { return t(`${key}.${i}`); } catch { return fallback[i]; }
    });
  } catch { return fallback; }
}

export function getDemoPatient(t?: TFunc) {
  const p = "settings.tours.demoData.patient";
  return {
    ...PATIENT_BASE,
    sexo: tt(t, `${p}.sexo`, DEFAULTS.sexo),
    objetivo: tt(t, `${p}.objetivo`, DEFAULTS.objetivo),
    objetivoDetalle: tt(t, `${p}.objetivoDetalle`, DEFAULTS.objetivoDetalle),
    alergias: ttArr(t, `${p}.alergias`, DEFAULTS.alergias),
    intolerancias: ttArr(t, `${p}.intolerancias`, DEFAULTS.intolerancias),
    patologias: ttArr(t, `${p}.patologias`, DEFAULTS.patologias),
    medicamentos: ttArr(t, `${p}.medicamentos`, DEFAULTS.medicamentos),
    suplementos: ttArr(t, `${p}.suplementos`, DEFAULTS.suplementos),
    ocupacion: tt(t, `${p}.ocupacion`, DEFAULTS.ocupacion),
    nivelActividad: tt(t, `${p}.nivelActividad`, DEFAULTS.nivelActividad),
    tipoEjercicio: tt(t, `${p}.tipoEjercicio`, DEFAULTS.tipoEjercicio),
    horarioTrabajo: tt(t, `${p}.horarioTrabajo`, DEFAULTS.horarioTrabajo),
    horarioEjercicio: tt(t, `${p}.horarioEjercicio`, DEFAULTS.horarioEjercicio),
    horasDescanso: tt(t, `${p}.horasDescanso`, DEFAULTS.horasDescanso),
    preferencias: ttArr(t, `${p}.preferencias`, DEFAULTS.preferencias),
    recomendaciones: tt(t, `${p}.recomendaciones`, DEFAULTS.recomendaciones),
    notas: tt(t, `${p}.notas`, DEFAULTS.notas),
  };
}

/** @deprecated Use getDemoPatient(t) instead for i18n support */
export const DEMO_PATIENT = getDemoPatient();

export function getDemoPlans(t?: TFunc) {
  const p = "settings.tours.demoData.plans";
  return PLAN_MACROS.map((macros, i) => ({
    nombre: tt(t, `${p}.${PLAN_KEYS[i]}`, DEFAULTS.planNames[i]),
    ...macros,
  }));
}

/** @deprecated Use getDemoPlans(t) instead for i18n support */
export const DEMO_PLANS = getDemoPlans();

export function getDemoDietaDias(t?: TFunc) {
  const p = "settings.tours.demoData.days";
  return DIETA_COMIDAS.map((dia, i) => ({
    nombre: tt(t, `${p}.${DAY_KEYS[i]}`, DEFAULTS.dayNames[i]),
    comidas: dia.comidas,
  }));
}

/** @deprecated Use getDemoDietaDias(t) instead for i18n support */
export const DEMO_DIETA_DIAS = getDemoDietaDias();

export function getDemoCitasSemana(t?: TFunc) {
  const p = "settings.tours.demoData.citas";
  const patientName = `${PATIENT_BASE.nombre} ${PATIENT_BASE.apellidos}`;
  return CITAS_BASE.map((cita) => ({
    dia: cita.dia,
    hora: cita.hora,
    duracion: cita.duracion,
    paciente: patientName,
    estado: cita.estado,
    motivo: tt(t, `${p}.${cita.motivoKey}`, DEFAULTS.motivos[cita.motivoKey as keyof typeof DEFAULTS.motivos]),
  }));
}

/** @deprecated Use getDemoCitasSemana(t) instead for i18n support */
export const DEMO_CITAS_SEMANA = getDemoCitasSemana();

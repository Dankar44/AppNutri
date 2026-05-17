/** Base de datos de ejercicios con valores MET (Compendio de Actividades Físicas). */

export interface EjercicioBase {
  /** Translation key for the exercise name (under patient-portal.seguimiento.ejercicios.nombres.*) */
  nombreKey: string;
  /** Fallback Spanish name (used when no t() is available) */
  nombre: string;
  met: number;
}

export const EJERCICIOS_DB: EjercicioBase[] = [
  // Caminar / Correr
  { nombreKey: "caminarNormal", nombre: "Caminar (ritmo normal)", met: 3.5 },
  { nombreKey: "caminarRapido", nombre: "Caminar (ritmo rápido)", met: 5.0 },
  { nombreKey: "marchaNordica", nombre: "Marcha nórdica", met: 6.0 },
  { nombreKey: "correrSuave", nombre: "Correr (ritmo suave)", met: 7.0 },
  { nombreKey: "correrModerado", nombre: "Correr (ritmo moderado)", met: 9.8 },
  { nombreKey: "correrIntenso", nombre: "Correr (ritmo intenso)", met: 12.0 },
  { nombreKey: "sprint", nombre: "Sprint", met: 15.0 },
  { nombreKey: "trailRunning", nombre: "Trail running", met: 9.0 },
  { nombreKey: "carreraEnCinta", nombre: "Carrera en cinta", met: 8.0 },
  // Ciclismo
  { nombreKey: "ciclismoPaseo", nombre: "Ciclismo (paseo)", met: 4.0 },
  { nombreKey: "ciclismoModerado", nombre: "Ciclismo (moderado)", met: 6.8 },
  { nombreKey: "ciclismoIntenso", nombre: "Ciclismo (intenso)", met: 10.0 },
  { nombreKey: "ciclismoBmx", nombre: "Ciclismo BMX", met: 8.5 },
  { nombreKey: "ciclismoSpinning", nombre: "Ciclismo (spinning)", met: 8.5 },
  { nombreKey: "ciclismoMontana", nombre: "Ciclismo de montaña", met: 8.5 },
  { nombreKey: "bicicletaEstaticaSuave", nombre: "Bicicleta estática (suave)", met: 3.5 },
  { nombreKey: "bicicletaEstaticaIntensa", nombre: "Bicicleta estática (intensa)", met: 8.5 },
  // Natación / Acuáticos
  { nombreKey: "natacionSuave", nombre: "Natación (suave)", met: 5.0 },
  { nombreKey: "natacionModerada", nombre: "Natación (moderada)", met: 7.0 },
  { nombreKey: "natacionIntensa", nombre: "Natación (intensa)", met: 9.8 },
  { nombreKey: "aquagym", nombre: "Aquagym", met: 5.5 },
  { nombreKey: "waterpolo", nombre: "Waterpolo", met: 10.0 },
  { nombreKey: "surf", nombre: "Surf", met: 3.0 },
  { nombreKey: "kayak", nombre: "Kayak", met: 5.0 },
  { nombreKey: "remoEnAgua", nombre: "Remo en agua", met: 7.0 },
  // Gimnasio / Fitness
  { nombreKey: "musculacionModerada", nombre: "Musculación (moderada)", met: 5.0 },
  { nombreKey: "musculacionIntensa", nombre: "Musculación (intensa)", met: 6.0 },
  { nombreKey: "crossfit", nombre: "CrossFit", met: 8.0 },
  { nombreKey: "hiit", nombre: "HIIT", met: 9.0 },
  { nombreKey: "circuitoFuerza", nombre: "Circuito de fuerza", met: 7.0 },
  { nombreKey: "eliptica", nombre: "Elíptica", met: 5.0 },
  { nombreKey: "elipticaIntensa", nombre: "Elíptica (intensa)", met: 8.0 },
  { nombreKey: "remoMaquina", nombre: "Remo (máquina)", met: 7.0 },
  { nombreKey: "remoMaquinaIntenso", nombre: "Remo (máquina, intenso)", met: 8.5 },
  { nombreKey: "escaladora", nombre: "Escaladora (stairmaster)", met: 9.0 },
  { nombreKey: "saltarCuerda", nombre: "Saltar a la cuerda", met: 12.3 },
  { nombreKey: "battleRopes", nombre: "Battle ropes", met: 10.0 },
  { nombreKey: "kettlebell", nombre: "Kettlebell", met: 6.0 },
  { nombreKey: "calistenia", nombre: "Calistenia", met: 5.5 },
  { nombreKey: "trxSuspension", nombre: "TRX / Suspensión", met: 5.5 },
  // Deportes de raqueta
  { nombreKey: "tenisIndividual", nombre: "Tenis (individual)", met: 7.3 },
  { nombreKey: "tenisDobles", nombre: "Tenis (dobles)", met: 5.0 },
  { nombreKey: "padel", nombre: "Pádel", met: 6.0 },
  { nombreKey: "badminton", nombre: "Bádminton", met: 5.5 },
  { nombreKey: "squash", nombre: "Squash", met: 7.3 },
  { nombreKey: "pingPong", nombre: "Ping pong", met: 4.0 },
  // Deportes de equipo
  { nombreKey: "futbol", nombre: "Fútbol", met: 7.0 },
  { nombreKey: "futbolSala", nombre: "Fútbol sala", met: 7.0 },
  { nombreKey: "baloncesto", nombre: "Baloncesto", met: 6.5 },
  { nombreKey: "balonmano", nombre: "Balonmano", met: 8.0 },
  { nombreKey: "voleibol", nombre: "Voleibol", met: 4.0 },
  { nombreKey: "voleibolPlaya", nombre: "Voleibol playa", met: 8.0 },
  { nombreKey: "rugby", nombre: "Rugby", met: 8.3 },
  { nombreKey: "hockey", nombre: "Hockey", met: 7.8 },
  { nombreKey: "beisbol", nombre: "Béisbol", met: 5.0 },
  // Artes marciales / Combate
  { nombreKey: "boxeoEntrenamiento", nombre: "Boxeo (entrenamiento)", met: 7.8 },
  { nombreKey: "boxeoSparring", nombre: "Boxeo (sparring)", met: 9.0 },
  { nombreKey: "kickboxing", nombre: "Kickboxing", met: 7.5 },
  { nombreKey: "judo", nombre: "Judo", met: 7.0 },
  { nombreKey: "karate", nombre: "Karate", met: 6.5 },
  { nombreKey: "taekwondo", nombre: "Taekwondo", met: 7.0 },
  { nombreKey: "mma", nombre: "MMA", met: 8.0 },
  { nombreKey: "artesMarciales", nombre: "Artes marciales (general)", met: 7.5 },
  { nombreKey: "esgrima", nombre: "Esgrima", met: 6.0 },
  // Yoga / Mindfulness
  { nombreKey: "yogaHatha", nombre: "Yoga (hatha)", met: 3.0 },
  { nombreKey: "yogaVinyasa", nombre: "Yoga (vinyasa/power)", met: 5.0 },
  { nombreKey: "pilates", nombre: "Pilates", met: 3.8 },
  { nombreKey: "taiChi", nombre: "Tai Chi", met: 3.0 },
  { nombreKey: "estiramientos", nombre: "Estiramientos", met: 2.3 },
  // Baile
  { nombreKey: "baileGeneral", nombre: "Baile (general)", met: 5.0 },
  { nombreKey: "zumba", nombre: "Zumba", met: 6.5 },
  { nombreKey: "aerobic", nombre: "Aeróbic", met: 6.5 },
  { nombreKey: "salsaBachata", nombre: "Salsa / Bachata", met: 5.5 },
  { nombreKey: "danzaContemporanea", nombre: "Danza contemporánea", met: 5.0 },
  { nombreKey: "flamenco", nombre: "Flamenco", met: 4.5 },
  // Montaña / Outdoor
  { nombreKey: "senderismo", nombre: "Senderismo", met: 6.0 },
  { nombreKey: "senderismoMontana", nombre: "Senderismo (montaña)", met: 7.5 },
  { nombreKey: "escaladaRoca", nombre: "Escalada (roca)", met: 8.0 },
  { nombreKey: "escaladaRocodromo", nombre: "Escalada (rocódromo)", met: 5.8 },
  { nombreKey: "esquiAlpino", nombre: "Esquí alpino", met: 5.3 },
  { nombreKey: "esquiFondo", nombre: "Esquí de fondo", met: 9.0 },
  { nombreKey: "snowboard", nombre: "Snowboard", met: 5.3 },
  { nombreKey: "patinajeHielo", nombre: "Patinaje sobre hielo", met: 5.5 },
  { nombreKey: "patinajeLinea", nombre: "Patinaje en línea", met: 7.5 },
  // Otros
  { nombreKey: "golfCaminando", nombre: "Golf (caminando)", met: 4.3 },
  { nombreKey: "golfCarro", nombre: "Golf (con carro)", met: 3.5 },
  { nombreKey: "equitacion", nombre: "Equitación", met: 3.8 },
  { nombreKey: "tiroConArco", nombre: "Tiro con arco", met: 3.5 },
  { nombreKey: "bolos", nombre: "Bolos", met: 3.0 },
  { nombreKey: "frisbee", nombre: "Frisbee / Ultimate", met: 3.5 },
  { nombreKey: "parkour", nombre: "Parkour", met: 8.0 },
  { nombreKey: "skateboard", nombre: "Skateboard", met: 5.0 },
  { nombreKey: "gimnasiaRitmica", nombre: "Gimnasia rítmica", met: 4.0 },
  { nombreKey: "gimnasiaArtistica", nombre: "Gimnasia artística", met: 4.0 },
  { nombreKey: "saltoTrampolin", nombre: "Salto de trampolín", met: 3.5 },
  { nombreKey: "buceo", nombre: "Buceo", met: 3.0 },
  { nombreKey: "snorkel", nombre: "Snorkel", met: 5.0 },
  { nombreKey: "vela", nombre: "Vela", met: 3.0 },
  { nombreKey: "trabajoJardin", nombre: "Trabajo en jardín / huerto", met: 4.0 },
  { nombreKey: "tareasDomesticas", nombre: "Tareas domésticas (intensas)", met: 3.5 },
  { nombreKey: "subirEscaleras", nombre: "Subir escaleras", met: 8.0 },
];

/**
 * Resolve the display name for an exercise.
 * If t() is provided, uses the translation key; otherwise falls back to the Spanish nombre.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TFunc = (key: string, values?: Record<string, any>) => string;

export function getEjercicioNombre(ej: EjercicioBase, t?: TFunc): string {
  if (t) {
    try {
      return t(`patient-portal.seguimiento.ejercicios.nombres.${ej.nombreKey}`);
    } catch {
      return ej.nombre;
    }
  }
  return ej.nombre;
}

/** Opciones de frecuencia semanal */
export interface FrecuenciaOption {
  value: number;
  labelKey: string;
  label: string;
}

export const FRECUENCIAS: readonly FrecuenciaOption[] = [
  { value: 1, labelKey: "freq1", label: "1 vez/semana" },
  { value: 2, labelKey: "freq2", label: "2 veces/semana" },
  { value: 3, labelKey: "freq3", label: "3 veces/semana" },
  { value: 4, labelKey: "freq4", label: "4 veces/semana" },
  { value: 5, labelKey: "freq5", label: "5 veces/semana" },
  { value: 6, labelKey: "freq6", label: "6 veces/semana" },
  { value: 7, labelKey: "freq7", label: "Todos los días" },
] as const;

export function getFrecuenciaLabel(f: FrecuenciaOption, t?: TFunc): string {
  if (t) {
    try {
      return t(`patient-portal.seguimiento.ejercicios.frecuencias.${f.labelKey}`);
    } catch {
      return f.label;
    }
  }
  return f.label;
}

/** Opciones de ingesta de agua */
export interface AguaOption {
  key: string;
  label: string;
}

export const OPCIONES_AGUA: readonly AguaOption[] = [
  { key: "menosDe05", label: "Menos de 0,5 litros" },
  { key: "entre05y1", label: "Entre 0,5 y 1 litro" },
  { key: "entre1y15", label: "Entre 1 y 1,5 litros" },
  { key: "entre15y2", label: "Entre 1,5 y 2 litros" },
  { key: "entre2y25", label: "Entre 2 y 2,5 litros" },
  { key: "entre25y3", label: "Entre 2,5 y 3 litros" },
  { key: "masDe3", label: "Más de 3 litros" },
] as const;

export function getAguaLabel(a: AguaOption, t?: TFunc): string {
  if (t) {
    try {
      return t(`patient-portal.seguimiento.ejercicios.agua.${a.key}`);
    } catch {
      return a.label;
    }
  }
  return a.label;
}

/** Sugerencias de alimentos a evitar */
export interface AlimentoEvitarOption {
  key: string;
  label: string;
}

export const SUGERENCIAS_ALIMENTOS_EVITAR: readonly AlimentoEvitarOption[] = [
  { key: "grasasTrans", label: "Alimentos ricos en grasas trans" },
  { key: "precocinados", label: "Alimentos precocinados" },
  { key: "fastFood", label: "Fast food" },
  { key: "patatasFritas", label: "Patatas fritas" },
  { key: "conservas", label: "Conservas" },
  { key: "embutidos", label: "Embutidos" },
  { key: "carnesProcesadas", label: "Carnes procesadas" },
  { key: "salsas", label: "Salsas" },
  { key: "harinasRefinadas", label: "Harinas refinadas" },
  { key: "bebidasAlcoholicas", label: "Bebidas alcohólicas" },
  { key: "bebidasRefrescantes", label: "Bebidas refrescantes" },
  { key: "dulces", label: "Dulces (azúcar, miel, mermelada)" },
] as const;

export function getAlimentoEvitarLabel(a: AlimentoEvitarOption, t?: TFunc): string {
  if (t) {
    try {
      return t(`patient-portal.seguimiento.ejercicios.alimentosEvitar.${a.key}`);
    } catch {
      return a.label;
    }
  }
  return a.label;
}

/**
 * Calcula kcal gastadas en una sesión de ejercicio.
 * Formula: MET x peso(kg) x duración(horas)
 */
export function calcularGastoActividad(
  met: number,
  pesoKg: number,
  duracionMinutos: number
): number {
  return Math.round(met * pesoKg * (duracionMinutos / 60));
}

/**
 * Calcula el promedio diario de kcal para un ejercicio.
 * Formula: gasto_por_sesión x frecuencia_semanal / 7
 */
export function calcularPromedioDiario(
  gastoSesion: number,
  frecuenciaSemanal: number
): number {
  return Math.round(gastoSesion * frecuenciaSemanal / 7);
}

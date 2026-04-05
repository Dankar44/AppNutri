/** Base de datos de ejercicios con valores MET (Compendio de Actividades Físicas). */

export interface EjercicioBase {
  nombre: string;
  met: number;
}

export const EJERCICIOS_DB: EjercicioBase[] = [
  { nombre: "Caminar (ritmo normal)", met: 3.5 },
  { nombre: "Caminar (ritmo rápido)", met: 5.0 },
  { nombre: "Correr (ritmo suave)", met: 7.0 },
  { nombre: "Correr (ritmo moderado)", met: 9.8 },
  { nombre: "Correr (ritmo intenso)", met: 12.0 },
  { nombre: "Ciclismo (paseo)", met: 4.0 },
  { nombre: "Ciclismo (moderado)", met: 6.8 },
  { nombre: "Ciclismo BMX", met: 8.5 },
  { nombre: "Ciclismo (spinning)", met: 8.5 },
  { nombre: "Natación (moderada)", met: 7.0 },
  { nombre: "Natación (intensa)", met: 9.8 },
  { nombre: "Yoga", met: 3.0 },
  { nombre: "Pilates", met: 3.8 },
  { nombre: "Saltar a la cuerda", met: 12.3 },
  { nombre: "Remo (máquina)", met: 7.0 },
  { nombre: "Elíptica", met: 5.0 },
  { nombre: "Aeróbic", met: 6.5 },
  { nombre: "Zumba", met: 6.5 },
  { nombre: "CrossFit", met: 8.0 },
  { nombre: "Musculación (moderada)", met: 5.0 },
  { nombre: "Musculación (intensa)", met: 6.0 },
  { nombre: "Fútbol", met: 7.0 },
  { nombre: "Baloncesto", met: 6.5 },
  { nombre: "Tenis (individual)", met: 7.3 },
  { nombre: "Pádel", met: 6.0 },
  { nombre: "Senderismo", met: 6.0 },
  { nombre: "Escalada", met: 8.0 },
  { nombre: "Boxeo (entrenamiento)", met: 7.8 },
  { nombre: "Artes marciales", met: 7.5 },
  { nombre: "Estiramientos", met: 2.3 },
  { nombre: "Tai Chi", met: 3.0 },
  { nombre: "Baile (general)", met: 5.0 },
];

/** Opciones de frecuencia semanal */
export const FRECUENCIAS = [
  { value: 1, label: "1 vez/semana" },
  { value: 2, label: "2 veces/semana" },
  { value: 3, label: "3 veces/semana" },
  { value: 4, label: "4 veces/semana" },
  { value: 5, label: "5 veces/semana" },
  { value: 6, label: "6 veces/semana" },
  { value: 7, label: "Todos los días" },
] as const;

/** Opciones de ingesta de agua */
export const OPCIONES_AGUA = [
  "Menos de 0,5 litros",
  "Entre 0,5 y 1 litro",
  "Entre 1 y 1,5 litros",
  "Entre 1,5 y 2 litros",
  "Entre 2 y 2,5 litros",
  "Entre 2,5 y 3 litros",
  "Más de 3 litros",
] as const;

/** Sugerencias de alimentos a evitar */
export const SUGERENCIAS_ALIMENTOS_EVITAR = [
  "Alimentos ricos en grasas trans",
  "Alimentos precocinados",
  "Fast food",
  "Patatas fritas",
  "Conservas",
  "Embutidos",
  "Carnes procesadas",
  "Salsas",
  "Harinas refinadas",
  "Bebidas alcohólicas",
  "Bebidas refrescantes",
  "Dulces (azúcar, miel, mermelada)",
] as const;

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

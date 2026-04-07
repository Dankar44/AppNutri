/** Base de datos de ejercicios con valores MET (Compendio de Actividades Físicas). */

export interface EjercicioBase {
  nombre: string;
  met: number;
}

export const EJERCICIOS_DB: EjercicioBase[] = [
  // Caminar / Correr
  { nombre: "Caminar (ritmo normal)", met: 3.5 },
  { nombre: "Caminar (ritmo rápido)", met: 5.0 },
  { nombre: "Marcha nórdica", met: 6.0 },
  { nombre: "Correr (ritmo suave)", met: 7.0 },
  { nombre: "Correr (ritmo moderado)", met: 9.8 },
  { nombre: "Correr (ritmo intenso)", met: 12.0 },
  { nombre: "Sprint", met: 15.0 },
  { nombre: "Trail running", met: 9.0 },
  { nombre: "Carrera en cinta", met: 8.0 },
  // Ciclismo
  { nombre: "Ciclismo (paseo)", met: 4.0 },
  { nombre: "Ciclismo (moderado)", met: 6.8 },
  { nombre: "Ciclismo (intenso)", met: 10.0 },
  { nombre: "Ciclismo BMX", met: 8.5 },
  { nombre: "Ciclismo (spinning)", met: 8.5 },
  { nombre: "Ciclismo de montaña", met: 8.5 },
  { nombre: "Bicicleta estática (suave)", met: 3.5 },
  { nombre: "Bicicleta estática (intensa)", met: 8.5 },
  // Natación / Acuáticos
  { nombre: "Natación (suave)", met: 5.0 },
  { nombre: "Natación (moderada)", met: 7.0 },
  { nombre: "Natación (intensa)", met: 9.8 },
  { nombre: "Aquagym", met: 5.5 },
  { nombre: "Waterpolo", met: 10.0 },
  { nombre: "Surf", met: 3.0 },
  { nombre: "Kayak", met: 5.0 },
  { nombre: "Remo en agua", met: 7.0 },
  // Gimnasio / Fitness
  { nombre: "Musculación (moderada)", met: 5.0 },
  { nombre: "Musculación (intensa)", met: 6.0 },
  { nombre: "CrossFit", met: 8.0 },
  { nombre: "HIIT", met: 9.0 },
  { nombre: "Circuito de fuerza", met: 7.0 },
  { nombre: "Elíptica", met: 5.0 },
  { nombre: "Elíptica (intensa)", met: 8.0 },
  { nombre: "Remo (máquina)", met: 7.0 },
  { nombre: "Remo (máquina, intenso)", met: 8.5 },
  { nombre: "Escaladora (stairmaster)", met: 9.0 },
  { nombre: "Saltar a la cuerda", met: 12.3 },
  { nombre: "Battle ropes", met: 10.0 },
  { nombre: "Kettlebell", met: 6.0 },
  { nombre: "Calistenia", met: 5.5 },
  { nombre: "TRX / Suspensión", met: 5.5 },
  // Deportes de raqueta
  { nombre: "Tenis (individual)", met: 7.3 },
  { nombre: "Tenis (dobles)", met: 5.0 },
  { nombre: "Pádel", met: 6.0 },
  { nombre: "Bádminton", met: 5.5 },
  { nombre: "Squash", met: 7.3 },
  { nombre: "Ping pong", met: 4.0 },
  // Deportes de equipo
  { nombre: "Fútbol", met: 7.0 },
  { nombre: "Fútbol sala", met: 7.0 },
  { nombre: "Baloncesto", met: 6.5 },
  { nombre: "Balonmano", met: 8.0 },
  { nombre: "Voleibol", met: 4.0 },
  { nombre: "Voleibol playa", met: 8.0 },
  { nombre: "Rugby", met: 8.3 },
  { nombre: "Hockey", met: 7.8 },
  { nombre: "Béisbol", met: 5.0 },
  // Artes marciales / Combate
  { nombre: "Boxeo (entrenamiento)", met: 7.8 },
  { nombre: "Boxeo (sparring)", met: 9.0 },
  { nombre: "Kickboxing", met: 7.5 },
  { nombre: "Judo", met: 7.0 },
  { nombre: "Karate", met: 6.5 },
  { nombre: "Taekwondo", met: 7.0 },
  { nombre: "MMA", met: 8.0 },
  { nombre: "Artes marciales (general)", met: 7.5 },
  { nombre: "Esgrima", met: 6.0 },
  // Yoga / Mindfulness
  { nombre: "Yoga (hatha)", met: 3.0 },
  { nombre: "Yoga (vinyasa/power)", met: 5.0 },
  { nombre: "Pilates", met: 3.8 },
  { nombre: "Tai Chi", met: 3.0 },
  { nombre: "Estiramientos", met: 2.3 },
  // Baile
  { nombre: "Baile (general)", met: 5.0 },
  { nombre: "Zumba", met: 6.5 },
  { nombre: "Aeróbic", met: 6.5 },
  { nombre: "Salsa / Bachata", met: 5.5 },
  { nombre: "Danza contemporánea", met: 5.0 },
  { nombre: "Flamenco", met: 4.5 },
  // Montaña / Outdoor
  { nombre: "Senderismo", met: 6.0 },
  { nombre: "Senderismo (montaña)", met: 7.5 },
  { nombre: "Escalada (roca)", met: 8.0 },
  { nombre: "Escalada (rocódromo)", met: 5.8 },
  { nombre: "Esquí alpino", met: 5.3 },
  { nombre: "Esquí de fondo", met: 9.0 },
  { nombre: "Snowboard", met: 5.3 },
  { nombre: "Patinaje sobre hielo", met: 5.5 },
  { nombre: "Patinaje en línea", met: 7.5 },
  // Otros
  { nombre: "Golf (caminando)", met: 4.3 },
  { nombre: "Golf (con carro)", met: 3.5 },
  { nombre: "Equitación", met: 3.8 },
  { nombre: "Tiro con arco", met: 3.5 },
  { nombre: "Bolos", met: 3.0 },
  { nombre: "Frisbee / Ultimate", met: 3.5 },
  { nombre: "Parkour", met: 8.0 },
  { nombre: "Skateboard", met: 5.0 },
  { nombre: "Gimnasia rítmica", met: 4.0 },
  { nombre: "Gimnasia artística", met: 4.0 },
  { nombre: "Salto de trampolín", met: 3.5 },
  { nombre: "Buceo", met: 3.0 },
  { nombre: "Snorkel", met: 5.0 },
  { nombre: "Vela", met: 3.0 },
  { nombre: "Trabajo en jardín / huerto", met: 4.0 },
  { nombre: "Tareas domésticas (intensas)", met: 3.5 },
  { nombre: "Subir escaleras", met: 8.0 },
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

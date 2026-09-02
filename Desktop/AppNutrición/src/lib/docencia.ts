/**
 * #39 (issue #31) — Módulo docente: piezas compartidas entre servidor y cliente.
 *
 * Aquí solo hay funciones puras y constantes. Las consultas y las acciones viven en
 * `src/app/actions/docencia.ts` (profesor) y `admin-docencia.ts` (administración).
 */

/**
 * El profesor tiene UNA cuenta con dos espacios: el docente (sus clases y sus casos) y el
 * profesional (sus propios pacientes, igual que cualquier otro nutricionista). Se pasa de uno a
 * otro con enlaces normales, sin recordar nada: al entrar aterriza siempre en el docente, que es
 * su cuenta principal, y eso lo decide `/entrar` en el servidor tras identificarse.
 *
 * Hubo una cookie para recordar el espacio y se quitó el 27 ago 2026: el enlace que la borraba
 * era un GET colgado de un <Link>, y el prefetch de Next lo disparaba solo al entrar el menú en
 * pantalla, así que la cuenta profesional se cerraba sola. Sin cookie no hay nada que disparar.
 */

/**
 * Curso académico en el formato en el que lo dicen las universidades ("2026/27").
 * El curso va de septiembre a agosto: en julio de 2027 seguimos en el curso 2026/27.
 */
export function cursoActual(hoy: Date = new Date()): string {
  const anioInicio = hoy.getMonth() >= 8 ? hoy.getFullYear() : hoy.getFullYear() - 1;
  return `${anioInicio}/${String((anioInicio + 1) % 100).padStart(2, "0")}`;
}

/**
 * El curso que se está CONTRATANDO, que no siempre es el que está en marcha: a partir de junio
 * ya se vende el que empieza en septiembre. En agosto de 2026 se contrata el 2026/27, no el
 * 2025/26 que está acabando. (Guillermo, 30 ago 2026: "el curso pone 25/26, será 26/27, ¿no?")
 */
export function cursoQueSeContrata(hoy: Date = new Date()): string {
  const anioInicio = hoy.getMonth() >= 5 ? hoy.getFullYear() : hoy.getFullYear() - 1;
  return `${anioInicio}/${String((anioInicio + 1) % 100).padStart(2, "0")}`;
}

/**
 * Fin del curso que se contrata, en formato de campo de fecha (YYYY-MM-DD): el 31 de agosto con
 * el que acaba ese curso. Para el 2026/27, el 31 de agosto de 2027.
 */
export function finDeCursoPorDefecto(hoy: Date = new Date()): string {
  const anioFin = Number(cursoQueSeContrata(hoy).slice(0, 4)) + 1;
  return `${anioFin}-08-31`;
}

/**
 * Una licencia caducada NO echa al profesor: conserva su cuenta, sus casos y el trabajo del
 * curso pasado. Lo que pierde es la capacidad de dar de alta alumnos hasta que se renueve.
 */
export function licenciaVigente(
  licencia: { activa: boolean; fechaFin: Date | null } | null | undefined,
  hoy: Date = new Date(),
): boolean {
  if (!licencia || !licencia.activa) return false;
  if (!licencia.fechaFin) return true;
  // La fecha se elige en un selector de día y se guarda a medianoche UTC, así que comparar tal
  // cual dejaría la licencia caducada durante todo el día que el administrador ha puesto como
  // último. Quien escribe "hasta el 31 de agosto" espera que el 31 de agosto siga funcionando.
  //
  // El final del día se calcula en UTC, no en la hora del servidor: si no, el resultado cambia
  // según dónde esté corriendo la aplicación, y en España, entre medianoche y las dos de la
  // mañana, una licencia que acababa hoy salía caducada (visto el 2 sep 2026).
  const finDelDia = new Date(licencia.fechaFin);
  finDelDia.setUTCHours(23, 59, 59, 999);
  return finDelDia.getTime() >= hoy.getTime();
}

/**
 * Dominios de una licencia, ya troceados. El campo guarda una lista separada por comas porque
 * en la misma universidad el profesor y el alumno tienen dominios distintos: en la Rey Juan
 * Carlos el profesor es `@urjc.es` y el alumno `@alumnos.urjc.es`.
 */
export function dominiosDeLicencia(dominioEmail: string | null | undefined): string[] {
  if (!dominioEmail) return [];
  return dominioEmail
    .split(",")
    .map((d) => d.trim().toLowerCase().replace(/^@/, ""))
    .filter(Boolean);
}

/**
 * ¿El correo pertenece a alguno de los dominios de la institución?
 *
 * Se usa solo para AVISAR, nunca para bloquear: hay profesores de universidad dados de alta con
 * Gmail, y un bloqueo por dominio los dejaría fuera. La decisión es de Guillermo (27 ago 2026).
 */
export function emailDelDominio(email: string, dominioEmail: string | null | undefined): boolean {
  const dominios = dominiosDeLicencia(dominioEmail);
  if (dominios.length === 0) return true;
  const limpio = email.trim().toLowerCase();
  // `.endsWith(".ua.es")` además de `@ua.es` para que un subdominio (alu.ua.es) cuente como
  // de la casa cuando solo se ha configurado el dominio principal.
  return dominios.some((d) => limpio.endsWith(`@${d}`) || limpio.endsWith(`.${d}`));
}

/**
 * Rutas que pertenecen al espacio docente. El menú se decide por la dirección en la que estás, no
 * por un estado guardado: así no hay nada que recordar ni que se pueda desincronizar, y el enlace
 * del menú sigue siendo un enlace normal (un GET con efectos ya nos costó un fallo, 27 ago 2026).
 */
export function esRutaDocente(pathname: string, espacio?: string | null): boolean {
  if (pathname === "/profesor" || pathname.startsWith("/profesor/")) return true;
  if (pathname === "/aula" || pathname.startsWith("/aula/")) return true;
  // Dietas, alimentos y recetas son de los dos espacios: las usa el profesor con su clase y el
  // nutricionista con sus pacientes. Como la dirección es la misma, el enlace del menú docente
  // lleva `?espacio=docente` y así al entrar ahí no se le cambia el menú por el de nutricionista,
  // que era lo que hacía desaparecer "Clases" al primer clic. Sigue siendo un enlace normal, sin
  // efectos: el prefetch puede dispararlo tantas veces como quiera.
  return (espacio === "docente" || espacio === "aula")
    && RUTAS_COMPARTIDAS.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

/**
 * Rutas que son de los DOS espacios: el material que el profesor comparte con su clase y que
 * también usa en su consulta, los ajustes y las novedades, que son de la cuenta entera, y los
 * pacientes — porque los casos de clase del alumno SON pacientes suyos y los trabaja ahí.
 */
export const RUTAS_COMPARTIDAS = ["/dietas", "/alimentos", "/recetas", "/ajustes", "/novedades", "/pacientes"] as const;

/**
 * ¿Se ha acabado ya el curso de una clase?
 *
 * Misma regla que la licencia: quien escribe "hasta el 31 de agosto" espera que el 31 de agosto
 * todavía se pueda entrar. Sin fecha, el curso no termina solo; lo cierra el profesor.
 */
export function cursoTerminado(fechaFinCurso: Date | null | undefined, hoy: Date = new Date()): boolean {
  if (!fechaFinCurso) return false;
  const finDelDia = new Date(fechaFinCurso);
  finDelDia.setUTCHours(23, 59, 59, 999);
  return finDelDia.getTime() < hoy.getTime();
}

/**
 * El primer instante del día de hoy en UTC: el corte con el que se filtran los cursos vivos en la
 * base de datos. Es el equivalente en consulta a `cursoTerminado`, y por eso también va en UTC —
 * las dos formas de preguntar lo mismo tienen que contestar lo mismo a cualquier hora.
 */
export function inicioDeHoy(hoy: Date = new Date()): Date {
  const d = new Date(hoy);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Días que quedan de curso, o null si no tiene fecha de fin. Negativo si ya pasó. */
export function diasDeCursoQueQuedan(fechaFinCurso: Date | null | undefined, hoy: Date = new Date()): number | null {
  if (!fechaFinCurso) return null;
  const fin = new Date(fechaFinCurso);
  fin.setHours(23, 59, 59, 999);
  return Math.ceil((fin.getTime() - hoy.getTime()) / (24 * 60 * 60 * 1000));
}

/**
 * #39 — Condición de "esta clase la llevo yo".
 *
 * Una clase puede tener varios profesores (Guillermo, 1 sep 2026): el que la creó y los que se
 * añaden después. Está aquí, en un solo sitio, porque se usa en todas las acciones de la clase y
 * cualquier despiste dejaría a un profesor tocando la clase de otra facultad.
 */
export function claseQueLleva(profesorId: string) {
  return {
    OR: [
      { profesorId },
      { profesores: { some: { profesorId } } },
    ],
  };
}

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
 * Fin del curso que se contrata, en formato de campo de fecha (YYYY-MM-DD): el 31 de agosto con el
 * que acaba. A partir de junio ya se vende el curso que empieza en septiembre, así que en agosto
 * de 2026 el fin es el 31/08/2027; en marzo de 2027, también (Guillermo, 30 ago y 4 sep 2026).
 */
export function finDeCursoPorDefecto(hoy: Date = new Date()): string {
  const anioInicio = hoy.getMonth() >= 5 ? hoy.getFullYear() : hoy.getFullYear() - 1;
  return `${anioInicio + 1}-08-31`;
}

/**
 * Hasta cuándo es alumno quien entró en una clase en `desde`: el 31 de agosto más próximo hacia
 * delante. Quien entra en septiembre lo es hasta el agosto siguiente; quien entra en marzo, hasta
 * ese mismo agosto (Guillermo, 4 sep 2026). Fin del día, en UTC, como el resto de fechas de día.
 */
export function finDeAnioEscolar(desde: Date): Date {
  const anio = desde.getUTCMonth() >= 8 ? desde.getUTCFullYear() + 1 : desde.getUTCFullYear();
  return new Date(Date.UTC(anio, 7, 31, 23, 59, 59, 999));
}

/**
 * El 1 de septiembre con el que empezó el curso en el que estamos. El complemento exacto de
 * `finDeAnioEscolar`: en octubre de 2026 devuelve el 1/09/2026, y en marzo de 2027 también.
 *
 * Es el corte con el que se cuentan las plazas de alumno vendidas: una plaza se consume para todo
 * el curso y no vuelve hasta el siguiente 1 de septiembre (Guillermo, 8 sep 2026).
 */
export function inicioDeAnioEscolar(hoy: Date = new Date()): Date {
  const anio = hoy.getUTCMonth() >= 8 ? hoy.getUTCFullYear() : hoy.getUTCFullYear() - 1;
  return new Date(Date.UTC(anio, 8, 1, 0, 0, 0, 0));
}

/**
 * Un curso escolar, del 1 de septiembre al 31 de agosto siguiente. Se identifica por el año en que
 * empieza: 2026 es el curso 2026/27.
 *
 * Se eligen así y no con dos fechas sueltas porque lo que se vende es un curso entero: poner el
 * inicio a mano dejaba licencias que empezaban un martes de septiembre y acababan el 31 de agosto,
 * y nada garantizaba que las dos fechas fueran del mismo curso (Guillermo, 8 sep 2026).
 */
export interface Curso {
  anio: number;
  /** «2026/27», para pintarlo. */
  etiqueta: string;
  /** 1 de septiembre de ese año, en UTC. */
  inicio: Date;
  /** 31 de agosto del siguiente, fin del día, en UTC. */
  fin: Date;
}

export function cursoDeAnio(anio: number): Curso {
  return {
    anio,
    etiqueta: `${anio}/${String(anio + 1).slice(2)}`,
    inicio: new Date(Date.UTC(anio, 8, 1, 0, 0, 0, 0)),
    fin: new Date(Date.UTC(anio + 1, 7, 31, 23, 59, 59, 999)),
  };
}

/** El curso en el que estamos: el que empezó el 1 de septiembre más reciente. */
export function cursoActual(hoy: Date = new Date()): Curso {
  return cursoDeAnio(hoy.getUTCMonth() >= 8 ? hoy.getUTCFullYear() : hoy.getUTCFullYear() - 1);
}

/** Los cursos que se pueden elegir: el de ahora y los tres siguientes. */
export function cursosParaElegir(hoy: Date = new Date()): Curso[] {
  const actual = cursoActual(hoy).anio;
  return [0, 1, 2, 3].map((n) => cursoDeAnio(actual + n));
}

/** De qué curso es una fecha de fin de licencia. Null si no tiene. */
export function cursoDeFechaFin(fechaFin: Date | null | undefined): Curso | null {
  if (!fechaFin) return null;
  const d = new Date(fechaFin);
  // El fin de curso es el 31 de agosto: el curso es el año anterior a ese agosto.
  return cursoDeAnio(d.getUTCMonth() >= 8 ? d.getUTCFullYear() : d.getUTCFullYear() - 1);
}

/** Inicio del curso por defecto: hoy, en formato de campo de fecha (YYYY-MM-DD). */
export function inicioDeCursoPorDefecto(hoy: Date = new Date()): string {
  return hoy.toISOString().slice(0, 10);
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

export type Espacio = "docente" | "aula";

/** La cookie donde el navegador recuerda en qué espacio estaba (ver espacioQueDicta). */
export const COOKIE_ESPACIO = "annonia-espacio";

/**
 * Qué espacio dicta una dirección por sí sola:
 *
 * - "docente" / "aula": las rutas propias de cada espacio, o una compartida con la marca `?espacio=`.
 * - "profesional": todo lo que es solo de la consulta (/dashboard, /agenda, /pagos, /mensajes…).
 * - null: una ruta compartida SIN marca (la ficha de un paciente, el editor de una dieta): no
 *   cambia nada y se sigue en el espacio en el que se estaba.
 *
 * Ese "se sigue donde se estaba" es lo que hace que el espacio sea un MODO y no una marca que se
 * pierde al primer salto: el profesor que abre la ficha del paciente de su caso y de ahí crea una
 * dieta pasa por /dietas/nuevo y el editor, que no llevan marca, y antes al llegar ahí el menú se
 * le cambiaba por el de nutricionista. El menú recuerda el último espacio dictado (en una cookie
 * que escribe el propio menú al pintarse, nunca un enlace con efectos) y solo cambia cuando una
 * dirección dicta otra cosa: «Mi cuenta profesional» lleva a /dashboard, que dicta "profesional".
 */
export function espacioQueDicta(pathname: string, espacio?: string | null): Espacio | "profesional" | null {
  if (pathname === "/profesor" || pathname.startsWith("/profesor/")) return "docente";
  if (pathname === "/aula" || pathname.startsWith("/aula/")) return "aula";
  if (espacio === "docente" || espacio === "aula") return espacio;
  if (RUTAS_COMPARTIDAS.some((r) => pathname === r || pathname.startsWith(`${r}/`))) return null;
  return "profesional";
}

/** El valor de la cookie, solo si es uno de los dos espacios. */
export function espacioGuardado(valor: string | undefined | null): Espacio | null {
  return valor === "docente" || valor === "aula" ? valor : null;
}

/**
 * Rutas que son de los DOS espacios: el material que el profesor comparte con su clase y que
 * también usa en su consulta, los ajustes y las novedades, que son de la cuenta entera, y los
 * pacientes — porque los casos de clase del alumno SON pacientes suyos y los trabaja ahí.
 *
 * Las notificaciones también, desde el 8 sep 2026: la campana está en la barra de los dos
 * espacios, y sin esto abrirla desde el aula te devolvía al menú de la consulta. Además la lista
 * enseña los avisos del espacio en el que estás, así que salir de él cambiaría lo que se ve.
 */
export const RUTAS_COMPARTIDAS = ["/dietas", "/alimentos", "/recetas", "/ajustes", "/novedades", "/pacientes", "/notificaciones"] as const;

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
  // En UTC, como `cursoTerminado`: las dos formas de mirar la misma fecha tienen que coincidir.
  const fin = new Date(fechaFinCurso);
  fin.setUTCHours(23, 59, 59, 999);
  return Math.ceil((fin.getTime() - hoy.getTime()) / (24 * 60 * 60 * 1000));
}

/**
 * #39 — Condición de "esta clase la llevo yo".
 *
 * Una clase puede tener varios profesores (Guillermo, 1 sep 2026): el que la creó y los que se
 * añaden después. Está aquí, en un solo sitio, porque se usa en todas las acciones de la clase y
 * cualquier despiste dejaría a un profesor tocando la clase de otra facultad.
 *
 * La clase es además de una universidad concreta, así que solo la lleva quien está en ELLA ahora
 * mismo (Guillermo, 6 sep 2026: quien sale de una facultad conserva su espacio docente pero deja
 * de tener acceso a las clases en las que estaba). Quien no está en ninguna universidad no lleva
 * ninguna clase; si vuelve a la suya, las recupera tal cual, porque nada se ha borrado.
 */
export function claseQueLleva(profesorId: string, licenciaId: string | null) {
  // Un `IN ()` vacío no casa con ninguna fila: es la forma honesta de decir "ninguna clase",
  // en vez de dejar la condición suelta y que se cuelen las de la universidad que dejó.
  if (!licenciaId) return { id: { in: [] as string[] } };
  return {
    licenciaDocenteId: licenciaId,
    OR: [
      { profesorId },
      { profesores: { some: { profesorId } } },
    ],
  };
}

/**
 * Una asignación con la que puedo trabajar: o el caso es mío, o llevo la clase donde está puesto.
 * Vive aquí porque lo usan tanto las acciones de casos como el endpoint del entregable en PDF.
 */
export function asignacionQuePuedoCorregir(profesorId: string, licenciaId: string | null) {
  return {
    OR: [
      { caso: { profesorId } },
      { clase: claseQueLleva(profesorId, licenciaId) },
    ],
  };
}

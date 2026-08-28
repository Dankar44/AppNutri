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
 * Una licencia caducada NO echa al profesor: conserva su cuenta, sus casos y el trabajo del
 * curso pasado. Lo que pierde es la capacidad de dar de alta alumnos hasta que se renueve.
 */
export function licenciaVigente(
  licencia: { activa: boolean; fechaFin: Date | null } | null | undefined,
  hoy: Date = new Date(),
): boolean {
  if (!licencia || !licencia.activa) return false;
  if (!licencia.fechaFin) return true;
  // La fecha se elige en un selector de día y se guarda a medianoche, así que comparar tal cual
  // dejaría la licencia caducada durante todo el día que el administrador ha puesto como último.
  // Quien escribe "hasta el 31 de agosto" espera que el 31 de agosto siga funcionando.
  const finDelDia = new Date(licencia.fechaFin);
  finDelDia.setHours(23, 59, 59, 999);
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

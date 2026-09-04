import { redirect } from "next/navigation";
import { esProfesor } from "@/app/actions/docencia";
import { getCurrentDietista } from "@/app/actions/auth";
import { revisarCursoDelAlumno } from "@/lib/docencia-acceso";

/**
 * #39 — Puerta de entrada tras identificarse: decide en el servidor a dónde va cada uno.
 * Un profesor aterriza en su espacio docente y un alumno en su aula, que son sus cuentas
 * principales; el resto, al panel de siempre.
 *
 * Existe por dos motivos, los dos comprobados el 27 y 28 de agosto de 2026:
 *
 * 1. Preguntarlo desde el navegador nada más iniciar sesión NO funciona: en ese instante la
 *    cookie de sesión todavía no ha llegado al servidor, así que la respuesta era siempre "no
 *    es profesor" y el profesor acababa en el panel de nutricionista. Aquí no pasa: la cookie
 *    viaja en la propia petición.
 * 2. Redirigir desde /dashboard llega tarde: cuando el panel ya ha empezado a enviarse, Next no
 *    puede devolver una redirección de verdad y la resuelve con un <meta refresh>, con lo que se
 *    veía el panel un segundo antes de saltar. Esta página no pinta nada, así que la redirección
 *    sale limpia.
 *
 * Sin sesión cae en /dashboard, que es quien manda a /login.
 */
export const dynamic = "force-dynamic";

export default async function EntrarPage() {
  if (await esProfesor()) redirect("/profesor");

  const dietista = await getCurrentDietista();
  if (dietista?.rolDocente === "ALUMNO") {
    // Se resuelve aquí y no en el panel: si se mirase después, un alumno cuyo curso acabó
    // aterrizaría un momento en el aula antes de que le dijeran que ya no está en clase.
    const { sigueSiendoAlumno, avisoPendiente } = await revisarCursoDelAlumno(dietista);
    if (sigueSiendoAlumno) redirect("/aula");
    if (avisoPendiente) redirect("/curso-terminado");
  }

  redirect("/dashboard");
}

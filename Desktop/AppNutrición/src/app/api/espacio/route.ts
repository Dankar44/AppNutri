import { NextResponse, type NextRequest } from "next/server";
import { ESPACIO_COOKIE } from "@/lib/docencia";

/**
 * #39 — Cambio de espacio del profesor (docente ⇄ profesional).
 *
 * Es una preferencia de interfaz, no un permiso: quien puede entrar al espacio docente lo
 * decide `rolDocente` en la base de datos, que se comprueba en cada página de /profesor.
 * Mismo enfoque que /api/locale con el idioma.
 *
 * La cookie es de SESIÓN a propósito: en cuanto el profesor vuelve a entrar otro día,
 * aterriza de nuevo en su espacio docente, que es su cuenta principal.
 */
export async function GET(request: NextRequest) {
  const destino = request.nextUrl.searchParams.get("a") === "profesional" ? "profesional" : "docente";
  const response = NextResponse.redirect(
    new URL(destino === "profesional" ? "/dashboard" : "/profesor", request.url),
  );

  if (destino === "profesional") {
    response.cookies.set(ESPACIO_COOKIE, "profesional", { path: "/", httpOnly: true, sameSite: "lax" });
  } else {
    response.cookies.delete(ESPACIO_COOKIE);
  }
  return response;
}

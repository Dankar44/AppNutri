import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

/**
 * Comprobación de estado.
 *
 * En desarrollo devuelve el detalle completo: es la forma más rápida de saber contra qué base
 * estás trabajando y qué variables faltan.
 *
 * En producción esta ruta está abierta a internet (el proxy la excluye), así que por
 * defecto NO revela ni cuántos nutricionistas hay ni el texto de los errores, que puede llevar
 * dentro la cadena de conexión. Para ver el detalle en producción hay que definir HEALTH_TOKEN
 * en el servidor y llamar con la cabecera `x-health-token`.
 */
export async function GET() {
  const esProduccion = process.env.NODE_ENV === "production";
  let detallado = !esProduccion;

  if (esProduccion) {
    const token = process.env.HEALTH_TOKEN;
    if (token) {
      const recibido = (await headers()).get("x-health-token");
      detallado = recibido === token;
    }
  }

  const checks: Record<string, string> = {};
  const problema = (e: unknown) =>
    detallado ? `ERROR: ${e instanceof Error ? e.message : String(e)}` : "ERROR";

  checks.DATABASE_URL = process.env.DATABASE_URL ? "set" : "MISSING";
  checks.SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ? "set" : "MISSING";
  checks.SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "set" : "MISSING";

  try {
    const count = await prisma.dietista.count();
    checks.prisma = detallado ? `OK (${count} dietistas)` : "OK";
  } catch (e) {
    checks.prisma = problema(e);
  }

  try {
    const rows = await prisma.$queryRawUnsafe<{ verificado: boolean }[]>(
      "SELECT verificado FROM dietistas LIMIT 1",
    );
    checks.verificado_column = detallado ? `OK (value: ${rows[0]?.verificado})` : "OK";
  } catch (e) {
    checks.verificado_column = problema(e);
  }

  if (detallado) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data, error } = await supabase.auth.getUser();
      checks.supabase_auth = error ? `No user (${error.message})` : `User: ${data.user?.email}`;
    } catch (e) {
      checks.supabase_auth = problema(e);
    }
  }

  return NextResponse.json(checks, { status: 200 });
}

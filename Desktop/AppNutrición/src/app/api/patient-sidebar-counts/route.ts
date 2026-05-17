import { NextResponse } from "next/server";
import { getContadorNoLeidosPaciente } from "@/app/actions/mensajes";
import { getContrapropuestasPendientesCount } from "@/app/actions/notificaciones-paciente";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [mensajesNoLeidos, contrapropuestas] = await Promise.all([
      getContadorNoLeidosPaciente(),
      getContrapropuestasPendientesCount(),
    ]);
    const badges: Record<string, number> = {};
    if (mensajesNoLeidos > 0) badges["/paciente/portal/mensajes"] = mensajesNoLeidos;
    if (contrapropuestas > 0) badges["/paciente/portal/citas"] = contrapropuestas;
    return NextResponse.json(
      { badges },
      { headers: { "Cache-Control": "private, max-age=15" } },
    );
  } catch (e) {
    console.error("[patient-sidebar-counts]", e);
    return NextResponse.json({ badges: {} });
  }
}

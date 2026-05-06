import { NextResponse } from "next/server";
import { getBadgesNavegacion } from "@/app/actions/notificaciones";
import { getConversacionesNoLeidasCount } from "@/app/actions/mensajes";
import { getNoLeidosSoporteCount } from "@/app/actions/soporte";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [convNoLeidas, soporteNoLeidos, badges] = await Promise.all([
      getConversacionesNoLeidasCount(),
      getNoLeidosSoporteCount(),
      getBadgesNavegacion(),
    ]);
    const mensajesCount = convNoLeidas + (soporteNoLeidos > 0 ? 1 : 0);
    return NextResponse.json({ mensajesCount, badges });
  } catch (e) {
    console.error("[sidebar-counts]", e);
    return NextResponse.json({ mensajesCount: 0, badges: {} });
  }
}

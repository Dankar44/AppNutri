import { NextResponse } from "next/server";
import { getBadgesNavegacion } from "@/app/actions/notificaciones";
import { getConversacionesNoLeidasCount } from "@/app/actions/mensajes";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [mensajesCount, badges] = await Promise.all([
      getConversacionesNoLeidasCount(),
      getBadgesNavegacion(),
    ]);
    return NextResponse.json({ mensajesCount, badges });
  } catch (e) {
    console.error("[sidebar-counts]", e);
    return NextResponse.json({ mensajesCount: 0, badges: {} });
  }
}

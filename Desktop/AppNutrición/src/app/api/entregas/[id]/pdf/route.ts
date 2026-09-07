import { NextResponse, type NextRequest } from "next/server";
import { getCurrentDietista } from "@/app/actions/auth";
import { prisma } from "@/lib/prisma";
import { generarPdfDeEntrega } from "@/lib/pdf-del-plan";

/**
 * #40 — El PDF que el alumno entregó con el caso, tal y como lo entregó.
 *
 * Lo pueden abrir dos personas: el alumno (es suyo) y el profesor del caso — el que lo creó o
 * cualquiera de los que llevan la clase. Nadie más: ni otro alumno de la clase ni otro profesor
 * de la facultad. Se sirve en línea (se abre en la pestaña), con su nombre para guardarlo.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const dietista = await getCurrentDietista();
  if (!dietista) return new NextResponse(null, { status: 401 });

  const { id } = await params;
  // El PDF no se guarda: se genera aquí, y sale igual que el día de la entrega porque entregar
  // cierra el caso y el alumno ya no puede tocarlo (7 sep 2026). Las opciones de presentación que
  // eligió al entregar van con la entrega.
  const entrega = await prisma.entregaCaso.findFirst({
    where: {
      id,
      OR: [
        { alumnoId: dietista.id },
        { asignacion: { caso: { profesorId: dietista.id } } },
        { asignacion: { clase: { profesores: { some: { profesorId: dietista.id } } } } },
      ],
    },
    select: { entregableNombre: true, entregaSnapshot: true },
  });
  if (!entrega) return new NextResponse(null, { status: 404 });

  const opciones = (entrega.entregaSnapshot as { entregable?: { sections?: unknown; displayOverrides?: unknown } } | null)?.entregable;
  const generado = await generarPdfDeEntrega(
    id,
    opciones?.sections as Parameters<typeof generarPdfDeEntrega>[1],
    opciones?.displayOverrides as Parameters<typeof generarPdfDeEntrega>[2],
  ).catch((e) => { console.error("[entregas/pdf] No se ha podido generar:", e); return null; });
  // Mismo 404 si no existe, si no es suya o si no llevaba entregable: no se revela nada.
  if (!generado) return new NextResponse(null, { status: 404 });

  const nombre = (entrega.entregableNombre ?? generado.nombre).replace(/[^\w.\-áéíóúÁÉÍÓÚñÑ]/g, "_");
  return new NextResponse(new Uint8Array(generado.pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${nombre}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

import { NextResponse, type NextRequest } from "next/server";
import { getCurrentDietista } from "@/app/actions/auth";
import { prisma } from "@/lib/prisma";

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
  const entrega = await prisma.entregaCaso.findFirst({
    where: {
      id,
      OR: [
        { alumnoId: dietista.id },
        { asignacion: { caso: { profesorId: dietista.id } } },
        { asignacion: { clase: { profesores: { some: { profesorId: dietista.id } } } } },
      ],
    },
    select: { entregablePdf: true, entregableNombre: true },
  });
  // Mismo 404 si no existe, si no es suya o si no lleva PDF: no se revela nada.
  if (!entrega?.entregablePdf) return new NextResponse(null, { status: 404 });

  const nombre = (entrega.entregableNombre ?? "entregable.pdf").replace(/[^\w.\-áéíóúÁÉÍÓÚñÑ]/g, "_");
  return new NextResponse(Buffer.from(entrega.entregablePdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${nombre}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

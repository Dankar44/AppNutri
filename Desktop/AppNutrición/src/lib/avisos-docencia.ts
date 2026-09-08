import type { PrismaClient } from "@/generated/prisma/client";
import { getTranslations } from "next-intl/server";

/**
 * El aviso al profesor de que tiene entregas esperando.
 *
 * El primer diseño avisaba en cada entrega. Con veinte alumnos eso es una lluvia de avisos por algo
 * que el profesor no va a atender de uno en uno (Guillermo, 8 sep 2026: "eso puede ser un poco
 * petada… prefiero que sea como ya ha acabado el período de esta clase, revisa las entregas").
 *
 * Así que se avisa UNA vez por asignación, cuando pasa la fecha límite, diciendo cuántas quedan por
 * corregir. Una asignación sin fecha límite no tiene final que anunciar, así que no genera aviso.
 *
 * No hay tarea programada: se mira cuando el profesor entra en su espacio, que es justo cuando el
 * aviso le sirve de algo. `avisoPlazoAt` es lo que impide repetirlo al día siguiente.
 */
export async function avisarDePlazosVencidos(prisma: PrismaClient): Promise<number> {
  // Solo el último mes: si el plazo venció hace medio año y nadie entregó, ya no hay nada que
  // anunciar y no tiene sentido seguir mirándolo en cada visita.
  const haceUnMes = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const vencidas = await prisma.asignacionCaso.findMany({
    where: {
      avisoPlazoAt: null,
      retiradaAt: null,
      fechaLimite: { lt: new Date(), gte: haceUnMes },
    },
    select: {
      id: true,
      casoId: true,
      caso: { select: { nombre: true, profesorId: true } },
      clase: { select: { nombre: true, profesores: { select: { profesorId: true } } } },
      entregas: {
        where: { estado: { in: ["ENTREGADA", "CORREGIDA"] } },
        select: { estado: true },
      },
    },
    take: 50,
  });
  if (vencidas.length === 0) return 0;

  const t = await getTranslations("validation");
  let avisadas = 0;

  for (const a of vencidas) {
    // Solo lo que queda por hacer: si ya están todas corregidas, no hay nada que revisar y el
    // aviso sería ruido. Se marca igual para no volver a mirarlo.
    // Si no hay nada por revisar no se avisa, y **tampoco se marca**: puede que alguien entregue
    // tarde, o que el profesor reabra una entrega, y entonces sí habrá algo que anunciar. Marcarlo
    // aquí dejaba la asignación muda para siempre (visto al montar el escenario de prueba, 8 sep
    // 2026: todas corregidas → cerrojo puesto → ningún aviso nunca más).
    const porRevisar = a.entregas.filter((e) => e.estado === "ENTREGADA").length;
    if (porRevisar === 0) continue;

    // Cerrojo: se marca ANTES de avisar, y solo si seguía sin marcar. Si dos peticiones entran a la
    // vez —dos profesores de la misma clase abriendo su espacio—, solo una pasa de aquí.
    const cerrojo = await prisma.asignacionCaso.updateMany({
      where: { id: a.id, avisoPlazoAt: null },
      data: { avisoPlazoAt: new Date() },
    });
    if (cerrojo.count === 0) continue;

    {
      const destinatarios = new Set(a.clase.profesores.map((p) => p.profesorId));
      destinatarios.add(a.caso.profesorId);
      const params = { n: porRevisar, caso: a.caso.nombre, clase: a.clase.nombre };
      await prisma.notificacion.createMany({
        data: Array.from(destinatarios).map((profesorId) => ({
          dietistaId: profesorId,
          tipo: "ENTREGA_RECIBIDA" as const,
          titulo: t("notificaciones.titulos.plazoTerminado"),
          mensaje: t("notificaciones.mensajes.plazoTerminado", params),
          tituloKey: "notificaciones.titulos.plazoTerminado",
          mensajeKey: "notificaciones.mensajes.plazoTerminado",
          params,
          enlace: `/profesor/casos/${a.casoId}`,
        })),
      });
      avisadas++;
    }
  }
  return avisadas;
}

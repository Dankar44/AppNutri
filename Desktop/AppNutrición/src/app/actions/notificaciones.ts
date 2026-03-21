"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import { TipoNotificacion } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";

export async function generarNotificaciones() {
  const dietista = await getCurrentDietista();
  if (!dietista) return;

  const hace24h = new Date();
  hace24h.setHours(hace24h.getHours() - 24);

  const hace30Dias = new Date();
  hace30Dias.setDate(hace30Dias.getDate() - 30);

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const manana = new Date(hoy);
  manana.setDate(manana.getDate() + 1);

  // Cargar todas las notificaciones recientes de una sola vez (evita N+1)
  const notificacionesRecientes = await prisma.notificacion.findMany({
    where: { dietistaId: dietista.id, createdAt: { gte: hace24h } },
    select: { tipo: true, mensaje: true },
  });
  const existeNotif = (tipo: TipoNotificacion, id: string) =>
    notificacionesRecientes.some((n) => n.tipo === tipo && n.mensaje.includes(id));

  // Datos necesarios en paralelo (3 queries en vez de separadas)
  const [citasHoy, pacientes, entradasHoy] = await Promise.all([
    prisma.cita.findMany({
      where: { dietistaId: dietista.id, fechaHora: { gte: hoy, lt: manana } },
      include: { paciente: { select: { nombre: true, apellidos: true } } },
    }),
    prisma.paciente.findMany({
      where: { dietistaId: dietista.id, activo: true },
      select: {
        id: true, nombre: true, apellidos: true,
        consultas: { orderBy: { fecha: "desc" }, take: 1, select: { fecha: true } },
        medidas: { orderBy: { fecha: "desc" }, take: 1, select: { fecha: true } },
      },
    }),
    prisma.entradaDiario.findMany({
      where: { createdAt: { gte: hoy }, paciente: { dietistaId: dietista.id } },
      select: { paciente: { select: { id: true, nombre: true, apellidos: true } } },
      distinct: ["pacienteId"],
    }),
  ]);

  // Preparar batch de notificaciones a crear
  const nuevas: {
    dietistaId: string;
    tipo: TipoNotificacion;
    titulo: string;
    mensaje: string;
    enlace: string;
  }[] = [];

  // Citas de hoy
  for (const cita of citasHoy) {
    if (!existeNotif("CITA_HOY", cita.id)) {
      const hora = new Date(cita.fechaHora).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
      nuevas.push({
        dietistaId: dietista.id,
        tipo: "CITA_HOY",
        titulo: `Cita a las ${hora}`,
        mensaje: `${cita.paciente.nombre} ${cita.paciente.apellidos} - ${cita.id}`,
        enlace: "/agenda",
      });
    }
  }

  // Pacientes sin consulta/medidas >30 días
  for (const p of pacientes) {
    if (p.consultas.length === 0 || new Date(p.consultas[0].fecha) < hace30Dias) {
      if (!existeNotif("PACIENTE_SIN_CONSULTA", p.id)) {
        nuevas.push({
          dietistaId: dietista.id,
          tipo: "PACIENTE_SIN_CONSULTA",
          titulo: "Paciente sin consulta reciente",
          mensaje: `${p.nombre} ${p.apellidos} lleva >30 días sin consulta - ${p.id}`,
          enlace: `/pacientes/${p.id}`,
        });
      }
    }
    if (p.medidas.length === 0 || new Date(p.medidas[0].fecha) < hace30Dias) {
      if (!existeNotif("PACIENTE_SIN_MEDIDAS", p.id)) {
        nuevas.push({
          dietistaId: dietista.id,
          tipo: "PACIENTE_SIN_MEDIDAS",
          titulo: "Paciente sin medidas recientes",
          mensaje: `${p.nombre} ${p.apellidos} lleva >30 días sin medidas - ${p.id}`,
          enlace: `/pacientes/${p.id}/medidas`,
        });
      }
    }
  }

  // Entradas de diario hoy
  for (const e of entradasHoy) {
    if (!existeNotif("DIARIO_NUEVO", e.paciente.id)) {
      nuevas.push({
        dietistaId: dietista.id,
        tipo: "DIARIO_NUEVO",
        titulo: "Nueva entrada en diario",
        mensaje: `${e.paciente.nombre} ${e.paciente.apellidos} registró comida hoy - ${e.paciente.id}`,
        enlace: `/pacientes/${e.paciente.id}/diario`,
      });
    }
  }

  // Insertar todas las notificaciones de una vez
  if (nuevas.length > 0) {
    await prisma.notificacion.createMany({ data: nuevas });
  }
}

export async function getNotificaciones(soloNoLeidas = false) {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  return prisma.notificacion.findMany({
    where: {
      dietistaId: dietista.id,
      ...(soloNoLeidas ? { leida: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getNotificacionesCount() {
  const dietista = await getCurrentDietista();
  if (!dietista) return 0;

  return prisma.notificacion.count({
    where: { dietistaId: dietista.id, leida: false },
  });
}

export async function marcarLeida(id: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) return;

  await prisma.notificacion.update({
    where: { id, dietistaId: dietista.id },
    data: { leida: true },
  });

  revalidatePath("/notificaciones");
  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
}

export async function marcarTodasLeidas() {
  const dietista = await getCurrentDietista();
  if (!dietista) return;

  await prisma.notificacion.updateMany({
    where: { dietistaId: dietista.id, leida: false },
    data: { leida: true },
  });

  revalidatePath("/notificaciones");
  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
}

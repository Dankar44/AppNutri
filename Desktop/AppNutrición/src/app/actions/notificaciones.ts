"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import { TipoNotificacion } from "@/generated/prisma/client";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { getLocale } from "@/i18n/locale";

const generacionEnCurso = new Map<string, number>();

export async function generarNotificaciones() {
  const dietista = await getCurrentDietista();
  if (!dietista) return;
  if (dietista.isDemo) return;

  const ahora = Date.now();
  const ultima = generacionEnCurso.get(dietista.id) ?? 0;
  if (ahora - ultima < 300_000) return;
  generacionEnCurso.set(dietista.id, ahora);

  const t = await getTranslations("validation");
  const locale = await getLocale();

  const hace24h = new Date();
  hace24h.setHours(hace24h.getHours() - 24);

  const hace7d = new Date();
  hace7d.setDate(hace7d.getDate() - 7);

  const hace30Dias = new Date();
  hace30Dias.setDate(hace30Dias.getDate() - 30);

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const manana = new Date(hoy);
  manana.setDate(manana.getDate() + 1);

  const notificacionesRecientes = await prisma.notificacion.findMany({
    where: { dietistaId: dietista.id, createdAt: { gte: hace7d } },
    select: { tipo: true, citaId: true, pacienteId: true, mensaje: true, createdAt: true },
  });
  const tiposPeriodicos: TipoNotificacion[] = ["PACIENTE_SIN_CONSULTA", "PACIENTE_SIN_MEDIDAS", "PLAN_ANTIGUO"];

  const existeCitaNotif = (tipo: TipoNotificacion, citaId: string) =>
    notificacionesRecientes.some(
      (n) => n.tipo === tipo && n.createdAt >= hace24h && n.citaId === citaId,
    );
  const existePacienteNotif = (tipo: TipoNotificacion, pacienteId: string) => {
    const corte = tiposPeriodicos.includes(tipo) ? hace7d : hace24h;
    return notificacionesRecientes.some(
      (n) => n.tipo === tipo && n.createdAt >= corte && n.pacienteId === pacienteId,
    );
  };

  // Datos necesarios en paralelo (3 queries en vez de separadas)
  const [citasHoy, pacientes, entradasHoy] = await Promise.all([
    prisma.cita.findMany({
      where: { dietistaId: dietista.id, fechaHora: { gte: hoy, lt: manana }, paciente: { esDemo: false } },
      include: { paciente: { select: { nombre: true, apellidos: true } } },
    }),
    prisma.paciente.findMany({
      where: { dietistaId: dietista.id, activo: true, esDemo: false },
      select: {
        id: true, nombre: true, apellidos: true,
        consultas: { orderBy: { fecha: "desc" }, take: 1, select: { fecha: true } },
        medidas: { orderBy: { fecha: "desc" }, take: 1, select: { fecha: true } },
      },
    }),
    prisma.seguimientoDiario.findMany({
      where: { createdAt: { gte: hoy }, paciente: { dietistaId: dietista.id, esDemo: false } },
      select: { paciente: { select: { id: true, nombre: true, apellidos: true } } },
      distinct: ["pacienteId"],
    }),
  ]);

  // Preparar batch de notificaciones a crear
  type NotifData = {
    dietistaId: string;
    pacienteId?: string;
    citaId?: string;
    tipo: TipoNotificacion;
    titulo: string;
    mensaje: string;
    tituloKey?: string;
    mensajeKey?: string;
    params?: Record<string, string>;
    enlace: string;
  };
  const nuevas: NotifData[] = [];

  // Citas de hoy
  for (const cita of citasHoy) {
    if (!existeCitaNotif("CITA_HOY", cita.id)) {
      const hora = new Date(cita.fechaHora).toLocaleTimeString(locale === "pt" ? "pt-BR" : "es-ES", { timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit" });
      const nombrePaciente = `${cita.paciente.nombre} ${cita.paciente.apellidos}`;
      nuevas.push({
        dietistaId: dietista.id,
        pacienteId: cita.pacienteId,
        citaId: cita.id,
        tipo: "CITA_HOY",
        titulo: t("notificaciones.titulos.citaHoy", { hora }),
        mensaje: nombrePaciente,
        tituloKey: "notificaciones.titulos.citaHoy",
        params: { hora, nombrePaciente },
        enlace: "/agenda",
      });
    }
  }

  // Pacientes sin consulta/medidas >30 días
  for (const p of pacientes) {
    const nombrePaciente = `${p.nombre} ${p.apellidos}`;
    if (p.consultas.length === 0 || new Date(p.consultas[0].fecha) < hace30Dias) {
      if (!existePacienteNotif("PACIENTE_SIN_CONSULTA", p.id)) {
        nuevas.push({
          dietistaId: dietista.id,
          pacienteId: p.id,
          tipo: "PACIENTE_SIN_CONSULTA",
          titulo: t("notificaciones.titulos.pacienteSinConsultaReciente"),
          mensaje: t("notificaciones.mensajes.pacienteSinConsulta", { nombrePaciente }),
          tituloKey: "notificaciones.titulos.pacienteSinConsultaReciente",
          mensajeKey: "notificaciones.mensajes.pacienteSinConsulta",
          params: { nombrePaciente },
          enlace: `/pacientes/${p.id}`,
        });
      }
    }
    if (p.medidas.length === 0 || new Date(p.medidas[0].fecha) < hace30Dias) {
      if (!existePacienteNotif("PACIENTE_SIN_MEDIDAS", p.id)) {
        nuevas.push({
          dietistaId: dietista.id,
          pacienteId: p.id,
          tipo: "PACIENTE_SIN_MEDIDAS",
          titulo: t("notificaciones.titulos.pacienteSinMedidasRecientes"),
          mensaje: t("notificaciones.mensajes.pacienteSinMedidas", { nombrePaciente }),
          tituloKey: "notificaciones.titulos.pacienteSinMedidasRecientes",
          mensajeKey: "notificaciones.mensajes.pacienteSinMedidas",
          params: { nombrePaciente },
          enlace: `/pacientes/${p.id}/medidas`,
        });
      }
    }
  }

  // Seguimientos registrados hoy
  for (const e of entradasHoy) {
    if (!existePacienteNotif("DIARIO_NUEVO", e.paciente.id)) {
      const nombrePaciente = `${e.paciente.nombre} ${e.paciente.apellidos}`;
      nuevas.push({
        dietistaId: dietista.id,
        pacienteId: e.paciente.id,
        tipo: "DIARIO_NUEVO",
        titulo: t("notificaciones.titulos.nuevoSeguimientoDiario"),
        mensaje: t("notificaciones.mensajes.pacienteRegistroSeguimiento", { nombrePaciente }),
        tituloKey: "notificaciones.titulos.nuevoSeguimientoDiario",
        mensajeKey: "notificaciones.mensajes.pacienteRegistroSeguimiento",
        params: { nombrePaciente },
        enlace: `/pacientes/${e.paciente.id}/seguimiento`,
      });
    }
  }

  // Stock bajo (solo si tiene empresa)
  const dietistaEmpresa = await prisma.dietista.findUnique({
    where: { id: dietista.id },
    select: { empresaId: true },
  });
  if (dietistaEmpresa?.empresaId) {
    const miembrosEmpresa = await prisma.dietista.findMany({
      where: { empresaId: dietistaEmpresa.empresaId },
      select: { id: true },
    });
    const memberIds = miembrosEmpresa.map((m) => m.id);
    const alimentosBajoStock = await prisma.alimento.findMany({
      where: {
        dietistaId: { in: memberIds },
        stock: { not: null },
        stockMinimo: { not: null },
      },
      select: { id: true, nombre: true, stock: true, stockMinimo: true },
    });

    const stockNotifRecientes = notificacionesRecientes.filter(
      (n) => n.tipo === "STOCK_BAJO" && n.createdAt >= hace24h,
    );

    for (const a of alimentosBajoStock) {
      if (a.stock !== null && a.stockMinimo !== null && a.stock <= a.stockMinimo) {
        const yaNotificado = stockNotifRecientes.some(
          (n) => n.mensaje?.includes(a.nombre),
        );
        if (!yaNotificado) {
          nuevas.push({
            dietistaId: dietista.id,
            tipo: "STOCK_BAJO",
            titulo: `Stock bajo: ${a.nombre}`,
            mensaje: `${a.nombre} tiene ${a.stock} uds (mínimo: ${a.stockMinimo}).`,
            enlace: `/alimentos/${a.id}`,
          });
        }
      }
    }
  }

  // Filtrar por preferencias del usuario antes de insertar
  const prefs = await getNotifPreferencias();
  const filtradas = nuevas.filter((n) => prefs[n.tipo as keyof NotifPreferencias]);

  if (filtradas.length > 0) {
    await prisma.notificacion.createMany({ data: filtradas });
  }

  // Limpieza automática (no bloquea)
  void limpiarNotificacionesAntiguas(dietista.id).catch((e) =>
    console.error("[limpiar-notif]", e),
  );
}

const LIMITE_MAX = 100;
const DIAS_LEIDAS = 30;

/**
 * Mantiene las notificaciones acotadas:
 *  - Borra leídas con más de 30 días
 *  - Deja solo las 100 más recientes (borra el excedente)
 */
async function limpiarNotificacionesAntiguas(dietistaId: string) {
  const corte = new Date();
  corte.setDate(corte.getDate() - DIAS_LEIDAS);

  await prisma.notificacion.deleteMany({
    where: { dietistaId, leida: true, createdAt: { lt: corte } },
  });

  // Notificaciones de cita cuyo evento ha sido cancelado o cuya cita ya no existe
  // (citaId=null por SetNull tras delete). Borramos para evitar huérfanas visibles.
  await prisma.notificacion.deleteMany({
    where: {
      dietistaId,
      tipo: { in: ["CITA_HOY", "CITA_SOLICITADA", "CITA_CONTRAPROPUESTA"] },
      OR: [
        { citaId: null },
        { cita: { estado: "CANCELADA" } },
      ],
    },
  });

  const total = await prisma.notificacion.count({ where: { dietistaId } });
  if (total > LIMITE_MAX) {
    const excedente = await prisma.notificacion.findMany({
      where: { dietistaId },
      orderBy: { createdAt: "desc" },
      skip: LIMITE_MAX,
      select: { id: true },
    });
    if (excedente.length > 0) {
      await prisma.notificacion.deleteMany({
        where: { id: { in: excedente.map((n) => n.id) } },
      });
    }
  }
}

export async function eliminarNotificacion(id: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) return;
  if (dietista.isDemo) return;

  await prisma.notificacion.deleteMany({
    where: { id, dietistaId: dietista.id },
  });

  revalidatePath("/notificaciones");
  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
}

export async function eliminarTodasNotificaciones() {
  const dietista = await getCurrentDietista();
  if (!dietista) return;
  if (dietista.isDemo) return;

  await prisma.notificacion.deleteMany({
    where: { dietistaId: dietista.id },
  });

  revalidatePath("/notificaciones");
  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
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
    take: 100,
  });
}

export async function getNotificacionesCount() {
  const dietista = await getCurrentDietista();
  if (!dietista) return 0;

  return prisma.notificacion.count({
    where: { dietistaId: dietista.id, leida: false },
  });
}

/**
 * Cuenta notificaciones no leídas agrupadas por área de la app.
 * Devuelve un objeto que la sidebar usa para pintar badges junto a cada item.
 */
export async function getBadgesNavegacion(): Promise<Record<string, number>> {
  const dietista = await getCurrentDietista();
  if (!dietista) return {};

  const rows = await prisma.notificacion.groupBy({
    by: ["tipo"],
    where: { dietistaId: dietista.id, leida: false },
    _count: { _all: true },
  });

  const countByTipo = Object.fromEntries(
    rows.map((r) => [r.tipo as string, r._count._all]),
  );

  const suma = (tipos: string[]) =>
    tipos.reduce((acc, t) => acc + (countByTipo[t] ?? 0), 0);

  const badges: Record<string, number> = {};

  const agenda = suma([
    "CITA_HOY",
    "CITA_SOLICITADA",
    "CITA_CONTRAPROPUESTA",
    "CITA_CONFIRMADA",
    "CITA_RECHAZADA",
    "CITA_CANCELADA_POR_PACIENTE",
  ]);
  if (agenda > 0) badges["/agenda"] = agenda;

  const pagos = suma(["PAGO_RECIBIDO", "PAGO_PENDIENTE", "PAGO_FALLIDO"]);
  if (pagos > 0) badges["/pagos"] = pagos;

  const pacientes = suma([
    "PACIENTE_SIN_CONSULTA",
    "PACIENTE_SIN_MEDIDAS",
    "DIARIO_NUEVO",
    "PLAN_ANTIGUO",
  ]);
  if (pacientes > 0) badges["/pacientes"] = pacientes;

  const empresa = suma([
    "EMPRESA_SOLICITUD",
    "EMPRESA_ACEPTADA",
    "EMPRESA_RECHAZADA",
    "EMPRESA_MIEMBRO_SALIO",
    "EMPRESA_LIDER_TRANSFERIDO",
  ]);
  if (empresa > 0) badges["/ajustes"] = empresa;

  const stockBajo = suma(["STOCK_BAJO"]);
  if (stockBajo > 0) badges["/alimentos"] = (badges["/alimentos"] ?? 0) + stockBajo;

  return badges;
}

/**
 * Mapa pacienteId → notificaciones no leídas del nutri.
 * Una sola query agrupada para pintar dots en el listado sin N+1.
 */
export async function getMapaNotificacionesPacientes(): Promise<
  Record<string, { id: string; tipo: string; titulo: string; mensaje: string; tituloKey: string | null; mensajeKey: string | null; params: Record<string, string> | null; createdAt: Date }[]>
> {
  const dietista = await getCurrentDietista();
  if (!dietista) return {};

  const notifs = await prisma.notificacion.findMany({
    where: { dietistaId: dietista.id, leida: false, pacienteId: { not: null }, paciente: { esDemo: false } },
    select: { id: true, pacienteId: true, tipo: true, titulo: true, mensaje: true, tituloKey: true, mensajeKey: true, params: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  const mapa: Record<string, { id: string; tipo: string; titulo: string; mensaje: string; tituloKey: string | null; mensajeKey: string | null; params: Record<string, string> | null; createdAt: Date }[]> = {};
  for (const n of notifs) {
    if (!n.pacienteId) continue;
    if (!mapa[n.pacienteId]) mapa[n.pacienteId] = [];
    mapa[n.pacienteId].push({
      id: n.id,
      tipo: n.tipo,
      titulo: n.titulo,
      mensaje: n.mensaje,
      tituloKey: n.tituloKey,
      mensajeKey: n.mensajeKey,
      params: n.params as Record<string, string> | null,
      createdAt: n.createdAt,
    });
  }
  return mapa;
}

/**
 * Mapa citaId → notificaciones no leídas del nutri.
 * Usado por la agenda para pintar dots por cita.
 */
export async function getMapaNotificacionesCitas(
  citaIds: string[],
): Promise<Record<string, { id: string; tipo: string; titulo: string; mensaje: string; tituloKey: string | null; mensajeKey: string | null; params: Record<string, string> | null; createdAt: Date }[]>> {
  const dietista = await getCurrentDietista();
  if (!dietista || citaIds.length === 0) return {};

  const notifs = await prisma.notificacion.findMany({
    where: {
      dietistaId: dietista.id,
      leida: false,
      citaId: { in: citaIds },
      OR: [{ paciente: { esDemo: false } }, { pacienteId: null }],
    },
    select: { id: true, citaId: true, tipo: true, titulo: true, mensaje: true, tituloKey: true, mensajeKey: true, params: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  const mapa: Record<string, { id: string; tipo: string; titulo: string; mensaje: string; tituloKey: string | null; mensajeKey: string | null; params: Record<string, string> | null; createdAt: Date }[]> = {};
  for (const n of notifs) {
    if (!n.citaId) continue;
    if (!mapa[n.citaId]) mapa[n.citaId] = [];
    mapa[n.citaId].push({
      id: n.id,
      tipo: n.tipo,
      titulo: n.titulo,
      mensaje: n.mensaje,
      tituloKey: n.tituloKey,
      mensajeKey: n.mensajeKey,
      params: n.params as Record<string, string> | null,
      createdAt: n.createdAt,
    });
  }
  return mapa;
}

/** Marca como leídas todas las notificaciones del nutri asociadas al paciente. */
export async function marcarLeidasDePaciente(pacienteId: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) return;
  if (dietista.isDemo) return;

  const res = await prisma.notificacion.updateMany({
    where: { dietistaId: dietista.id, pacienteId, leida: false },
    data: { leida: true },
  });

  if (res.count > 0) {
    revalidatePath("/pacientes");
    revalidatePath("/notificaciones");
    revalidatePath("/", "layout");
  }
}

/** Marca leídas solo las notificaciones del paciente de los tipos indicados. */
export async function marcarLeidasDePacientePorTipo(
  pacienteId: string,
  tipos: TipoNotificacion[],
) {
  const dietista = await getCurrentDietista();
  if (!dietista || tipos.length === 0) return;
  if (dietista.isDemo) return;

  const res = await prisma.notificacion.updateMany({
    where: {
      dietistaId: dietista.id,
      pacienteId,
      tipo: { in: tipos },
      leida: false,
    },
    data: { leida: true },
  });

  if (res.count > 0) {
    revalidatePath(`/pacientes/${pacienteId}`);
    revalidatePath("/pacientes");
    revalidatePath("/notificaciones");
    revalidatePath("/", "layout");
  }
}

/** Marca como leídas todas las notificaciones del nutri asociadas a la cita. */
export async function marcarLeidasDeCita(citaId: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) return;
  if (dietista.isDemo) return;

  const res = await prisma.notificacion.updateMany({
    where: { dietistaId: dietista.id, citaId, leida: false },
    data: { leida: true },
  });

  if (res.count > 0) {
    revalidatePath("/agenda");
    revalidatePath("/notificaciones");
    revalidatePath("/", "layout");
  }
}

export async function marcarLeida(id: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) return;
  if (dietista.isDemo) return;

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
  if (dietista.isDemo) return;

  await prisma.notificacion.updateMany({
    where: { dietistaId: dietista.id, leida: false },
    data: { leida: true },
  });

  revalidatePath("/notificaciones");
  revalidatePath("/dashboard");
  revalidatePath("/", "layout");
}

export type NotifPreferencias = {
  CITA_HOY: boolean;
  CITA_SOLICITADA: boolean;
  CITA_CONFIRMADA: boolean;
  CITA_CONTRAPROPUESTA: boolean;
  CITA_RECHAZADA: boolean;
  CITA_CANCELADA_POR_PACIENTE: boolean;
  PACIENTE_SIN_CONSULTA: boolean;
  PACIENTE_SIN_MEDIDAS: boolean;
  PLAN_ANTIGUO: boolean;
  DIARIO_NUEVO: boolean;
  PAGO_RECIBIDO: boolean;
  PAGO_PENDIENTE: boolean;
  PAGO_FALLIDO: boolean;
  EMPRESA_SOLICITUD: boolean;
  EMPRESA_ACEPTADA: boolean;
  EMPRESA_RECHAZADA: boolean;
  EMPRESA_MIEMBRO_SALIO: boolean;
  EMPRESA_LIDER_TRANSFERIDO: boolean;
  STOCK_BAJO: boolean;
};

const PREFERENCIAS_DEFAULT: NotifPreferencias = {
  CITA_HOY: true,
  CITA_SOLICITADA: true,
  CITA_CONFIRMADA: true,
  CITA_CONTRAPROPUESTA: true,
  CITA_RECHAZADA: true,
  CITA_CANCELADA_POR_PACIENTE: true,
  PACIENTE_SIN_CONSULTA: true,
  PACIENTE_SIN_MEDIDAS: true,
  PLAN_ANTIGUO: true,
  DIARIO_NUEVO: true,
  PAGO_RECIBIDO: true,
  PAGO_PENDIENTE: true,
  PAGO_FALLIDO: true,
  EMPRESA_SOLICITUD: true,
  EMPRESA_ACEPTADA: true,
  EMPRESA_RECHAZADA: true,
  EMPRESA_MIEMBRO_SALIO: true,
  EMPRESA_LIDER_TRANSFERIDO: true,
  STOCK_BAJO: true,
};

export async function getNotifPreferencias(): Promise<NotifPreferencias> {
  const dietista = await getCurrentDietista();
  if (!dietista) return PREFERENCIAS_DEFAULT;

  const rows = await prisma.$queryRawUnsafe<{ notifPreferencias: unknown }[]>(
    `SELECT "notifPreferencias" FROM dietistas WHERE id = $1`,
    dietista.id,
  );

  const raw = rows[0]?.notifPreferencias;
  if (!raw || typeof raw !== "object") return PREFERENCIAS_DEFAULT;

  return { ...PREFERENCIAS_DEFAULT, ...(raw as Partial<NotifPreferencias>) };
}

export async function setNotifPreferencias(prefs: NotifPreferencias) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  await prisma.$executeRawUnsafe(
    `UPDATE dietistas SET "notifPreferencias" = $1::jsonb, "updatedAt" = NOW() WHERE id = $2`,
    JSON.stringify(prefs),
    dietista.id,
  );

  revalidatePath("/notificaciones/preferencias");
  revalidatePath("/notificaciones");
}

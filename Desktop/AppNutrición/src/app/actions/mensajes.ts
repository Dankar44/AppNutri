"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import { getCurrentPaciente } from "@/lib/patient-auth";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { publicarBroadcast } from "@/lib/realtime-publish";
import { checkRateLimit, LIMITES } from "@/lib/rate-limit";

export interface Conversacion {
  id: string;
  dietistaId: string;
  pacienteId: string;
  ultimoMensajeAt: Date | null;
  archivadaDietista: boolean;
  noLeidosDietista: number;
  noLeidosPaciente: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversacionConPaciente extends Conversacion {
  paciente: {
    id: string;
    nombre: string;
    apellidos: string;
    fotoUrl: string | null;
  };
  ultimoMensaje: {
    texto: string;
    autor: "DIETISTA" | "PACIENTE";
    createdAt: Date;
  } | null;
}

export interface Mensaje {
  id: string;
  conversacionId: string;
  autor: "DIETISTA" | "PACIENTE";
  dietistaId: string | null;
  pacienteId: string | null;
  texto: string;
  adjuntoUrl: string | null;
  adjuntoNombre: string | null;
  adjuntoTipo: string | null;
  leidoEn: Date | null;
  createdAt: Date;
}

function cuid(): string {
  // Pseudo-cuid basado en timestamp + random para compatibilidad con id generator
  const ts = Date.now().toString(36);
  const rand = randomUUID().replace(/-/g, "").slice(0, 16);
  return `c${ts}${rand}`;
}

/** Envía notificación email en background sin bloquear el flow principal. */
function notifyEmail(
  destino: "dietista" | "paciente",
  id: string,
  texto: string,
  remitentePacienteId?: string,
) {
  // Import dinámico en void para que no requiera el módulo si aún no existe
  void (async () => {
    try {
      const mod = await import("@/lib/email-mensajes");
      if (destino === "paciente") {
        await mod.notificarPacienteNuevoMensaje(id, texto);
      } else {
        await mod.notificarDietistaNuevoMensaje(id, remitentePacienteId!, texto);
      }
    } catch {
      // Silenciar errores (email es best-effort)
    }
  })();
}

// ============================================================================
// ACTIONS DIETISTA
// ============================================================================

/** Lista todas las conversaciones del dietista con preview del último mensaje. */
export async function getConversaciones(options?: {
  archivadas?: boolean;
  busqueda?: string;
}): Promise<ConversacionConPaciente[]> {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  const archivadas = options?.archivadas ?? false;
  const busqueda = (options?.busqueda ?? "").trim().toLowerCase();

  const rows = await prisma.$queryRawUnsafe<Array<{
    id: string;
    dietistaId: string;
    pacienteId: string;
    ultimoMensajeAt: Date | null;
    archivadaDietista: boolean;
    noLeidosDietista: number;
    noLeidosPaciente: number;
    createdAt: Date;
    updatedAt: Date;
    paciente_id: string;
    paciente_nombre: string;
    paciente_apellidos: string;
    paciente_fotoUrl: string | null;
    ultimo_texto: string | null;
    ultimo_autor: "DIETISTA" | "PACIENTE" | null;
    ultimo_createdAt: Date | null;
  }>>(
    `
    SELECT
      c.id, c."dietistaId", c."pacienteId", c."ultimoMensajeAt",
      c."archivadaDietista", c."noLeidosDietista", c."noLeidosPaciente",
      c."createdAt", c."updatedAt",
      p.id AS paciente_id, p.nombre AS paciente_nombre,
      p.apellidos AS paciente_apellidos, p."fotoUrl" AS "paciente_fotoUrl",
      m.texto AS ultimo_texto, m.autor AS ultimo_autor,
      m."createdAt" AS "ultimo_createdAt"
    FROM conversaciones c
    INNER JOIN pacientes p ON p.id = c."pacienteId"
    LEFT JOIN LATERAL (
      SELECT texto, autor, "createdAt"
      FROM mensajes
      WHERE "conversacionId" = c.id
      ORDER BY "createdAt" DESC
      LIMIT 1
    ) m ON true
    WHERE c."dietistaId" = $1
      AND c."archivadaDietista" = $2
      ${busqueda ? `AND (LOWER(p.nombre) LIKE $3 OR LOWER(p.apellidos) LIKE $3)` : ""}
    ORDER BY c."ultimoMensajeAt" DESC NULLS LAST
    `,
    ...(busqueda
      ? [dietista.id, archivadas, `%${busqueda}%`]
      : [dietista.id, archivadas]),
  );

  return rows.map((r) => ({
    id: r.id,
    dietistaId: r.dietistaId,
    pacienteId: r.pacienteId,
    ultimoMensajeAt: r.ultimoMensajeAt,
    archivadaDietista: r.archivadaDietista,
    noLeidosDietista: r.noLeidosDietista,
    noLeidosPaciente: r.noLeidosPaciente,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    paciente: {
      id: r.paciente_id,
      nombre: r.paciente_nombre,
      apellidos: r.paciente_apellidos,
      fotoUrl: r.paciente_fotoUrl,
    },
    ultimoMensaje: r.ultimo_texto
      ? {
          texto: r.ultimo_texto,
          autor: r.ultimo_autor!,
          createdAt: r.ultimo_createdAt!,
        }
      : null,
  }));
}

/**
 * Devuelve la conversación entre dietista y paciente. Si no existe, la crea.
 * Solo puede crear conversaciones entre dietista actual y pacientes suyos.
 */
export async function getOrCrearConversacion(pacienteId: string): Promise<Conversacion> {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  // Verificar que el paciente pertenece al dietista
  const paciente = await prisma.paciente.findFirst({
    where: { id: pacienteId, dietistaId: dietista.id },
    select: { id: true },
  });
  if (!paciente) throw new Error("Paciente no encontrado");

  const existing = await prisma.$queryRawUnsafe<Conversacion[]>(
    `SELECT * FROM conversaciones WHERE "dietistaId" = $1 AND "pacienteId" = $2`,
    dietista.id,
    pacienteId,
  );

  if (existing.length > 0) return existing[0];

  if (dietista.isDemo) {
    const now = new Date();
    return {
      id: `demo-conv-${pacienteId}`,
      dietistaId: dietista.id,
      pacienteId,
      ultimoMensajeAt: null,
      archivadaDietista: false,
      noLeidosDietista: 0,
      noLeidosPaciente: 0,
      createdAt: now,
      updatedAt: now,
    };
  }

  const id = cuid();
  const rows = await prisma.$queryRawUnsafe<Conversacion[]>(
    `INSERT INTO conversaciones (id, "dietistaId", "pacienteId", "updatedAt")
     VALUES ($1, $2, $3, NOW())
     RETURNING *`,
    id,
    dietista.id,
    pacienteId,
  );

  revalidatePath("/mensajes");
  return rows[0];
}

/** Lista los mensajes de una conversación (orden ascendente). */
export async function getMensajes(
  conversacionId: string,
  limit = 100,
): Promise<Mensaje[]> {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  // Verificar autorización
  const conv = await prisma.$queryRawUnsafe<{ dietistaId: string }[]>(
    `SELECT "dietistaId" FROM conversaciones WHERE id = $1`,
    conversacionId,
  );
  if (!conv[0] || conv[0].dietistaId !== dietista.id) return [];

  // Cogemos los N más recientes y los re-ordenamos ASC para mostrar
  return prisma.$queryRawUnsafe<Mensaje[]>(
    `SELECT * FROM (
       SELECT * FROM mensajes
       WHERE "conversacionId" = $1
       ORDER BY "createdAt" DESC
       LIMIT $2
     ) AS m
     ORDER BY m."createdAt" ASC`,
    conversacionId,
    limit,
  );
}

/** Envía un mensaje desde el dietista en una conversación. */
export async function enviarMensaje(
  conversacionId: string,
  texto: string,
  adjunto?: { url: string; nombre: string; tipo: string },
): Promise<Mensaje> {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");
  if (dietista.isDemo) throw new Error("No disponible en modo demo");

  // Rate limit: 20 mensajes/min por dietista
  const rl = checkRateLimit({
    key: `msg:dietista:${dietista.id}`,
    ...LIMITES.enviarMensaje,
  });
  if (!rl.ok) {
    throw new Error(`Demasiados mensajes. Espera ${rl.retryAfter}s`);
  }

  const textoLimpio = texto.trim().slice(0, 5000);
  if (!textoLimpio && !adjunto) throw new Error("Mensaje vacío");

  // Verificar que la conversación pertenece al dietista
  const conv = await prisma.$queryRawUnsafe<{ dietistaId: string; pacienteId: string }[]>(
    `SELECT "dietistaId", "pacienteId" FROM conversaciones WHERE id = $1`,
    conversacionId,
  );
  if (!conv[0] || conv[0].dietistaId !== dietista.id) {
    throw new Error("No autorizado");
  }

  const id = cuid();
  const rows = await prisma.$queryRawUnsafe<Mensaje[]>(
    `INSERT INTO mensajes
     (id, "conversacionId", autor, "dietistaId", texto, "adjuntoUrl", "adjuntoNombre", "adjuntoTipo")
     VALUES ($1, $2, 'DIETISTA', $3, $4, $5, $6, $7)
     RETURNING *`,
    id,
    conversacionId,
    dietista.id,
    textoLimpio,
    adjunto?.url ?? null,
    adjunto?.nombre ?? null,
    adjunto?.tipo ?? null,
  );

  // Actualizar conversación: timestamp último mensaje + incrementar no leídos del paciente
  await prisma.$executeRawUnsafe(
    `UPDATE conversaciones
     SET "ultimoMensajeAt" = NOW(),
         "noLeidosPaciente" = "noLeidosPaciente" + 1,
         "updatedAt" = NOW(),
         "archivadaDietista" = false
     WHERE id = $1`,
    conversacionId,
  );

  // Notificar al paciente por email (no bloqueante)
  notifyEmail("paciente", conv[0].pacienteId, textoLimpio);

  // Broadcast Realtime: a la conversación y al inbox del paciente
  void publicarBroadcast(`conv:${conversacionId}`, "nuevo_mensaje", {
    mensaje: rows[0],
  });
  void publicarBroadcast(`inbox:p:${conv[0].pacienteId}`, "actualizacion", {
    conversacionId,
  });

  revalidatePath("/mensajes");
  revalidatePath("/paciente/portal/mensajes");

  return rows[0];
}

/** Marca todos los mensajes de una conversación como leídos (por el dietista). */
export async function marcarConversacionLeida(conversacionId: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) return;
  if (dietista.isDemo) return;

  const conv = await prisma.$queryRawUnsafe<{ dietistaId: string }[]>(
    `SELECT "dietistaId" FROM conversaciones WHERE id = $1`,
    conversacionId,
  );
  if (!conv[0] || conv[0].dietistaId !== dietista.id) return;

  await prisma.$executeRawUnsafe(
    `UPDATE conversaciones SET "noLeidosDietista" = 0, "updatedAt" = NOW() WHERE id = $1`,
    conversacionId,
  );

  await prisma.$executeRawUnsafe(
    `UPDATE mensajes SET "leidoEn" = NOW()
     WHERE "conversacionId" = $1 AND autor = 'PACIENTE' AND "leidoEn" IS NULL`,
    conversacionId,
  );

  // Broadcast: el paciente ve ✓✓ en sus mensajes
  void publicarBroadcast(`conv:${conversacionId}`, "leido", {
    por: "DIETISTA",
  });

  revalidatePath("/mensajes");
}

/** Archiva una conversación (oculta del listado principal del dietista). */
export async function archivarConversacion(conversacionId: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) return;
  if (dietista.isDemo) return;

  await prisma.$executeRawUnsafe(
    `UPDATE conversaciones SET "archivadaDietista" = true, "updatedAt" = NOW()
     WHERE id = $1 AND "dietistaId" = $2`,
    conversacionId,
    dietista.id,
  );

  revalidatePath("/mensajes");
}

export async function desarchivarConversacion(conversacionId: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) return;
  if (dietista.isDemo) return;

  await prisma.$executeRawUnsafe(
    `UPDATE conversaciones SET "archivadaDietista" = false, "updatedAt" = NOW()
     WHERE id = $1 AND "dietistaId" = $2`,
    conversacionId,
    dietista.id,
  );

  revalidatePath("/mensajes");
}

/** Cuenta el total de conversaciones con mensajes no leídos por el dietista. */
export async function getConversacionesNoLeidasCount(): Promise<number> {
  const dietista = await getCurrentDietista();
  if (!dietista) return 0;

  const rows = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
    `SELECT COUNT(*) as count FROM conversaciones
     WHERE "dietistaId" = $1 AND "noLeidosDietista" > 0 AND "archivadaDietista" = false`,
    dietista.id,
  );

  return Number(rows[0]?.count ?? 0);
}

export interface PacienteParaConversacion {
  id: string;
  nombre: string;
  apellidos: string;
  fotoUrl: string | null;
  conversacionId: string | null;
}

/**
 * Lista los pacientes activos del dietista, indicando si ya tienen una
 * conversación creada (para poder navegar a ella) o no (para crear una nueva
 * al hacer clic).
 */
export async function getPacientesParaConversacion(
  busqueda?: string,
): Promise<PacienteParaConversacion[]> {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  const q = (busqueda ?? "").trim().toLowerCase();

  const rows = await prisma.$queryRawUnsafe<Array<{
    id: string;
    nombre: string;
    apellidos: string;
    fotoUrl: string | null;
    conversacionId: string | null;
  }>>(
    `
    SELECT
      p.id, p.nombre, p.apellidos, p."fotoUrl",
      c.id AS "conversacionId"
    FROM pacientes p
    LEFT JOIN conversaciones c
      ON c."pacienteId" = p.id AND c."dietistaId" = $1
    WHERE p."dietistaId" = $1
      AND p.activo = true
      ${q ? `AND (LOWER(p.nombre) LIKE $2 OR LOWER(p.apellidos) LIKE $2 OR LOWER(p.nombre || ' ' || p.apellidos) LIKE $2)` : ""}
    ORDER BY p.nombre ASC, p.apellidos ASC
    LIMIT 100
    `,
    ...(q ? [dietista.id, `%${q}%`] : [dietista.id]),
  );

  return rows;
}

// ============================================================================
// ACTIONS PACIENTE
// ============================================================================

async function getSessionPaciente() {
  const session = await getCurrentPaciente();
  if (!session) return null;
  const p = await prisma.paciente.findUnique({
    where: { id: session.pacienteId },
    select: { id: true, dietistaId: true },
  });
  return p;
}

/** Paciente: obtiene o crea su conversación con el dietista. */
export async function getConversacionPaciente(): Promise<Conversacion | null> {
  const paciente = await getSessionPaciente();
  if (!paciente) return null;

  const existing = await prisma.$queryRawUnsafe<Conversacion[]>(
    `SELECT * FROM conversaciones WHERE "pacienteId" = $1 AND "dietistaId" = $2`,
    paciente.id,
    paciente.dietistaId,
  );

  if (existing.length > 0) return existing[0];

  const id = cuid();
  const rows = await prisma.$queryRawUnsafe<Conversacion[]>(
    `INSERT INTO conversaciones (id, "dietistaId", "pacienteId", "updatedAt")
     VALUES ($1, $2, $3, NOW())
     RETURNING *`,
    id,
    paciente.dietistaId,
    paciente.id,
  );

  revalidatePath("/paciente/portal/mensajes");
  return rows[0];
}

/** Paciente: obtiene los mensajes de su conversación. */
export async function getMensajesPaciente(limit = 100): Promise<Mensaje[]> {
  const paciente = await getSessionPaciente();
  if (!paciente) return [];

  // Cogemos los N más recientes y los re-ordenamos ASC para mostrar
  return prisma.$queryRawUnsafe<Mensaje[]>(
    `SELECT * FROM (
       SELECT m.*
       FROM mensajes m
       INNER JOIN conversaciones c ON c.id = m."conversacionId"
       WHERE c."pacienteId" = $1 AND c."dietistaId" = $2
       ORDER BY m."createdAt" DESC
       LIMIT $3
     ) AS sub
     ORDER BY sub."createdAt" ASC`,
    paciente.id,
    paciente.dietistaId,
    limit,
  );
}

/** Paciente: envía mensaje al dietista. */
export async function enviarMensajePaciente(
  texto: string,
  adjunto?: { url: string; nombre: string; tipo: string },
): Promise<Mensaje> {
  const paciente = await getSessionPaciente();
  if (!paciente) throw new Error("No autorizado");

  // Rate limit: 20 mensajes/min por paciente
  const rl = checkRateLimit({
    key: `msg:paciente:${paciente.id}`,
    ...LIMITES.enviarMensaje,
  });
  if (!rl.ok) {
    throw new Error(`Demasiados mensajes. Espera ${rl.retryAfter}s`);
  }

  const textoLimpio = texto.trim().slice(0, 5000);
  if (!textoLimpio && !adjunto) throw new Error("Mensaje vacío");

  // Obtener o crear conversación
  let conv = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id FROM conversaciones WHERE "pacienteId" = $1 AND "dietistaId" = $2`,
    paciente.id,
    paciente.dietistaId,
  );

  let conversacionId: string;
  if (conv.length === 0) {
    conversacionId = cuid();
    await prisma.$executeRawUnsafe(
      `INSERT INTO conversaciones (id, "dietistaId", "pacienteId", "updatedAt")
       VALUES ($1, $2, $3, NOW())`,
      conversacionId,
      paciente.dietistaId,
      paciente.id,
    );
  } else {
    conversacionId = conv[0].id;
  }

  const id = cuid();
  const rows = await prisma.$queryRawUnsafe<Mensaje[]>(
    `INSERT INTO mensajes
     (id, "conversacionId", autor, "pacienteId", texto, "adjuntoUrl", "adjuntoNombre", "adjuntoTipo")
     VALUES ($1, $2, 'PACIENTE', $3, $4, $5, $6, $7)
     RETURNING *`,
    id,
    conversacionId,
    paciente.id,
    textoLimpio,
    adjunto?.url ?? null,
    adjunto?.nombre ?? null,
    adjunto?.tipo ?? null,
  );

  await prisma.$executeRawUnsafe(
    `UPDATE conversaciones
     SET "ultimoMensajeAt" = NOW(),
         "noLeidosDietista" = "noLeidosDietista" + 1,
         "updatedAt" = NOW(),
         "archivadaDietista" = false
     WHERE id = $1`,
    conversacionId,
  );

  // Notificar al dietista por email (no bloqueante)
  notifyEmail("dietista", paciente.dietistaId, textoLimpio, paciente.id);

  // Broadcast Realtime: a la conversación y al inbox del dietista
  void publicarBroadcast(`conv:${conversacionId}`, "nuevo_mensaje", {
    mensaje: rows[0],
  });
  void publicarBroadcast(`inbox:d:${paciente.dietistaId}`, "actualizacion", {
    conversacionId,
  });

  revalidatePath("/paciente/portal/mensajes");
  revalidatePath("/mensajes");

  return rows[0];
}

/** Paciente: marca los mensajes del dietista como leídos. */
export async function marcarLeidoPaciente() {
  const paciente = await getSessionPaciente();
  if (!paciente) return;

  const conv = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id FROM conversaciones WHERE "pacienteId" = $1 AND "dietistaId" = $2`,
    paciente.id,
    paciente.dietistaId,
  );
  if (conv.length === 0) return;

  await prisma.$executeRawUnsafe(
    `UPDATE conversaciones SET "noLeidosPaciente" = 0, "updatedAt" = NOW() WHERE id = $1`,
    conv[0].id,
  );

  await prisma.$executeRawUnsafe(
    `UPDATE mensajes SET "leidoEn" = NOW()
     WHERE "conversacionId" = $1 AND autor = 'DIETISTA' AND "leidoEn" IS NULL`,
    conv[0].id,
  );

  // Broadcast: el dietista ve ✓✓ en sus mensajes
  void publicarBroadcast(`conv:${conv[0].id}`, "leido", {
    por: "PACIENTE",
  });

  revalidatePath("/paciente/portal/mensajes");
}

/** Paciente: cuenta mensajes no leídos de su conversación con el dietista. */
export async function getContadorNoLeidosPaciente(): Promise<number> {
  const paciente = await getSessionPaciente();
  if (!paciente) return 0;

  const rows = await prisma.$queryRawUnsafe<{ noLeidosPaciente: number }[]>(
    `SELECT "noLeidosPaciente" FROM conversaciones
     WHERE "pacienteId" = $1 AND "dietistaId" = $2`,
    paciente.id,
    paciente.dietistaId,
  );

  return rows[0]?.noLeidosPaciente ?? 0;
}

"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin";
import { publicarBroadcast } from "@/lib/realtime-publish";
import { checkRateLimit, LIMITES } from "@/lib/rate-limit";
import { randomUUID } from "crypto";
import { getTranslations } from "next-intl/server";
import type { MensajeSoporteData } from "./soporte";

export interface ConversacionSoporteItem {
  dietistaId: string;
  nombre: string;
  apellidos: string;
  email: string;
  especialidad: string | null;
  ultimoMensaje: string | null;
  ultimoAutor: "DIETISTA" | "ADMIN" | null;
  ultimoAt: Date | null;
  noLeidos: number;
}

function cuid(): string {
  const ts = Date.now().toString(36);
  const rand = randomUUID().replace(/-/g, "").slice(0, 16);
  return `c${ts}${rand}`;
}

export async function getConversacionesSoporte(
  busqueda?: string,
): Promise<ConversacionSoporteItem[]> {
  const t = await getTranslations("validation");
  const admin = await requireAdmin();
  if (!admin) throw new Error(t("auth.noAutorizado"));

  const q = (busqueda ?? "").trim().toLowerCase();

  const rows = await prisma.$queryRawUnsafe<Array<{
    dietistaId: string;
    nombre: string;
    apellidos: string;
    email: string;
    especialidad: string | null;
    ultimoMensaje: string | null;
    ultimoAutor: "DIETISTA" | "ADMIN" | null;
    ultimoAt: Date | null;
    noLeidos: bigint;
  }>>(
    `SELECT
       d.id AS "dietistaId",
       d.nombre,
       d.apellidos,
       d.email,
       d.especialidad,
       m.texto AS "ultimoMensaje",
       m.autor AS "ultimoAutor",
       m."createdAt" AS "ultimoAt",
       COALESCE(u.cnt, 0) AS "noLeidos"
     FROM dietistas d
     INNER JOIN LATERAL (
       SELECT texto, autor, "createdAt"
       FROM mensajes_soporte
       WHERE "dietistaId" = d.id
       ORDER BY "createdAt" DESC
       LIMIT 1
     ) m ON true
     LEFT JOIN LATERAL (
       SELECT COUNT(*) AS cnt
       FROM mensajes_soporte
       WHERE "dietistaId" = d.id AND autor = 'DIETISTA' AND "leidoEn" IS NULL
     ) u ON true
     ${q ? `WHERE LOWER(d.nombre) LIKE $1 OR LOWER(d.apellidos) LIKE $1 OR LOWER(d.email) LIKE $1` : ""}
     ORDER BY
       CASE WHEN COALESCE(u.cnt, 0) > 0 THEN 0 ELSE 1 END,
       m."createdAt" DESC`,
    ...(q ? [`%${q}%`] : []),
  );

  return rows.map((r) => ({
    ...r,
    noLeidos: Number(r.noLeidos),
  }));
}

export async function getMensajesSoporteAdmin(
  dietistaId: string,
  limit = 100,
): Promise<MensajeSoporteData[]> {
  const t = await getTranslations("validation");
  const admin = await requireAdmin();
  if (!admin) throw new Error(t("auth.noAutorizado"));

  return prisma.$queryRawUnsafe<MensajeSoporteData[]>(
    `SELECT * FROM (
       SELECT id, "dietistaId", autor, texto, "leidoEn", "createdAt"
       FROM mensajes_soporte
       WHERE "dietistaId" = $1
       ORDER BY "createdAt" DESC
       LIMIT $2
     ) AS m
     ORDER BY m."createdAt" ASC`,
    dietistaId,
    limit,
  );
}

export async function enviarMensajeSoporteAdmin(
  dietistaId: string,
  texto: string,
): Promise<MensajeSoporteData> {
  const t = await getTranslations("validation");
  const admin = await requireAdmin();
  if (!admin) throw new Error(t("auth.noAutorizado"));

  const rl = checkRateLimit({
    key: `soporte:admin`,
    ...LIMITES.enviarMensaje,
  });
  if (!rl.ok) {
    throw new Error(t("mensajes.demasiadosMensajes", { retryAfter: rl.retryAfter }));
  }

  const textoLimpio = texto.trim().slice(0, 5000);
  if (!textoLimpio) throw new Error(t("mensajes.mensajeVacio"));

  const dietista = await prisma.dietista.findUnique({
    where: { id: dietistaId },
    select: { id: true },
  });
  if (!dietista) throw new Error(t("admin.dietistaNoEncontrado"));

  const id = cuid();
  const rows = await prisma.$queryRawUnsafe<MensajeSoporteData[]>(
    `INSERT INTO mensajes_soporte (id, "dietistaId", autor, texto)
     VALUES ($1, $2, 'ADMIN', $3)
     RETURNING id, "dietistaId", autor, texto, "leidoEn", "createdAt"`,
    id,
    dietistaId,
    textoLimpio,
  );

  await prisma.$executeRawUnsafe(
    `UPDATE dietistas SET "noLeidosSoporte" = "noLeidosSoporte" + 1 WHERE id = $1`,
    dietistaId,
  );

  void publicarBroadcast(`soporte:${dietistaId}`, "nuevo_mensaje", {
    mensaje: rows[0],
  });
  void publicarBroadcast(`inbox:d:${dietistaId}`, "actualizacion", {
    tipo: "soporte",
  });

  return rows[0];
}

export async function marcarSoporteLeidoAdmin(dietistaId: string): Promise<void> {
  const admin = await requireAdmin();
  if (!admin) return;

  await prisma.$executeRawUnsafe(
    `UPDATE mensajes_soporte SET "leidoEn" = NOW()
     WHERE "dietistaId" = $1 AND autor = 'DIETISTA' AND "leidoEn" IS NULL`,
    dietistaId,
  );

  void publicarBroadcast(`soporte:${dietistaId}`, "leido", {
    por: "ADMIN",
  });
}

export async function getTotalNoLeidosSoporteAdmin(): Promise<number> {
  const admin = await requireAdmin();
  if (!admin) return 0;

  const rows = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
    `SELECT COUNT(DISTINCT "dietistaId") AS count
     FROM mensajes_soporte
     WHERE autor = 'DIETISTA' AND "leidoEn" IS NULL`,
  );

  return Number(rows[0]?.count ?? 0);
}

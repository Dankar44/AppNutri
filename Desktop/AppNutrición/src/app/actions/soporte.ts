"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import { publicarBroadcast } from "@/lib/realtime-publish";
import { checkRateLimit, LIMITES } from "@/lib/rate-limit";
import { randomUUID } from "crypto";

export interface MensajeSoporteData {
  id: string;
  dietistaId: string;
  autor: "DIETISTA" | "ADMIN";
  texto: string;
  leidoEn: Date | null;
  createdAt: Date;
}

export interface SoporteResumen {
  texto: string;
  autor: "DIETISTA" | "ADMIN";
  createdAt: Date;
  noLeidos: number;
}

function cuid(): string {
  const ts = Date.now().toString(36);
  const rand = randomUUID().replace(/-/g, "").slice(0, 16);
  return `c${ts}${rand}`;
}

export async function getMensajesSoporte(limit = 100): Promise<MensajeSoporteData[]> {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  return prisma.$queryRawUnsafe<MensajeSoporteData[]>(
    `SELECT * FROM (
       SELECT id, "dietistaId", autor, texto, "leidoEn", "createdAt"
       FROM mensajes_soporte
       WHERE "dietistaId" = $1
       ORDER BY "createdAt" DESC
       LIMIT $2
     ) AS m
     ORDER BY m."createdAt" ASC`,
    dietista.id,
    limit,
  );
}

export async function enviarMensajeSoporte(texto: string): Promise<MensajeSoporteData> {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");
  if (dietista.isDemo) return { id: "", dietistaId: dietista.id, autor: "DIETISTA", texto: texto.trim().slice(0, 5000), leidoEn: null, createdAt: new Date() };

  const rl = checkRateLimit({
    key: `soporte:dietista:${dietista.id}`,
    ...LIMITES.enviarMensaje,
  });
  if (!rl.ok) {
    throw new Error(`Demasiados mensajes. Espera ${rl.retryAfter}s`);
  }

  const textoLimpio = texto.trim().slice(0, 5000);
  if (!textoLimpio) throw new Error("Mensaje vacío");

  const id = cuid();
  const rows = await prisma.$queryRawUnsafe<MensajeSoporteData[]>(
    `INSERT INTO mensajes_soporte (id, "dietistaId", autor, texto)
     VALUES ($1, $2, 'DIETISTA', $3)
     RETURNING id, "dietistaId", autor, texto, "leidoEn", "createdAt"`,
    id,
    dietista.id,
    textoLimpio,
  );

  void publicarBroadcast(`soporte:${dietista.id}`, "nuevo_mensaje", {
    mensaje: rows[0],
  });
  void publicarBroadcast("inbox:admin", "actualizacion", {
    dietistaId: dietista.id,
  });

  return rows[0];
}

export async function marcarSoporteLeido(): Promise<void> {
  const dietista = await getCurrentDietista();
  if (!dietista) return;
  if (dietista.isDemo) return;

  await prisma.$executeRawUnsafe(
    `UPDATE dietistas SET "noLeidosSoporte" = 0 WHERE id = $1`,
    dietista.id,
  );

  await prisma.$executeRawUnsafe(
    `UPDATE mensajes_soporte SET "leidoEn" = NOW()
     WHERE "dietistaId" = $1 AND autor = 'ADMIN' AND "leidoEn" IS NULL`,
    dietista.id,
  );

  void publicarBroadcast(`soporte:${dietista.id}`, "leido", {
    por: "DIETISTA",
  });
}

export async function getNoLeidosSoporteCount(): Promise<number> {
  const dietista = await getCurrentDietista();
  if (!dietista) return 0;

  const rows = await prisma.$queryRawUnsafe<{ noLeidosSoporte: number }[]>(
    `SELECT "noLeidosSoporte" FROM dietistas WHERE id = $1`,
    dietista.id,
  );

  return rows[0]?.noLeidosSoporte ?? 0;
}

export async function getSoporteResumen(): Promise<SoporteResumen | null> {
  const dietista = await getCurrentDietista();
  if (!dietista) return null;

  const rows = await prisma.$queryRawUnsafe<Array<{
    texto: string;
    autor: "DIETISTA" | "ADMIN";
    createdAt: Date;
    noLeidosSoporte: number;
  }>>(
    `SELECT m.texto, m.autor, m."createdAt", d."noLeidosSoporte"
     FROM dietistas d
     LEFT JOIN LATERAL (
       SELECT texto, autor, "createdAt"
       FROM mensajes_soporte
       WHERE "dietistaId" = d.id
       ORDER BY "createdAt" DESC
       LIMIT 1
     ) m ON true
     WHERE d.id = $1`,
    dietista.id,
  );

  if (!rows[0] || !rows[0].texto) return null;

  return {
    texto: rows[0].texto,
    autor: rows[0].autor,
    createdAt: rows[0].createdAt,
    noLeidos: rows[0].noLeidosSoporte,
  };
}

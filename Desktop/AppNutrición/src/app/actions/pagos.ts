"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import { revalidatePath } from "next/cache";

export interface Pago {
  id: string;
  pacienteId: string | null;
  pacienteNombre: string | null;
  concepto: string;
  importe: number;
  estado: string;
  metodoPago: string | null;
  fechaPago: Date | null;
  notas: string | null;
  createdAt: Date;
}

export async function getPagos(): Promise<Pago[]> {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  const rows = await prisma.$queryRawUnsafe<{
    id: string;
    pacienteId: string | null;
    pacienteNombre: string | null;
    concepto: string;
    importe: number;
    estado: string;
    metodoPago: string | null;
    fechaPago: Date | null;
    notas: string | null;
    createdAt: Date;
  }[]>(
    `SELECT p.id, p."pacienteId",
      CASE WHEN pac.id IS NOT NULL THEN pac.nombre || ' ' || pac.apellidos ELSE NULL END as "pacienteNombre",
      p.concepto, p.importe, p.estado, p."metodoPago", p."fechaPago", p.notas, p."createdAt"
     FROM pagos p
     LEFT JOIN pacientes pac ON p."pacienteId" = pac.id
     WHERE p."dietistaId" = $1
     ORDER BY p."createdAt" DESC`,
    dietista.id
  );

  return rows;
}

export async function getEstadisticasPagos() {
  const dietista = await getCurrentDietista();
  if (!dietista) return { total: 0, cobrado: 0, pendiente: 0, pagosCount: 0 };

  const rows = await prisma.$queryRawUnsafe<{
    estado: string;
    total: number;
    count: bigint;
  }[]>(
    `SELECT estado, COALESCE(SUM(importe), 0) as total, COUNT(*) as count
     FROM pagos WHERE "dietistaId" = $1
     GROUP BY estado`,
    dietista.id
  );

  let cobrado = 0, pendiente = 0, pagosCount = 0;
  for (const r of rows) {
    pagosCount += Number(r.count);
    if (r.estado === "PAGADO") cobrado += Number(r.total);
    else pendiente += Number(r.total);
  }

  return { total: pagosCount, cobrado, pendiente, pagosCount };
}

export async function crearPago(data: {
  pacienteId?: string;
  concepto: string;
  importe: number;
  notas?: string;
}) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  if (!data.concepto.trim()) throw new Error("El concepto es obligatorio");
  if (data.importe <= 0) throw new Error("El importe debe ser mayor que 0");

  await prisma.$queryRawUnsafe(
    `INSERT INTO pagos (id, "dietistaId", "pacienteId", concepto, importe, estado, notas, "createdAt", "updatedAt")
     VALUES (gen_random_uuid()::text, $1, $2, $3, $4, 'PENDIENTE', $5, NOW(), NOW())`,
    dietista.id,
    data.pacienteId || null,
    data.concepto.trim().slice(0, 200),
    data.importe,
    data.notas?.trim().slice(0, 500) || null
  );

  revalidatePath("/pagos");
}

export async function marcarPagado(pagoId: string, metodoPago: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  await prisma.$queryRawUnsafe(
    `UPDATE pagos SET estado = 'PAGADO', "metodoPago" = $1, "fechaPago" = NOW(), "updatedAt" = NOW()
     WHERE id = $2 AND "dietistaId" = $3`,
    metodoPago.slice(0, 50),
    pagoId,
    dietista.id
  );

  revalidatePath("/pagos");
}

export async function eliminarPago(pagoId: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  await prisma.$queryRawUnsafe(
    `DELETE FROM pagos WHERE id = $1 AND "dietistaId" = $2`,
    pagoId,
    dietista.id
  );

  revalidatePath("/pagos");
}

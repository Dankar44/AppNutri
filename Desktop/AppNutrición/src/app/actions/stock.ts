"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import {
  validateId,
  validateNumber,
  sanitizeStringOptional,
  validateEnum,
  LIMITS,
} from "@/lib/validation";
import { getCompanyMemberIds } from "@/lib/empresa-utils";

const TIPOS_MOVIMIENTO = ["ESTABLECER", "INCREMENTAR", "DECREMENTAR"] as const;

// ─── Registrar movimiento de stock ───

export async function registrarMovimientoStock(
  alimentoId: string,
  data: { tipo: string; cantidad: number; nota?: string },
): Promise<{ ok: boolean; error?: string; stockNuevo?: number }> {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) return { ok: false, error: t("auth.noAutorizado") };
  if (dietista.isDemo) return { ok: false, error: t("auth.noAutorizado") };

  const aId = validateId(alimentoId);
  if (!aId) return { ok: false, error: t("alimento.noEncontrado") };

  const tipo = validateEnum(data.tipo, TIPOS_MOVIMIENTO);
  if (!tipo) return { ok: false, error: t("empresa.tipoMovimientoInvalido") };

  const cantidad = validateNumber(data.cantidad, 0, LIMITS.STOCK_MAX);
  const nota = sanitizeStringOptional(data.nota, LIMITS.NOTA_STOCK);

  const d = await prisma.dietista.findUnique({
    where: { id: dietista.id },
    select: { empresaId: true },
  });
  if (!d?.empresaId) return { ok: false, error: t("empresa.noEnEmpresa") };

  const memberIds = await getCompanyMemberIds(dietista.id, d.empresaId);
  const alimento = await prisma.alimento.findFirst({
    where: { id: aId, dietistaId: { in: memberIds } },
    select: { id: true, stock: true, stockMinimo: true, dietistaId: true },
  });
  if (!alimento) return { ok: false, error: t("alimento.noEncontrado") };

  const stockAnterior = alimento.stock ?? 0;
  let stockNuevo: number;

  switch (tipo) {
    case "ESTABLECER":
      stockNuevo = cantidad;
      break;
    case "INCREMENTAR":
      stockNuevo = stockAnterior + cantidad;
      break;
    case "DECREMENTAR":
      stockNuevo = Math.max(0, stockAnterior - cantidad);
      break;
  }

  if (stockNuevo > LIMITS.STOCK_MAX) stockNuevo = LIMITS.STOCK_MAX;

  await prisma.$transaction([
    prisma.alimento.update({
      where: { id: aId },
      data: { stock: stockNuevo },
    }),
    prisma.movimientoStock.create({
      data: {
        alimentoId: aId,
        dietistaId: dietista.id,
        empresaId: d.empresaId,
        tipo,
        cantidad: tipo === "DECREMENTAR" ? -cantidad : cantidad,
        stockAnterior,
        stockNuevo,
        nota,
      },
    }),
  ]);

  if (alimento.stockMinimo && stockNuevo <= alimento.stockMinimo && stockAnterior > alimento.stockMinimo) {
    const miembros = await prisma.dietista.findMany({
      where: { empresaId: d.empresaId },
      select: { id: true },
    });
    const alimentoNombre = await prisma.alimento.findUnique({
      where: { id: aId },
      select: { nombre: true },
    });
    for (const m of miembros) {
      await prisma.notificacion.create({
        data: {
          dietistaId: m.id,
          tipo: "STOCK_BAJO",
          titulo: `Stock bajo: ${alimentoNombre?.nombre ?? "Producto"}`,
          mensaje: `El stock ha bajado a ${stockNuevo} unidades (mínimo: ${alimento.stockMinimo}).`,
          enlace: `/alimentos/${aId}`,
        },
      });
    }
  }

  revalidatePath("/alimentos");
  revalidatePath(`/alimentos/${aId}`);
  revalidatePath("/centro");
  return { ok: true, stockNuevo };
}

// ─── Actualizar campos de stock de un alimento ───

export async function actualizarStockAlimento(
  alimentoId: string,
  data: { stock?: number | null; precioUnitario?: number | null; stockMinimo?: number | null },
): Promise<{ ok: boolean; error?: string }> {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) return { ok: false, error: t("auth.noAutorizado") };
  if (dietista.isDemo) return { ok: false, error: t("auth.noAutorizado") };

  const aId = validateId(alimentoId);
  if (!aId) return { ok: false, error: t("alimento.noEncontrado") };

  const d = await prisma.dietista.findUnique({
    where: { id: dietista.id },
    select: { empresaId: true },
  });
  if (!d?.empresaId) return { ok: false, error: t("empresa.noEnEmpresa") };

  const memberIds = await getCompanyMemberIds(dietista.id, d.empresaId);
  const alimento = await prisma.alimento.findFirst({
    where: { id: aId, dietistaId: { in: memberIds } },
    select: { id: true, dietistaId: true },
  });
  if (!alimento) return { ok: false, error: t("alimento.noEncontrado") };

  const updateData: Record<string, unknown> = {};
  if (data.stock !== undefined) {
    updateData.stock = data.stock === null ? null : validateNumber(data.stock, 0, LIMITS.STOCK_MAX);
  }
  if (data.precioUnitario !== undefined) {
    updateData.precioUnitario = data.precioUnitario === null ? null : validateNumber(data.precioUnitario, 0, LIMITS.PRECIO_MAX);
  }
  if (data.stockMinimo !== undefined) {
    updateData.stockMinimo = data.stockMinimo === null ? null : validateNumber(data.stockMinimo, 0, LIMITS.STOCK_MAX);
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.alimento.update({ where: { id: aId }, data: updateData });
  }

  revalidatePath("/alimentos");
  revalidatePath(`/alimentos/${aId}`);
  revalidatePath("/centro");
  return { ok: true };
}

// ─── Historial de movimientos de stock ───

export async function getHistorialStock(alimentoId: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  const aId = validateId(alimentoId);
  if (!aId) return [];

  const d = await prisma.dietista.findUnique({
    where: { id: dietista.id },
    select: { empresaId: true },
  });
  if (!d?.empresaId) return [];

  return prisma.movimientoStock.findMany({
    where: { alimentoId: aId, empresaId: d.empresaId },
    include: {
      dietista: { select: { nombre: true, apellidos: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

// ─── Resumen de stock de la empresa ───

export async function getResumenStockEmpresa() {
  const dietista = await getCurrentDietista();
  if (!dietista) return null;

  const d = await prisma.dietista.findUnique({
    where: { id: dietista.id },
    select: { empresaId: true },
  });
  if (!d?.empresaId) return null;

  const memberIds = await prisma.dietista.findMany({
    where: { empresaId: d.empresaId },
    select: { id: true },
  });
  const ids = memberIds.map((m) => m.id);

  const alimentos = await prisma.alimento.findMany({
    where: {
      dietistaId: { in: ids },
      stock: { not: null },
    },
    select: { stock: true, precioUnitario: true, stockMinimo: true },
  });

  let totalItems = 0;
  let bajosStock = 0;
  let valorTotal = 0;

  for (const a of alimentos) {
    totalItems++;
    if (a.stockMinimo !== null && a.stock !== null && a.stock <= a.stockMinimo) {
      bajosStock++;
    }
    if (a.stock !== null && a.precioUnitario !== null) {
      valorTotal += a.stock * a.precioUnitario;
    }
  }

  return { totalItems, bajosStock, valorTotal: Math.round(valorTotal * 100) / 100 };
}

// ─── Inventario completo de la empresa ───

export async function getInventarioEmpresa() {
  const dietista = await getCurrentDietista();
  if (!dietista) return null;

  const d = await prisma.dietista.findUnique({
    where: { id: dietista.id },
    select: { empresaId: true },
  });
  if (!d?.empresaId) return null;

  const memberIds = await getCompanyMemberIds(dietista.id, d.empresaId);

  const alimentos = await prisma.alimento.findMany({
    where: {
      dietistaId: { in: memberIds },
      OR: [
        { stock: { not: null } },
        { compartido: true },
      ],
    },
    select: {
      id: true,
      nombre: true,
      categoria: true,
      stock: true,
      stockMinimo: true,
      precioUnitario: true,
      compartido: true,
      dietistaId: true,
      dietista: {
        select: { nombre: true, apellidos: true },
      },
    },
    orderBy: { nombre: "asc" },
  });

  return alimentos;
}

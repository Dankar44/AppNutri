"use server";

import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
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
  stripePaymentUrl: string | null;
  stripeSessionId: string | null;
  createdAt: Date;
}

export async function getPagos(): Promise<Pago[]> {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  const rows = await prisma.$queryRawUnsafe<Pago[]>(
    `SELECT p.id, p."pacienteId",
      CASE WHEN pac.id IS NOT NULL THEN pac.nombre || ' ' || pac.apellidos ELSE NULL END as "pacienteNombre",
      p.concepto, p.importe, p.estado, p."metodoPago", p."fechaPago", p.notas,
      p."stripePaymentUrl", p."stripeSessionId", p."createdAt"
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
  if (dietista.isDemo) return;

  if (!data.concepto.trim()) throw new Error("El concepto es obligatorio");
  if (data.importe <= 0) throw new Error("El importe debe ser mayor que 0");

  // Insertar pago en BD
  const rows = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `INSERT INTO pagos (id, "dietistaId", "pacienteId", concepto, importe, estado, notas, "createdAt", "updatedAt")
     VALUES (gen_random_uuid()::text, $1, $2, $3, $4, 'PENDIENTE', $5, NOW(), NOW())
     RETURNING id`,
    dietista.id,
    data.pacienteId || null,
    data.concepto.trim().slice(0, 200),
    data.importe,
    data.notas?.trim().slice(0, 500) || null
  );

  const pagoId = rows[0]?.id;

  // Si el dietista tiene Stripe conectado, crear Checkout Session
  if (pagoId) {
    const stripeRows = await prisma.$queryRawUnsafe<{ stripeAccountId: string | null; stripeOnboarded: boolean }[]>(
      `SELECT "stripeAccountId", "stripeOnboarded" FROM dietistas WHERE id = $1`,
      dietista.id
    );

    const stripeAccount = stripeRows[0];
    if (stripeAccount?.stripeAccountId && stripeAccount.stripeOnboarded) {
      try {
        const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const session = await stripe.checkout.sessions.create({
          mode: "payment",
          line_items: [{
            price_data: {
              currency: "eur",
              product_data: {
                name: data.concepto.trim().slice(0, 200),
                description: data.notas?.trim().slice(0, 500) || undefined,
              },
              unit_amount: Math.round(data.importe * 100), // Stripe usa céntimos
            },
            quantity: 1,
          }],
          payment_intent_data: {
            application_fee_amount: 0, // Sin comisión de plataforma por ahora
          },
          metadata: {
            pagoId,
            dietistaId: dietista.id,
          },
          success_url: `${origin}/pagos?pago=${pagoId}&status=success`,
          cancel_url: `${origin}/pagos?pago=${pagoId}&status=cancel`,
          expires_at: Math.floor(Date.now() / 1000) + 86400, // 24 horas
        }, {
          stripeAccount: stripeAccount.stripeAccountId,
        });

        // Guardar la URL y session ID
        await prisma.$queryRawUnsafe(
          `UPDATE pagos SET "stripeSessionId" = $1, "stripePaymentUrl" = $2, "updatedAt" = NOW()
           WHERE id = $3`,
          session.id,
          session.url,
          pagoId
        );
      } catch (err) {
        // Si falla Stripe, el pago se crea igual sin link (modo manual)
        console.error("Error creando Stripe Checkout Session:", err);
      }
    }
  }

  revalidatePath("/pagos");
}

// ─── Generar nuevo link de pago para un pago existente ─────────────────

export async function generarLinkPago(pagoId: string): Promise<{ url: string | null }> {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");
  if (dietista.isDemo) return { url: null };

  // Obtener datos del pago
  const pagoRows = await prisma.$queryRawUnsafe<{ id: string; concepto: string; importe: number; notas: string | null; estado: string }[]>(
    `SELECT id, concepto, importe, notas, estado FROM pagos WHERE id = $1 AND "dietistaId" = $2`,
    pagoId,
    dietista.id
  );

  const pago = pagoRows[0];
  if (!pago) throw new Error("Pago no encontrado");
  if (pago.estado === "PAGADO") throw new Error("El pago ya está completado");

  // Verificar que tiene Stripe
  const stripeRows = await prisma.$queryRawUnsafe<{ stripeAccountId: string | null; stripeOnboarded: boolean }[]>(
    `SELECT "stripeAccountId", "stripeOnboarded" FROM dietistas WHERE id = $1`,
    dietista.id
  );

  const stripeAccount = stripeRows[0];
  if (!stripeAccount?.stripeAccountId || !stripeAccount.stripeOnboarded) {
    throw new Error("Conecta tu cuenta de Stripe en Ajustes para generar links de pago");
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{
      price_data: {
        currency: "eur",
        product_data: {
          name: pago.concepto,
          description: pago.notas || undefined,
        },
        unit_amount: Math.round(pago.importe * 100),
      },
      quantity: 1,
    }],
    payment_intent_data: {
      application_fee_amount: 0,
    },
    metadata: {
      pagoId: pago.id,
      dietistaId: dietista.id,
    },
    success_url: `${origin}/pagos?pago=${pago.id}&status=success`,
    cancel_url: `${origin}/pagos?pago=${pago.id}&status=cancel`,
    expires_at: Math.floor(Date.now() / 1000) + 86400, // 24 horas
  }, {
    stripeAccount: stripeAccount.stripeAccountId,
  });

  await prisma.$queryRawUnsafe(
    `UPDATE pagos SET "stripeSessionId" = $1, "stripePaymentUrl" = $2, "updatedAt" = NOW()
     WHERE id = $3`,
    session.id,
    session.url,
    pago.id
  );

  revalidatePath("/pagos");
  return { url: session.url };
}

export async function marcarPagado(pagoId: string, metodoPago: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");
  if (dietista.isDemo) return;

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
  if (dietista.isDemo) return;

  await prisma.$queryRawUnsafe(
    `DELETE FROM pagos WHERE id = $1 AND "dietistaId" = $2`,
    pagoId,
    dietista.id
  );

  revalidatePath("/pagos");
}

import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import pg from "pg";

// Pool directa para el webhook (no pasa por Prisma para evitar problemas con server actions)
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
  max: 1,
});

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    switch (event.type) {
      // ─── Pago completado via Checkout ──────────────────────
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.payment_status === "paid" && session.metadata?.pagoId) {
          await client.query(
            `UPDATE pagos SET estado = 'PAGADO', "metodoPago" = 'Stripe', "fechaPago" = NOW(), "updatedAt" = NOW()
             WHERE id = $1`,
            [session.metadata.pagoId]
          );
        }
        break;
      }

      // ─── Checkout expirado ─────────────────────────────────
      case "checkout.session.expired": {
        const session = event.data.object;
        if (session.metadata?.pagoId) {
          // Limpiar la URL de pago expirada
          await client.query(
            `UPDATE pagos SET "stripeSessionId" = NULL, "stripePaymentUrl" = NULL, "updatedAt" = NOW()
             WHERE id = $1 AND estado = 'PENDIENTE'`,
            [session.metadata.pagoId]
          );
        }
        break;
      }

      // ─── Cuenta Connect actualizada ────────────────────────
      case "account.updated": {
        const account = event.data.object;
        const onboarded = account.charges_enabled && account.details_submitted;
        await client.query(
          `UPDATE dietistas SET "stripeOnboarded" = $1 WHERE "stripeAccountId" = $2`,
          [onboarded, account.id]
        );
        break;
      }
    }
  } finally {
    client.release();
  }

  return NextResponse.json({ received: true });
}

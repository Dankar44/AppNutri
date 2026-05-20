import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

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

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.payment_status === "paid" && session.metadata?.pagoId) {
        await prisma.$queryRawUnsafe(
          `UPDATE pagos SET estado = 'PAGADO', "metodoPago" = 'Stripe', "fechaPago" = NOW(), "updatedAt" = NOW()
           WHERE id = $1`,
          session.metadata.pagoId
        );
      }
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object;
      if (session.metadata?.pagoId) {
        await prisma.$queryRawUnsafe(
          `UPDATE pagos SET "stripeSessionId" = NULL, "stripePaymentUrl" = NULL, "updatedAt" = NOW()
           WHERE id = $1 AND estado = 'PENDIENTE'`,
          session.metadata.pagoId
        );
      }
      break;
    }

    case "account.updated": {
      const account = event.data.object;
      const onboarded = account.charges_enabled && account.details_submitted;
      await prisma.$queryRawUnsafe(
        `UPDATE dietistas SET "stripeOnboarded" = $1 WHERE "stripeAccountId" = $2`,
        onboarded, account.id
      );
      break;
    }
  }

  return NextResponse.json({ received: true });
}

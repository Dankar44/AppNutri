"use server";

import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import { revalidatePath } from "next/cache";

// ─── Estado de la cuenta Stripe del dietista ───────────────────────────

export interface StripeAccountStatus {
  connected: boolean;
  accountId: string | null;
  onboarded: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
}

export async function getStripeAccountStatus(): Promise<StripeAccountStatus> {
  const dietista = await getCurrentDietista();
  if (!dietista) return { connected: false, accountId: null, onboarded: false, chargesEnabled: false, payoutsEnabled: false, detailsSubmitted: false };

  const rows = await prisma.$queryRawUnsafe<{ stripeAccountId: string | null; stripeOnboarded: boolean }[]>(
    `SELECT "stripeAccountId", "stripeOnboarded" FROM dietistas WHERE id = $1`,
    dietista.id
  );
  const row = rows[0];
  if (!row?.stripeAccountId) {
    return { connected: false, accountId: null, onboarded: false, chargesEnabled: false, payoutsEnabled: false, detailsSubmitted: false };
  }

  try {
    const account = await stripe.accounts.retrieve(row.stripeAccountId);
    const chargesEnabled = account.charges_enabled ?? false;
    const payoutsEnabled = account.payouts_enabled ?? false;
    const detailsSubmitted = account.details_submitted ?? false;
    const onboarded = chargesEnabled && detailsSubmitted;

    // Actualizar estado en BD si cambió
    if (onboarded !== row.stripeOnboarded) {
      await prisma.$queryRawUnsafe(
        `UPDATE dietistas SET "stripeOnboarded" = $1 WHERE id = $2`,
        onboarded,
        dietista.id
      );
    }

    return {
      connected: true,
      accountId: row.stripeAccountId,
      onboarded,
      chargesEnabled,
      payoutsEnabled,
      detailsSubmitted,
    };
  } catch {
    return { connected: true, accountId: row.stripeAccountId, onboarded: row.stripeOnboarded, chargesEnabled: false, payoutsEnabled: false, detailsSubmitted: false };
  }
}

// ─── Crear cuenta Connect Express y generar link de onboarding ─────────

export async function createStripeConnectAccount(): Promise<{ url: string }> {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  // Comprobar si ya tiene cuenta
  const rows = await prisma.$queryRawUnsafe<{ stripeAccountId: string | null }[]>(
    `SELECT "stripeAccountId" FROM dietistas WHERE id = $1`,
    dietista.id
  );

  let accountId = rows[0]?.stripeAccountId;

  if (!accountId) {
    // Crear cuenta Express
    const account = await stripe.accounts.create({
      type: "express",
      country: "ES",
      email: dietista.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: "individual",
      metadata: {
        dietistaId: dietista.id,
      },
    });

    accountId = account.id;

    await prisma.$queryRawUnsafe(
      `UPDATE dietistas SET "stripeAccountId" = $1, "stripeOnboarded" = FALSE WHERE id = $2`,
      accountId,
      dietista.id
    );
  }

  // Generar link de onboarding
  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${origin}/ajustes?stripe=refresh`,
    return_url: `${origin}/ajustes?stripe=success`,
    type: "account_onboarding",
  });

  return { url: accountLink.url };
}

// ─── Generar link de onboarding para cuenta existente ──────────────────

export async function getStripeOnboardingLink(): Promise<{ url: string }> {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  const rows = await prisma.$queryRawUnsafe<{ stripeAccountId: string | null }[]>(
    `SELECT "stripeAccountId" FROM dietistas WHERE id = $1`,
    dietista.id
  );

  const accountId = rows[0]?.stripeAccountId;
  if (!accountId) throw new Error("No tienes cuenta de Stripe conectada");

  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${origin}/ajustes?stripe=refresh`,
    return_url: `${origin}/ajustes?stripe=success`,
    type: "account_onboarding",
  });

  return { url: accountLink.url };
}

// ─── Desconectar cuenta Stripe ─────────────────────────────────────────

export async function disconnectStripeAccount(): Promise<void> {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  const rows = await prisma.$queryRawUnsafe<{ stripeAccountId: string | null }[]>(
    `SELECT "stripeAccountId" FROM dietistas WHERE id = $1`,
    dietista.id
  );

  const accountId = rows[0]?.stripeAccountId;
  if (accountId) {
    try {
      await stripe.accounts.del(accountId);
    } catch {
      // La cuenta puede no existir ya en Stripe
    }
  }

  await prisma.$queryRawUnsafe(
    `UPDATE dietistas SET "stripeAccountId" = NULL, "stripeOnboarded" = FALSE WHERE id = $1`,
    dietista.id
  );

  revalidatePath("/ajustes");
}

// ─── Acceso al dashboard de Stripe Express ─────────────────────────────

export async function getStripeDashboardLink(): Promise<{ url: string }> {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  const rows = await prisma.$queryRawUnsafe<{ stripeAccountId: string | null }[]>(
    `SELECT "stripeAccountId" FROM dietistas WHERE id = $1`,
    dietista.id
  );

  const accountId = rows[0]?.stripeAccountId;
  if (!accountId) throw new Error("No tienes cuenta de Stripe conectada");

  const loginLink = await stripe.accounts.createLoginLink(accountId);
  return { url: loginLink.url };
}

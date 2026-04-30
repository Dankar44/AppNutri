import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentDietista } from "@/app/actions/auth";
import { exchangeCodeForTokens, getUserEmail } from "@/lib/google-oauth";
import { backfillCitasNutri } from "@/lib/google-sync";
import { prisma } from "@/lib/prisma";

const STATE_COOKIE_NUTRI = "google_oauth_state_nutri";

function getBaseUrl(req: NextRequest): string {
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("host") || "localhost:3000";
  return `${proto}://${host}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const base = getBaseUrl(req);

  if (error) {
    return NextResponse.redirect(new URL(`/ajustes?google=error&reason=${encodeURIComponent(error)}`, base));
  }
  if (!code || !state) {
    return NextResponse.redirect(new URL("/ajustes?google=error&reason=missing_params", base));
  }

  const jar = await cookies();
  const storedState = jar.get(STATE_COOKIE_NUTRI)?.value;
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(new URL("/ajustes?google=error&reason=state_mismatch", base));
  }
  jar.delete(STATE_COOKIE_NUTRI);

  const dietista = await getCurrentDietista();
  if (!dietista) {
    return NextResponse.redirect(new URL("/login", base));
  }

  try {
    const tokens = await exchangeCodeForTokens("nutri", code);
    const accessToken = tokens.access_token;
    const refreshToken = tokens.refresh_token;
    const expiryDate = tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600_000);

    if (!accessToken || !refreshToken) {
      return NextResponse.redirect(new URL("/ajustes?google=error&reason=no_tokens", base));
    }

    const email = (await getUserEmail(accessToken)) ?? dietista.email;

    await prisma.googleIntegracion.upsert({
      where: { dietistaId: dietista.id },
      update: { accessToken, refreshToken, expiryDate, email, sincronizar: true },
      create: {
        dietistaId: dietista.id,
        email,
        accessToken,
        refreshToken,
        expiryDate,
        sincronizar: true,
        crearMeet: false,
      },
    });

    // Backfill en background (no esperamos a que acabe)
    void backfillCitasNutri(dietista.id).catch((e) =>
      console.error("[backfill-callback]", e),
    );

    return NextResponse.redirect(new URL("/ajustes?google=ok&backfill=1", base));
  } catch (e) {
    console.error("[google/callback-nutri]", e);
    return NextResponse.redirect(new URL("/ajustes?google=error&reason=exchange_failed", base));
  }
}

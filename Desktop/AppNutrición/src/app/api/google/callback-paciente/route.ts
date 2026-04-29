import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentPaciente } from "@/lib/patient-auth";
import { exchangeCodeForTokens, getUserEmail } from "@/lib/google-oauth";
import { backfillCitasPaciente } from "@/lib/google-sync";
import { prisma } from "@/lib/prisma";

const STATE_COOKIE_PACIENTE = "google_oauth_state_paciente";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const redirectBase = "/paciente/portal/citas";

  if (error) {
    return NextResponse.redirect(new URL(`${redirectBase}?google=error&reason=${encodeURIComponent(error)}`, req.url));
  }
  if (!code || !state) {
    return NextResponse.redirect(new URL(`${redirectBase}?google=error&reason=missing_params`, req.url));
  }

  const jar = await cookies();
  const storedState = jar.get(STATE_COOKIE_PACIENTE)?.value;
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(new URL(`${redirectBase}?google=error&reason=state_mismatch`, req.url));
  }
  jar.delete(STATE_COOKIE_PACIENTE);

  const session = await getCurrentPaciente();
  if (!session) {
    return NextResponse.redirect(new URL("/paciente/login", req.url));
  }

  try {
    const tokens = await exchangeCodeForTokens("paciente", code);
    const accessToken = tokens.access_token;
    const refreshToken = tokens.refresh_token;
    const expiryDate = tokens.expiry_date ? new Date(tokens.expiry_date) : new Date(Date.now() + 3600_000);

    if (!accessToken || !refreshToken) {
      return NextResponse.redirect(new URL(`${redirectBase}?google=error&reason=no_tokens`, req.url));
    }

    const paciente = await prisma.paciente.findUnique({
      where: { id: session.pacienteId },
      select: { email: true },
    });
    const email = (await getUserEmail(accessToken)) ?? paciente?.email ?? "desconocido";

    await prisma.googleIntegracionPaciente.upsert({
      where: { pacienteId: session.pacienteId },
      update: { accessToken, refreshToken, expiryDate, email, sincronizar: true },
      create: {
        pacienteId: session.pacienteId,
        email,
        accessToken,
        refreshToken,
        expiryDate,
        sincronizar: true,
      },
    });

    void backfillCitasPaciente(session.pacienteId).catch((e) =>
      console.error("[backfill-paciente-callback]", e),
    );

    return NextResponse.redirect(new URL(`${redirectBase}?google=ok`, req.url));
  } catch (e) {
    console.error("[google/callback-paciente]", e);
    return NextResponse.redirect(new URL(`${redirectBase}?google=error&reason=exchange_failed`, req.url));
  }
}

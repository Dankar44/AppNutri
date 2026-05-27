import { NextRequest, NextResponse } from "next/server";
import { verifyEmailToken } from "@/lib/verify-email";
import { prisma } from "@/lib/prisma";

function getBaseUrl(req: NextRequest): string {
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("host") || "localhost:3000";
  return `${proto}://${host}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const origin = getBaseUrl(req);

  if (!token) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Enlace de verificación no válido.")}`,
    );
  }

  const payload = await verifyEmailToken(token);
  if (!payload) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Enlace expirado o no válido. Regístrate de nuevo.")}`,
    );
  }

  const rows = await prisma.$queryRawUnsafe<{ email_confirmed_at: Date | null }[]>(
    `SELECT email_confirmed_at FROM auth.users WHERE id = $1::uuid`,
    payload.authId,
  );

  if (rows.length === 0) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Cuenta no encontrada. Regístrate de nuevo.")}`,
    );
  }

  if (rows[0].email_confirmed_at) {
    return NextResponse.redirect(`${origin}/login?verified=true`);
  }

  await prisma.$queryRawUnsafe(
    `UPDATE auth.users SET email_confirmed_at = NOW(), updated_at = NOW() WHERE id = $1::uuid`,
    payload.authId,
  );

  await prisma.$queryRawUnsafe(
    `UPDATE auth.identities SET identity_data = identity_data || '{"email_verified": true}'::jsonb, updated_at = NOW() WHERE user_id = $1::uuid`,
    payload.authId,
  );

  return NextResponse.redirect(`${origin}/login?verified=true`);
}

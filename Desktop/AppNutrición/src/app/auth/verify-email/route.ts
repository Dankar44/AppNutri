import { NextRequest, NextResponse } from "next/server";
import { verifyEmailToken } from "@/lib/verify-email";
import { prisma } from "@/lib/prisma";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

function getBaseUrl(req: NextRequest): string {
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("host") || "localhost:3000";
  return `${proto}://${host}`;
}

// Confirma el email e inicia sesión automáticamente, redirigiendo al dashboard.
// Si el auto-login falla por cualquier motivo, cae a /login?verified=true (comportamiento
// anterior), de modo que verificar el email nunca se rompe para nadie.
async function confirmarYEntrar(req: NextRequest, origin: string, email: string): Promise<NextResponse> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const fallback = NextResponse.redirect(`${origin}/login?verified=true`);
  if (!url || !anon || !serviceKey) return fallback;

  try {
    const response = NextResponse.redirect(`${origin}/dashboard`);
    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });

    // Con la clave de servicio generamos un token de inicio de sesión de un solo uso
    // para este email y lo canjeamos para establecer la sesión (cookies en la respuesta).
    const admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
    const tokenHash = data?.properties?.hashed_token;
    if (error || !tokenHash) return fallback;

    const { error: otpError } = await supabase.auth.verifyOtp({
      type: "magiclink",
      token_hash: tokenHash,
    });
    if (otpError) return fallback;

    return response;
  } catch (e) {
    console.error("[verify-email] auto-login falló, redirigiendo a login:", e);
    return fallback;
  }
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

  // Ya estaba confirmado: igualmente lo entramos directo al dashboard.
  if (rows[0].email_confirmed_at) {
    return confirmarYEntrar(req, origin, payload.email);
  }

  await prisma.$queryRawUnsafe(
    `UPDATE auth.users SET email_confirmed_at = NOW(), updated_at = NOW() WHERE id = $1::uuid`,
    payload.authId,
  );

  await prisma.$queryRawUnsafe(
    `UPDATE auth.identities SET identity_data = identity_data || '{"email_verified": true}'::jsonb, updated_at = NOW() WHERE user_id = $1::uuid`,
    payload.authId,
  );

  return confirmarYEntrar(req, origin, payload.email);
}

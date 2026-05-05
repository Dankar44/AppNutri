import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

function getBaseUrl(req: NextRequest): string {
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("host") || "localhost:3000";
  return `${proto}://${host}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const origin = getBaseUrl(req);

  const supabase = await createClient();

  if (error) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription || error)}`,
    );
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error("[auth/callback] exchange failed", exchangeError);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    return NextResponse.redirect(`${origin}/login?error=exchange_failed`);
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const dietista = await prisma.dietista.findUnique({
      where: { authId: user.id },
    });

    if (!dietista) {
      if (process.env.REGISTRATION_OPEN !== "true") {
        await supabase.auth.signOut();
        return NextResponse.redirect(
          `${origin}/login?error=${encodeURIComponent("Los registros están cerrados. Si ya tienes cuenta de dietista, inicia sesión con email y contraseña.")}`,
        );
      }

      if (user.email) {
        const paciente = await prisma.paciente.findFirst({
          where: { email: user.email },
        });
        if (paciente) {
          await supabase.auth.signOut();
          return NextResponse.redirect(
            `${origin}/login?error=${encodeURIComponent("Este email está registrado como paciente. No es posible crear una cuenta de dietista con el mismo email.")}`,
          );
        }
      }
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}

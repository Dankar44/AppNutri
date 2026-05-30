import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import { ensureDietistaParaUsuario } from "@/app/actions/auth";

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

  // [logging] Registrar cada invocación del callback. Si un login con Google
  // "se pierde", aquí veremos si el callback llegó a ejecutarse y con qué datos.
  console.log(
    `[auth/callback] entrada — code=${code ? "sí" : "no"} oauthError=${error ?? "no"} next=${next} host=${req.headers.get("host") ?? "?"}`,
  );

  const supabase = await createClient();
  const t = await getTranslations("validation");

  if (error) {
    console.warn(
      `[auth/callback] Google devolvió error: ${error} — ${errorDescription ?? "sin descripción"}`,
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription || error)}`,
    );
  }

  if (!code) {
    console.warn("[auth/callback] sin 'code' en la URL — redirige a login (missing_code)");
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error(
      `[auth/callback] exchangeCodeForSession FALLÓ: ${exchangeError.message ?? exchangeError}`,
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    return NextResponse.redirect(`${origin}/login?error=exchange_failed`);
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    console.log(
      `[auth/callback] exchange OK — usuario ${user.email ?? user.id} (provider=${user.app_metadata?.provider ?? "?"})`,
    );
    // Si el email está registrado como paciente, no puede entrar como dietista.
    // signOut explícito para evitar el bucle middleware↔layout (sesión activa sin ficha).
    if (user.email) {
      const paciente = await prisma.paciente.findFirst({
        where: { email: user.email },
      });
      if (paciente) {
        console.warn(
          `[auth/callback] ${user.email} está registrado como PACIENTE — signOut y a login`,
        );
        await supabase.auth.signOut();
        return NextResponse.redirect(
          `${origin}/login?error=${encodeURIComponent(t("auth.emailRegistradoComoPaciente"))}`,
        );
      }
    }

    // Crear la ficha de dietista YA, en el momento del login, sin esperar a que cargue
    // el panel. Si algo fallara, NO rompemos el flujo: getCurrentDietista la reintentará
    // al abrir el dashboard (degradación al comportamiento anterior).
    try {
      const dietista = await ensureDietistaParaUsuario(user);
      if (dietista) {
        console.log(`[auth/callback] ficha asegurada para ${user.email ?? user.id} (id=${dietista.id})`);
      } else {
        console.warn(`[auth/callback] ensureDietistaParaUsuario devolvió null para ${user.email ?? user.id}`);
      }
    } catch (e) {
      console.error(
        `[auth/callback] error asegurando ficha para ${user.email ?? user.id}:`,
        e instanceof Error ? e.message : e,
      );
    }
  } else {
    console.error("[auth/callback] exchange sin error pero getUser() no devolvió usuario");
  }

  console.log(`[auth/callback] redirige a ${next}`);
  return NextResponse.redirect(`${origin}${next}`);
}

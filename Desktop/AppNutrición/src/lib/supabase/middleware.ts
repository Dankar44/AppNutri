import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthPage =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/registro") ||
    request.nextUrl.pathname.startsWith("/pendiente") ||
    request.nextUrl.pathname.startsWith("/recuperar-password") ||
    request.nextUrl.pathname.startsWith("/nueva-password");

  const isPublicRoute =
    request.nextUrl.pathname.startsWith("/landing") ||
    request.nextUrl.pathname.startsWith("/precios") ||
    request.nextUrl.pathname.startsWith("/legal") ||
    request.nextUrl.pathname.startsWith("/compartido") ||
    request.nextUrl.pathname.startsWith("/preconsulta") ||
    request.nextUrl.pathname.startsWith("/paciente") ||
    request.nextUrl.pathname.startsWith("/admin-login") ||
    request.nextUrl.pathname.startsWith("/admin") ||
    request.nextUrl.pathname.startsWith("/demo") ||
    request.nextUrl.pathname.startsWith("/colaboradores") ||
    request.nextUrl.pathname.startsWith("/faq") ||
    request.nextUrl.pathname.startsWith("/novedades") ||
    request.nextUrl.pathname.startsWith("/software-para-nutricionistas-gratis") ||
    request.nextUrl.pathname.startsWith("/alternativa-") ||
    // Callbacks OAuth: el code lo procesa el handler, el usuario puede no
    // tener sesión aún (Sign in with Google) o ser paciente (JWT propio).
    request.nextUrl.pathname === "/auth/callback" ||
    request.nextUrl.pathname === "/auth/verify-email" ||
    request.nextUrl.pathname.startsWith("/api/google/");

  const hasDemoSession = request.cookies.has("annonia-demo-session");

  // La cookie demo (dura 24h) no debe "contaminar" el acceso a la cuenta real.
  // La limpiamos cuando: (a) hay sesión real → la real SIEMPRE manda; o
  // (b) el usuario va a una página de login/registro → ir ahí significa que
  // quiere salir de la demo para entrar a su cuenta, así que no debe quedar
  // "atrapado" en la demo. Se auto-cura en cualquier ruta.
  const limpiarDemoObsoleta = (res: NextResponse) => {
    if (hasDemoSession && (user || isAuthPage)) {
      res.cookies.delete("annonia-demo-session");
    }
    return res;
  };

  if (!user && !hasDemoSession && !isAuthPage && !isPublicRoute && request.nextUrl.pathname !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage && !request.nextUrl.pathname.startsWith("/pendiente") && !request.nextUrl.pathname.startsWith("/nueva-password")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return limpiarDemoObsoleta(NextResponse.redirect(url));
  }

  return limpiarDemoObsoleta(supabaseResponse);
}

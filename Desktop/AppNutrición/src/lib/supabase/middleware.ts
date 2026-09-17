import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Nombre de la cookie donde @supabase/ssr guarda la sesión. Si la cookie no está, no hay
 * sesión posible y no hace falta preguntárselo a nadie.
 *
 * Cuando el contenido no cabe en una cookie, la librería lo parte en `...auth-token.0`,
 * `...auth-token.1`, etc., así que se busca por prefijo.
 */
const PREFIJO_COOKIE_SESION = "-auth-token";

/**
 * Margen antes de que caduque el token a partir del cual se pide uno nuevo. Con 5 minutos,
 * a nadie se le corta la sesión a mitad de faena por apurar.
 */
const MARGEN_RENOVACION_SEGUNDOS = 5 * 60;

function tieneCookieDeSesion(request: NextRequest): boolean {
  return request.cookies.getAll().some(
    (c) => c.name.startsWith("sb-") && c.name.includes(PREFIJO_COOKIE_SESION),
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const pathname = request.nextUrl.pathname;

  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/registro") ||
    pathname.startsWith("/pendiente") ||
    pathname.startsWith("/recuperar-password") ||
    pathname.startsWith("/nueva-password");

  const isPublicRoute =
    pathname.startsWith("/landing") ||
    pathname.startsWith("/precios") ||
    pathname.startsWith("/legal") ||
    pathname.startsWith("/compartido") ||
    pathname.startsWith("/preconsulta") ||
    // #39 — El enlace de invitación docente: quien lo abre todavía no tiene cuenta, así que no
    // puede pasar por el login. Lo que autoriza es el token, que se valida en la propia página.
    pathname.startsWith("/invitacion") ||
    // El enlace de clase: el alumno que lo abre todavía no tiene cuenta.
    pathname.startsWith("/clase/") ||
    // Y el de profesorado, por lo mismo: la universidad lo reparte y quien lo abre puede no tener
    // cuenta. Sin esto se le mandaba al login y no había forma de darse de alta (8 sep 2026).
    pathname.startsWith("/profesorado/") ||
    pathname.startsWith("/paciente") ||
    pathname.startsWith("/admin-login") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/demo") ||
    pathname.startsWith("/colaboradores") ||
    pathname.startsWith("/faq") ||
    pathname.startsWith("/novedades") ||
    pathname.startsWith("/software-para-nutricionistas-gratis") ||
    pathname.startsWith("/alternativa-") ||
    // Callbacks OAuth: el code lo procesa el handler, el usuario puede no
    // tener sesión aún (Sign in with Google) o ser paciente (JWT propio).
    pathname === "/auth/callback" ||
    pathname === "/auth/verify-email" ||
    pathname.startsWith("/api/google/");

  const hasDemoSession = request.cookies.has("annonia-demo-session");

  // ─────────────────────────────────────────────────────────────────────────────
  // Quién es el visitante, gastando lo menos posible.
  //
  // Antes esto hacía SIEMPRE `supabase.auth.getUser()`, que es una petición HTTP al
  // servicio de Auth de Supabase, en TODAS las peticiones y aunque no hubiera ninguna
  // cookie. El 17 sep 2026 un escáner automático pidió 14.038 veces /login desde cinco
  // IPs: cada una se convirtió en una llamada a Auth, Auth se saturó, la CPU de la
  // instancia se fue al 61 % y Postgres dejó de aceptar conexiones. La web estuvo caída
  // hasta que se reinició el proyecto. Ver #188.
  //
  // Ahora, por orden de coste:
  //   1. Sin cookie de sesión  → no se pregunta a nadie. Un `curl` pelado no cuesta nada.
  //   2. Con cookie            → el token se valida EN LOCAL con `getClaims()`. Los tokens
  //      de este proyecto son ES256 y la clave pública se cachea diez minutos, así que no
  //      hay petición de red. Es validación criptográfica de verdad, no un atajo.
  //   3. Solo si el token caducó (o le quedan menos de cinco minutos) se llama a
  //      `getUser()`, que además renueva y reescribe las cookies. Sale a una vez por hora
  //      y usuario, en vez de una por petición.
  // ─────────────────────────────────────────────────────────────────────────────

  let user: { id: string } | null = null;
  let authCaido = false;

  if (tieneCookieDeSesion(request)) {
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

    try {
      const { data, error } = await supabase.auth.getClaims();
      const claims = data?.claims;
      const caducaEn = typeof claims?.exp === "number" ? claims.exp : 0;
      const quedaPoco = caducaEn - Math.floor(Date.now() / 1000) < MARGEN_RENOVACION_SEGUNDOS;

      if (claims?.sub && !quedaPoco && !error) {
        // Token válido y con margen: nada que renovar, ni una petición de red.
        user = { id: claims.sub };
      } else {
        // Caducado, a punto, o no se pudo validar: aquí sí se llama a Auth, que de paso
        // renueva el token y deja las cookies nuevas en `supabaseResponse`.
        const { data: datosUsuario, error: errorUsuario } = await supabase.auth.getUser();
        if (errorUsuario) {
          // Distinguir "este token no vale" de "Auth no contesta" es lo que evita echar a
          // todo el mundo cuando Supabase tiene un mal rato: si es un problema de red, se
          // respeta la sesión que trae la cookie. Las páginas y las acciones vuelven a
          // comprobar la identidad por su cuenta, así que esto no abre ninguna puerta.
          const esFalloDeRed =
            errorUsuario.name === "AuthRetryableFetchError" || errorUsuario.status === 0;
          if (esFalloDeRed) {
            authCaido = true;
            user = claims?.sub ? { id: claims.sub } : null;
          }
        } else {
          user = datosUsuario.user ? { id: datosUsuario.user.id } : null;
        }
      }
    } catch {
      // Cualquier fallo inesperado se trata como caída de Auth, nunca como sesión inválida.
      authCaido = true;
    }
  }

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

  // Mandar al login solo cuando se sabe que no hay sesión. Si Auth no contesta, se deja
  // pasar: las páginas comprueban la identidad otra vez y, si de verdad no la hay, serán
  // ellas las que redirijan. Peor sería expulsar a quien sí tiene sesión y provocar que
  // toda la gente conectada vuelva a intentar entrar a la vez.
  if (!user && !authCaido && !hasDemoSession && !isAuthPage && !isPublicRoute && pathname !== "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthPage && !pathname.startsWith("/pendiente") && !pathname.startsWith("/nueva-password")) {
    const url = request.nextUrl.clone();
    // #39 — A /entrar y no a /dashboard: ahí se decide si esta cuenta es de profesor. No se puede
    // consultar la base de datos desde aquí (esto corre en Edge).
    url.pathname = "/entrar";
    return limpiarDemoObsoleta(NextResponse.redirect(url));
  }

  return limpiarDemoObsoleta(supabaseResponse);
}

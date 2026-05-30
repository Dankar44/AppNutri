"use server";

import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { crearPacienteDemoSiNoExiste } from "@/lib/paciente-demo";
import { getDemoSession, clearDemoSession } from "@/lib/demo-auth";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { generarSlug } from "@/lib/empresa-utils";

/**
 * Garantiza que un usuario autenticado tenga su ficha de dietista (auto-provisioning).
 * Idempotente: si ya existe la devuelve; si no, la crea. Se invoca tanto desde
 * getCurrentDietista (al cargar el panel) como desde el callback de OAuth (justo tras
 * el login), para que el alta NO dependa de un único punto frágil: así la ficha se crea
 * en el momento del login y no se difiere a la primera carga del dashboard.
 *
 * Devuelve null cuando el usuario no debe tener ficha (es paciente, o email sin confirmar
 * en cuenta no-OAuth). Cada salida sin ficha se loguea con prefijo [auth] para diagnóstico.
 */
export async function ensureDietistaParaUsuario(
  user: User,
  locale: "es" | "pt" = "es",
) {
  const idLog = user.email ?? user.id;

  const existente = await prisma.dietista.findUnique({
    where: { authId: user.id },
  });
  if (existente) return existente;

  // Email sin confirmar: las cuentas OAuth (Google) se auto-confirman; las de
  // email/password sin confirmar se rechazan (deben verificar antes de tener ficha).
  const confirmCheck = await prisma.$queryRawUnsafe<{ email_confirmed_at: Date | null }[]>(
    `SELECT email_confirmed_at FROM auth.users WHERE id = $1::uuid`,
    user.id,
  );
  if (confirmCheck.length > 0 && !confirmCheck[0].email_confirmed_at) {
    const isOAuth = user.app_metadata?.providers?.some((p: string) => p !== "email");
    if (isOAuth) {
      console.log(`[auth] ${idLog}: OAuth sin email_confirmed_at, confirmando automáticamente`);
      await prisma.$queryRawUnsafe(
        `UPDATE auth.users SET email_confirmed_at = NOW(), updated_at = NOW() WHERE id = $1::uuid`,
        user.id,
      );
    } else {
      console.warn(`[auth] ${idLog}: email no confirmado (cuenta no-OAuth) → signOut, no se crea ficha`);
      try {
        const supabaseSignOut = await createClient();
        await supabaseSignOut.auth.signOut();
      } catch { /* ignore */ }
      return null;
    }
  }

  // NOTA: aquí NO se aplica rate-limit. El usuario ya está autenticado y verificado
  // (OAuth o email confirmado); un límite por IP bloqueaba a usuarios legítimos en redes
  // compartidas (centros, universidades, datos móviles) dejándolos autenticados pero sin
  // ficha. La barrera anti-spam real vive en registrarCuenta() (formulario de registro),
  // antes de crear el auth.user.

  if (user.email) {
    const paciente = await prisma.paciente.findFirst({
      where: { email: user.email },
    });
    if (paciente) {
      console.warn(`[auth] ${idLog}: autenticado pero registrado como PACIENTE → no se crea ficha de dietista`);
      return null;
    }
  }

  const t = await getTranslations("validation");
  const dietista = await prisma.dietista.create({
    data: {
      authId: user.id,
      email: user.email!,
      nombre: user.user_metadata.nombre || t("auth.sinNombre"),
      apellidos: user.user_metadata.apellidos || "",
      especialidad: user.user_metadata.especialidad || null,
      verificado: true,
      fuenteContacto: "organico",
    },
  });
  console.log(`[auth] ficha de dietista creada para ${idLog} (id=${dietista.id}, provider=${user.app_metadata?.provider ?? "?"})`);

  if (user.user_metadata.tipoCuenta === "centro" && user.user_metadata.centroNombre) {
    const centroNombre = String(user.user_metadata.centroNombre).trim();
    let slug = generarSlug(centroNombre);
    const existeSlug = await prisma.empresa.findUnique({ where: { slug } });
    if (existeSlug) slug = `${slug}-${Date.now().toString(36)}`;

    const empresa = await prisma.empresa.create({
      data: {
        nombre: centroNombre,
        slug,
        liderId: dietista.id,
        maxMiembros: 10,
      },
    });

    await prisma.dietista.update({
      where: { id: dietista.id },
      data: { empresaId: empresa.id },
    });
  }

  crearPacienteDemoSiNoExiste(prisma, dietista.id, locale).catch((err) => {
    console.error("[paciente-demo] Error creando paciente demo:", err);
  });

  return dietista;
}

export const getCurrentDietista = cache(async function getCurrentDietista() {
  let locale: "es" | "pt" = "es";
  try { const l = await getLocale(); if (l === "pt") locale = "pt"; } catch { /* default to es */ }

  // La sesión real de Supabase SIEMPRE tiene prioridad sobre la demo. Si
  // existe un usuario real, ignoramos cualquier cookie demo que haya quedado
  // de una visita previa (la cookie demo dura 24h y, si no, "contaminaría"
  // la cuenta real mostrando el banner y los datos de la demo).
  let user;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    user = null;
  }

  if (!user) {
    // Sin usuario real → comprobamos la demo como fallback.
    const demoSession = await getDemoSession();
    if (demoSession) {
      const demoDietista = await prisma.dietista.findUnique({
        where: { id: demoSession.dietistaId },
      });
      if (demoDietista) {
        crearPacienteDemoSiNoExiste(prisma, demoDietista.id, locale).catch(() => {});
        return { ...demoDietista, verificado: true, isDemo: true as const };
      }
      try { await clearDemoSession(); } catch { /* no se puede borrar en render */ }
    }
    return null;
  }

  const dietista = await ensureDietistaParaUsuario(user, locale);
  if (!dietista) return null;

  let verificado = false;
  try {
    const rows = await prisma.$queryRawUnsafe<{ verificado: boolean }[]>(
      `SELECT verificado FROM dietistas WHERE id = $1`, dietista.id
    );
    verificado = rows[0]?.verificado ?? false;
  } catch {
    verificado = true;
  }

  return { ...dietista, verificado, isDemo: false as const };
});

export async function getGoogleIdentityLinked(): Promise<{ email: string } | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.identities) return null;

  const google = user.identities.find((i) => i.provider === "google");
  if (!google) return null;

  return { email: (google.identity_data?.email as string) || user.email || "" };
  } catch {
    return null;
  }
}

export async function signOut() {
  // Limpiamos siempre la cookie demo: puede haber quedado de una visita previa
  // aunque ahora exista una sesión real de Supabase.
  await clearDemoSession();

  // Comprobamos si había sesión real para decidir el destino del redirect y,
  // sobre todo, para cerrarla de verdad (antes, una cookie demo persistente
  // hacía que un usuario real saliera a /landing sin cerrar Supabase).
  let hadRealSession = false;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    hadRealSession = !!data.user;
    await supabase.auth.signOut();
  } catch {
    // Ignore — redirect regardless
  }

  redirect(hadRealSession ? "/login" : "/landing");
}

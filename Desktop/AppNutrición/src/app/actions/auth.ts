"use server";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { crearPacienteDemoSiNoExiste } from "@/lib/paciente-demo";
import { getDemoSession, clearDemoSession } from "@/lib/demo-auth";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { generarSlug } from "@/lib/empresa-utils";
import { headers } from "next/headers";
import { checkRateLimit, LIMITES } from "@/lib/rate-limit";

export const getCurrentDietista = cache(async function getCurrentDietista() {
  let locale: "es" | "pt" = "es";
  try { const l = await getLocale(); if (l === "pt") locale = "pt"; } catch { /* default to es */ }
  const demoSession = await getDemoSession();
  if (demoSession) {
    const demoDietista = await prisma.dietista.findUnique({
      where: { id: demoSession.dietistaId },
    });
    if (demoDietista) {
      crearPacienteDemoSiNoExiste(prisma, demoDietista.id, locale).catch(() => {});
      return { ...demoDietista, verificado: true, isDemo: true as const };
    }
    await clearDemoSession();
    return null;
  }

  let user;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    return null;
  }

  if (!user) return null;

  let dietista = await prisma.dietista.findUnique({
    where: { authId: user.id },
  });

  if (!dietista) {
    const confirmCheck = await prisma.$queryRawUnsafe<{ email_confirmed_at: Date | null }[]>(
      `SELECT email_confirmed_at FROM auth.users WHERE id = $1::uuid`,
      user.id,
    );
    if (confirmCheck.length > 0 && !confirmCheck[0].email_confirmed_at) {
      const isOAuth = user.app_metadata?.providers?.some((p: string) => p !== "email");
      if (isOAuth) {
        await prisma.$queryRawUnsafe(
          `UPDATE auth.users SET email_confirmed_at = NOW(), updated_at = NOW() WHERE id = $1::uuid`,
          user.id,
        );
      } else {
        try {
          const supabaseSignOut = await createClient();
          await supabaseSignOut.auth.signOut();
        } catch { /* ignore */ }
        return null;
      }
    }

    const headerList = await headers();
    const forwarded = headerList.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() || headerList.get("x-real-ip") || "unknown";
    const rl = checkRateLimit({ key: `reg:${ip}`, ...LIMITES.registro });
    if (!rl.ok) return null;

    if (user.email) {
      const paciente = await prisma.paciente.findFirst({
        where: { email: user.email },
      });
      if (paciente) return null;
    }

    const t = await getTranslations("validation");
    dietista = await prisma.dietista.create({
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
  }

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
  const demoSession = await getDemoSession();
  if (demoSession) {
    await clearDemoSession();
    redirect("/landing");
  }

  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Ignore — redirect to login regardless
  }
  redirect("/login");
}

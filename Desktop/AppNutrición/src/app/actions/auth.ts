"use server";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { crearPacienteDemoSiNoExiste } from "@/lib/paciente-demo";
import { getDemoSession, clearDemoSession } from "@/lib/demo-auth";
import { redirect } from "next/navigation";

export const getCurrentDietista = cache(async function getCurrentDietista() {
  const demoSession = await getDemoSession();
  if (demoSession) {
    const demoDietista = await prisma.dietista.findUnique({
      where: { id: demoSession.dietistaId },
    });
    if (demoDietista) {
      crearPacienteDemoSiNoExiste(prisma, demoDietista.id).catch(() => {});
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
    if (process.env.REGISTRATION_OPEN !== "true") return null;

    if (user.email) {
      const paciente = await prisma.paciente.findFirst({
        where: { email: user.email },
      });
      if (paciente) return null;
    }

    dietista = await prisma.dietista.create({
      data: {
        authId: user.id,
        email: user.email!,
        nombre: user.user_metadata.nombre || "Sin nombre",
        apellidos: user.user_metadata.apellidos || "",
        especialidad: user.user_metadata.especialidad || null,
        numColegiado: user.user_metadata.numColegiado || null,
      },
    });

    crearPacienteDemoSiNoExiste(prisma, dietista.id).catch((err) => {
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

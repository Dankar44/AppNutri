"use server";

import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { crearPacienteDemoSiNoExiste } from "@/lib/paciente-demo";
import { redirect } from "next/navigation";

export const getCurrentDietista = cache(async function getCurrentDietista() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  return { ...dietista, verificado };
});

export async function getGoogleIdentityLinked(): Promise<{ email: string } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.identities) return null;

  const google = user.identities.find((i) => i.provider === "google");
  if (!google) return null;

  return { email: (google.identity_data?.email as string) || user.email || "" };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

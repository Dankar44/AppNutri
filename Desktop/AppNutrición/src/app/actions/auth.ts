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

  const dietista = await prisma.dietista.upsert({
    where: { authId: user.id },
    update: {},
    create: {
      authId: user.id,
      email: user.email!,
      nombre: user.user_metadata.nombre || "Sin nombre",
      apellidos: user.user_metadata.apellidos || "",
      especialidad: user.user_metadata.especialidad || null,
      numColegiado: user.user_metadata.numColegiado || null,
    },
  });

  // Si es un dietista recién creado (createdAt ≈ updatedAt), crear el paciente demo.
  // No bloqueamos el login: si falla, lo logueamos y seguimos.
  const esNuevo = Math.abs(dietista.createdAt.getTime() - dietista.updatedAt.getTime()) < 1500;
  if (esNuevo) {
    crearPacienteDemoSiNoExiste(prisma, dietista.id).catch((err) => {
      console.error("[paciente-demo] Error creando paciente demo:", err);
    });
  }

  // Leer verificado — intentar Prisma nativo primero, fallback a raw SQL
  let verificado = false;
  try {
    const rows = await prisma.$queryRawUnsafe<{ verificado: boolean }[]>(
      `SELECT verificado FROM dietistas WHERE id = $1`, dietista.id
    );
    verificado = rows[0]?.verificado ?? false;
  } catch {
    // Si la columna no existe aún, asumir verificado
    verificado = true;
  }

  return { ...dietista, verificado };
});

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

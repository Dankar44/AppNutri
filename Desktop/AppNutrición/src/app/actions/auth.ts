"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function getCurrentDietista() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  let dietista = await prisma.dietista.findUnique({
    where: { authId: user.id },
  });

  if (!dietista) {
    dietista = await prisma.dietista.create({
      data: {
        authId: user.id,
        email: user.email!,
        nombre: user.user_metadata.nombre || "Sin nombre",
        apellidos: user.user_metadata.apellidos || "",
        especialidad: user.user_metadata.especialidad || null,
      },
    });
  }

  return dietista;
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

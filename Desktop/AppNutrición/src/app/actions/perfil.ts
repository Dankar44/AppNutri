"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  sanitizeString,
  sanitizeStringOptional,
  validatePhone,
  validateImageDataUrl,
  validateHexColor,
  validateEnum,
  LIMITS,
  TEMA_PDF_OPCIONES,
} from "@/lib/validation";

export interface PerfilFormData {
  nombre: string;
  apellidos: string;
  telefono?: string;
  especialidad?: string;
  numColegiado?: string;
  clinica?: string;
}

export async function actualizarPerfil(data: PerfilFormData) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");
  if (dietista.isDemo) return;

  const nombre = sanitizeString(data.nombre, LIMITS.NOMBRE_CORTO);
  if (!nombre) throw new Error("El nombre es obligatorio");
  const apellidos = sanitizeString(data.apellidos, LIMITS.NOMBRE_CORTO);
  if (!apellidos) throw new Error("Los apellidos son obligatorios");
  const telefono = validatePhone(data.telefono) || null;
  const especialidad = sanitizeStringOptional(data.especialidad, LIMITS.ESPECIALIDAD);
  const numColegiado = sanitizeStringOptional(data.numColegiado, LIMITS.COLEGIADO);
  const clinica = sanitizeStringOptional(data.clinica, LIMITS.CLINICA);

  await prisma.dietista.update({
    where: { id: dietista.id },
    data: {
      nombre,
      apellidos,
      telefono,
      especialidad,
      numColegiado,
      clinica,
    },
  });

  revalidatePath("/ajustes");
  revalidatePath("/dashboard");
}

export async function eliminarCuenta() {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");
  if (dietista.isDemo) return;

  // Cascade borra pacientes, planes, recetas, etc.
  await prisma.dietista.delete({ where: { id: dietista.id } });

  // Cerrar sesión de Supabase
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  await supabase.auth.signOut();

  redirect("/login");
}

export async function actualizarFotoDietista(fotoUrl: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");
  if (dietista.isDemo) return;

  const validatedUrl = validateImageDataUrl(fotoUrl);
  if (!validatedUrl) throw new Error("Imagen inválida");

  await prisma.dietista.update({
    where: { id: dietista.id },
    data: { logoUrl: validatedUrl },
  });

  revalidatePath("/ajustes");
  revalidatePath("/dashboard");
}

export async function actualizarTemaPdf(tema: string, colorPrimario: string | null) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");
  if (dietista.isDemo) return;

  const temaValido = validateEnum(tema, TEMA_PDF_OPCIONES);
  if (!temaValido) throw new Error("Tema no válido");

  const color = temaValido === "personalizado" ? validateHexColor(colorPrimario) : null;
  if (temaValido === "personalizado" && !color) throw new Error("Color no válido");

  await prisma.dietista.update({
    where: { id: dietista.id },
    data: { temaPdf: temaValido, colorPrimarioPdf: color },
  });

  revalidatePath("/ajustes");
}

export async function actualizarLogoPdf(logoDataUrl: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");
  if (dietista.isDemo) return;

  const validatedUrl = validateImageDataUrl(logoDataUrl);
  if (!validatedUrl) throw new Error("Imagen inválida");

  await prisma.dietista.update({
    where: { id: dietista.id },
    data: { pdfLogoUrl: validatedUrl },
  });

  revalidatePath("/ajustes");
}

export async function eliminarLogoPdf() {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");
  if (dietista.isDemo) return;

  await prisma.dietista.update({
    where: { id: dietista.id },
    data: { pdfLogoUrl: null },
  });

  revalidatePath("/ajustes");
}

export async function actualizarMarcaPdf(marca: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");
  if (dietista.isDemo) return;

  const cleaned = sanitizeStringOptional(marca, LIMITS.MARCA_PDF);

  await prisma.dietista.update({
    where: { id: dietista.id },
    data: { marcaPdf: cleaned },
  });

  revalidatePath("/ajustes");
}

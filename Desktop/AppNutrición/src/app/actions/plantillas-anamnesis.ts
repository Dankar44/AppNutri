"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { Prisma } from "@/generated/prisma/client";
import {
  sanitizeEstructura,
  estructuraBase,
  estructuraEfectiva,
  getPreset,
  type EstructuraPlantilla,
} from "@/lib/anamnesis-plantillas";
import { sanitizeCamposAnamnesis } from "@/lib/ficha-informacion-types";

export interface PlantillaResumen {
  id: string;
  nombre: string;
}

function sanitizeNombre(n: string): string {
  return (n || "").trim().slice(0, 80);
}

// --- Lectura ---

export async function getPlantillasAnamnesis(): Promise<PlantillaResumen[]> {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];
  return prisma.plantillaAnamnesis.findMany({
    where: { dietistaId: dietista.id },
    select: { id: true, nombre: true },
    orderBy: { createdAt: "asc" },
  });
}

/** Estructura efectiva de la anamnesis de un paciente (su plantilla, o base + campos globales). */
export async function getEstructuraEfectivaPaciente(pacienteId: string): Promise<EstructuraPlantilla> {
  const dietista = await getCurrentDietista();
  if (!dietista) return estructuraBase();
  const paciente = await prisma.paciente.findFirst({
    where: { id: pacienteId, dietistaId: dietista.id },
    select: {
      estructuraAnamnesis: true,
      plantillaAnamnesis: { select: { estructura: true } },
      dietista: { select: { camposAnamnesis: true } },
    },
  });
  if (!paciente) return estructuraBase();
  const campos = sanitizeCamposAnamnesis(paciente.dietista.camposAnamnesis);
  return estructuraEfectiva(
    paciente.estructuraAnamnesis ?? null,
    paciente.plantillaAnamnesis?.estructura ?? null,
    campos,
  );
}

export async function getPlantillaAnamnesis(
  id: string,
): Promise<{ id: string; nombre: string; estructura: EstructuraPlantilla } | null> {
  const dietista = await getCurrentDietista();
  if (!dietista) return null;
  const row = await prisma.plantillaAnamnesis.findFirst({
    where: { id, dietistaId: dietista.id },
    select: { id: true, nombre: true, estructura: true },
  });
  if (!row) return null;
  return { id: row.id, nombre: row.nombre, estructura: sanitizeEstructura(row.estructura) };
}

// --- Escritura ---

export async function crearPlantillaAnamnesis(
  nombre: string,
  presetId?: string,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) return { ok: false, error: t("auth.noAutorizado") };
  if (dietista.isDemo) return { ok: false, error: t("general.noDisponibleDemo") };

  const nombreLimpio = sanitizeNombre(nombre);
  if (!nombreLimpio) return { ok: false, error: t("general.errorDesconocido") };

  const preset = presetId ? getPreset(presetId) : undefined;
  const estructura: EstructuraPlantilla = preset ? preset.estructura : estructuraBase();

  const row = await prisma.plantillaAnamnesis.create({
    data: {
      dietistaId: dietista.id,
      nombre: nombreLimpio,
      estructura: estructura as unknown as Prisma.InputJsonValue,
    },
    select: { id: true },
  });
  revalidatePath("/ajustes");
  return { ok: true, id: row.id };
}

export async function guardarPlantillaAnamnesis(
  id: string,
  nombre: string,
  estructura: EstructuraPlantilla,
): Promise<{ ok: boolean; error?: string }> {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) return { ok: false, error: t("auth.noAutorizado") };
  if (dietista.isDemo) return { ok: false, error: t("general.noDisponibleDemo") };

  const limpia = sanitizeEstructura(estructura);
  const res = await prisma.plantillaAnamnesis.updateMany({
    where: { id, dietistaId: dietista.id },
    data: {
      nombre: sanitizeNombre(nombre) || "Plantilla",
      estructura: limpia as unknown as Prisma.InputJsonValue,
    },
  });
  if (res.count === 0) return { ok: false, error: t("general.errorDesconocido") };
  revalidatePath("/ajustes");
  return { ok: true };
}

export async function renombrarPlantillaAnamnesis(
  id: string,
  nombre: string,
): Promise<{ ok: boolean; error?: string }> {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) return { ok: false, error: t("auth.noAutorizado") };
  if (dietista.isDemo) return { ok: false, error: t("general.noDisponibleDemo") };
  const res = await prisma.plantillaAnamnesis.updateMany({
    where: { id, dietistaId: dietista.id },
    data: { nombre: sanitizeNombre(nombre) || "Plantilla" },
  });
  if (res.count === 0) return { ok: false, error: t("general.errorDesconocido") };
  revalidatePath("/ajustes");
  return { ok: true };
}

export async function eliminarPlantillaAnamnesis(id: string): Promise<{ ok: boolean; error?: string }> {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) return { ok: false, error: t("auth.noAutorizado") };
  if (dietista.isDemo) return { ok: false, error: t("general.noDisponibleDemo") };
  // ON DELETE SET NULL en BD: los pacientes que la usaban vuelven a la anamnesis genérica.
  await prisma.plantillaAnamnesis.deleteMany({ where: { id, dietistaId: dietista.id } });
  revalidatePath("/ajustes");
  return { ok: true };
}

export async function asignarPlantillaPaciente(
  pacienteId: string,
  plantillaId: string | null,
): Promise<{ ok: boolean; error?: string }> {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) return { ok: false, error: t("auth.noAutorizado") };
  if (dietista.isDemo) return { ok: false, error: t("general.noDisponibleDemo") };

  // Si se asigna una plantilla concreta, debe pertenecer al dietista.
  if (plantillaId) {
    const plantilla = await prisma.plantillaAnamnesis.findFirst({
      where: { id: plantillaId, dietistaId: dietista.id },
      select: { id: true },
    });
    if (!plantilla) return { ok: false, error: t("general.errorDesconocido") };
  }

  const res = await prisma.paciente.updateMany({
    where: { id: pacienteId, dietistaId: dietista.id },
    // Al elegir un tipo, se descarta la estructura propia para usar la del tipo.
    data: { plantillaAnamnesisId: plantillaId, estructuraAnamnesis: Prisma.DbNull },
  });
  if (res.count === 0) return { ok: false, error: t("paciente.pacienteNoEncontrado") };
  revalidatePath(`/pacientes/${pacienteId}`);
  return { ok: true };
}

// --- Guardado de la anamnesis editada desde la ficha (3 opciones) ---

/** (1) Guarda la estructura editada SOLO para este paciente (no toca ningún tipo). */
export async function guardarEstructuraPaciente(
  pacienteId: string,
  estructura: EstructuraPlantilla,
): Promise<{ ok: boolean; error?: string }> {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) return { ok: false, error: t("auth.noAutorizado") };
  if (dietista.isDemo) return { ok: false, error: t("general.noDisponibleDemo") };
  const limpia = sanitizeEstructura(estructura);
  const res = await prisma.paciente.updateMany({
    where: { id: pacienteId, dietistaId: dietista.id },
    data: { estructuraAnamnesis: limpia as unknown as Prisma.InputJsonValue },
  });
  if (res.count === 0) return { ok: false, error: t("paciente.pacienteNoEncontrado") };
  revalidatePath(`/pacientes/${pacienteId}`);
  return { ok: true };
}

/** (2) Guarda la estructura como un tipo NUEVO reutilizable y lo asigna a este paciente. */
export async function guardarComoTipoNuevoPaciente(
  pacienteId: string,
  nombre: string,
  estructura: EstructuraPlantilla,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) return { ok: false, error: t("auth.noAutorizado") };
  if (dietista.isDemo) return { ok: false, error: t("general.noDisponibleDemo") };
  const nombreLimpio = sanitizeNombre(nombre);
  if (!nombreLimpio) return { ok: false, error: t("general.errorDesconocido") };
  const limpia = sanitizeEstructura(estructura);
  const tipo = await prisma.plantillaAnamnesis.create({
    data: { dietistaId: dietista.id, nombre: nombreLimpio, estructura: limpia as unknown as Prisma.InputJsonValue },
    select: { id: true },
  });
  await prisma.paciente.updateMany({
    where: { id: pacienteId, dietistaId: dietista.id },
    data: { plantillaAnamnesisId: tipo.id, estructuraAnamnesis: Prisma.DbNull },
  });
  revalidatePath(`/pacientes/${pacienteId}`);
  return { ok: true, id: tipo.id };
}

/** (3) Sobrescribe el tipo `tipoId` (afecta a todos los que lo usan) y deja al paciente usando ese tipo. */
export async function actualizarTipoDePaciente(
  pacienteId: string,
  tipoId: string,
  estructura: EstructuraPlantilla,
): Promise<{ ok: boolean; error?: string }> {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) return { ok: false, error: t("auth.noAutorizado") };
  if (dietista.isDemo) return { ok: false, error: t("general.noDisponibleDemo") };
  const limpia = sanitizeEstructura(estructura);
  const res = await prisma.plantillaAnamnesis.updateMany({
    where: { id: tipoId, dietistaId: dietista.id },
    data: { estructura: limpia as unknown as Prisma.InputJsonValue },
  });
  if (res.count === 0) return { ok: false, error: t("general.errorDesconocido") };
  // El paciente queda usando ese tipo (ya actualizado), descartando su estructura propia.
  await prisma.paciente.updateMany({
    where: { id: pacienteId, dietistaId: dietista.id },
    data: { plantillaAnamnesisId: tipoId, estructuraAnamnesis: Prisma.DbNull },
  });
  revalidatePath(`/pacientes/${pacienteId}`);
  return { ok: true };
}

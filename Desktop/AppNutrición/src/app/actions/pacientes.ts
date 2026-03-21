"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ObjetivoPaciente, Sexo } from "@/generated/prisma/client";

export interface PacienteFormData {
  nombre: string;
  apellidos: string;
  email: string;
  telefono?: string;
  fechaNacimiento?: string;
  sexo?: Sexo;
  peso?: number;
  altura?: number;
  alergias: string[];
  intolerancias: string[];
  patologias: string[];
  medicamentos: string[];
  objetivo: ObjetivoPaciente;
  objetivoDetalle?: string;
  preferencias: string[];
  notas?: string;
}

// --- Sanitización y validación ---

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+\-\s()]{6,20}$/;
const SEXOS_VALIDOS: string[] = ["MASCULINO", "FEMENINO", "OTRO"];
const OBJETIVOS_VALIDOS: string[] = [
  "PERDER_PESO", "GANAR_MASA", "MANTENIMIENTO", "PATOLOGIA", "DEPORTIVO", "OTRO",
];

function sanitizeString(value: string | undefined | null, maxLength = 200): string {
  if (!value) return "";
  return value.trim().slice(0, maxLength);
}

function capitalizeName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function sanitizeArray(arr: string[], maxItems = 20, maxLen = 100): string[] {
  return arr
    .map((s) => sanitizeString(s, maxLen))
    .filter((s) => s.length > 0)
    .slice(0, maxItems);
}

function validatePacienteData(data: PacienteFormData): string | null {
  const nombre = sanitizeString(data.nombre);
  if (nombre.length < 1 || nombre.length > 100) return "El nombre es obligatorio (máx 100 caracteres)";

  const apellidos = sanitizeString(data.apellidos);
  if (apellidos.length < 1 || apellidos.length > 100) return "Los apellidos son obligatorios (máx 100 caracteres)";

  const email = sanitizeString(data.email);
  if (!email || !EMAIL_REGEX.test(email)) return "El email es obligatorio y debe ser válido";

  if (data.telefono) {
    const tel = sanitizeString(data.telefono);
    if (tel && !PHONE_REGEX.test(tel)) return "El teléfono no tiene un formato válido";
  }

  if (data.peso !== undefined && data.peso !== null) {
    if (data.peso < 1 || data.peso > 500) return "El peso debe estar entre 1 y 500 kg";
  }

  if (data.altura !== undefined && data.altura !== null) {
    if (data.altura < 30 || data.altura > 300) return "La altura debe estar entre 30 y 300 cm";
  }

  if (data.sexo && !SEXOS_VALIDOS.includes(data.sexo)) return "Sexo no válido";
  if (!OBJETIVOS_VALIDOS.includes(data.objetivo)) return "Objetivo no válido";

  if (data.fechaNacimiento) {
    const fecha = new Date(data.fechaNacimiento);
    if (isNaN(fecha.getTime())) return "Fecha de nacimiento no válida";
    if (fecha > new Date()) return "La fecha de nacimiento no puede ser futura";
  }

  return null;
}

function sanitizeFormData(data: PacienteFormData) {
  return {
    nombre: capitalizeName(sanitizeString(data.nombre, 100)),
    apellidos: capitalizeName(sanitizeString(data.apellidos, 100)),
    email: sanitizeString(data.email, 200).toLowerCase(),
    telefono: sanitizeString(data.telefono, 20) || null,
    fechaNacimiento: data.fechaNacimiento ? new Date(data.fechaNacimiento) : null,
    sexo: (data.sexo && SEXOS_VALIDOS.includes(data.sexo) ? data.sexo : null) as Sexo | null,
    peso: data.peso && data.peso > 0 ? data.peso : null,
    altura: data.altura && data.altura > 0 ? data.altura : null,
    alergias: sanitizeArray(data.alergias),
    intolerancias: sanitizeArray(data.intolerancias),
    patologias: sanitizeArray(data.patologias),
    medicamentos: sanitizeArray(data.medicamentos),
    objetivo: OBJETIVOS_VALIDOS.includes(data.objetivo) ? data.objetivo as ObjetivoPaciente : "MANTENIMIENTO" as ObjetivoPaciente,
    objetivoDetalle: sanitizeString(data.objetivoDetalle, 500) || null,
    preferencias: sanitizeArray(data.preferencias),
    notas: sanitizeString(data.notas, 2000) || null,
  };
}

// --- Actions ---

export async function crearPaciente(data: PacienteFormData) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  const error = validatePacienteData(data);
  if (error) throw new Error(error);

  const clean = sanitizeFormData(data);

  const paciente = await prisma.paciente.create({
    data: {
      dietistaId: dietista.id,
      ...clean,
    },
  });

  revalidatePath("/pacientes");
  revalidatePath("/dashboard");
  redirect(`/pacientes/${paciente.id}`);
}

export async function actualizarPaciente(id: string, data: PacienteFormData) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  const error = validatePacienteData(data);
  if (error) throw new Error(error);

  const clean = sanitizeFormData(data);

  await prisma.paciente.update({
    where: { id, dietistaId: dietista.id },
    data: clean,
  });

  revalidatePath("/pacientes");
  revalidatePath(`/pacientes/${id}`);
  revalidatePath("/dashboard");
  redirect(`/pacientes/${id}`);
}

export async function eliminarPaciente(id: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  await prisma.paciente.delete({
    where: { id, dietistaId: dietista.id },
  });

  revalidatePath("/pacientes");
  revalidatePath("/dashboard");
}

export async function toggleActivoPaciente(id: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  const paciente = await prisma.paciente.findUnique({
    where: { id, dietistaId: dietista.id },
  });

  if (!paciente) throw new Error("Paciente no encontrado");

  await prisma.paciente.update({
    where: { id },
    data: { activo: !paciente.activo },
  });

  revalidatePath("/pacientes");
  revalidatePath(`/pacientes/${id}`);
  revalidatePath("/dashboard");
}

export async function getPacientes(
  busqueda?: string,
  soloActivos?: boolean
) {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  const query = busqueda ? sanitizeString(busqueda, 100) : undefined;

  return prisma.paciente.findMany({
    where: {
      dietistaId: dietista.id,
      ...(soloActivos ? { activo: true } : {}),
      ...(query
        ? {
            OR: [
              { nombre: { contains: query, mode: "insensitive" } },
              { apellidos: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPaciente(id: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) return null;

  return prisma.paciente.findUnique({
    where: { id, dietistaId: dietista.id },
  });
}

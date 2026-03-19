"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ObjetivoPaciente, Sexo } from "@/generated/prisma/client";

export interface PacienteFormData {
  nombre: string;
  apellidos: string;
  email?: string;
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

export async function crearPaciente(data: PacienteFormData) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  const paciente = await prisma.paciente.create({
    data: {
      dietistaId: dietista.id,
      nombre: data.nombre,
      apellidos: data.apellidos,
      email: data.email || null,
      telefono: data.telefono || null,
      fechaNacimiento: data.fechaNacimiento
        ? new Date(data.fechaNacimiento)
        : null,
      sexo: data.sexo || null,
      peso: data.peso || null,
      altura: data.altura || null,
      alergias: data.alergias,
      intolerancias: data.intolerancias,
      patologias: data.patologias,
      medicamentos: data.medicamentos,
      objetivo: data.objetivo,
      objetivoDetalle: data.objetivoDetalle || null,
      preferencias: data.preferencias,
      notas: data.notas || null,
    },
  });

  revalidatePath("/pacientes");
  revalidatePath("/dashboard");
  redirect(`/pacientes/${paciente.id}`);
}

export async function actualizarPaciente(id: string, data: PacienteFormData) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  await prisma.paciente.update({
    where: { id, dietistaId: dietista.id },
    data: {
      nombre: data.nombre,
      apellidos: data.apellidos,
      email: data.email || null,
      telefono: data.telefono || null,
      fechaNacimiento: data.fechaNacimiento
        ? new Date(data.fechaNacimiento)
        : null,
      sexo: data.sexo || null,
      peso: data.peso || null,
      altura: data.altura || null,
      alergias: data.alergias,
      intolerancias: data.intolerancias,
      patologias: data.patologias,
      medicamentos: data.medicamentos,
      objetivo: data.objetivo,
      objetivoDetalle: data.objetivoDetalle || null,
      preferencias: data.preferencias,
      notas: data.notas || null,
    },
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
  redirect("/pacientes");
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

  return prisma.paciente.findMany({
    where: {
      dietistaId: dietista.id,
      ...(soloActivos ? { activo: true } : {}),
      ...(busqueda
        ? {
            OR: [
              { nombre: { contains: busqueda, mode: "insensitive" } },
              { apellidos: { contains: busqueda, mode: "insensitive" } },
              { email: { contains: busqueda, mode: "insensitive" } },
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

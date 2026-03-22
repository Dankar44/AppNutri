"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import {
  hashPin,
  verifyPin,
  createPatientSession,
  clearPatientSession,
  getCurrentPaciente,
} from "@/lib/patient-auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { validateEmail, sanitizeString } from "@/lib/validation";

export async function crearAccesoPaciente(
  pacienteId: string,
  email: string,
  pin: string
) {
  // Validar y sanitizar inputs
  const emailValidado = validateEmail(email);
  if (!emailValidado) throw new Error("Email no válido");
  email = emailValidado;

  pin = sanitizeString(pin, 8);
  if (!/^\d{4,8}$/.test(pin)) throw new Error("El PIN debe tener entre 4 y 8 dígitos");

  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  const paciente = await prisma.paciente.findFirst({
    where: { id: pacienteId, dietistaId: dietista.id },
  });
  if (!paciente) throw new Error("Paciente no encontrado");

  const pinHashVal = await hashPin(pin);

  await prisma.accesoPaciente.upsert({
    where: { pacienteId },
    update: { email, pinHash: pinHashVal, activo: true, passwordHash: null, perfilCompleto: false },
    create: { pacienteId, email, pinHash: pinHashVal },
  });

  revalidatePath(`/pacientes/${pacienteId}`);
}

export async function loginPaciente(email: string, credencial: string): Promise<{ error?: string }> {
  const emailValidado = validateEmail(email);
  if (!emailValidado) return { error: "Email no válido" };
  email = emailValidado;
  credencial = sanitizeString(credencial, 128);

  const acceso = await prisma.accesoPaciente.findUnique({
    where: { email, activo: true },
  });

  if (!acceso) return { error: "Email no encontrado o cuenta inactiva" };

  // Intentar con contraseña primero, luego con PIN
  let valid = false;
  if (acceso.passwordHash) {
    valid = await verifyPin(credencial, acceso.passwordHash);
  }
  if (!valid) {
    valid = await verifyPin(credencial, acceso.pinHash);
  }
  if (!valid) return { error: "Contraseña o PIN incorrectos" };

  await createPatientSession(acceso.pacienteId, email);

  // Si no ha completado el perfil, redirigir a completar
  if (!acceso.perfilCompleto) {
    redirect("/paciente/completar-perfil");
  }

  redirect("/paciente/portal");
}

export async function completarPerfilPaciente(password: string, fotoUrl?: string) {
  const session = await getCurrentPaciente();
  if (!session) throw new Error("No autorizado");

  if (password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres");

  const passwordHash = await hashPin(password);

  await prisma.accesoPaciente.update({
    where: { pacienteId: session.pacienteId },
    data: { passwordHash, perfilCompleto: true },
  });

  if (fotoUrl) {
    await prisma.paciente.update({
      where: { id: session.pacienteId },
      data: { fotoUrl },
    });
  }

  redirect("/paciente/portal");
}

export async function actualizarFotoPaciente(fotoUrl: string) {
  const session = await getCurrentPaciente();
  if (!session) throw new Error("No autorizado");

  await prisma.paciente.update({
    where: { id: session.pacienteId },
    data: { fotoUrl },
  });

  revalidatePath("/paciente/portal");
}

export async function getPerfilCompleto() {
  const session = await getCurrentPaciente();
  if (!session) return null;

  const acceso = await prisma.accesoPaciente.findUnique({
    where: { pacienteId: session.pacienteId },
    select: { perfilCompleto: true },
  });

  return acceso?.perfilCompleto ?? false;
}

export async function actualizarPerfilPaciente(data: { nombre?: string; apellidos?: string; telefono?: string }) {
  const session = await getCurrentPaciente();
  if (!session) throw new Error("No autorizado");

  const updateData: Record<string, string | null> = {};
  if (data.nombre?.trim()) updateData.nombre = data.nombre.trim().slice(0, 100);
  if (data.apellidos?.trim()) updateData.apellidos = data.apellidos.trim().slice(0, 100);
  if (data.telefono !== undefined) updateData.telefono = data.telefono.trim().slice(0, 20) || null;

  if (Object.keys(updateData).length > 0) {
    await prisma.paciente.update({
      where: { id: session.pacienteId },
      data: updateData,
    });
  }

  revalidatePath("/paciente/portal/perfil");
  revalidatePath("/paciente/portal");
}

export async function cambiarPasswordPaciente(passwordActual: string, passwordNueva: string) {
  const session = await getCurrentPaciente();
  if (!session) throw new Error("No autorizado");

  if (passwordNueva.length < 6) throw new Error("La nueva contraseña debe tener al menos 6 caracteres");

  const acceso = await prisma.accesoPaciente.findUnique({
    where: { pacienteId: session.pacienteId },
  });
  if (!acceso) throw new Error("Acceso no encontrado");

  // Verificar contraseña actual
  const valid = await verifyPin(passwordActual, acceso.passwordHash || acceso.pinHash);
  if (!valid) throw new Error("La contraseña actual es incorrecta");

  const newHash = await hashPin(passwordNueva);
  await prisma.accesoPaciente.update({
    where: { pacienteId: session.pacienteId },
    data: { passwordHash: newHash },
  });
}

export async function logoutPaciente() {
  await clearPatientSession();
  redirect("/paciente/login");
}

// ─── Horario compartido (lado paciente) ───

export interface HorarioEntry {
  dia: string;
  hora: string;
  actividad: string;
  color?: string;
  nota?: string;
}

export async function getHorarioPacientePortal(): Promise<HorarioEntry[]> {
  const session = await getCurrentPaciente();
  if (!session) return [];

  const rows = await prisma.$queryRawUnsafe<{ horario: HorarioEntry[] | null }[]>(
    `SELECT horario FROM pacientes WHERE id = $1`,
    session.pacienteId
  );

  const horario = rows[0]?.horario;
  if (!horario || !Array.isArray(horario)) return [];
  return horario;
}

export async function guardarHorarioPacientePortal(horario: HorarioEntry[]) {
  const session = await getCurrentPaciente();
  if (!session) throw new Error("No autorizado");

  await prisma.$queryRawUnsafe(
    `UPDATE pacientes SET horario = $1::jsonb WHERE id = $2`,
    JSON.stringify(horario), session.pacienteId
  );

  revalidatePath("/paciente/portal/perfil");
}

export async function getAccesoPaciente(pacienteId: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) return null;

  return prisma.accesoPaciente.findUnique({
    where: { pacienteId },
  });
}

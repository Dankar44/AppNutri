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

export async function crearAccesoPaciente(
  pacienteId: string,
  email: string,
  pin: string
) {
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

export async function logoutPaciente() {
  await clearPatientSession();
  redirect("/paciente/login");
}

export async function getAccesoPaciente(pacienteId: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) return null;

  return prisma.accesoPaciente.findUnique({
    where: { pacienteId },
  });
}

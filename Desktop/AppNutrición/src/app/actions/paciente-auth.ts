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
import { getTranslations } from "next-intl/server";

export async function crearAccesoPaciente(
  pacienteId: string,
  email: string,
  pin: string
) {
  const t = await getTranslations("validation");
  // Validar y sanitizar inputs
  const emailValidado = validateEmail(email);
  if (!emailValidado) throw new Error(t("auth.emailNoValido"));
  email = emailValidado;

  pin = sanitizeString(pin, 8);
  if (!/^\d{4,8}$/.test(pin)) throw new Error(t("pacienteAuth.pinFormatoInvalido"));

  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  const paciente = await prisma.paciente.findFirst({
    where: { id: pacienteId, dietistaId: dietista.id },
  });
  if (!paciente) throw new Error(t("paciente.pacienteNoEncontrado"));

  const pinHashVal = await hashPin(pin);

  await prisma.accesoPaciente.upsert({
    where: { pacienteId },
    update: { email, pinHash: pinHashVal, activo: true, passwordHash: null, perfilCompleto: false },
    create: { pacienteId, email, pinHash: pinHashVal },
  });

  revalidatePath(`/pacientes/${pacienteId}`);
}

export async function loginPaciente(email: string, credencial: string): Promise<{ error?: string }> {
  const t = await getTranslations("validation");
  const emailValidado = validateEmail(email);
  if (!emailValidado) return { error: t("auth.emailNoValido") };
  email = emailValidado;
  credencial = sanitizeString(credencial, 128);

  const acceso = await prisma.accesoPaciente.findUnique({
    where: { email, activo: true },
  });

  if (!acceso) return { error: t("auth.emailNoEncontrado") };

  // Intentar con contraseña primero, luego con PIN
  let valid = false;
  if (acceso.passwordHash) {
    valid = await verifyPin(credencial, acceso.passwordHash);
  }
  if (!valid) {
    valid = await verifyPin(credencial, acceso.pinHash);
  }
  if (!valid) return { error: t("auth.contrasenaOPinIncorrectos") };

  await createPatientSession(acceso.pacienteId, email);

  prisma.paciente.update({
    where: { id: acceso.pacienteId },
    data: { lastAccessAt: new Date() },
  }).catch(() => {});

  // Si no ha completado el perfil, redirigir a completar
  if (!acceso.perfilCompleto) {
    redirect("/paciente/completar-perfil");
  }

  redirect("/paciente/portal");
}

export async function completarPerfilPaciente(password: string, fotoUrl?: string) {
  const t = await getTranslations("validation");
  const session = await getCurrentPaciente();
  if (!session) throw new Error(t("auth.noAutorizado"));

  if (password.length < 6) throw new Error(t("pacienteAuth.contrasenaMinima"));

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
  const t = await getTranslations("validation");
  const session = await getCurrentPaciente();
  if (!session) throw new Error(t("auth.noAutorizado"));

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
  const t = await getTranslations("validation");
  const session = await getCurrentPaciente();
  if (!session) throw new Error(t("auth.noAutorizado"));

  const updateData: Record<string, string | null> = {};
  if (data.nombre?.trim()) updateData.nombre = data.nombre.trim().slice(0, 100);
  if (data.apellidos?.trim()) updateData.apellidos = data.apellidos.trim().slice(0, 100);
  if (data.telefono !== undefined) updateData.telefono = data.telefono.trim().slice(0, 25) || null;

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
  const t = await getTranslations("validation");
  const session = await getCurrentPaciente();
  if (!session) throw new Error(t("auth.noAutorizado"));

  if (passwordNueva.length < 6) throw new Error(t("pacienteAuth.nuevaContrasenaMinima"));

  const acceso = await prisma.accesoPaciente.findUnique({
    where: { pacienteId: session.pacienteId },
  });
  if (!acceso) throw new Error(t("pacienteAuth.accesoNoEncontrado"));

  // Verificar contraseña actual
  const valid = await verifyPin(passwordActual, acceso.passwordHash || acceso.pinHash);
  if (!valid) throw new Error(t("pacienteAuth.contrasenaActualIncorrecta"));

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
  const t = await getTranslations("validation");
  const session = await getCurrentPaciente();
  if (!session) throw new Error(t("auth.noAutorizado"));

  await prisma.$queryRawUnsafe(
    `UPDATE pacientes SET horario = $1::jsonb WHERE id = $2`,
    JSON.stringify(horario), session.pacienteId
  );

  revalidatePath("/paciente/portal/seguimiento/horario");
}

export async function getAccesoPaciente(pacienteId: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) return null;

  return prisma.accesoPaciente.findUnique({
    where: { pacienteId },
  });
}

export async function getAccesoEstado(pacienteId: string) {
  "use server";
  const acceso = await prisma.accesoPaciente.findUnique({
    where: { pacienteId },
    select: { email: true, activo: true, passwordHash: true, perfilCompleto: true },
  });
  if (!acceso) return null;
  return {
    email: acceso.email,
    activo: acceso.activo,
    tienePassword: !!acceso.passwordHash,
    perfilCompleto: acceso.perfilCompleto,
  };
}

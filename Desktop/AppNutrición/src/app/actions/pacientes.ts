"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import { crearPacienteDemoSiNoExiste } from "@/lib/paciente-demo";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ObjetivoPaciente, Sexo } from "@/generated/prisma/client";
import type { FichaInformacionData } from "@/lib/ficha-informacion-types";

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
  suplementos: string[];
  objetivo: ObjetivoPaciente;
  objetivoDetalle?: string;
  nivelActividad?: string;
  frecuenciaEjercicio?: string;
  tipoEjercicio?: string;
  horarioTrabajo?: string;
  horarioEjercicio?: string;
  horasDescanso?: string;
  ocupacion?: string;
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
  if (email && !EMAIL_REGEX.test(email)) return "El formato del email no es válido";

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

  if (!data.fechaNacimiento) return "La fecha de nacimiento es obligatoria";
  const fecha = new Date(data.fechaNacimiento);
  if (isNaN(fecha.getTime())) return "Fecha de nacimiento no válida";
  if (fecha > new Date()) return "La fecha de nacimiento no puede ser futura";

  return null;
}

function sanitizeFormData(data: PacienteFormData) {
  return {
    nombre: capitalizeName(sanitizeString(data.nombre, 100)),
    apellidos: capitalizeName(sanitizeString(data.apellidos, 100)),
    email: sanitizeString(data.email, 200).toLowerCase() || null,
    telefono: sanitizeString(data.telefono, 20) || null,
    fechaNacimiento: data.fechaNacimiento ? new Date(data.fechaNacimiento) : null,
    sexo: (data.sexo && SEXOS_VALIDOS.includes(data.sexo) ? data.sexo : null) as Sexo | null,
    peso: data.peso && data.peso > 0 ? data.peso : null,
    altura: data.altura && data.altura > 0 ? data.altura : null,
    alergias: sanitizeArray(data.alergias),
    intolerancias: sanitizeArray(data.intolerancias),
    patologias: sanitizeArray(data.patologias),
    medicamentos: sanitizeArray(data.medicamentos),
    suplementos: sanitizeArray(data.suplementos),
    objetivo: OBJETIVOS_VALIDOS.includes(data.objetivo) ? data.objetivo as ObjetivoPaciente : "MANTENIMIENTO" as ObjetivoPaciente,
    objetivoDetalle: sanitizeString(data.objetivoDetalle, 500) || null,
    nivelActividad: sanitizeString(data.nivelActividad, 100) || null,
    frecuenciaEjercicio: sanitizeString(data.frecuenciaEjercicio, 100) || null,
    tipoEjercicio: sanitizeString(data.tipoEjercicio, 200) || null,
    horarioTrabajo: sanitizeString(data.horarioTrabajo, 100) || null,
    horarioEjercicio: sanitizeString(data.horarioEjercicio, 100) || null,
    horasDescanso: sanitizeString(data.horasDescanso, 100) || null,
    ocupacion: sanitizeString(data.ocupacion, 200) || null,
    preferencias: sanitizeArray(data.preferencias),
    notas: sanitizeString(data.notas, 2000) || null,
  };
}

// --- Actions ---

// Campos que el Prisma client local no conoce (Node 20.9 no regenera)
function splitExtraFields(clean: ReturnType<typeof sanitizeFormData>) {
  const {
    suplementos,
    nivelActividad,
    frecuenciaEjercicio,
    tipoEjercicio,
    horarioTrabajo,
    horarioEjercicio,
    horasDescanso,
    ocupacion,
    ...prismaFields
  } = clean;
  return {
    prismaFields,
    extraFields: {
      suplementos,
      nivelActividad,
      frecuenciaEjercicio,
      tipoEjercicio,
      horarioTrabajo,
      horarioEjercicio,
      horasDescanso,
      ocupacion,
    },
  };
}

async function saveExtraFields(pacienteId: string, extra: ReturnType<typeof splitExtraFields>["extraFields"]) {
  await prisma.$queryRawUnsafe(
    `UPDATE pacientes SET
      suplementos = $1::text[],
      "nivelActividad" = $2,
      "frecuenciaEjercicio" = $3,
      "tipoEjercicio" = $4,
      "horarioTrabajo" = $5,
      "horarioEjercicio" = $6,
      "horasDescanso" = $7,
      ocupacion = $8
    WHERE id = $9`,
    extra.suplementos,
    extra.nivelActividad,
    extra.frecuenciaEjercicio,
    extra.tipoEjercicio,
    extra.horarioTrabajo,
    extra.horarioEjercicio,
    extra.horasDescanso,
    extra.ocupacion,
    pacienteId
  );
}

export async function crearPaciente(data: PacienteFormData) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  const error = validatePacienteData(data);
  if (error) throw new Error(error);

  const sanitized = sanitizeFormData(data);

  if (sanitized.email) {
    const dietistaExistente = await prisma.dietista.findUnique({
      where: { email: sanitized.email },
    });
    if (dietistaExistente) {
      throw new Error("Este email pertenece a una cuenta de dietista. Una persona no puede ser dietista y paciente a la vez.");
    }
  }

  const { prismaFields, extraFields } = splitExtraFields(sanitized);

  const paciente = await prisma.paciente.create({
    data: {
      dietista: { connect: { id: dietista.id } },
      ...prismaFields,
    },
  });

  await saveExtraFields(paciente.id, extraFields);

  revalidatePath("/pacientes");
  revalidatePath("/dashboard");
  redirect(`/pacientes/${paciente.id}`);
}

export async function actualizarPaciente(id: string, data: PacienteFormData) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  const error = validatePacienteData(data);
  if (error) throw new Error(error);

  const sanitized = sanitizeFormData(data);

  if (sanitized.email) {
    const dietistaExistente = await prisma.dietista.findUnique({
      where: { email: sanitized.email },
    });
    if (dietistaExistente) {
      throw new Error("Este email pertenece a una cuenta de dietista. Una persona no puede ser dietista y paciente a la vez.");
    }
  }

  const { prismaFields, extraFields } = splitExtraFields(sanitized);

  await prisma.paciente.update({
    where: { id, dietistaId: dietista.id },
    data: prismaFields,
  });

  await saveExtraFields(id, extraFields);

  revalidatePath("/pacientes");
  revalidatePath(`/pacientes/${id}`);
  revalidatePath("/dashboard");
  redirect(`/pacientes/${id}`);
}

export async function eliminarPaciente(id: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  // Si borra el paciente demo, marcar la flag para que NO se re-cree al recargar
  const paciente = await prisma.paciente.findUnique({
    where: { id },
    select: { nombre: true, apellidos: true },
  });
  const esDemo = paciente?.nombre === "Paciente" && paciente?.apellidos === "Prueba";

  // Borrar pagos ANTES de eliminar el paciente: el modelo Pago usa onDelete: SetNull,
  // así que si borramos primero el paciente, los pagos quedan huérfanos (pacienteId = NULL).
  if (esDemo) {
    await prisma.$queryRawUnsafe(
      `DELETE FROM pagos WHERE "pacienteId" = $1 AND "dietistaId" = $2`,
      id, dietista.id,
    );
  }

  await prisma.paciente.delete({
    where: { id, dietistaId: dietista.id },
  });

  if (esDemo) {
    await prisma.$queryRawUnsafe(
      `UPDATE dietistas SET "demoEliminado" = true WHERE id = $1`,
      dietista.id,
    );
  }

  revalidatePath("/pacientes");
  revalidatePath("/dashboard");
  revalidatePath("/pagos");
}

/**
 * Restaura el paciente demo que el nutri había eliminado previamente.
 * Resetea la flag y recrea el paciente con todos sus datos de inmediato.
 */
export async function restaurarPacienteDemo() {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  await prisma.$queryRawUnsafe(
    `UPDATE dietistas SET "demoEliminado" = false WHERE id = $1`,
    dietista.id,
  );

  await crearPacienteDemoSiNoExiste(prisma, dietista.id);

  revalidatePath("/pacientes");
  revalidatePath("/dashboard");
  revalidatePath("/pagos");
}

/** Devuelve true si el nutri borró el paciente demo y aún no lo ha restaurado. */
export async function isDemoEliminado(): Promise<boolean> {
  const dietista = await getCurrentDietista();
  if (!dietista) return false;
  const rows = await prisma.$queryRawUnsafe<{ demoEliminado: boolean }[]>(
    `SELECT "demoEliminado" FROM dietistas WHERE id = $1`,
    dietista.id,
  );
  return rows[0]?.demoEliminado ?? false;
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

// ─── Horario compartido ───

export interface HorarioEntry {
  dia: string;
  hora: string;
  actividad: string;
  color?: string;
  nota?: string;
}

export async function getHorarioPaciente(pacienteId: string): Promise<HorarioEntry[]> {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  const rows = await prisma.$queryRawUnsafe<{ horario: HorarioEntry[] | null }[]>(
    `SELECT horario FROM pacientes WHERE id = $1 AND "dietistaId" = $2`,
    pacienteId, dietista.id
  );

  const horario = rows[0]?.horario;
  if (!horario || !Array.isArray(horario)) return [];
  return horario;
}

export async function guardarHorarioPaciente(pacienteId: string, horario: HorarioEntry[]) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  await prisma.$queryRawUnsafe(
    `UPDATE pacientes SET horario = $1::jsonb WHERE id = $2 AND "dietistaId" = $3`,
    JSON.stringify(horario), pacienteId, dietista.id
  );

  revalidatePath(`/pacientes/${pacienteId}`);
}

// ─── Recomendaciones ───

/** Returns only the "otrasRecomendaciones" text for backward-compatible usage (General tab card). */
export async function getRecomendaciones(pacienteId: string): Promise<string> {
  const dietista = await getCurrentDietista();
  if (!dietista) return "";

  const rows = await prisma.$queryRawUnsafe<{ recomendaciones: string | null }[]>(
    `SELECT recomendaciones FROM pacientes WHERE id = $1 AND "dietistaId" = $2`,
    pacienteId, dietista.id
  );
  const raw = rows[0]?.recomendaciones || "";

  // If the field stores structured JSON, extract otrasRecomendaciones
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "otrasRecomendaciones" in parsed) {
      return parsed.otrasRecomendaciones || "";
    }
  } catch {
    // plain text
  }
  return raw;
}

/** Saves only the "otrasRecomendaciones" text, preserving other structured fields. */
export async function guardarRecomendaciones(pacienteId: string, texto: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  const sanitized = texto.slice(0, 5000);

  // Read current value to preserve structured fields
  const rows = await prisma.$queryRawUnsafe<{ recomendaciones: string | null }[]>(
    `SELECT recomendaciones FROM pacientes WHERE id = $1 AND "dietistaId" = $2`,
    pacienteId, dietista.id
  );
  const raw = rows[0]?.recomendaciones || "";

  let toSave: string;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && "agua" in parsed) {
      // Structured format: update only otrasRecomendaciones
      parsed.otrasRecomendaciones = sanitized;
      toSave = JSON.stringify(parsed);
    } else {
      toSave = sanitized;
    }
  } catch {
    toSave = sanitized;
  }

  await prisma.$queryRawUnsafe(
    `UPDATE pacientes SET recomendaciones = $1 WHERE id = $2 AND "dietistaId" = $3`,
    toSave, pacienteId, dietista.id
  );
}

function sanitizeFichaInformacionDeep(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === "string") return obj.trim().slice(0, 4000);
  if (Array.isArray(obj)) return {};
  if (typeof obj !== "object") return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (typeof v === "string") out[k] = v.trim().slice(0, 4000);
    else if (v !== null && typeof v === "object" && !Array.isArray(v))
      out[k] = sanitizeFichaInformacionDeep(v);
  }
  return out;
}

export async function guardarFichaInformacionPaciente(
  pacienteId: string,
  data: FichaInformacionData
) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autorizado");

  const cleaned = sanitizeFichaInformacionDeep(data) as FichaInformacionData;

  await prisma.$queryRawUnsafe(
    `UPDATE pacientes SET "fichaInformacion" = $1::jsonb WHERE id = $2 AND "dietistaId" = $3`,
    JSON.stringify(cleaned), pacienteId, dietista.id
  );

  revalidatePath(`/pacientes/${pacienteId}`);
}

"use server";

import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import { getCurrentPaciente } from "@/lib/patient-auth";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { Prisma, type ObjetivoPaciente, type Sexo } from "@/generated/prisma/client";
import {
  sanitizeCamposAnamnesis,
  type CampoPersonalizadoDefinicion,
  type FichaInformacionData,
} from "@/lib/ficha-informacion-types";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://annonia.com";
const OBJETIVOS_VALIDOS: string[] = [
  "PERDER_PESO", "GANAR_MASA", "MANTENIMIENTO", "PATOLOGIA", "DEPORTIVO", "OTRO",
];
const SEXOS_VALIDOS: string[] = ["MASCULINO", "FEMENINO", "OTRO"];

/** Datos que el paciente envía desde el formulario de preconsulta. */
export interface PreconsultaInput {
  telefono?: string;
  fechaNacimiento?: string; // yyyy-mm-dd
  sexo?: string;
  peso?: number;
  altura?: number;
  objetivo?: string;
  objetivoDetalle?: string;
  alergias: string[];
  intolerancias: string[];
  patologias: string[];
  medicamentos: string[];
  suplementos: string[];
  ficha: FichaInformacionData;
}

/** Todo lo que la página (pública o portal) necesita para pintar el formulario. */
export interface PreconsultaContext {
  nombre: string;
  apellidos: string;
  prefill: {
    telefono: string;
    fechaNacimiento: string;
    sexo: string;
    peso: number | null;
    altura: number | null;
    objetivo: string;
    objetivoDetalle: string;
    alergias: string[];
    intolerancias: string[];
    patologias: string[];
    medicamentos: string[];
    suplementos: string[];
    ficha: FichaInformacionData;
  };
  campos: CampoPersonalizadoDefinicion[];
  yaCompletada: boolean;
  branding: {
    nombre: string;
    clinica: string | null;
    temaPdf: string | null;
    colorPrimarioPdf: string | null;
    logoUrl: string | null;
    marcaPdf: string | null;
  };
}

// --- Helpers (no exportados) ---

const PRECONSULTA_SELECT = {
  nombre: true,
  apellidos: true,
  telefono: true,
  fechaNacimiento: true,
  sexo: true,
  peso: true,
  altura: true,
  objetivo: true,
  objetivoDetalle: true,
  alergias: true,
  intolerancias: true,
  patologias: true,
  medicamentos: true,
  suplementos: true,
  fichaInformacion: true,
  preconsultaCompletadaAt: true,
  dietista: {
    select: {
      nombre: true,
      apellidos: true,
      clinica: true,
      temaPdf: true,
      colorPrimarioPdf: true,
      pdfLogoUrl: true,
      marcaPdf: true,
      camposAnamnesis: true,
    },
  },
} satisfies Prisma.PacienteSelect;

type PacientePreconsulta = Prisma.PacienteGetPayload<{ select: typeof PRECONSULTA_SELECT }>;

function sStr(v: string | undefined | null, max = 200): string {
  if (!v) return "";
  return v.trim().slice(0, max);
}

function sArr(arr: unknown, maxItems = 20, maxLen = 100): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((s) => sStr(typeof s === "string" ? s : "", maxLen))
    .filter((s) => s.length > 0)
    .slice(0, maxItems);
}

/** Limpia el JSON de la ficha: solo strings (máx 4000) y objetos anidados. Reusa el criterio de pacientes.ts. */
function sanitizeFichaDeep(obj: unknown): Record<string, unknown> {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (typeof v === "string") out[k] = v.trim().slice(0, 4000);
    else if (v !== null && typeof v === "object" && !Array.isArray(v)) out[k] = sanitizeFichaDeep(v);
  }
  return out;
}

/** Fusiona por sección la ficha existente con la entrante (la entrante pisa campo a campo; no se pierde lo no enviado). */
function mergeFicha(base: FichaInformacionData, incoming: FichaInformacionData): FichaInformacionData {
  const merged: Record<string, unknown> = { ...(base ?? {}) };
  for (const [k, iv] of Object.entries(incoming ?? {})) {
    const bv = (base as Record<string, unknown> | null)?.[k];
    if (iv && typeof iv === "object" && !Array.isArray(iv)) {
      merged[k] = { ...(bv && typeof bv === "object" && !Array.isArray(bv) ? bv : {}), ...iv };
    } else {
      merged[k] = iv;
    }
  }
  return merged as FichaInformacionData;
}

function buildContext(p: PacientePreconsulta): PreconsultaContext {
  const fecha = p.fechaNacimiento ? p.fechaNacimiento.toISOString().slice(0, 10) : "";
  return {
    nombre: p.nombre,
    apellidos: p.apellidos,
    prefill: {
      telefono: p.telefono ?? "",
      fechaNacimiento: fecha,
      sexo: p.sexo ?? "",
      peso: p.peso ?? null,
      altura: p.altura ?? null,
      objetivo: p.objetivo,
      objetivoDetalle: p.objetivoDetalle ?? "",
      alergias: p.alergias ?? [],
      intolerancias: p.intolerancias ?? [],
      patologias: p.patologias ?? [],
      medicamentos: p.medicamentos ?? [],
      suplementos: p.suplementos ?? [],
      ficha: (p.fichaInformacion as FichaInformacionData) ?? {},
    },
    campos: sanitizeCamposAnamnesis(p.dietista.camposAnamnesis),
    yaCompletada: !!p.preconsultaCompletadaAt,
    branding: {
      nombre: `${p.dietista.nombre} ${p.dietista.apellidos}`.trim(),
      clinica: p.dietista.clinica,
      temaPdf: p.dietista.temaPdf,
      colorPrimarioPdf: p.dietista.colorPrimarioPdf,
      logoUrl: p.dietista.pdfLogoUrl,
      marcaPdf: p.dietista.marcaPdf,
    },
  };
}

/** Vuelca lo que rellenó el paciente a su ficha + datos directos, marca la preconsulta como completada y avisa al nutri. */
async function volcarPreconsulta(
  pacienteId: string,
  dietistaId: string,
  nombrePaciente: string,
  fichaActual: FichaInformacionData,
  data: PreconsultaInput,
): Promise<{ ok: boolean; error?: string }> {
  const t = await getTranslations("validation");

  const fichaLimpia = sanitizeFichaDeep(data.ficha) as FichaInformacionData;
  const fichaMerged = mergeFicha(fichaActual ?? {}, fichaLimpia);

  const updateData: Prisma.PacienteUpdateInput = {
    // Listas clínicas: el formulario muestra las actuales y reenvía la lista final.
    alergias: sArr(data.alergias),
    intolerancias: sArr(data.intolerancias),
    patologias: sArr(data.patologias),
    medicamentos: sArr(data.medicamentos),
    suplementos: sArr(data.suplementos),
    fichaInformacion: fichaMerged as Prisma.InputJsonValue,
    preconsultaCompletadaAt: new Date(),
  };

  // Campos sueltos: solo se pisan si el paciente aportó un valor válido (no borran lo que ya había).
  const telefono = sStr(data.telefono, 25);
  if (telefono) updateData.telefono = telefono;

  const objetivoDetalle = sStr(data.objetivoDetalle, 500);
  if (objetivoDetalle) updateData.objetivoDetalle = objetivoDetalle;

  if (data.objetivo && OBJETIVOS_VALIDOS.includes(data.objetivo)) {
    updateData.objetivo = data.objetivo as ObjetivoPaciente;
  }
  if (data.sexo && SEXOS_VALIDOS.includes(data.sexo)) {
    updateData.sexo = data.sexo as Sexo;
  }
  if (data.fechaNacimiento) {
    const f = new Date(data.fechaNacimiento);
    if (!isNaN(f.getTime()) && f <= new Date()) updateData.fechaNacimiento = f;
  }
  if (typeof data.peso === "number" && data.peso >= 1 && data.peso <= 500) {
    updateData.peso = data.peso;
  }
  if (typeof data.altura === "number" && data.altura >= 30 && data.altura <= 300) {
    updateData.altura = data.altura;
  }

  await prisma.paciente.update({ where: { id: pacienteId }, data: updateData });

  // Aviso al nutri (campana del dashboard).
  await prisma.notificacion.create({
    data: {
      dietistaId,
      pacienteId,
      tipo: "PRECONSULTA_COMPLETADA",
      titulo: t("notificaciones.titulos.preconsultaCompletada"),
      mensaje: t("notificaciones.mensajes.preconsultaCompletada", { nombrePaciente }),
      tituloKey: "notificaciones.titulos.preconsultaCompletada",
      mensajeKey: "notificaciones.mensajes.preconsultaCompletada",
      params: { nombrePaciente },
      enlace: `/pacientes/${pacienteId}?pestana=informacion`,
    },
  });

  revalidatePath(`/pacientes/${pacienteId}`);
  return { ok: true };
}

// --- Acciones del dietista (autenticado) ---

/** Asegura el token del link de preconsulta del paciente y devuelve la URL pública. Marca "enviada" la primera vez. */
export async function getOrCreatePreconsultaLink(
  pacienteId: string,
): Promise<{ ok: boolean; url?: string; token?: string; email?: string; telefono?: string; error?: string }> {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) return { ok: false, error: t("auth.noAutorizado") };
  if (dietista.isDemo) return { ok: false, error: t("general.noDisponibleDemo") };

  const paciente = await prisma.paciente.findFirst({
    where: { id: pacienteId, dietistaId: dietista.id },
    select: { id: true, preconsultaToken: true, preconsultaEnviadaAt: true, email: true, telefono: true },
  });
  if (!paciente) return { ok: false, error: t("paciente.pacienteNoEncontrado") };

  const token = paciente.preconsultaToken ?? randomUUID();
  await prisma.paciente.update({
    where: { id: pacienteId },
    data: {
      preconsultaToken: token,
      preconsultaEnviadaAt: paciente.preconsultaEnviadaAt ?? new Date(),
    },
  });

  revalidatePath(`/pacientes/${pacienteId}`);
  return {
    ok: true,
    url: `${APP_URL}/preconsulta/${token}`,
    token,
    email: paciente.email ?? undefined,
    telefono: paciente.telefono ?? undefined,
  };
}

// --- Acciones públicas (por token, sin login) ---

/** Contexto para la ruta pública /preconsulta/[token]. Null si el token no es válido. */
export async function getPreconsultaContextPorToken(token: string): Promise<PreconsultaContext | null> {
  if (!token || typeof token !== "string") return null;
  const p = await prisma.paciente.findFirst({
    where: { preconsultaToken: token, activo: true },
    select: PRECONSULTA_SELECT,
  });
  if (!p) return null;
  return buildContext(p);
}

/** Guarda las respuestas enviadas desde la ruta pública. */
export async function guardarPreconsultaPorToken(
  token: string,
  data: PreconsultaInput,
): Promise<{ ok: boolean; error?: string }> {
  const t = await getTranslations("validation");
  if (!token || typeof token !== "string") return { ok: false, error: t("paciente.pacienteNoEncontrado") };
  const p = await prisma.paciente.findFirst({
    where: { preconsultaToken: token, activo: true },
    select: { id: true, dietistaId: true, nombre: true, apellidos: true, fichaInformacion: true },
  });
  if (!p) return { ok: false, error: t("paciente.pacienteNoEncontrado") };
  return volcarPreconsulta(
    p.id,
    p.dietistaId,
    `${p.nombre} ${p.apellidos}`.trim(),
    (p.fichaInformacion as FichaInformacionData) ?? {},
    data,
  );
}

// --- Acciones del portal del paciente (sesión propia) ---

/** Contexto para /paciente/portal/anamnesis (paciente autenticado). */
export async function getPreconsultaContextPaciente(): Promise<PreconsultaContext | null> {
  const session = await getCurrentPaciente();
  if (!session) return null;
  const p = await prisma.paciente.findFirst({
    where: { id: session.pacienteId, activo: true },
    select: PRECONSULTA_SELECT,
  });
  if (!p) return null;
  return buildContext(p);
}

/** Guarda las respuestas enviadas desde el portal del paciente. */
export async function guardarPreconsultaPaciente(
  data: PreconsultaInput,
): Promise<{ ok: boolean; error?: string }> {
  const t = await getTranslations("validation");
  const session = await getCurrentPaciente();
  if (!session) return { ok: false, error: t("auth.noAutorizado") };
  const p = await prisma.paciente.findFirst({
    where: { id: session.pacienteId, activo: true },
    select: { id: true, dietistaId: true, nombre: true, apellidos: true, fichaInformacion: true },
  });
  if (!p) return { ok: false, error: t("paciente.pacienteNoEncontrado") };
  const res = await volcarPreconsulta(
    p.id,
    p.dietistaId,
    `${p.nombre} ${p.apellidos}`.trim(),
    (p.fichaInformacion as FichaInformacionData) ?? {},
    data,
  );
  revalidatePath("/paciente/portal/anamnesis");
  revalidatePath("/paciente/portal");
  return res;
}

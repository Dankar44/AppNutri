"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import { revalidatePath } from "next/cache";
import { EstadoCita } from "@/generated/prisma/client";
import {
  sanitizeStringOptional,
  validateNumber,
  validateDate,
  validateUrl,
  LIMITS,
} from "@/lib/validation";
import { syncCitaAmbos, unsyncCitaAntesDeBorrar } from "@/lib/google-sync";
import { enviarEmailCita, construirMensajeWhatsAppCita } from "@/lib/email-citas";
import { getTranslations, getLocale } from "next-intl/server";

export interface CitaFormData {
  pacienteId: string;
  fechaHora: string;
  duracion?: number;
  motivo?: string;
  notas?: string;
  isOnline?: boolean;
  /** Enlace de videollamada manual (Zoom, Meet, Teams...). Se incluye en el aviso al paciente. */
  enlaceVideollamada?: string;
  /**
   * - "directa" (por defecto): crea la cita CONFIRMADA directamente, útil para citas ya acordadas en persona.
   * - "proponer": crea PENDIENTE y notifica al paciente, que decidirá si aceptarla/contraponerla/rechazarla.
   */
  modo?: "directa" | "proponer";
}

export async function crearCita(data: CitaFormData) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  const fechaHora = validateDate(data.fechaHora);
  if (!fechaHora) throw new Error(t("cita.fechaHoraInvalidas"));
  const duracion = validateNumber(data.duracion || 30, LIMITS.DURACION_MIN, LIMITS.DURACION_MAX);
  const motivo = sanitizeStringOptional(data.motivo, LIMITS.MOTIVO);
  const notas = sanitizeStringOptional(data.notas, LIMITS.NOTAS);
  // Enlace de videollamada manual: si viene pero no es URL válida, se ignora
  // (el <input type="url"> ya valida el formato en el cliente).
  const enlaceVideollamada = validateUrl(data.enlaceVideollamada) ?? undefined;
  const modo = data.modo ?? "directa";

  // Verificar que el paciente pertenece al nutri (seguridad)
  const paciente = await prisma.paciente.findFirst({
    where: { id: data.pacienteId, dietistaId: dietista.id },
    select: { id: true, nombre: true, apellidos: true },
  });
  if (!paciente) throw new Error(t("paciente.pacienteNoEncontrado"));

  const cita = await prisma.cita.create({
    data: {
      paciente: { connect: { id: data.pacienteId } },
      dietista: { connect: { id: dietista.id } },
      fechaHora,
      duracion,
      motivo,
      notas,
      estado: modo === "proponer" ? "PENDIENTE" : "CONFIRMADA",
      origen: "DIETISTA",
      propuestoPor: "DIETISTA",
      isOnline: data.isOnline ?? false,
      enlaceVideollamada,
    },
    select: { id: true },
  });

  // Sincroniza con Google (si está conectado, genera el enlace de Meet) y SOLO
  // DESPUÉS avisa al paciente, para que el email pueda incluir el enlace de la
  // videollamada (manual o Meet). Fire-and-forget; el locale se captura aquí porque
  // enviarEmailCita puede ejecutarse ya fuera del contexto de la petición.
  // enviarEmailCita adapta el texto al estado (propuesta vs confirmada).
  const locale = await getLocale();
  void syncCitaAmbos(cita.id)
    .catch((e) => console.error("[crearCita] syncCita", e))
    .finally(() => {
      void enviarEmailCita(cita.id, { locale });
    });

  // Si es una propuesta al paciente, notificar
  if (modo === "proponer") {
    const textoFecha = await formatFechaHoraIntl(fechaHora);
    await prisma.notificacion.create({
      data: {
        pacienteId: paciente.id,
        citaId: cita.id,
        tipo: "CITA_SOLICITADA",
        titulo: t("notificaciones.titulos.nutricionistaPropone"),
        mensaje: t("notificaciones.mensajes.proponeCita", { nombreDietista: `${dietista.nombre} ${dietista.apellidos}`, fecha: textoFecha }),
        tituloKey: "notificaciones.titulos.nutricionistaPropone",
        mensajeKey: "notificaciones.mensajes.proponeCita",
        params: { nombreDietista: `${dietista.nombre} ${dietista.apellidos}`, fecha: textoFecha },
        enlace: "/paciente/portal/citas",
      },
    });
  }

  revalidatePath("/agenda");
  revalidatePath("/paciente/portal/citas");
  return cita;
}

export async function actualizarEstadoCita(id: string, estado: EstadoCita) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  await prisma.cita.update({
    where: { id, dietistaId: dietista.id },
    data: { estado },
  });

  void syncCitaAmbos(id);
  revalidatePath("/agenda");
}

export async function eliminarCita(id: string) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  await unsyncCitaAntesDeBorrar(id);
  await prisma.cita.delete({
    where: { id, dietistaId: dietista.id },
  });

  revalidatePath("/agenda");
}

export async function getCitasSemana(fechaInicio: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  const inicio = new Date(fechaInicio);
  inicio.setHours(0, 0, 0, 0);
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + 7);

  return prisma.cita.findMany({
    where: {
      dietistaId: dietista.id,
      fechaHora: { gte: inicio, lt: fin },
      paciente: { esDemo: false },
    },
    include: { paciente: { select: { id: true, nombre: true, apellidos: true } } },
    orderBy: { fechaHora: "asc" },
  });
}

export async function getCitasMes(anio: number, mes: number) {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  const inicio = new Date(anio, mes, 1);
  const fin = new Date(anio, mes + 1, 1);

  return prisma.cita.findMany({
    where: {
      dietistaId: dietista.id,
      fechaHora: { gte: inicio, lt: fin },
      paciente: { esDemo: false },
    },
    include: { paciente: { select: { id: true, nombre: true, apellidos: true } } },
    orderBy: { fechaHora: "asc" },
  });
}

export async function getCitasHoy() {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const manana = new Date(hoy);
  manana.setDate(manana.getDate() + 1);

  return prisma.cita.findMany({
    where: {
      dietistaId: dietista.id,
      fechaHora: { gte: hoy, lt: manana },
      paciente: { esDemo: false },
    },
    include: { paciente: { select: { nombre: true, apellidos: true } } },
    orderBy: { fechaHora: "asc" },
  });
}

/** Citas de un día concreto (fecha local YYYY-MM-DD). */
export async function getCitasDia(fechaYYYYMMDD: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  const [y, m, d] = fechaYYYYMMDD.split("-").map(Number);
  if (!y || !m || !d) return [];

  const inicio = new Date(y, m - 1, d, 0, 0, 0, 0);
  const fin = new Date(y, m - 1, d + 1, 0, 0, 0, 0);

  return prisma.cita.findMany({
    where: {
      dietistaId: dietista.id,
      fechaHora: { gte: inicio, lt: fin },
      paciente: { esDemo: false },
    },
    include: {
      paciente: {
        select: { id: true, nombre: true, apellidos: true, fotoUrl: true },
      },
    },
    orderBy: { fechaHora: "asc" },
  });
}

/** Citas pendientes o confirmadas desde ahora en adelante (para dashboard). */
export async function getProximasCitas(take = 8) {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  const ahora = new Date();

  return prisma.cita.findMany({
    where: {
      dietistaId: dietista.id,
      fechaHora: { gte: ahora },
      estado: { in: [EstadoCita.PENDIENTE, EstadoCita.CONFIRMADA] },
      paciente: { esDemo: false },
    },
    include: {
      paciente: {
        select: { id: true, nombre: true, apellidos: true, fotoUrl: true },
      },
    },
    orderBy: { fechaHora: "asc" },
    take,
  });
}

export async function getPacientesParaCita() {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  return prisma.paciente.findMany({
    where: { dietistaId: dietista.id, activo: true },
    select: {
      id: true,
      nombre: true,
      apellidos: true,
      fotoUrl: true,
      email: true,
      telefono: true,
      fechaNacimiento: true,
      objetivo: true,
      objetivoDetalle: true,
      avisarPorWhatsapp: true,
    },
    orderBy: { nombre: "asc" },
  });
}

export async function getPacienteContextoCita(pacienteId: string) {
  const dietista = await getCurrentDietista();
  if (!dietista) return null;

  const paciente = await prisma.paciente.findFirst({
    where: { id: pacienteId, dietistaId: dietista.id },
    select: {
      id: true,
      nombre: true,
      apellidos: true,
      fotoUrl: true,
      email: true,
      telefono: true,
      fechaNacimiento: true,
      objetivo: true,
      objetivoDetalle: true,
      peso: true,
      altura: true,
    },
  });
  if (!paciente) return null;

  const ahora = new Date();
  const [proximaCita, ultimaCita, planActivo, ultimaMedida] = await Promise.all([
    prisma.cita.findFirst({
      where: { pacienteId, dietistaId: dietista.id, fechaHora: { gte: ahora } },
      orderBy: { fechaHora: "asc" },
      select: { id: true, fechaHora: true, motivo: true, estado: true },
    }),
    prisma.cita.findFirst({
      where: { pacienteId, dietistaId: dietista.id, fechaHora: { lt: ahora } },
      orderBy: { fechaHora: "desc" },
      select: { id: true, fechaHora: true, motivo: true, estado: true },
    }),
    prisma.planAlimenticio.findFirst({
      where: { pacienteId, dietistaId: dietista.id, activo: true },
      orderBy: { createdAt: "desc" },
      select: { id: true, nombre: true, caloriasObjetivo: true, createdAt: true },
    }),
    prisma.medidaAntropometrica.findFirst({
      where: { pacienteId },
      orderBy: { fecha: "desc" },
      select: { fecha: true, peso: true, imc: true },
    }),
  ]);

  return { paciente, proximaCita, ultimaCita, planActivo, ultimaMedida };
}

/**
 * Reenvía al paciente el email de su cita (botón "Notificar por email" en la agenda).
 * force: true se salta el debounce para permitir recordatorios manuales.
 */
export async function notificarCitaPorEmail(
  citaId: string,
): Promise<{ ok: boolean; error?: string }> {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) return { ok: false, error: t("auth.noAutorizado") };
  if (dietista.isDemo) return { ok: true };

  const cita = await prisma.cita.findFirst({
    where: { id: citaId, dietistaId: dietista.id },
    select: { id: true, paciente: { select: { email: true } } },
  });
  if (!cita) return { ok: false, error: t("cita.citaNoEncontrada") };
  if (!cita.paciente.email) return { ok: false, error: t("paciente.sinEmailRegistrado") };

  const res = await enviarEmailCita(citaId, { force: true });
  if (!res.ok) return { ok: false, error: t("general.errorDesconocido") };
  return { ok: true };
}

/**
 * Datos de contacto del paciente para los avisos de cita desde la agenda:
 * si tiene email (para el botón de email) y su teléfono + mensaje ya redactado
 * (para el botón de WhatsApp). Verifica que la cita pertenece al nutri actual.
 */
export async function getInfoAvisoCita(citaId: string): Promise<{
  tieneEmail: boolean;
  telefono: string | null;
  mensajeWhatsApp: string | null;
}> {
  const vacio = { tieneEmail: false, telefono: null, mensajeWhatsApp: null };
  const dietista = await getCurrentDietista();
  if (!dietista) return vacio;

  const cita = await prisma.cita.findFirst({
    where: { id: citaId, dietistaId: dietista.id },
    select: { id: true, paciente: { select: { email: true, telefono: true } } },
  });
  if (!cita) return vacio;

  const mensajeWhatsApp = cita.paciente.telefono
    ? await construirMensajeWhatsAppCita(citaId)
    : null;
  return {
    tieneEmail: !!cita.paciente.email,
    telefono: cita.paciente.telefono ?? null,
    mensajeWhatsApp,
  };
}

async function formatFechaHoraIntl(d: Date): Promise<string> {
  const locale = await import("@/i18n/locale").then((m) => m.getLocale());
  const tag = locale === "pt" ? "pt-BR" : "es-ES";
  return d.toLocaleString(tag, {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

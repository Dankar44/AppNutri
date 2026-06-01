"use server";

import { prisma } from "@/lib/prisma";
import { registrarCuenta } from "./registro";
import { sanitizeString } from "@/lib/validation";

export type SolicitudColaboradorInput = {
  nombre: string;
  apellidos: string;
  email: string;
  password: string;
  telefono: string;
  pais: string;
  numPacientes: string;
  modalidad: string;
  tipoTrabajo: string;
  nivelEstudios: string;
  esProfesor: boolean;
  discapacidad: string;
};

// Valores válidos de cada pregunta (defensa servidor; el form ya los limita).
const VALIDOS = {
  numPacientes: ["0-2", "2-5", "5-15", "15-30", "30+"],
  modalidad: ["presencial", "online", "ambas", "sin_consulta"],
  tipoTrabajo: ["autonomo", "clinica"],
  nivelEstudios: ["estudiante", "fp", "grado", "master", "doctorado"],
  discapacidad: ["si", "no", "prefiero_no_decir"],
};

export async function enviarSolicitudColaborador(
  data: SolicitudColaboradorInput,
): Promise<{ ok: boolean; error?: string }> {
  // 1. Validar los datos propios de la candidatura.
  const telefono = sanitizeString(data.telefono, 30);
  if (!telefono || !/^\+\d[\d\s]{5,}$/.test(telefono)) {
    return { ok: false, error: "Introduce un teléfono válido con prefijo (ej. +34 600 000 000)." };
  }
  const pais = sanitizeString(data.pais, 80);
  if (!pais) return { ok: false, error: "Indica tu país de residencia." };

  if (!VALIDOS.numPacientes.includes(data.numPacientes)) return { ok: false, error: "Responde cuántos pacientes atiendes." };
  if (!VALIDOS.modalidad.includes(data.modalidad)) return { ok: false, error: "Indica la modalidad de tus consultas." };
  if (!VALIDOS.tipoTrabajo.includes(data.tipoTrabajo)) return { ok: false, error: "Indica si trabajas por tu cuenta o en una clínica." };
  if (!VALIDOS.nivelEstudios.includes(data.nivelEstudios)) return { ok: false, error: "Indica tu nivel de estudios." };
  if (!VALIDOS.discapacidad.includes(data.discapacidad)) return { ok: false, error: "Completa la última pregunta." };

  // 2. Crear la cuenta (valida email/duplicados, rate-limit y envía el email de verificación).
  const res = await registrarCuenta({
    nombre: data.nombre,
    apellidos: data.apellidos,
    email: data.email,
    password: data.password,
    fuente: "ofertas",
  });
  if (!res.ok) return res;

  // 3. Guardar las respuestas de la candidatura (best-effort: no bloquea el alta).
  try {
    await prisma.solicitudColaborador.create({
      data: {
        email: data.email.trim().toLowerCase(),
        telefono,
        pais,
        numPacientes: data.numPacientes,
        modalidad: data.modalidad,
        tipoTrabajo: data.tipoTrabajo,
        nivelEstudios: data.nivelEstudios,
        esProfesor: !!data.esProfesor,
        discapacidad: data.discapacidad,
      },
    });
  } catch (e) {
    console.error("[colaborador] No se pudo guardar la solicitud:", e);
  }

  return { ok: true };
}

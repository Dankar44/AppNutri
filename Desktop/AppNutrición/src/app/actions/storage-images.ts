"use server";

import { fileTypeFromBuffer } from "file-type";
import { getCurrentDietista } from "./auth";
import { getCurrentPaciente } from "@/lib/patient-auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { checkRateLimit, LIMITES } from "@/lib/rate-limit";
import {
  uploadDietistaPhoto,
  uploadPacientePhoto,
  uploadPdfLogo,
  deletePdfLogo,
  deleteDietistaPhoto,
  deletePacientePhoto,
  isStorageUrl,
} from "@/lib/storage";

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];

async function validarArchivo(formData: FormData, t: (key: string) => string) {
  const archivo = formData.get("imagen") as File | null;
  if (!archivo) throw new Error(t("adjuntos.sinArchivo"));
  if (archivo.size > MAX_SIZE) throw new Error(t("adjuntos.archivoSuperaTamano"));
  if (!TIPOS_PERMITIDOS.includes(archivo.type)) throw new Error(t("adjuntos.tipoNoPermitido"));

  const buffer = Buffer.from(await archivo.arrayBuffer());
  const detectado = await fileTypeFromBuffer(buffer);
  if (!detectado || !TIPOS_PERMITIDOS.includes(detectado.mime)) {
    throw new Error(t("adjuntos.contenidoNoValido"));
  }
  if (detectado.mime !== archivo.type) {
    throw new Error(t("adjuntos.tipoNoCoincide"));
  }

  return buffer;
}

export async function subirFotoDietista(formData: FormData): Promise<{ url: string }> {
  const { getTranslations } = await import("next-intl/server");
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) throw new Error(t("general.noDisponibleDemo"));

  const rl = checkRateLimit({ key: `img:d_${dietista.id}`, ...LIMITES.subirImagen });
  if (!rl.ok) throw new Error(t("mensajes.demasiadosArchivos"));

  const buffer = await validarArchivo(formData, t);
  const url = await uploadDietistaPhoto(dietista.id, buffer);

  await prisma.dietista.update({
    where: { id: dietista.id },
    data: { logoUrl: url },
  });

  revalidatePath("/ajustes");
  revalidatePath("/dashboard");
  return { url };
}

export async function subirLogoPdf(formData: FormData): Promise<{ url: string }> {
  const { getTranslations } = await import("next-intl/server");
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) throw new Error(t("general.noDisponibleDemo"));

  const rl = checkRateLimit({ key: `img:d_${dietista.id}`, ...LIMITES.subirImagen });
  if (!rl.ok) throw new Error(t("mensajes.demasiadosArchivos"));

  const buffer = await validarArchivo(formData, t);
  const url = await uploadPdfLogo(dietista.id, buffer);

  await prisma.dietista.update({
    where: { id: dietista.id },
    data: { pdfLogoUrl: url },
  });

  revalidatePath("/ajustes");
  return { url };
}

export async function eliminarLogoPdfStorage() {
  const { getTranslations } = await import("next-intl/server");
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) throw new Error(t("general.noDisponibleDemo"));

  await deletePdfLogo(dietista.id);
  await prisma.dietista.update({
    where: { id: dietista.id },
    data: { pdfLogoUrl: null },
  });

  revalidatePath("/ajustes");
}

export async function subirFotoPaciente(formData: FormData): Promise<{ url: string }> {
  const { getTranslations } = await import("next-intl/server");
  const t = await getTranslations("validation");
  const session = await getCurrentPaciente();
  if (!session) throw new Error(t("auth.noAutorizado"));

  const rl = checkRateLimit({ key: `img:p_${session.pacienteId}`, ...LIMITES.subirImagen });
  if (!rl.ok) throw new Error(t("mensajes.demasiadosArchivos"));

  const buffer = await validarArchivo(formData, t);
  const url = await uploadPacientePhoto(session.pacienteId, buffer);

  await prisma.paciente.update({
    where: { id: session.pacienteId },
    data: { fotoUrl: url },
  });

  revalidatePath("/paciente/portal");
  return { url };
}

export async function subirFotoPacienteAlCompletar(formData: FormData): Promise<string | null> {
  const { getTranslations } = await import("next-intl/server");
  const t = await getTranslations("validation");
  const session = await getCurrentPaciente();
  if (!session) throw new Error(t("auth.noAutorizado"));

  const archivo = formData.get("imagen") as File | null;
  if (!archivo || archivo.size === 0) return null;

  const rl = checkRateLimit({ key: `img:p_${session.pacienteId}`, ...LIMITES.subirImagen });
  if (!rl.ok) throw new Error(t("mensajes.demasiadosArchivos"));

  const buffer = await validarArchivo(formData, t);
  const url = await uploadPacientePhoto(session.pacienteId, buffer);

  await prisma.paciente.update({
    where: { id: session.pacienteId },
    data: { fotoUrl: url },
  });

  return url;
}

export async function limpiarImagenesDietista(dietistaId: string, pacienteIds: string[]) {
  const deletes: Promise<void>[] = [
    deleteDietistaPhoto(dietistaId).catch(() => {}),
    deletePdfLogo(dietistaId).catch(() => {}),
  ];
  for (const pid of pacienteIds) {
    deletes.push(deletePacientePhoto(pid).catch(() => {}));
  }
  await Promise.allSettled(deletes);
}

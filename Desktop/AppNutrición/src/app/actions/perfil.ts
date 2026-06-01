"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  sanitizeString,
  sanitizeStringOptional,
  validatePhone,
  validateImageDataUrl,
  validateHexColor,
  validateEnum,
  LIMITS,
  TEMA_PDF_OPCIONES,
} from "@/lib/validation";
import type { CampoPersonalizadoDefinicion, TipoCampoAnamnesis, SeccionAnamnesis } from "@/lib/ficha-informacion-types";

export interface PerfilFormData {
  nombre: string;
  apellidos: string;
  telefono?: string;
  especialidad?: string;
  numColegiado?: string;
  clinica?: string;
}

export async function actualizarPerfil(data: PerfilFormData) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  const nombre = sanitizeString(data.nombre, LIMITS.NOMBRE_CORTO);
  if (!nombre) throw new Error(t("perfil.nombreObligatorio"));
  const apellidos = sanitizeString(data.apellidos, LIMITS.NOMBRE_CORTO);
  if (!apellidos) throw new Error(t("perfil.apellidosObligatorios"));
  const telefono = validatePhone(data.telefono) || null;
  const especialidad = sanitizeStringOptional(data.especialidad, LIMITS.ESPECIALIDAD);
  const numColegiado = sanitizeStringOptional(data.numColegiado, LIMITS.COLEGIADO);
  const clinica = sanitizeStringOptional(data.clinica, LIMITS.CLINICA);

  await prisma.dietista.update({
    where: { id: dietista.id },
    data: {
      nombre,
      apellidos,
      telefono,
      especialidad,
      numColegiado,
      clinica,
    },
  });

  revalidatePath("/ajustes");
  revalidatePath("/dashboard");
}

export async function eliminarCuenta() {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  const authId = dietista.authId;

  // Eliminar auth ANTES del dietista para evitar zombis si falla a medias
  if (authId) {
    try {
      await prisma.$queryRawUnsafe(`DELETE FROM auth.identities WHERE user_id = $1::uuid`, authId);
    } catch (e) {
      console.warn("[perfil] Error eliminando auth.identities:", e);
    }
    try {
      await prisma.$queryRawUnsafe(`DELETE FROM auth.users WHERE id = $1::uuid`, authId);
    } catch (e) {
      console.warn("[perfil] Error eliminando auth.users:", e);
    }
  }

  // Eliminar suscripción (belt-and-suspenders, cascade también la borra)
  try {
    await prisma.$queryRawUnsafe(`DELETE FROM suscripciones WHERE "dietistaId" = $1`, dietista.id);
  } catch { /* puede no existir */ }

  // Cascade borra pacientes, planes, recetas, etc.
  await prisma.dietista.delete({ where: { id: dietista.id } });

  // Cerrar sesión de Supabase
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  await supabase.auth.signOut();

  redirect("/login");
}

export async function actualizarFotoDietista(fotoUrl: string) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  const validatedUrl = validateImageDataUrl(fotoUrl);
  if (!validatedUrl) throw new Error(t("perfil.imagenInvalida"));

  await prisma.dietista.update({
    where: { id: dietista.id },
    data: { logoUrl: validatedUrl },
  });

  revalidatePath("/ajustes");
  revalidatePath("/dashboard");
}

export async function actualizarTemaPdf(tema: string, colorPrimario: string | null) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  const temaValido = validateEnum(tema, TEMA_PDF_OPCIONES);
  if (!temaValido) throw new Error(t("perfil.temaNoValido"));

  const color = temaValido === "personalizado" ? validateHexColor(colorPrimario) : null;
  if (temaValido === "personalizado" && !color) throw new Error(t("perfil.colorNoValido"));

  await prisma.dietista.update({
    where: { id: dietista.id },
    data: { temaPdf: temaValido, colorPrimarioPdf: color },
  });

  revalidatePath("/ajustes");
}

export async function actualizarLogoPdf(logoDataUrl: string) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  const validatedUrl = validateImageDataUrl(logoDataUrl);
  if (!validatedUrl) throw new Error(t("perfil.imagenInvalida"));

  await prisma.dietista.update({
    where: { id: dietista.id },
    data: { pdfLogoUrl: validatedUrl },
  });

  revalidatePath("/ajustes");
}

export async function eliminarLogoPdf() {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  await prisma.dietista.update({
    where: { id: dietista.id },
    data: { pdfLogoUrl: null },
  });

  revalidatePath("/ajustes");
}

// ¿La cuenta tiene contraseña? Las creadas solo con Google no tienen
// encrypted_password, así que en Ajustes se "establece" en vez de "cambiar".
export async function dietistaTienePassword(): Promise<boolean> {
  const dietista = await getCurrentDietista();
  if (!dietista) return false;
  const estado = await prisma.$queryRawUnsafe<{ tiene: boolean }[]>(
    `SELECT (encrypted_password IS NOT NULL AND encrypted_password <> '') as tiene FROM auth.users WHERE id = $1::uuid`,
    dietista.authId
  );
  return !!estado[0]?.tiene;
}

export async function cambiarPassword(data: {
  actual: string;
  nueva: string;
}): Promise<{ ok: boolean; error?: string }> {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return { ok: false, error: t("password.noDisponibleDemo") };

  const { actual, nueva } = data;
  if (!nueva) return { ok: false, error: t("password.camposObligatorios") };
  if (nueva.length < 6) return { ok: false, error: t("password.longitudMinima") };

  const authId = dietista.authId;

  // El servidor decide el modo según la BD (no se fía del cliente):
  // una cuenta creada solo con Google no tiene encrypted_password.
  const estado = await prisma.$queryRawUnsafe<{ tiene: boolean }[]>(
    `SELECT (encrypted_password IS NOT NULL AND encrypted_password <> '') as tiene FROM auth.users WHERE id = $1::uuid`,
    authId
  );
  const tienePassword = !!estado[0]?.tiene;

  if (tienePassword) {
    // Modo CAMBIAR: exige y verifica la contraseña actual.
    if (!actual) return { ok: false, error: t("password.camposObligatorios") };
    if (actual === nueva) return { ok: false, error: t("password.debeSerDiferente") };
    const verify = await prisma.$queryRawUnsafe<{ valid: boolean }[]>(
      `SELECT (encrypted_password = crypt($1, encrypted_password)) as valid FROM auth.users WHERE id = $2::uuid`,
      actual, authId
    );
    if (!verify[0]?.valid) return { ok: false, error: t("password.actualIncorrecta") };
  }
  // Modo ESTABLECER (sin contraseña previa, p. ej. cuenta Google): se fija
  // directamente porque el usuario ya está autenticado en su sesión.

  await prisma.$queryRawUnsafe(
    `UPDATE auth.users SET encrypted_password = crypt($1, gen_salt('bf')), updated_at = NOW() WHERE id = $2::uuid`,
    nueva, authId
  );

  return { ok: true };
}

export async function actualizarMarcaPdf(marca: string) {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error(t("auth.noAutorizado"));
  if (dietista.isDemo) return;

  const cleaned = sanitizeStringOptional(marca, LIMITS.MARCA_PDF);

  await prisma.dietista.update({
    where: { id: dietista.id },
    data: { marcaPdf: cleaned },
  });

  revalidatePath("/ajustes");
}

const MAX_CAMPOS_ANAMNESIS = 20;
const MAX_LABEL_LENGTH = 100;
const MAX_OPCIONES = 20;
const MAX_OPCION_LENGTH = 100;
const TIPOS_VALIDOS: TipoCampoAnamnesis[] = ["texto", "textarea", "selector"];
const SECCIONES_VALIDAS: SeccionAnamnesis[] = [
  "consulta",
  "personalSocial",
  "clinica",
  "alimentaria",
  "personalizado",
];

function sanitizeCamposAnamnesis(
  raw: unknown
): CampoPersonalizadoDefinicion[] {
  if (!Array.isArray(raw)) return [];
  const result: CampoPersonalizadoDefinicion[] = [];

  for (const item of raw.slice(0, MAX_CAMPOS_ANAMNESIS)) {
    if (!item || typeof item !== "object") continue;
    const id = typeof item.id === "string" ? item.id.trim().slice(0, 50) : "";
    const label =
      typeof item.label === "string"
        ? item.label.trim().slice(0, MAX_LABEL_LENGTH)
        : "";
    if (!id || !label) continue;

    const tipo = TIPOS_VALIDOS.includes(item.tipo) ? item.tipo : "texto";
    const seccion = SECCIONES_VALIDAS.includes(item.seccion)
      ? item.seccion
      : "personalizado";

    let opciones: string[] | undefined;
    if (tipo === "selector" && Array.isArray(item.opciones)) {
      const filtered = item.opciones
        .filter((o: unknown) => typeof o === "string" && o.trim())
        .map((o: string) => o.trim().slice(0, MAX_OPCION_LENGTH))
        .slice(0, MAX_OPCIONES);
      if (filtered.length > 0) opciones = filtered;
    }

    result.push({ id, label, tipo, seccion, ...(opciones ? { opciones } : {}) });
  }

  return result;
}

export async function getBrandingDietista(): Promise<{
  nombre: string;
  clinica: string | null;
  temaPdf: string | null;
  colorPrimarioPdf: string | null;
  pdfLogoUrl: string | null;
  marcaPdf: string | null;
} | null> {
  const dietista = await getCurrentDietista();
  if (!dietista) return null;
  const row = await prisma.dietista.findUnique({
    where: { id: dietista.id },
    select: {
      nombre: true,
      apellidos: true,
      clinica: true,
      temaPdf: true,
      colorPrimarioPdf: true,
      pdfLogoUrl: true,
      marcaPdf: true,
    },
  });
  if (!row) return null;
  return {
    nombre: `${row.nombre} ${row.apellidos}`.trim(),
    clinica: row.clinica,
    temaPdf: row.temaPdf,
    colorPrimarioPdf: row.colorPrimarioPdf,
    pdfLogoUrl: row.pdfLogoUrl,
    marcaPdf: row.marcaPdf,
  };
}

export async function getCamposAnamnesis(): Promise<
  CampoPersonalizadoDefinicion[]
> {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];
  const row = await prisma.dietista.findUnique({
    where: { id: dietista.id },
    select: { camposAnamnesis: true },
  });
  return sanitizeCamposAnamnesis(row?.camposAnamnesis);
}

export async function guardarCamposAnamnesis(
  campos: CampoPersonalizadoDefinicion[]
): Promise<{ ok: boolean; error?: string }> {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) return { ok: false, error: t("auth.noAutorizado") };
  if (dietista.isDemo) return { ok: false, error: t("general.noDisponibleDemo") };

  const sanitized = sanitizeCamposAnamnesis(campos);

  await prisma.dietista.update({
    where: { id: dietista.id },
    data: { camposAnamnesis: sanitized as unknown as Parameters<typeof prisma.dietista.update>[0]["data"]["camposAnamnesis"] },
  });

  revalidatePath("/ajustes");
  return { ok: true };
}

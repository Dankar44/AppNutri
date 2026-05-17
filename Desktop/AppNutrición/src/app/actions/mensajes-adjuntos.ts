"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { fileTypeFromBuffer } from "file-type";
import { getCurrentDietista } from "./auth";
import { getCurrentPaciente } from "@/lib/patient-auth";
import { randomUUID } from "crypto";
import { checkRateLimit, LIMITES } from "@/lib/rate-limit";
import { getTranslations } from "next-intl/server";

const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const TIPOS_PERMITIDOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
];

const BUCKET = "mensajes-adjuntos";
const URL_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 días

async function adminClient() {
  const t = await getTranslations("validation");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(t("adjuntos.supabaseNoConfigurado"));
  }
  return createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function getUsuarioId(): Promise<string | null> {
  const dietista = await getCurrentDietista();
  if (dietista) return `d_${dietista.id}`;
  const paciente = await getCurrentPaciente();
  if (paciente) return `p_${paciente.pacienteId}`;
  return null;
}

/**
 * Sube un archivo adjunto al bucket de mensajes. Devuelve URL firmada (14 días).
 * Solo dietista o paciente autenticado pueden subir.
 *
 * Validaciones:
 *   - Tamaño <= 10 MB
 *   - MIME declarado en whitelist
 *   - Magic bytes coinciden con MIME (no se puede renombrar un .exe a .pdf)
 *   - Rate limit 5 archivos/min por usuario
 */
export async function subirAdjuntoMensaje(formData: FormData) {
  const t = await getTranslations("validation");
  // Demo guard: bloquear subida si el dietista es demo
  const dietistaCheck = await getCurrentDietista();
  if (dietistaCheck?.isDemo) throw new Error(t("general.noDisponibleDemo"));

  const usuarioId = await getUsuarioId();
  if (!usuarioId) throw new Error(t("auth.noAutorizado"));

  // Rate limit
  const rl = checkRateLimit({
    key: `adj:${usuarioId}`,
    ...LIMITES.subirAdjunto,
  });
  if (!rl.ok) {
    throw new Error(t("mensajes.demasiadosArchivos", { retryAfter: rl.retryAfter }));
  }

  const archivo = formData.get("archivo") as File | null;
  if (!archivo) throw new Error(t("adjuntos.sinArchivo"));

  if (archivo.size > MAX_SIZE) {
    throw new Error(t("adjuntos.archivoSuperaTamano", { maxMB: Math.round(MAX_SIZE / 1024 / 1024) }));
  }

  if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
    throw new Error(t("adjuntos.tipoNoPermitido"));
  }

  const buffer = Buffer.from(await archivo.arrayBuffer());

  // Validar magic bytes: el contenido real debe coincidir con el MIME declarado
  const detectado = await fileTypeFromBuffer(buffer);
  if (!detectado || !TIPOS_PERMITIDOS.includes(detectado.mime)) {
    throw new Error(t("adjuntos.contenidoNoValido"));
  }
  if (detectado.mime !== archivo.type) {
    throw new Error(t("adjuntos.tipoNoCoincide"));
  }

  const supabase = await adminClient();

  // Asegurar bucket (idempotente)
  await supabase.storage.createBucket(BUCKET, { public: false }).catch(() => {});

  const ext = detectado.ext || archivo.name.split(".").pop() || "bin";
  const nombreArchivo = `${usuarioId}/${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(nombreArchivo, buffer, {
      contentType: detectado.mime,
      upsert: false,
    });

  if (error) {
    console.error("[adjuntos] error upload:", error);
    throw new Error(t("adjuntos.noSePudoSubir"));
  }

  const { data: signedUrl, error: signedErr } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(nombreArchivo, URL_TTL_SECONDS);

  if (signedErr || !signedUrl) {
    console.error("[adjuntos] error signedUrl:", signedErr);
    throw new Error(t("adjuntos.noSePudoGenerarUrl"));
  }

  return {
    url: signedUrl.signedUrl,
    path: nombreArchivo,
    nombre: archivo.name,
    tipo: detectado.mime,
    tamano: archivo.size,
  };
}

/**
 * Renueva una URL firmada cuando esté próxima a caducar.
 * Recibe el path del bucket (no la URL completa) y devuelve nueva URL firmada.
 */
export async function renovarUrlFirmada(path: string): Promise<string | null> {
  const usuarioId = await getUsuarioId();
  if (!usuarioId) return null;

  // Verificar que el path empieza por el prefijo del usuario actual
  if (!path.startsWith(`${usuarioId}/`)) return null;

  const supabase = await adminClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, URL_TTL_SECONDS);

  if (error || !data) return null;
  return data.signedUrl;
}

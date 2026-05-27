"use server";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const STORAGE_BUCKETS = {
  PROFILE_IMAGES: "profile-images",
  PDF_LOGOS: "pdf-logos",
} as const;

async function storageAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Supabase Storage no configurado");
  }
  return createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function getPublicUrl(bucket: string, path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

async function ensureBucket(bucket: string, isPublic: boolean) {
  const supabase = await storageAdminClient();
  await supabase.storage.createBucket(bucket, { public: isPublic }).catch(() => {});
}

async function uploadProfileImage(
  bucket: string,
  path: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  const supabase = await storageAdminClient();
  await ensureBucket(bucket, true);

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, { contentType, upsert: true });

  if (error) {
    console.error("[storage] upload error:", error);
    throw new Error("No se pudo subir la imagen");
  }

  return getPublicUrl(bucket, path);
}

export async function deleteStorageImage(bucket: string, path: string) {
  const supabase = await storageAdminClient();
  await supabase.storage.from(bucket).remove([path]);
}

// --- Path builders ---

export function dietistaPhotoPath(dietistaId: string): string {
  return `dietistas/${dietistaId}.webp`;
}

export function pacientePhotoPath(pacienteId: string): string {
  return `pacientes/${pacienteId}.webp`;
}

export function pdfLogoPath(dietistaId: string): string {
  return `${dietistaId}.webp`;
}

// --- High-level upload/delete ---

export async function uploadDietistaPhoto(dietistaId: string, buffer: Buffer): Promise<string> {
  return uploadProfileImage(
    STORAGE_BUCKETS.PROFILE_IMAGES,
    dietistaPhotoPath(dietistaId),
    buffer,
    "image/webp",
  );
}

export async function uploadPacientePhoto(pacienteId: string, buffer: Buffer): Promise<string> {
  return uploadProfileImage(
    STORAGE_BUCKETS.PROFILE_IMAGES,
    pacientePhotoPath(pacienteId),
    buffer,
    "image/webp",
  );
}

export async function uploadPdfLogo(dietistaId: string, buffer: Buffer): Promise<string> {
  return uploadProfileImage(
    STORAGE_BUCKETS.PDF_LOGOS,
    pdfLogoPath(dietistaId),
    buffer,
    "image/webp",
  );
}

export async function deletePdfLogo(dietistaId: string) {
  await deleteStorageImage(STORAGE_BUCKETS.PDF_LOGOS, pdfLogoPath(dietistaId));
}

export async function deleteDietistaPhoto(dietistaId: string) {
  await deleteStorageImage(STORAGE_BUCKETS.PROFILE_IMAGES, dietistaPhotoPath(dietistaId));
}

export async function deletePacientePhoto(pacienteId: string) {
  await deleteStorageImage(STORAGE_BUCKETS.PROFILE_IMAGES, pacientePhotoPath(pacienteId));
}

// --- URL helpers ---

const DATA_URL_PREFIX = "data:image/";

export function isBase64DataUrl(value: string | null | undefined): boolean {
  return typeof value === "string" && value.startsWith(DATA_URL_PREFIX);
}

export function isStorageUrl(value: string | null | undefined): boolean {
  if (typeof value !== "string") return false;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return value.startsWith("https://") && !!supabaseUrl && value.includes(supabaseUrl.replace("https://", ""));
}

export function resolveImageUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  if (value.startsWith("https://")) return value;
  if (value.startsWith(DATA_URL_PREFIX)) return value;
  return null;
}

// --- Base64 conversion (for migration script) ---

export function base64ToBuffer(dataUrl: string): { buffer: Buffer; mimeType: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid data URL");
  return { buffer: Buffer.from(match[2], "base64"), mimeType: match[1] };
}

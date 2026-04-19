"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

/**
 * Cliente Supabase para uso en el navegador (Realtime).
 * Singleton: una sola conexión WebSocket por sesión, reutilizada entre componentes.
 *
 * Solo se usa para suscripciones Realtime (broadcast). NO se usa para BD,
 * que sigue gestionándose desde server actions con Prisma.
 */
export function getSupabaseBrowser(): SupabaseClient | null {
  if (cached) return cached;
  if (typeof window === "undefined") return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  cached = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { params: { eventsPerSecond: 10 } },
  });
  return cached;
}

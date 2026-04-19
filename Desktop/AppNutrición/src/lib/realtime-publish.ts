import { createClient, type SupabaseClient, type RealtimeChannel } from "@supabase/supabase-js";

let cachedClient: SupabaseClient | null = null;
const canales = new Map<string, { ch: RealtimeChannel; ready: Promise<boolean> }>();

function getServerClient(): SupabaseClient | null {
  if (cachedClient) return cachedClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  cachedClient = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { params: { eventsPerSecond: 20 } },
  });
  return cachedClient;
}

/**
 * Reutiliza canales abiertos para no pagar el coste de
 * subscribe()/unsubscribe() en cada mensaje.
 */
function getOrCreateChannel(supabase: SupabaseClient, canal: string) {
  const cached = canales.get(canal);
  if (cached) return cached;

  const ch = supabase.channel(canal, {
    config: { broadcast: { self: false, ack: false } },
  });

  const ready = new Promise<boolean>((resolve) => {
    let resolved = false;
    const finish = (ok: boolean) => {
      if (resolved) return;
      resolved = true;
      resolve(ok);
    };
    ch.subscribe((status) => {
      if (status === "SUBSCRIBED") finish(true);
      else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
        canales.delete(canal);
        finish(false);
      }
    });
    setTimeout(() => finish(false), 3000);
  });

  const entry = { ch, ready };
  canales.set(canal, entry);
  return entry;
}

/**
 * Emite un broadcast Realtime al canal indicado.
 * Reutiliza canales abiertos. No bloquea el flujo principal.
 */
export async function publicarBroadcast(
  canal: string,
  evento: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const supabase = getServerClient();
  if (!supabase) return;

  try {
    const entry = getOrCreateChannel(supabase, canal);
    const ok = await entry.ready;
    if (!ok) return;
    await entry.ch.send({ type: "broadcast", event: evento, payload });
  } catch {
    // best-effort
  }
}

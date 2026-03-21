import OpenAI from "openai";

// Groq usa la misma API que OpenAI, solo cambia la baseURL
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const GROQ_MODEL = "llama-3.3-70b-versatile"; // bueno siguiendo instrucciones estructuradas

function getApiKeys(): string[] {
  const keys: string[] = [];
  if (process.env.GROQ_API_KEY_1) keys.push(process.env.GROQ_API_KEY_1);
  if (process.env.GROQ_API_KEY_2) keys.push(process.env.GROQ_API_KEY_2);
  // Fallback a OPENAI_API_KEY si existe (compatibilidad)
  if (keys.length === 0 && process.env.OPENAI_API_KEY) {
    keys.push(process.env.OPENAI_API_KEY);
  }
  return keys;
}

let currentKeyIndex = 0;

export function isAIConfigured(): boolean {
  return getApiKeys().length > 0;
}

export function getGroqModel(): string {
  return GROQ_MODEL;
}

export function getNextClient(): OpenAI {
  const keys = getApiKeys();
  if (keys.length === 0) {
    throw new Error("No hay API keys de Groq configuradas");
  }

  // Rotación round-robin
  const key = keys[currentKeyIndex % keys.length];
  currentKeyIndex++;

  return new OpenAI({
    apiKey: key,
    baseURL: GROQ_BASE_URL,
  });
}

// Ejecuta una llamada rotando keys con circuit breaker.
// Máximo 10 reintentos y 2 minutos totales.
const MAX_RETRIES = 10;
const MAX_TOTAL_MS = 120_000;

export async function callWithRetry<T>(
  fn: (client: OpenAI) => Promise<T>,
): Promise<T> {
  const keys = getApiKeys();
  if (keys.length === 0) throw new Error("No hay API keys de Groq configuradas");

  let consecutiveRateLimits = 0;
  const startTime = Date.now();

  while (consecutiveRateLimits < MAX_RETRIES) {
    if (Date.now() - startTime > MAX_TOTAL_MS) {
      throw new Error("Tiempo máximo de espera agotado. Inténtalo de nuevo más tarde.");
    }

    const client = getNextClient();
    try {
      const result = await fn(client);
      return result;
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      const msg = err.message.toLowerCase();

      const isRateLimit =
        msg.includes("rate_limit") ||
        msg.includes("429") ||
        msg.includes("rate limit") ||
        msg.includes("too many requests");

      if (!isRateLimit) {
        throw err;
      }

      consecutiveRateLimits++;

      const ciclosCompletos = Math.floor(consecutiveRateLimits / keys.length);
      const waitMs = Math.min(3000 + ciclosCompletos * 5000, 30000);

      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }

  throw new Error("Demasiados reintentos por rate limit. Inténtalo de nuevo más tarde.");
}

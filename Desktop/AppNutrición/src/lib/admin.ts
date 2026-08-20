import { cookies, headers } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
/**
 * Compara dos contraseñas en tiempo constante.
 *
 * Con `===` la comparación termina en el primer carácter distinto, así que el tiempo de
 * respuesta filtra cuántos caracteres se han acertado. Aquí se recorren siempre todos los
 * caracteres y se acumulan las diferencias con OR, de modo que el tiempo no depende de en qué
 * posición falla.
 *
 * NO se usa `crypto` de Node (createHash/timingSafeEqual) a propósito: este fichero lo importa
 * también `src/middleware.ts`, que corre en Edge Runtime, donde los módulos de Node no existen.
 * Importarlo llenaba el arranque de avisos y, si el empaquetador dejara de eliminar el import,
 * rompería el middleware — que es justo lo que protege /admin.
 */
function contrasenasIguales(recibida: string, esperada: string): boolean {
  const largo = Math.max(recibida.length, esperada.length);
  let diferencia = recibida.length ^ esperada.length;
  for (let i = 0; i < largo; i++) {
    diferencia |= (recibida.charCodeAt(i) || 0) ^ (esperada.charCodeAt(i) || 0);
  }
  return diferencia === 0;
}

export type AdminRole = "admin" | "creator";

export const ADMIN_COOKIE = "annonia-admin-session";
const ADMIN_SESSION_DAYS = 7;

function cleanEnv(val: string | undefined): string {
  return (val || "").replace(/\\n/g, "").replace(/\n/g, "").replace(/\r/g, "").trim();
}

function parseEmails(val: string | undefined): string[] {
  return cleanEnv(val).split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}

function getAdminEmails(): string[] {
  return [...parseEmails(process.env.ADMIN_EMAILS), ...parseEmails(process.env.ADMIN_EMAILS_2)];
}

function getCreatorEmails(): string[] {
  return parseEmails(process.env.ADMIN_CREATOR_EMAILS);
}

function getSecret() {
  // Sin valor por defecto en producción: la cadena estaría publicada en el repositorio y
  // cualquiera podría firmarse una sesión de administrador válida. Antes se prefiere que la
  // aplicación no arranque a que arranque abierta.
  const secret = process.env.PATIENT_JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("PATIENT_JWT_SECRET must be set in production");
    }
    return new TextEncoder().encode("admin-dev-only-secret");
  }
  return new TextEncoder().encode(secret);
}

export function isAdminEmail(email: string): boolean {
  return getAdminEmails().includes(email.toLowerCase());
}

export function isCreatorEmail(email: string): boolean {
  return getCreatorEmails().includes(email.toLowerCase());
}

export function isAnyAdminEmail(email: string): boolean {
  return isAdminEmail(email) || isCreatorEmail(email);
}

export function verifyAdminCredentials(email: string, password: string): { valid: true; role: AdminRole } | false {
  const e = email.toLowerCase();

  const pw1 = cleanEnv(process.env.ADMIN_PASSWORD);
  if (pw1 && parseEmails(process.env.ADMIN_EMAILS).includes(e) && contrasenasIguales(password, pw1)) {
    return { valid: true, role: "admin" };
  }

  const pw2 = cleanEnv(process.env.ADMIN_PASSWORD_2);
  if (pw2 && parseEmails(process.env.ADMIN_EMAILS_2).includes(e) && contrasenasIguales(password, pw2)) {
    return { valid: true, role: "admin" };
  }

  const creatorPassword = cleanEnv(process.env.ADMIN_CREATOR_PASSWORD);
  if (creatorPassword && isCreatorEmail(e) && contrasenasIguales(password, creatorPassword)) {
    return { valid: true, role: "creator" };
  }

  return false;
}

export async function createAdminSession(email: string, role: AdminRole) {
  const token = await new SignJWT({ email, role })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${ADMIN_SESSION_DAYS}d`)
    .sign(getSecret());

  const cookieStore = await cookies();
  const hdrs = await headers();
  const proto = hdrs.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");
  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: proto === "https",
    sameSite: "lax",
    maxAge: ADMIN_SESSION_DAYS * 24 * 60 * 60,
    path: "/",
  });
}

export async function getAdminSession(): Promise<{ email: string; role: AdminRole } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  return verifyAdminToken(token);
}

export async function verifyAdminToken(token: string): Promise<{ email: string; role: AdminRole } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const email = payload.email as string;
    const role = payload.role as string;
    if (!email || !isAnyAdminEmail(email)) return null;
    if (role !== "admin" && role !== "creator") return null;
    return { email, role };
  } catch {
    return null;
  }
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}

export async function requireAdmin(): Promise<{ email: string; role: AdminRole } | null> {
  const session = await getAdminSession();
  if (!session) return null;
  return session;
}

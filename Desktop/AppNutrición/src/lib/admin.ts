import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const ADMIN_COOKIE = "appnutri-admin-session";
const ADMIN_SESSION_DAYS = 7;

function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS || "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function getSecret() {
  const secret = process.env.PATIENT_JWT_SECRET || "admin-fallback-secret";
  return new TextEncoder().encode(secret);
}

export function isAdminEmail(email: string): boolean {
  return getAdminEmails().includes(email.toLowerCase());
}

export function verifyAdminCredentials(email: string, password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD?.trim();
  if (!adminPassword) return false;
  return isAdminEmail(email) && password === adminPassword;
}

export async function createAdminSession(email: string) {
  const token = await new SignJWT({ email, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${ADMIN_SESSION_DAYS}d`)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ADMIN_SESSION_DAYS * 24 * 60 * 60,
    path: "/",
  });
}

export async function getAdminSession(): Promise<{ email: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    const email = payload.email as string;
    if (!email || !isAdminEmail(email)) return null;
    return { email };
  } catch {
    return null;
  }
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}

export async function requireAdmin() {
  const session = await getAdminSession();
  if (!session) return null;
  return session;
}

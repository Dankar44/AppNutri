import { cookies, headers } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const ADMIN_COOKIE = "appnutri-admin-session";
const ADMIN_SESSION_DAYS = 7;

function cleanEnv(val: string | undefined): string {
  return (val || "").replace(/\\n/g, "").replace(/\n/g, "").replace(/\r/g, "").trim();
}

function getAdminEmails(): string[] {
  return cleanEnv(process.env.ADMIN_EMAILS)
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
  const adminPassword = cleanEnv(process.env.ADMIN_PASSWORD);
  const adminEmails = getAdminEmails();
  const emailMatch = isAdminEmail(email);
  const passMatch = password === adminPassword;

  console.log("[ADMIN-LOGIN-DEBUG]", {
    inputEmail: email,
    configuredEmails: adminEmails,
    emailMatch,
    passMatch,
    inputPassLen: password.length,
    storedPassLen: adminPassword.length,
    rawEnvPass: JSON.stringify(process.env.ADMIN_PASSWORD),
    rawEnvEmails: JSON.stringify(process.env.ADMIN_EMAILS),
  });

  if (!adminPassword) return false;
  return emailMatch && passMatch;
}

export async function createAdminSession(email: string) {
  const token = await new SignJWT({ email, role: "admin" })
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

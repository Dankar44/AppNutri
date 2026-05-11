import { cookies, headers } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.PATIENT_JWT_SECRET || "annonia-demo-secret-dev-only"
);

const DEMO_COOKIE = "annonia-demo-session";

export function getDemoDietistaId(): string | undefined {
  return process.env.DEMO_DIETISTA_ID;
}

export function isDemoEnabled(): boolean {
  return !!process.env.DEMO_DIETISTA_ID;
}

export async function createDemoSession(): Promise<void> {
  const dietistaId = getDemoDietistaId();
  if (!dietistaId) return;

  const token = await new SignJWT({ dietistaId, demo: true })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .sign(SECRET);

  const cookieStore = await cookies();
  const hdrs = await headers();
  const proto =
    hdrs.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "production" ? "https" : "http");

  cookieStore.set(DEMO_COOKIE, token, {
    httpOnly: true,
    secure: proto === "https",
    sameSite: "lax",
    maxAge: 24 * 60 * 60,
    path: "/",
  });
}

export async function getDemoSession(): Promise<{
  dietistaId: string;
} | null> {
  const dietistaId = getDemoDietistaId();
  if (!dietistaId) return null;

  const cookieStore = await cookies();
  const token = cookieStore.get(DEMO_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (payload.dietistaId !== dietistaId || payload.demo !== true) return null;
    return { dietistaId: payload.dietistaId as string };
  } catch {
    return null;
  }
}

export async function clearDemoSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(DEMO_COOKIE);
}

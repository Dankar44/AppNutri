import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.PATIENT_JWT_SECRET || "nutriapp-patient-secret-dev"
);

export async function createPatientSession(
  pacienteId: string,
  email: string
): Promise<void> {
  const token = await new SignJWT({ pacienteId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("30d")
    .sign(SECRET);

  const cookieStore = await cookies();
  cookieStore.set("appnutri-paciente-session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });
}

export async function getCurrentPaciente(): Promise<{
  pacienteId: string;
  email: string;
} | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("appnutri-paciente-session")?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, SECRET);
    return {
      pacienteId: payload.pacienteId as string,
      email: payload.email as string,
    };
  } catch {
    return null;
  }
}

export async function clearPatientSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("appnutri-paciente-session");
}

export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + "nutriapp-salt");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  const pinHash = await hashPin(pin);
  return pinHash === hash;
}

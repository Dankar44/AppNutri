import { cookies, headers } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

// Fallar ruidosamente en producción si no hay secreto configurado
if (!process.env.PATIENT_JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("PATIENT_JWT_SECRET must be set in production");
}

const SECRET = new TextEncoder().encode(
  process.env.PATIENT_JWT_SECRET || "annonia-patient-secret-dev-only"
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
  const hdrs = await headers();
  const proto = hdrs.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");
  cookieStore.set("annonia-paciente-session", token, {
    httpOnly: true,
    secure: proto === "https",
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
  const token = cookieStore.get("annonia-paciente-session")?.value;
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
  cookieStore.delete("annonia-paciente-session");
}

// Hashing con PBKDF2 (mucho más seguro que SHA-256 simple)
// Usa sal única por usuario derivada del pin + salt aleatorio
export async function hashPin(pin: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  const hashArray = Array.from(new Uint8Array(derivedBits));
  const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join("");
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${saltHex}:${hashHex}`;
}

export async function verifyPin(pin: string, storedHash: string): Promise<boolean> {
  // Compatibilidad con hashes antiguos (SHA-256 sin sal)
  if (!storedHash.includes(":")) {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin + "nutriapp-salt");
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const oldHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return oldHash === storedHash;
  }

  // PBKDF2 verification
  const [saltHex, expectedHash] = storedHash.split(":");
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map((byte) => parseInt(byte, 16)));
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(pin),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  const hashArray = Array.from(new Uint8Array(derivedBits));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return hashHex === expectedHash;
}

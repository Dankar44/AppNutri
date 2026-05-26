import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { cookies, headers } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.PATIENT_JWT_SECRET || "annonia-demo-secret-dev-only"
);
const DEMO_COOKIE = "annonia-demo-session";

export async function GET() {
  const dietistaId = process.env.DEMO_DIETISTA_ID;

  const hdrs = await headers();
  const proto =
    hdrs.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "production" ? "https" : "http");
  const host = hdrs.get("host") ?? "localhost:3000";
  const origin = `${proto}://${host}`;

  if (!dietistaId) {
    return NextResponse.redirect(new URL("/landing", origin));
  }

  const token = await new SignJWT({ dietistaId, demo: true })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .sign(SECRET);

  const response = NextResponse.redirect(new URL("/dashboard", origin));

  (await cookies()).set(DEMO_COOKIE, token, {
    httpOnly: true,
    secure: proto === "https",
    sameSite: "lax",
    maxAge: 24 * 60 * 60,
    path: "/",
  });

  return response;
}

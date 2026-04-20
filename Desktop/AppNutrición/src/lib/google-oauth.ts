import { OAuth2Client } from "google-auth-library";

export const GOOGLE_SCOPES_CALENDAR = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

export type GoogleAudience = "nutri" | "paciente";

function getRedirectUri(audience: GoogleAudience): string {
  if (audience === "nutri") {
    return process.env.GOOGLE_REDIRECT_URI_NUTRI || "http://localhost:3000/api/google/callback-nutri";
  }
  return process.env.GOOGLE_REDIRECT_URI_PACIENTE || "http://localhost:3000/api/google/callback-paciente";
}

export function isGoogleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function getOAuthClient(audience: GoogleAudience): OAuth2Client {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("Faltan GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET en el entorno");
  }
  return new OAuth2Client({
    clientId,
    clientSecret,
    redirectUri: getRedirectUri(audience),
  });
}

export function buildAuthUrl(audience: GoogleAudience, state: string): string {
  const client = getOAuthClient(audience);
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GOOGLE_SCOPES_CALENDAR,
    state,
  });
}

export async function exchangeCodeForTokens(audience: GoogleAudience, code: string) {
  const client = getOAuthClient(audience);
  const { tokens } = await client.getToken(code);
  return tokens;
}

export async function getUserEmail(accessToken: string): Promise<string | null> {
  try {
    const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { email?: string };
    return data.email ?? null;
  } catch {
    return null;
  }
}

export async function refreshAccessToken(refreshToken: string, audience: GoogleAudience) {
  const client = getOAuthClient(audience);
  client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await client.refreshAccessToken();
  return credentials;
}

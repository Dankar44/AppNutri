// Migración: cifrar tokens de Google Calendar existentes con AES-256-GCM.
// Idempotente: detecta tokens ya cifrados y los salta.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { createCipheriv, randomBytes } from "crypto";
import pg from "pg";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getKey(): Buffer | null {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex) return null;
  return Buffer.from(hex, "hex");
}

function isEncrypted(value: string): boolean {
  const parts = value.split(":");
  if (parts.length !== 3) return false;
  const [iv, tag, ct] = parts;
  return (
    iv.length === IV_LENGTH * 2 &&
    tag.length === 32 &&
    ct.length > 0 &&
    /^[0-9a-f]+$/.test(iv) &&
    /^[0-9a-f]+$/.test(tag) &&
    /^[0-9a-f]+$/.test(ct)
  );
}

function encrypt(plaintext: string, key: Buffer): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

async function main() {
  const key = getKey();
  if (!key) {
    console.error("ENCRYPTION_KEY no configurada. Abortando.");
    process.exit(1);
  }

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL!,
    ssl: { rejectUnauthorized: false },
  });

  let migrated = 0;
  let skipped = 0;

  // --- google_integraciones (nutri) ---
  const nutri = await pool.query<{
    id: string;
    "accessToken": string;
    "refreshToken": string;
  }>('SELECT id, "accessToken", "refreshToken" FROM google_integraciones');

  for (const row of nutri.rows) {
    const needsAccess = !isEncrypted(row.accessToken);
    const needsRefresh = !isEncrypted(row.refreshToken);
    if (!needsAccess && !needsRefresh) {
      skipped++;
      continue;
    }
    const encAccess = needsAccess ? encrypt(row.accessToken, key) : row.accessToken;
    const encRefresh = needsRefresh ? encrypt(row.refreshToken, key) : row.refreshToken;
    await pool.query(
      'UPDATE google_integraciones SET "accessToken" = $1, "refreshToken" = $2 WHERE id = $3',
      [encAccess, encRefresh, row.id],
    );
    migrated++;
  }

  // --- google_integraciones_paciente ---
  const paciente = await pool.query<{
    id: string;
    "accessToken": string;
    "refreshToken": string;
  }>('SELECT id, "accessToken", "refreshToken" FROM google_integraciones_paciente');

  for (const row of paciente.rows) {
    const needsAccess = !isEncrypted(row.accessToken);
    const needsRefresh = !isEncrypted(row.refreshToken);
    if (!needsAccess && !needsRefresh) {
      skipped++;
      continue;
    }
    const encAccess = needsAccess ? encrypt(row.accessToken, key) : row.accessToken;
    const encRefresh = needsRefresh ? encrypt(row.refreshToken, key) : row.refreshToken;
    await pool.query(
      'UPDATE google_integraciones_paciente SET "accessToken" = $1, "refreshToken" = $2 WHERE id = $3',
      [encAccess, encRefresh, row.id],
    );
    migrated++;
  }

  console.log(`Migración completada: ${migrated} registros cifrados, ${skipped} ya estaban cifrados.`);
  await pool.end();
}

main().catch((e) => {
  console.error("Error en migración:", e);
  process.exit(1);
});

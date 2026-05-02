import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getKey(): Buffer | null {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex) return null;
  return Buffer.from(hex, "hex");
}

function isEncrypted(value: string): boolean {
  const parts = value.split(":");
  if (parts.length !== 3) return false;
  const [iv, tag, ciphertext] = parts;
  return (
    iv.length === IV_LENGTH * 2 &&
    tag.length === AUTH_TAG_LENGTH * 2 &&
    ciphertext.length > 0 &&
    /^[0-9a-f]+$/.test(iv) &&
    /^[0-9a-f]+$/.test(tag) &&
    /^[0-9a-f]+$/.test(ciphertext)
  );
}

export function encryptToken(plaintext: string): string {
  const key = getKey();
  if (!key) return plaintext;

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptToken(maybeEncrypted: string): string {
  if (!isEncrypted(maybeEncrypted)) return maybeEncrypted;

  const key = getKey();
  if (!key) return maybeEncrypted;

  const [ivHex, tagHex, ciphertextHex] = maybeEncrypted.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(tagHex, "hex");
  const ciphertext = Buffer.from(ciphertextHex, "hex");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

  return decrypted.toString("utf8");
}

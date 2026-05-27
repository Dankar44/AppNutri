import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";

const DRY_RUN = process.argv.includes("--dry-run");

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  { auth: { persistSession: false, autoRefreshToken: false } },
);

function base64ToBuffer(dataUrl: string): { buffer: Buffer; mime: string } {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error("Invalid data URL");
  return { buffer: Buffer.from(match[2], "base64"), mime: match[1] };
}

function getPublicUrl(bucket: string, path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

async function ensureBuckets() {
  await supabase.storage.createBucket("profile-images", { public: true }).catch(() => {});
  await supabase.storage.createBucket("pdf-logos", { public: true }).catch(() => {});
  console.log("Buckets verificados\n");
}

interface MigrateStats {
  total: number;
  migrated: number;
  skipped: number;
  failed: number;
}

async function migrateField(
  table: string,
  field: string,
  bucket: string,
  pathBuilder: (id: string) => string,
): Promise<MigrateStats> {
  const client = await pool.connect();
  const stats: MigrateStats = { total: 0, migrated: 0, skipped: 0, failed: 0 };

  try {
    const { rows } = await client.query<{ id: string; val: string }>(
      `SELECT id, "${field}" as val FROM ${table} WHERE "${field}" IS NOT NULL`,
    );
    stats.total = rows.length;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const prefix = `[${i + 1}/${rows.length}] ${table}.${field} id=${row.id.slice(0, 8)}...`;

      if (!row.val.startsWith("data:")) {
        console.log(`${prefix} SKIP (ya migrado)`);
        stats.skipped++;
        continue;
      }

      if (DRY_RUN) {
        const sizeKB = Math.round(row.val.length * 0.75 / 1024);
        console.log(`${prefix} DRY-RUN (~${sizeKB}KB)`);
        stats.migrated++;
        continue;
      }

      try {
        const { buffer, mime } = base64ToBuffer(row.val);
        const path = pathBuilder(row.id);

        const { error } = await supabase.storage
          .from(bucket)
          .upload(path, buffer, { contentType: mime, upsert: true });

        if (error) throw error;

        const publicUrl = getPublicUrl(bucket, path);
        await client.query(
          `UPDATE ${table} SET "${field}" = $1 WHERE id = $2`,
          [publicUrl, row.id],
        );

        console.log(`${prefix} OK -> ${path}`);
        stats.migrated++;

        await new Promise((r) => setTimeout(r, 200));
      } catch (err) {
        console.error(`${prefix} ERROR:`, err instanceof Error ? err.message : err);
        stats.failed++;
      }
    }
  } finally {
    client.release();
  }

  return stats;
}

async function main() {
  if (DRY_RUN) console.log("=== MODO DRY-RUN (no se sube ni modifica nada) ===\n");

  await ensureBuckets();

  console.log("=== Migrando fotos de dietistas ===");
  const s1 = await migrateField("dietistas", "logoUrl", "profile-images", (id) => `dietistas/${id}.webp`);

  console.log("\n=== Migrando logos PDF ===");
  const s2 = await migrateField("dietistas", "pdfLogoUrl", "pdf-logos", (id) => `${id}.webp`);

  console.log("\n=== Migrando fotos de pacientes ===");
  const s3 = await migrateField("pacientes", "fotoUrl", "profile-images", (id) => `pacientes/${id}.webp`);

  console.log("\n=== RESUMEN ===");
  for (const [name, s] of [["Fotos dietistas", s1], ["Logos PDF", s2], ["Fotos pacientes", s3]] as const) {
    console.log(`${name}: ${s.total} total, ${s.migrated} migrados, ${s.skipped} omitidos, ${s.failed} errores`);
  }

  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

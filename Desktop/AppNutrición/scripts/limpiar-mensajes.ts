/**
 * Limpieza periódica de mensajes y adjuntos antiguos.
 *
 * Política:
 *   - Adjuntos (Storage): se borran a los 30 días
 *   - Mensajes (BD, texto): se borran a los 60 días
 *   - Conversaciones: se mantienen (no consumen casi espacio)
 *
 * Uso:
 *   npx tsx scripts/limpiar-mensajes.ts            # ejecuta el borrado
 *   npx tsx scripts/limpiar-mensajes.ts --dry-run  # muestra qué borraría sin borrar nada
 *
 * Cron sugerido (Oracle Linux):
 *   0 3 * * * cd /ruta/al/proyecto && /usr/bin/npx tsx scripts/limpiar-mensajes.ts >> /var/log/annonia-cron.log 2>&1
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import pg from "pg";
import { createClient } from "@supabase/supabase-js";

const DRY_RUN = process.argv.includes("--dry-run");
const DIAS_ADJUNTOS = 30;
const DIAS_MENSAJES = 60;
const BUCKET = "mensajes-adjuntos";
const BATCH_SIZE = 100;

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

interface AdjuntoARemover {
  mensajeId: string;
  adjuntoUrl: string;
}

/**
 * Extrae el path interno del bucket desde la URL firmada de Supabase.
 * Formato URL: https://xxx.supabase.co/storage/v1/object/sign/<bucket>/<path>?token=...
 */
function pathFromSignedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const marker = `/storage/v1/object/sign/${BUCKET}/`;
    const idx = u.pathname.indexOf(marker);
    if (idx === -1) return null;
    return decodeURIComponent(u.pathname.slice(idx + marker.length));
  } catch {
    return null;
  }
}

async function limpiarAdjuntos() {
  console.log(
    `\n[adjuntos] Buscando adjuntos > ${DIAS_ADJUNTOS} días${DRY_RUN ? " (DRY RUN)" : ""}...`,
  );
  const client = await pool.connect();
  try {
    const { rows } = await client.query<AdjuntoARemover>(
      `SELECT id AS "mensajeId", "adjuntoUrl"
       FROM mensajes
       WHERE "adjuntoUrl" IS NOT NULL
         AND "createdAt" < NOW() - ($1 || ' days')::interval`,
      [DIAS_ADJUNTOS],
    );

    if (rows.length === 0) {
      console.log("[adjuntos] Nada que borrar");
      return;
    }

    console.log(`[adjuntos] ${rows.length} adjunto(s) candidatos`);

    let borradosStorage = 0;
    let borradosBD = 0;
    let errores = 0;

    // Procesar en lotes
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const lote = rows.slice(i, i + BATCH_SIZE);
      const paths = lote
        .map((r) => pathFromSignedUrl(r.adjuntoUrl))
        .filter((p): p is string => p !== null);

      if (DRY_RUN) {
        console.log(
          `  [dry] Borraría ${paths.length} archivos del bucket (lote ${i / BATCH_SIZE + 1})`,
        );
        if (paths.length > 0 && i === 0) {
          console.log(`  [dry] Ejemplo: ${paths[0]}`);
        }
      } else if (paths.length > 0) {
        const { error: errStorage, data } = await supabase.storage
          .from(BUCKET)
          .remove(paths);
        if (errStorage) {
          console.error(`  [storage] error: ${errStorage.message}`);
          errores++;
        } else {
          borradosStorage += data?.length ?? 0;
        }
      }

      // Limpiar columnas adjunto en BD (idempotente)
      const ids = lote.map((r) => r.mensajeId);
      if (DRY_RUN) {
        console.log(`  [dry] Limpiaría columnas adjunto en ${ids.length} filas`);
      } else {
        const res = await client.query(
          `UPDATE mensajes
           SET "adjuntoUrl" = NULL,
               "adjuntoNombre" = NULL,
               "adjuntoTipo" = NULL
           WHERE id = ANY($1::text[])`,
          [ids],
        );
        borradosBD += res.rowCount ?? 0;
      }
    }

    console.log(
      `[adjuntos] OK — Storage: ${borradosStorage} | BD limpios: ${borradosBD} | errores: ${errores}`,
    );
  } finally {
    client.release();
  }
}

async function limpiarMensajesAntiguos() {
  console.log(
    `\n[mensajes] Buscando mensajes > ${DIAS_MENSAJES} días${DRY_RUN ? " (DRY RUN)" : ""}...`,
  );
  const client = await pool.connect();
  try {
    const { rows: cuenta } = await client.query<{ count: string }>(
      `SELECT COUNT(*) as count
       FROM mensajes
       WHERE "createdAt" < NOW() - ($1 || ' days')::interval`,
      [DIAS_MENSAJES],
    );
    const total = Number(cuenta[0]?.count ?? 0);

    if (total === 0) {
      console.log("[mensajes] Nada que borrar");
      return;
    }

    console.log(`[mensajes] ${total} mensaje(s) candidatos`);

    if (DRY_RUN) {
      console.log(`  [dry] DELETE saltado`);
    } else {
      const res = await client.query(
        `DELETE FROM mensajes
         WHERE "createdAt" < NOW() - ($1 || ' days')::interval`,
        [DIAS_MENSAJES],
      );
      console.log(`[mensajes] OK — borrados: ${res.rowCount}`);
    }
  } finally {
    client.release();
  }
}

async function main() {
  const t0 = Date.now();
  console.log(
    `=== Limpieza ${new Date().toISOString()} ${DRY_RUN ? "[DRY RUN]" : ""} ===`,
  );

  try {
    await limpiarAdjuntos();
    await limpiarMensajesAntiguos();
  } catch (e) {
    console.error("Error en limpieza:", e);
    process.exit(1);
  } finally {
    await pool.end();
  }

  const ms = Date.now() - t0;
  console.log(`\nFinalizado en ${ms}ms\n`);
}

main();

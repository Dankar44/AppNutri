#!/usr/bin/env node
/**
 * Limpieza periódica de mensajes y adjuntos antiguos.
 * Versión JavaScript puro para ejecutar directamente con node (sin tsx).
 *
 * Política:
 *   - Adjuntos (Storage): se borran a los 30 días
 *   - Mensajes (BD, texto): se borran a los 60 días
 *
 * Uso:
 *   node scripts/limpiar-mensajes.mjs            # ejecuta el borrado
 *   node scripts/limpiar-mensajes.mjs --dry-run  # muestra qué borraría sin borrar
 */

import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import pg from "pg";
import { createClient } from "@supabase/supabase-js";

const DRY_RUN = process.argv.includes("--dry-run");

// ── Salvaguarda ───────────────────────────────────────────────────────────────
// Este script lo ejecuta el cron del servidor cada noche (por eso es .mjs y no .ts:
// en producción no está instalado tsx). Carga .env.local, que en el servidor Y en la
// máquina del mantenedor es PRODUCCIÓN, así que siempre dice a dónde va.
//
// La confirmación solo se exige cuando lo lanza una persona desde una terminal
// (process.stdout.isTTY). El cron no tiene terminal, así que sigue funcionando solo.
const REF_PRODUCCION = "kzbrugggurcjwxsmutic";
const refDestino = (process.env.DATABASE_URL ?? "").match(/postgres\.([a-z0-9]+):/)?.[1] ?? "desconocida";
const esProduccion = refDestino === REF_PRODUCCION;

if (refDestino === "desconocida") {
  console.error("\n✗ ABORTADO: no encuentro DATABASE_URL. Revisa que exista .env.local junto al proyecto.\n");
  process.exit(1);
}
console.log(
  esProduccion
    ? `[limpieza] ⚠️  BASE DE DATOS DESTINO: PRODUCCIÓN (${refDestino})${DRY_RUN ? " — modo prueba, no borra nada" : ""}`
    : `[limpieza] base de datos destino: ${refDestino}${DRY_RUN ? " (modo prueba)" : ""}`,
);

if (!DRY_RUN && esProduccion && process.stdout.isTTY && process.env.CONFIRMO !== "BORRAR-EN-PRODUCCION") {
  console.error(
    "\n✗ ABORTADO: esto borra mensajes y adjuntos de PRODUCCIÓN de forma irreversible.\n" +
    "  Para ver qué borraría sin borrar:  node scripts/limpiar-mensajes.mjs --dry-run\n" +
    "  Para borrar de verdad:             CONFIRMO=BORRAR-EN-PRODUCCION node scripts/limpiar-mensajes.mjs\n" +
    "  (el cron no pasa por aquí: se ejecuta sin terminal)\n",
  );
  process.exit(1);
}
// ──────────────────────────────────────────────────────────────────────────────
const DIAS_ADJUNTOS = 30;
const DIAS_MENSAJES = 60;
const BUCKET = "mensajes-adjuntos";
const BATCH_SIZE = 100;

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Faltan variables de Supabase (NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SECRET_KEY)");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function pathFromSignedUrl(url) {
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
    const { rows } = await client.query(
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

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const lote = rows.slice(i, i + BATCH_SIZE);
      const paths = lote
        .map((r) => pathFromSignedUrl(r.adjuntoUrl))
        .filter((p) => p !== null);

      if (DRY_RUN) {
        console.log(
          `  [dry] Borraría ${paths.length} archivos (lote ${i / BATCH_SIZE + 1})`,
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

      const ids = lote.map((r) => r.mensajeId);
      if (DRY_RUN) {
        console.log(`  [dry] Limpiaría ${ids.length} filas en BD`);
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
      `[adjuntos] OK — Storage: ${borradosStorage} | BD: ${borradosBD} | errores: ${errores}`,
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
    const { rows: cuenta } = await client.query(
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

  console.log(`\nFinalizado en ${Date.now() - t0}ms\n`);
}

main();

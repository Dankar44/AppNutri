/**
 * #39/#40 — Limpieza de lo que engorda la base por el módulo docente.
 *
 * El problema, con números reales (6 sep 2026): un PDF de entregable pesa ~165 KB. Una facultad de
 * 300 alumnos con 4 casos deja ~1.200 entregas, unos 240 MB solo en PDFs. La base de producción
 * entera ocupa hoy 120 MB. Es decir: **una sola universidad la duplicaría**.
 *
 * Lo que se borra, y solo esto:
 *
 *   1. El **PDF** del entregable, pasados N días desde que se corrigió (por defecto 30). Ya se ha
 *      corregido y visto, y el plan del que salió sigue vivo en la cuenta del alumno.
 *   2. El **PDF y la foto del trabajo** de las entregas de cursos que ya han terminado (la fecha de
 *      fin de la clase pasó) — en la práctica, el 31 de agosto de cada año.
 *   3. Las **invitaciones sin usar** que caducaron hace más de 90 días.
 *
 * Lo que NO se toca nunca: la nota, el comentario, las fechas, el nombre de lo que entregó, las
 * cuentas de los alumnos y sus pacientes de prácticas. El expediente se queda; el peso, no.
 * Cuando el PDF ya no está, la pantalla lo dice en vez de ofrecer una descarga rota.
 *
 * Por defecto SOLO SIMULA: dice qué borraría y cuánto liberaría, sin tocar nada.
 *
 *   DB=dev  npx tsx scripts/limpiar-docencia.ts                 (simula)
 *   DB=dev  npx tsx scripts/limpiar-docencia.ts --ejecutar      (borra de verdad)
 *   DB=prod npx tsx scripts/limpiar-docencia.ts                 (simula en producción, solo lee)
 */
import "./_guard";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } });

const EJECUTAR = process.argv.includes("--ejecutar");
/** Días desde la corrección tras los que el PDF deja de guardarse. */
const DIAS_TRAS_CORREGIR = Number(process.argv.find((a) => a.startsWith("--dias="))?.split("=")[1] ?? 30);
/** Días que se guarda una invitación caducada antes de tirarla. */
const DIAS_INVITACION = 90;

const kb = (bytes: number) => `${(bytes / 1024).toFixed(0)} KB`;
const mb = (bytes: number) => (bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : kb(bytes));

async function main() {
  const client = await pool.connect();
  let liberado = 0;
  try {
    const { rows: existe } = await client.query(
      `SELECT to_regclass('public.entregas_caso') IS NOT NULL AS hay`);
    if (!existe[0].hay) {
      console.log("\nEl módulo docente no está en esta base todavía: no hay nada que limpiar.");
      return;
    }
    const { rows: antes } = await client.query(
      `SELECT pg_size_pretty(pg_database_size(current_database())) AS base,
              pg_size_pretty(pg_total_relation_size('entregas_caso')) AS entregas`);
    console.log(`\nAhora mismo: la base ocupa ${antes[0].base}, y la tabla de entregas ${antes[0].entregas}.`);

    // ── 1. El PDF de lo ya corregido hace tiempo ──
    const { rows: viejos } = await client.query(
      `SELECT COUNT(*)::int AS n, COALESCE(SUM("entregableBytes"), 0)::bigint AS bytes
         FROM entregas_caso
        WHERE "entregablePdf" IS NOT NULL
          AND "corregidaAt" IS NOT NULL
          AND "corregidaAt" < NOW() - ($1 || ' days')::interval`, [DIAS_TRAS_CORREGIR]);
    console.log(`\n1. PDFs corregidos hace más de ${DIAS_TRAS_CORREGIR} días: ${viejos[0].n} (${mb(Number(viejos[0].bytes))})`);
    liberado += Number(viejos[0].bytes);
    if (EJECUTAR && viejos[0].n > 0) {
      await client.query(
        `UPDATE entregas_caso SET "entregablePdf" = NULL, "entregableBytes" = NULL
          WHERE "entregablePdf" IS NOT NULL AND "corregidaAt" IS NOT NULL
            AND "corregidaAt" < NOW() - ($1 || ' days')::interval`, [DIAS_TRAS_CORREGIR]);
      console.log("   → borrados");
    }

    // ── 2. Todo lo pesado de los cursos que ya acabaron ──
    const { rows: cursos } = await client.query(
      `SELECT COUNT(*)::int AS n,
              COALESCE(SUM(COALESCE(e."entregableBytes", 0)), 0)::bigint AS bytes_pdf,
              COALESCE(SUM(pg_column_size(e."entregaSnapshot")), 0)::bigint AS bytes_foto
         FROM entregas_caso e
         JOIN asignaciones_caso a ON a.id = e."asignacionId"
         JOIN clases c ON c.id = a."claseId"
        WHERE (e."entregablePdf" IS NOT NULL OR e."entregaSnapshot" IS NOT NULL)
          AND c."fechaFinCurso" IS NOT NULL
          AND c."fechaFinCurso" < CURRENT_DATE`);
    const pesoCursos = Number(cursos[0].bytes_pdf) + Number(cursos[0].bytes_foto);
    console.log(`2. Entregas de cursos ya terminados: ${cursos[0].n} (${mb(pesoCursos)})`);
    liberado += pesoCursos;
    if (EJECUTAR && cursos[0].n > 0) {
      await client.query(
        `UPDATE entregas_caso e
            SET "entregablePdf" = NULL, "entregableBytes" = NULL, "entregaSnapshot" = NULL
           FROM asignaciones_caso a, clases c
          WHERE a.id = e."asignacionId" AND c.id = a."claseId"
            AND (e."entregablePdf" IS NOT NULL OR e."entregaSnapshot" IS NOT NULL)
            AND c."fechaFinCurso" IS NOT NULL AND c."fechaFinCurso" < CURRENT_DATE`);
      console.log("   → borrados");
    }

    // ── 3. Invitaciones sin usar que caducaron hace tiempo ──
    const { rows: inv } = await client.query(
      `SELECT COUNT(*)::int AS n FROM invitaciones_docentes
        WHERE "aceptadaAt" IS NULL AND "expiraAt" < NOW() - ($1 || ' days')::interval`, [DIAS_INVITACION]);
    console.log(`3. Invitaciones sin usar caducadas hace más de ${DIAS_INVITACION} días: ${inv[0].n}`);
    if (EJECUTAR && inv[0].n > 0) {
      await client.query(
        `DELETE FROM invitaciones_docentes
          WHERE "aceptadaAt" IS NULL AND "expiraAt" < NOW() - ($1 || ' days')::interval`, [DIAS_INVITACION]);
      console.log("   → borradas");
    }

    console.log(`\n${EJECUTAR ? "Liberado" : "Se liberaría"}: ${mb(liberado)}`);
    if (EJECUTAR) {
      // `VACUUM` deja el hueco listo para reutilizar; no se lo devuelve al disco (eso sería
      // `VACUUM FULL`, que bloquea la tabla). Lo que importa: la tabla deja de crecer.
      await client.query(`VACUUM (ANALYZE) entregas_caso`);
      const { rows: despues } = await client.query(
        `SELECT pg_size_pretty(pg_database_size(current_database())) AS base,
                pg_size_pretty(pg_total_relation_size('entregas_caso')) AS entregas`);
      console.log(`La base ocupa ${despues[0].base} y la tabla de entregas ${despues[0].entregas}: el hueco`);
      console.log("queda libre para las entregas que vengan, en vez de seguir engordando.");
    } else {
      console.log("Nada tocado: esto solo era una simulación. Con --ejecutar se borra de verdad.");
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

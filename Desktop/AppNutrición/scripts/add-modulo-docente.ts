import "./_guard";   // obliga a elegir DB=dev|prod antes de tocar nada
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

// #39 (issue #31) — Módulo docente, Fase 1: el rol de profesor y la bolsa de licencias.
//
// Una licencia docente es lo que se le vende a una universidad: "3 profesores y 300 alumnos",
// de septiembre a agosto. Las licencias de alumno son una bolsa COMÚN que se reparten los
// profesores de esa licencia (no hay cupo por profesor), y cada alta de alumno consume una.
//
// Todo es aditivo: los dietistas existentes se quedan con rolDocente NULL y no ven ningún
// cambio. El rol SOLO se concede desde /admin, nunca al registrarse.
//
// El enum se crea ya con los dos valores (PROFESOR y ALUMNO) aunque la Fase 1 solo use
// PROFESOR: añadir un valor a un enum después obliga a un ALTER TYPE en los dos entornos y a
// regenerar el cliente de Prisma, y ese desajuste ya ha roto entornos antes.
async function main() {
  const client = await pool.connect();
  try {
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RolDocente') THEN
          CREATE TYPE "RolDocente" AS ENUM ('PROFESOR', 'ALUMNO');
        END IF;
      END $$;
    `);
    console.log("✓ enum RolDocente listo (PROFESOR, ALUMNO)");

    await client.query(`
      CREATE TABLE IF NOT EXISTS licencias_docentes (
        id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        institucion     TEXT NOT NULL,
        "dominioEmail"  TEXT,
        "maxProfesores" INTEGER NOT NULL DEFAULT 1,
        "maxAlumnos"    INTEGER NOT NULL DEFAULT 0,
        "fechaInicio"   TIMESTAMP(3) NOT NULL DEFAULT NOW(),
        "fechaFin"      TIMESTAMP(3),
        activa          BOOLEAN NOT NULL DEFAULT true,
        notas           TEXT,
        "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT NOW(),
        "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT NOW()
      )
    `);
    // Una tabla creada por Prisma nace SIN RLS y Supabase vuelve a avisar (brecha del 26 ago 2026).
    await client.query(`ALTER TABLE public.licencias_docentes ENABLE ROW LEVEL SECURITY`);
    console.log("✓ tabla licencias_docentes creada, con RLS activado");

    await client.query(`ALTER TABLE dietistas ADD COLUMN IF NOT EXISTS "rolDocente" "RolDocente"`);
    await client.query(`ALTER TABLE dietistas ADD COLUMN IF NOT EXISTS "licenciaDocenteId" TEXT`);
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'dietistas_licenciaDocenteId_fkey'
        ) THEN
          ALTER TABLE dietistas
            ADD CONSTRAINT "dietistas_licenciaDocenteId_fkey"
            FOREIGN KEY ("licenciaDocenteId") REFERENCES licencias_docentes(id) ON DELETE SET NULL;
        END IF;
      END $$;
    `);
    await client.query(
      `CREATE INDEX IF NOT EXISTS "dietistas_licenciaDocenteId_idx" ON dietistas("licenciaDocenteId")`
    );
    console.log("✓ dietistas: columnas rolDocente y licenciaDocenteId añadidas (nullables)");

    const { rows } = await client.query(`
      SELECT
        (SELECT count(*)::int FROM licencias_docentes)                       AS licencias,
        (SELECT count(*)::int FROM dietistas WHERE "rolDocente" IS NOT NULL) AS con_rol,
        (SELECT count(*)::int FROM dietistas)                                AS dietistas,
        (SELECT relrowsecurity FROM pg_class WHERE relname = 'licencias_docentes') AS rls,
        (SELECT count(*)::int FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
          WHERE t.typname = 'RolDocente')                                    AS valores_enum
    `);
    const r = rows[0];
    console.log(`  licencias docentes: ${r.licencias} · dietistas con rol docente: ${r.con_rol} de ${r.dietistas}`);
    console.log(`  RLS en licencias_docentes: ${r.rls ? "ACTIVO" : "✗ DESACTIVADO"} · valores del enum: ${r.valores_enum}`);
    if (!r.rls) throw new Error("licencias_docentes se ha quedado SIN RLS: no dejar así (brecha del 26 ago 2026)");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);

import "./_guard";   // obliga a elegir DB=dev|prod antes de tocar nada
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

// #39 (issue #31) — Módulo docente, fase 2: clases y matrículas.
//
// Una CLASE es el grupo del profesor ("Dietoterapia 3º A", curso 2026/27). Una MATRÍCULA es un
// alumno dentro de una clase, y es lo que se activa y se retira cada curso: al cerrar el curso el
// alumno pierde el acceso pero **su trabajo no se toca**, y al devolvérselo vuelve todo.
//
// Un alumno puede estar en clases de dos profesores distintos y sigue consumiendo UNA licencia:
// por eso la bolsa se cuenta por alumnos distintos de la licencia, no por matrículas.
//
// Todo aditivo. Las dos tablas nacen con RLS: una tabla nueva sin él es la brecha del 26 ago 2026.
async function main() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS clases (
        id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "profesorId"        TEXT NOT NULL REFERENCES dietistas(id) ON DELETE CASCADE,
        "licenciaDocenteId" TEXT REFERENCES licencias_docentes(id) ON DELETE SET NULL,
        nombre              TEXT NOT NULL,
        "fechaInicioCurso"  TIMESTAMP(3),
        -- Enlace de invitación de la clase. Se puede cerrar cuando ya se han apuntado todos.
        "tokenInvitacion"   TEXT UNIQUE,
        "invitacionAbierta" BOOLEAN NOT NULL DEFAULT true,
        -- Fin del curso de ESTA clase: pasada la fecha, sus alumnos pierden el acceso.
        "fechaFinCurso"     TIMESTAMP(3),
        archivada           BOOLEAN NOT NULL DEFAULT false,
        "archivadaAt"       TIMESTAMP(3),
        "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT NOW(),
        "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(`ALTER TABLE public.clases ENABLE ROW LEVEL SECURITY`);
    await client.query(`CREATE INDEX IF NOT EXISTS "clases_profesorId_idx" ON clases("profesorId")`);
    await client.query(`CREATE INDEX IF NOT EXISTS "clases_licenciaDocenteId_idx" ON clases("licenciaDocenteId")`);
    console.log("✓ tabla clases creada, con RLS");

    await client.query(`
      CREATE TABLE IF NOT EXISTS alumnos_clase (
        id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "claseId"   TEXT NOT NULL REFERENCES clases(id) ON DELETE CASCADE,
        "alumnoId"  TEXT NOT NULL REFERENCES dietistas(id) ON DELETE CASCADE,
        -- El acceso se quita en agosto y se devuelve en septiembre; los datos del alumno no se
        -- tocan en ningún caso.
        activa      BOOLEAN NOT NULL DEFAULT true,
        "altaAt"    TIMESTAMP(3) NOT NULL DEFAULT NOW(),
        "bajaAt"    TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
        UNIQUE ("claseId", "alumnoId")
      )
    `);
    await client.query(`ALTER TABLE public.alumnos_clase ENABLE ROW LEVEL SECURITY`);
    await client.query(`CREATE INDEX IF NOT EXISTS "alumnos_clase_alumnoId_idx" ON alumnos_clase("alumnoId")`);
    console.log("✓ tabla alumnos_clase creada, con RLS");

    // Una cuenta que nace de una clase no se convierte en cuenta normal: si no, al quitarle el
    // acceso al acabar el curso bastaría con registrarse otra vez para seguir usando Annonia gratis.
    await client.query(`ALTER TABLE dietistas ADD COLUMN IF NOT EXISTS "cuentaDeClase" BOOLEAN NOT NULL DEFAULT false`);
    console.log("✓ dietistas: columna cuentaDeClase");

    // La invitación ya existía para profesores; ahora también dice a qué clase entra el alumno.
    await client.query(`ALTER TABLE invitaciones_docentes ADD COLUMN IF NOT EXISTS "claseId" TEXT`);
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'invitaciones_docentes_claseId_fkey') THEN
          ALTER TABLE invitaciones_docentes
            ADD CONSTRAINT "invitaciones_docentes_claseId_fkey"
            FOREIGN KEY ("claseId") REFERENCES clases(id) ON DELETE CASCADE;
        END IF;
      END $$;
    `);
    console.log("✓ invitaciones_docentes: columna claseId");

    const { rows } = await client.query(`
      SELECT (SELECT count(*)::int FROM clases) AS clases,
             (SELECT count(*)::int FROM alumnos_clase) AS matriculas,
             (SELECT relrowsecurity FROM pg_class WHERE relname = 'clases') AS rls_clases,
             (SELECT relrowsecurity FROM pg_class WHERE relname = 'alumnos_clase') AS rls_matriculas
    `);
    const r = rows[0];
    console.log(`  clases: ${r.clases} · matrículas: ${r.matriculas}`);
    console.log(`  RLS → clases: ${r.rls_clases ? "ACTIVO" : "✗"} · alumnos_clase: ${r.rls_matriculas ? "ACTIVO" : "✗"}`);
    if (!r.rls_clases || !r.rls_matriculas) throw new Error("alguna tabla se ha quedado sin RLS");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);

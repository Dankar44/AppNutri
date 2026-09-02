import "./_guard";   // obliga a elegir DB=dev|prod antes de tocar nada
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

// #40 (issue #32) — Casos clínicos y entregas, fase 3.
//
// La decisión que lo ordena todo (Guillermo, 2 sep 2026): **un caso ES un paciente**. El profesor
// escribe un paciente ficticio con su historia; al asignarlo a una clase, cada alumno recibe su
// propia copia como paciente de verdad de su cuenta, y lo trabaja con las pantallas de siempre
// (ficha, anamnesis, plan, PDF), que es justo lo que tiene que aprender a usar.
//
//   casos_clinicos    → la plantilla que escribe el profesor
//   asignaciones_caso → ese caso puesto a una clase, con su fecha límite
//   entregas_caso     → lo de cada alumno: su paciente, su estado y su nota
//
// `pacientes.esDeClase` marca al paciente nacido de un caso: sirve para etiquetarlo en su lista y
// para que no cuente como paciente real en ningún sitio.
//
// Todo aditivo. Las tres tablas nacen con RLS: una tabla nueva sin él es la brecha del 26 ago 2026.
async function main() {
  const client = await pool.connect();
  try {
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "EstadoEntrega" AS ENUM ('SIN_EMPEZAR', 'EN_MARCHA', 'ENTREGADA', 'CORREGIDA');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
    `);
    console.log("✓ enum EstadoEntrega");

    await client.query(`
      CREATE TABLE IF NOT EXISTS casos_clinicos (
        id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "profesorId"        TEXT NOT NULL REFERENCES dietistas(id) ON DELETE CASCADE,
        "licenciaDocenteId" TEXT REFERENCES licencias_docentes(id) ON DELETE SET NULL,
        nombre              TEXT NOT NULL,
        consigna            TEXT,
        "pacienteNombre"    TEXT NOT NULL,
        "pacienteApellidos" TEXT NOT NULL DEFAULT '',
        sexo                "Sexo",
        "fechaNacimiento"   TIMESTAMP(3),
        peso                DOUBLE PRECISION,
        altura              DOUBLE PRECISION,
        objetivo            "ObjetivoPaciente" NOT NULL DEFAULT 'MANTENIMIENTO',
        "objetivoDetalle"   TEXT,
        "nivelActividad"    TEXT,
        patologias          TEXT[] NOT NULL DEFAULT '{}',
        alergias            TEXT[] NOT NULL DEFAULT '{}',
        intolerancias       TEXT[] NOT NULL DEFAULT '{}',
        medicamentos        TEXT[] NOT NULL DEFAULT '{}',
        suplementos         TEXT[] NOT NULL DEFAULT '{}',
        preferencias        TEXT[] NOT NULL DEFAULT '{}',
        notas               TEXT,
        "fichaInformacion"  JSONB,
        archivado           BOOLEAN NOT NULL DEFAULT false,
        "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT NOW(),
        "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS casos_clinicos_profesor_idx ON casos_clinicos ("profesorId", archivado)`);
    await client.query(`ALTER TABLE public.casos_clinicos ENABLE ROW LEVEL SECURITY`);
    await client.query(`REVOKE ALL ON public.casos_clinicos FROM anon, authenticated`);
    console.log("✓ casos_clinicos");

    await client.query(`
      CREATE TABLE IF NOT EXISTS asignaciones_caso (
        id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "casoId"       TEXT NOT NULL REFERENCES casos_clinicos(id) ON DELETE CASCADE,
        "claseId"      TEXT NOT NULL REFERENCES clases(id) ON DELETE CASCADE,
        "fechaLimite"  TIMESTAMP(3),
        "asignadoPor"  TEXT REFERENCES dietistas(id) ON DELETE SET NULL,
        "retiradaAt"   TIMESTAMP(3),
        "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT NOW(),
        "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT NOW(),
        UNIQUE ("casoId", "claseId")
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS asignaciones_caso_clase_idx ON asignaciones_caso ("claseId")`);
    await client.query(`ALTER TABLE public.asignaciones_caso ENABLE ROW LEVEL SECURITY`);
    await client.query(`REVOKE ALL ON public.asignaciones_caso FROM anon, authenticated`);
    console.log("✓ asignaciones_caso");

    await client.query(`
      CREATE TABLE IF NOT EXISTS entregas_caso (
        id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "asignacionId"      TEXT NOT NULL REFERENCES asignaciones_caso(id) ON DELETE CASCADE,
        "alumnoId"          TEXT NOT NULL REFERENCES dietistas(id) ON DELETE CASCADE,
        -- El paciente se crea la primera vez que el alumno abre el caso, no al asignarlo: si no,
        -- una clase de 300 alumnos generaría 300 pacientes que quizá nadie llegue a abrir.
        "pacienteId"        TEXT REFERENCES pacientes(id) ON DELETE SET NULL,
        estado              "EstadoEntrega" NOT NULL DEFAULT 'SIN_EMPEZAR',
        "abiertaAt"         TIMESTAMP(3),
        "entregadaAt"       TIMESTAMP(3),
        nota                DOUBLE PRECISION,
        comentario          TEXT,
        -- La nota no se le enseña hasta que el profesor quiere (se acordó el 27 ago 2026).
        "visibleParaAlumno" BOOLEAN NOT NULL DEFAULT false,
        "corregidaAt"       TIMESTAMP(3),
        "corregidaPor"      TEXT REFERENCES dietistas(id) ON DELETE SET NULL,
        "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT NOW(),
        "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT NOW(),
        UNIQUE ("asignacionId", "alumnoId")
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS entregas_caso_alumno_idx ON entregas_caso ("alumnoId", estado)`);
    await client.query(`ALTER TABLE public.entregas_caso ENABLE ROW LEVEL SECURITY`);
    await client.query(`REVOKE ALL ON public.entregas_caso FROM anon, authenticated`);
    console.log("✓ entregas_caso");

    await client.query(`ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS "esDeClase" BOOLEAN NOT NULL DEFAULT false`);
    await client.query(`CREATE INDEX IF NOT EXISTS pacientes_de_clase_idx ON pacientes ("dietistaId", "esDeClase")`);
    console.log("✓ pacientes.esDeClase");

    for (const tabla of ["casos_clinicos", "asignaciones_caso", "entregas_caso", "pacientes"]) {
      const { rows } = await client.query(
        `SELECT relrowsecurity FROM pg_class WHERE oid = ('public.' || $1)::regclass`, [tabla]);
      if (!rows[0]?.relrowsecurity) throw new Error(`${tabla} se ha quedado sin RLS`);
    }
    console.log("✓ las cuatro tablas con RLS");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

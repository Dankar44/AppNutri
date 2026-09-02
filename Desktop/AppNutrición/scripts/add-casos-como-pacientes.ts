import "./_guard";   // obliga a elegir DB=dev|prod antes de tocar nada
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

// #40 — El caso ES un paciente del profesor (Guillermo, 2 sep 2026).
//
// La primera versión guardaba en `casos_clinicos` una copia recortada de los campos del paciente y
// se rellenaba con un formulario aparte. Guillermo lo tumbó: "la gracia es que el profesor cree un
// caso exactamente igual que cuando un nutricionista se lo da a un paciente… la anamnesis,
// mediciones, alergias, el horario… tiene que verse exactamente igual que un paciente normal".
//
// Así que el caso pasa a apuntar a un PACIENTE de verdad del profesor (`pacienteId`), marcado con
// `pacientes.esCasoDocente` para que no se mezcle con sus pacientes reales, y que se rellena con la
// ficha de siempre. Al asignarlo, cada alumno recibe una copia completa de ese paciente.
//
// Y `entregas_caso.notaAlumno`: la nota que el alumno escribe al entregar, "como una pequeña nota".
//
// Los campos recortados del paciente que tenía `casos_clinicos` sobran y se quitan. Producción
// nunca los tuvo (esta migración va detrás de `add-casos-clinicos`, ya sin ellos), así que los DROP
// solo hacen algo en desarrollo. Todo repetible.
async function main() {
  const client = await pool.connect();
  try {
    await client.query(`ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS "esCasoDocente" BOOLEAN NOT NULL DEFAULT false`);
    await client.query(`CREATE INDEX IF NOT EXISTS pacientes_caso_docente_idx ON pacientes ("dietistaId", "esCasoDocente")`);
    console.log("✓ pacientes.esCasoDocente");

    await client.query(`ALTER TABLE casos_clinicos ADD COLUMN IF NOT EXISTS "pacienteId" TEXT REFERENCES pacientes(id) ON DELETE SET NULL`);
    await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS casos_clinicos_paciente_key ON casos_clinicos ("pacienteId") WHERE "pacienteId" IS NOT NULL`);
    console.log("✓ casos_clinicos.pacienteId");

    for (const col of [
      "pacienteNombre", "pacienteApellidos", "sexo", "fechaNacimiento", "peso", "altura", "objetivo",
      "objetivoDetalle", "nivelActividad", "patologias", "alergias", "intolerancias", "medicamentos",
      "suplementos", "preferencias", "notas", "fichaInformacion",
    ]) {
      await client.query(`ALTER TABLE casos_clinicos DROP COLUMN IF EXISTS "${col}"`);
    }
    console.log("✓ casos_clinicos sin la copia recortada del paciente");

    await client.query(`ALTER TABLE entregas_caso ADD COLUMN IF NOT EXISTS "notaAlumno" TEXT`);
    console.log("✓ entregas_caso.notaAlumno");

    for (const tabla of ["casos_clinicos", "entregas_caso", "pacientes"]) {
      const { rows } = await client.query(
        `SELECT relrowsecurity FROM pg_class WHERE oid = ('public.' || $1)::regclass`, [tabla]);
      if (!rows[0]?.relrowsecurity) throw new Error(`${tabla} se ha quedado sin RLS`);
    }
    console.log("✓ RLS comprobada");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

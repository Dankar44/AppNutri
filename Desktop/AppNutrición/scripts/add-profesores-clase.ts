import "./_guard";   // obliga a elegir DB=dev|prod antes de tocar nada
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

// #39 — Varias personas dando la misma clase (Guillermo, 1 sep 2026).
//
// Hasta ahora una clase era de UN profesor. En una facultad lo normal es que la misma asignatura
// la lleven dos o tres, y con el modelo anterior cada uno tenía que hacerse su propia clase: los
// alumnos salían duplicados en las listas y nadie veía el trabajo del otro.
//
// `clases.profesorId` se queda como "quien la creó" (es a quien nombra el alumno como su
// profesor), y esta tabla dice quién más la lleva. El creador también se mete aquí, para que la
// comprobación de permisos sea una sola: "¿estoy en la lista?".
//
// Todo aditivo. La tabla nace con RLS: una tabla nueva sin él es la brecha del 26 ago 2026.
async function main() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS profesores_clase (
        id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "claseId"    TEXT NOT NULL REFERENCES clases(id) ON DELETE CASCADE,
        "profesorId" TEXT NOT NULL REFERENCES dietistas(id) ON DELETE CASCADE,
        "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT NOW(),
        "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT NOW(),
        UNIQUE ("claseId", "profesorId")
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS profesores_clase_profesor_idx ON profesores_clase ("profesorId")`);
    await client.query(`ALTER TABLE public.profesores_clase ENABLE ROW LEVEL SECURITY`);
    await client.query(`REVOKE ALL ON public.profesores_clase FROM anon, authenticated`);
    console.log("✓ tabla profesores_clase, con RLS");

    // Las clases que ya existen: su creador pasa a ser el primero de la lista.
    const { rowCount } = await client.query(`
      INSERT INTO profesores_clase (id, "claseId", "profesorId", "createdAt", "updatedAt")
      SELECT gen_random_uuid()::text, c.id, c."profesorId", NOW(), NOW()
        FROM clases c
       WHERE NOT EXISTS (
         SELECT 1 FROM profesores_clase pc WHERE pc."claseId" = c.id AND pc."profesorId" = c."profesorId"
       )
    `);
    console.log(`✓ ${rowCount ?? 0} clases con su creador en la lista`);

    const { rows } = await client.query(
      `SELECT relrowsecurity FROM pg_class WHERE oid = 'public.profesores_clase'::regclass`);
    if (!rows[0]?.relrowsecurity) throw new Error("profesores_clase se ha quedado sin RLS");
    console.log("✓ RLS comprobada");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

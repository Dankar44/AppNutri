import "./_guard";   // obliga a elegir DB=dev|prod antes de tocar nada
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

// El enlace para dar de alta profesores de una universidad de golpe.
//
// Hasta ahora había que tener el correo de cada profesor y meterlos uno a uno. Con esto se le manda
// UN enlace al representante, él lo reparte por su facultad y cada profesor se crea la cuenta solo
// (o se le añade el rol a la que ya tenga).
//
// Las plazas se cuentan por USOS, no por ocupación: un enlace de 10 admite 10 altas y se agota, y si
// después un profesor se va, ese hueco no lo puede coger nadie por ahí (Guillermo, 8 sep 2026: "se
// pierde y me tendrían que decir que quieren otra"). Para vender 3 más se crea otro enlace de 3.
//
// Coste: una fila por enlace, unos 100 bytes. Nada.
async function main() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS enlaces_profesores (
        id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "licenciaDocenteId" TEXT NOT NULL REFERENCES licencias_docentes(id) ON DELETE CASCADE,
        token             TEXT NOT NULL UNIQUE,
        plazas            INTEGER NOT NULL,
        usadas            INTEGER NOT NULL DEFAULT 0,
        "creadoPor"       TEXT,
        "enviadoA"        TEXT[] NOT NULL DEFAULT '{}',
        "ultimoEnvioAt"   TIMESTAMP(3),
        "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT NOW(),
        "updatedAt"       TIMESTAMP(3) NOT NULL DEFAULT NOW()
      )
    `);
    await client.query(`CREATE INDEX IF NOT EXISTS enlaces_profesores_licencia_idx ON enlaces_profesores("licenciaDocenteId")`);
    // Toda tabla nueva con RLS y sin permisos para los roles públicos (brecha del 26 ago 2026).
    await client.query(`ALTER TABLE public.enlaces_profesores ENABLE ROW LEVEL SECURITY`);
    await client.query(`REVOKE ALL ON public.enlaces_profesores FROM anon, authenticated`);

    // Quién entró por cada enlace, para poder mirarlo en la ficha de la universidad.
    await client.query(`ALTER TABLE dietistas ADD COLUMN IF NOT EXISTS "altaPorEnlaceId" TEXT`);

    const { rows } = await client.query(
      `SELECT relrowsecurity FROM pg_class WHERE relname = 'enlaces_profesores'`);
    console.log(rows[0]?.relrowsecurity ? "  ✓ enlaces_profesores creada con RLS" : "  ✗ sin RLS");
    const { rows: col } = await client.query(
      `SELECT 1 FROM information_schema.columns WHERE table_name='dietistas' AND column_name='altaPorEnlaceId'`);
    console.log(col.length ? "  ✓ dietistas.altaPorEnlaceId" : "  ✗ falta la columna");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });

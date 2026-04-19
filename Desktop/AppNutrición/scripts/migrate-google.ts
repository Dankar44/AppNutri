// Migración BD: añadir soporte para integración Google Calendar + Meet.
// Idempotente: se puede ejecutar varias veces sin romper.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

async function exec(client: pg.PoolClient, sql: string, label: string) {
  try {
    await client.query(sql);
    console.log(`  ✓ ${label}`);
  } catch (e) {
    console.warn(`  ! ${label} falló: ${(e as Error).message}`);
  }
}

async function main() {
  const client = await pool.connect();
  try {
    console.log("\n━━ Columnas en citas ━━");
    await exec(
      client,
      `ALTER TABLE citas ADD COLUMN IF NOT EXISTS "isOnline" BOOLEAN NOT NULL DEFAULT false`,
      "isOnline",
    );
    await exec(
      client,
      `ALTER TABLE citas ADD COLUMN IF NOT EXISTS "googleEventIdPaciente" TEXT`,
      "googleEventIdPaciente",
    );

    console.log("\n━━ Tabla google_integraciones (dietista) ━━");
    await exec(
      client,
      `CREATE TABLE IF NOT EXISTS google_integraciones (
        id            TEXT PRIMARY KEY,
        "dietistaId"  TEXT NOT NULL UNIQUE,
        email         TEXT NOT NULL,
        "accessToken" TEXT NOT NULL,
        "refreshToken" TEXT NOT NULL,
        "expiryDate"  TIMESTAMP(3) NOT NULL,
        "calendarId"  TEXT NOT NULL DEFAULT 'primary',
        sincronizar   BOOLEAN NOT NULL DEFAULT true,
        "crearMeet"   BOOLEAN NOT NULL DEFAULT false,
        "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      "CREATE TABLE google_integraciones",
    );
    await exec(
      client,
      `DO $$ BEGIN
        ALTER TABLE google_integraciones
          ADD CONSTRAINT google_integraciones_dietistaId_fkey
          FOREIGN KEY ("dietistaId") REFERENCES dietistas(id) ON DELETE CASCADE;
        EXCEPTION WHEN duplicate_object THEN NULL;
       END $$;`,
      "FK google_integraciones → dietistas",
    );

    console.log("\n━━ Tabla google_integraciones_paciente ━━");
    await exec(
      client,
      `CREATE TABLE IF NOT EXISTS google_integraciones_paciente (
        id            TEXT PRIMARY KEY,
        "pacienteId"  TEXT NOT NULL UNIQUE,
        email         TEXT NOT NULL,
        "accessToken" TEXT NOT NULL,
        "refreshToken" TEXT NOT NULL,
        "expiryDate"  TIMESTAMP(3) NOT NULL,
        "calendarId"  TEXT NOT NULL DEFAULT 'primary',
        sincronizar   BOOLEAN NOT NULL DEFAULT true,
        "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      "CREATE TABLE google_integraciones_paciente",
    );
    await exec(
      client,
      `DO $$ BEGIN
        ALTER TABLE google_integraciones_paciente
          ADD CONSTRAINT google_integraciones_paciente_pacienteId_fkey
          FOREIGN KEY ("pacienteId") REFERENCES pacientes(id) ON DELETE CASCADE;
        EXCEPTION WHEN duplicate_object THEN NULL;
       END $$;`,
      "FK google_integraciones_paciente → pacientes",
    );

    console.log("\n✅ Migración Google completada\n");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

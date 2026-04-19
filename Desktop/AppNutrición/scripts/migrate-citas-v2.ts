// Migración BD: añadir soporte a flujo de citas solicitadas por paciente + Google fields.
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
    console.log("\n━━ Enum OrigenCita ━━");
    await exec(
      client,
      `DO $$ BEGIN CREATE TYPE "OrigenCita" AS ENUM ('DIETISTA', 'PACIENTE'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
      "CREATE TYPE OrigenCita",
    );

    console.log("\n━━ Añadir valores al enum EstadoCita ━━");
    await exec(client, `ALTER TYPE "EstadoCita" ADD VALUE IF NOT EXISTS 'CONTRAPROPUESTA'`, "CONTRAPROPUESTA");

    console.log("\n━━ Añadir valores al enum TipoNotificacion ━━");
    for (const v of ["CITA_SOLICITADA", "CITA_CONFIRMADA", "CITA_CONTRAPROPUESTA", "CITA_RECHAZADA", "CITA_CANCELADA_POR_PACIENTE"]) {
      await exec(client, `ALTER TYPE "TipoNotificacion" ADD VALUE IF NOT EXISTS '${v}'`, v);
    }

    console.log("\n━━ Columnas en citas ━━");
    await exec(client, `ALTER TABLE citas ADD COLUMN IF NOT EXISTS "origen" "OrigenCita" NOT NULL DEFAULT 'DIETISTA'`, "origen");
    await exec(client, `ALTER TABLE citas ADD COLUMN IF NOT EXISTS "propuestoPor" "OrigenCita" NOT NULL DEFAULT 'DIETISTA'`, "propuestoPor");
    await exec(client, `ALTER TABLE citas ADD COLUMN IF NOT EXISTS "citaOriginalId" TEXT`, "citaOriginalId");
    await exec(client, `ALTER TABLE citas ADD COLUMN IF NOT EXISTS "googleEventId" TEXT`, "googleEventId");
    await exec(client, `ALTER TABLE citas ADD COLUMN IF NOT EXISTS "googleMeetLink" TEXT`, "googleMeetLink");

    console.log("\n━━ Cambios en notificaciones ━━");
    await exec(client, `ALTER TABLE notificaciones ALTER COLUMN "dietistaId" DROP NOT NULL`, "dietistaId nullable");
    await exec(client, `ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS "pacienteId" TEXT`, "pacienteId");
    // FK a pacientes
    await exec(
      client,
      `DO $$ BEGIN
        ALTER TABLE notificaciones
          ADD CONSTRAINT notificaciones_pacienteId_fkey
          FOREIGN KEY ("pacienteId") REFERENCES pacientes(id) ON DELETE CASCADE;
        EXCEPTION WHEN duplicate_object THEN NULL;
       END $$;`,
      "FK notificaciones → pacientes",
    );

    console.log("\n✅ Migración completada\n");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

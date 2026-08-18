/**
 * ARCHIVADO — NO EJECUTAR. Ver LEEME.md
 *
 * Este script hacía `DROP TABLE IF EXISTS planificaciones CASCADE` cargando `.env.local`, que en
 * la máquina del mantenedor es PRODUCCIÓN. La tabla `planificaciones` está viva (schema.prisma,
 * model Planificacion) y la usan varias server actions: ejecutarlo borraría las planificaciones
 * de todos los nutricionistas junto con todo lo que cuelga de ellas.
 *
 * Se ha desarmado a propósito. El cuerpo original está en el historial de git si alguna vez
 * hiciera falta recuperarlo.
 */
console.error(
  "\n✗ Este script está ARCHIVADO y desarmado a propósito: borraba la tabla de planificaciones.\n" +
  "  Si de verdad necesitas lo que hacía, léelo en el historial de git y escribe un script nuevo\n" +
  "  con `import \"../_guard-destructivo\";` en la primera línea.\n",
);
process.exit(1);

/* CUERPO ORIGINAL (desactivado):

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const client = await pool.connect();
  try {
    // Drop si existe (está vacía de todas formas tras mi accidente).
    await client.query(`DROP TABLE IF EXISTS planificaciones CASCADE`);

    // Recrear con el esquema que espera la app.
    await client.query(`
      CREATE TABLE "planificaciones" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "pacienteId" TEXT NOT NULL,
        "dietistaId" TEXT NOT NULL,
        "nombre" TEXT NOT NULL DEFAULT 'Planificación',
        "estado" TEXT NOT NULL DEFAULT 'ACTIVA',
        "esDefecto" BOOLEAN NOT NULL DEFAULT false,
        "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "fechaUltimoCambio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "fechaFinPrevista" TIMESTAMP(3),
        "datos" JSONB NOT NULL DEFAULT '{}',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "planificaciones_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "planificaciones_pacienteId_fkey" FOREIGN KEY ("pacienteId")
          REFERENCES "pacientes"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "planificaciones_dietistaId_fkey" FOREIGN KEY ("dietistaId")
          REFERENCES "dietistas"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    await client.query(
      `CREATE INDEX "planificaciones_pacienteId_esDefecto_idx"
       ON "planificaciones" ("pacienteId", "esDefecto");`,
    );
    console.log("✓ planificaciones recreada con schema correcto");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


*/

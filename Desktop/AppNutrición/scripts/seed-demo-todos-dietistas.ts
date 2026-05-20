/**
 * Crea un paciente demo (esDemo=true) para TODOS los dietistas que
 * aún no tengan uno. Reutiliza la función `crearPacienteDemoSiNoExiste`.
 *
 * Uso:
 *   npx tsx scripts/seed-demo-todos-dietistas.ts
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { PrismaClient } from "../src/generated/prisma/client";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const { crearPacienteDemoSiNoExiste } = await import("../src/lib/paciente-demo");

  const dietistas = await prisma.dietista.findMany({
    select: { id: true, email: true, nombre: true, apellidos: true },
    orderBy: { createdAt: "asc" },
  });

  console.log(`Total dietistas: ${dietistas.length}`);

  let creados = 0;
  let existentes = 0;
  let errores = 0;

  for (const d of dietistas) {
    try {
      const result = await crearPacienteDemoSiNoExiste(prisma, d.id, "es");
      if (result.creado) {
        creados++;
        console.log(`  + ${d.nombre} ${d.apellidos} (${d.email}) → paciente demo creado: ${result.id}`);
      } else {
        existentes++;
        console.log(`  = ${d.nombre} ${d.apellidos} (${d.email}) → ya tenía demo: ${result.id}`);
      }
    } catch (e) {
      errores++;
      console.error(`  ✗ ${d.nombre} ${d.apellidos} (${d.email}):`, e);
    }
  }

  console.log(`\nResumen: ${creados} creados, ${existentes} ya existían, ${errores} errores`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

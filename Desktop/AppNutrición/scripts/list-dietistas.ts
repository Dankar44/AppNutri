import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const dietistas = await prisma.dietista.findMany({
    select: {
      id: true,
      nombre: true,
      apellidos: true,
      email: true,
      pacientes: { select: { id: true, nombre: true, apellidos: true, activo: true } },
    },
  });
  for (const d of dietistas) {
    console.log(`\n${d.nombre} ${d.apellidos} <${d.email}> (id=${d.id})`);
    console.log(`  pacientes:`);
    for (const p of d.pacientes) {
      console.log(`    - ${p.nombre} ${p.apellidos} ${p.activo ? "(activo)" : "(inactivo)"}`);
    }
  }
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());

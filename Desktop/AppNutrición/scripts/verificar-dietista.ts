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

const EMAIL = process.argv[2];

async function main() {
  if (!EMAIL) {
    console.error("Uso: tsx scripts/verificar-dietista.ts <email>");
    process.exit(1);
  }

  const dietista = await prisma.dietista.findUnique({
    where: { email: EMAIL },
    select: { id: true, nombre: true, apellidos: true, email: true, numColegiado: true },
  });

  if (!dietista) {
    console.error(`No existe dietista con email ${EMAIL}`);
    process.exit(1);
  }

  const antes = await prisma.$queryRawUnsafe<{ verificado: boolean }[]>(
    `SELECT verificado FROM dietistas WHERE id = $1`, dietista.id
  );
  console.log(`Antes: ${dietista.nombre} ${dietista.apellidos} (colegiado: ${dietista.numColegiado}) → verificado=${antes[0]?.verificado}`);

  await prisma.$executeRawUnsafe(
    `UPDATE dietistas SET verificado = true WHERE id = $1`, dietista.id
  );

  const despues = await prisma.$queryRawUnsafe<{ verificado: boolean }[]>(
    `SELECT verificado FROM dietistas WHERE id = $1`, dietista.id
  );
  console.log(`Después: verificado=${despues[0]?.verificado} ✓`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());

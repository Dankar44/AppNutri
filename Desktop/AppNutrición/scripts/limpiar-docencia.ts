/**
 * #39/#40 — Mirar (o forzar) la limpieza del módulo docente.
 *
 * **La limpieza corre sola**: la aplicación la hace una vez al día cuando alguien entra en el
 * espacio docente o en el aula (`src/lib/limpieza-docente.ts`). Este script no reimplementa nada:
 * llama exactamente a la misma función, y sirve para dos cosas — ver qué se llevaría antes de que
 * pase, y forzarla si hace falta.
 *
 *   DB=dev  npx tsx scripts/limpiar-docencia.ts                 (simula: no toca nada)
 *   DB=dev  npx tsx scripts/limpiar-docencia.ts --ejecutar      (la fuerza)
 *   DB=prod npx tsx scripts/limpiar-docencia.ts                 (simula en producción, solo lee)
 *
 * Qué se lleva, y por qué es poco: desde el 7 sep 2026 el PDF del entregable **no se guarda** (se
 * genera al pedirlo), así que de cada entrega solo queda ~1 KB. Lo que de verdad crecía eran los
 * pacientes de prácticas, y esos se van cuando el alumno deja de serlo.
 */
import "./_guard";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { limpiarDocencia } from "../src/lib/limpieza-docente";

const EJECUTAR = process.argv.includes("--ejecutar");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

async function main() {
  // El módulo puede no estar todavía en esta base (producción, hasta que se despliegue).
  const [{ hay }] = await prisma.$queryRaw<{ hay: boolean }[]>`
    SELECT to_regclass('public.entregas_caso') IS NOT NULL AS hay`;
  if (!hay) {
    console.log("\nEl módulo docente no está en esta base todavía: no hay nada que limpiar.");
    return;
  }

  const [{ base }] = await prisma.$queryRaw<{ base: string }[]>`
    SELECT pg_size_pretty(pg_database_size(current_database())) AS base`;
  console.log(`\nLa base ocupa ${base}.\n`);

  const r = await limpiarDocencia(prisma, { simular: !EJECUTAR });
  const verbo = EJECUTAR ? "" : "se irían: ";
  console.log(`  ${verbo}${r.fotosBorradas} fotos del trabajo de cursos terminados`);
  console.log(`  ${verbo}${r.invitacionesBorradas} invitaciones sin usar y caducadas`);
  console.log(`  ${verbo}${r.pacientesBorrados} pacientes de prácticas de quien ya no es alumno`);

  if (EJECUTAR) {
    // `VACUUM` deja el hueco listo para reutilizar; no se lo devuelve al disco (eso sería
    // `VACUUM FULL`, que bloquea la tabla). Lo que importa: la tabla deja de crecer.
    await prisma.$executeRawUnsafe("VACUUM (ANALYZE) entregas_caso");
    await prisma.$executeRawUnsafe("VACUUM (ANALYZE) pacientes");
    console.log("\nHecho.");
  } else {
    console.log("\nNada tocado: esto solo era una simulación. La aplicación lo hace sola una vez al día;");
    console.log("con --ejecutar se fuerza ahora.");
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

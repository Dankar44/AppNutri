/**
 * Script de normalización de alimentos existentes en la BD.
 *
 * 1. Normaliza nombres (capitalización consistente)
 * 2. Redondea valores nutricionales a 1 decimal
 * 3. Detecta y fusiona duplicados (reasignando referencias)
 *
 * Ejecutar: npx tsx scripts/normalizar-alimentos.ts
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import {
  normalizarNombreAlimento,
  normalizarParaBusqueda,
  redondearMacros,
} from "../src/lib/alimento-utils";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("=== Normalización de alimentos ===\n");

  // 1. Leer todos los alimentos
  const alimentos = await prisma.alimento.findMany({
    orderBy: { createdAt: "asc" },
  });
  console.log(`Total de alimentos en BD: ${alimentos.length}`);

  // 2. Normalizar nombres y redondear macros
  let normalizados = 0;
  for (const a of alimentos) {
    const nombreNorm = normalizarNombreAlimento(a.nombre);
    const calNorm = redondearMacros(a.calorias);
    const protNorm = redondearMacros(a.proteinas);
    const carbNorm = redondearMacros(a.carbohidratos);
    const grasNorm = redondearMacros(a.grasas);
    const fibraNorm = redondearMacros(a.fibra);

    const cambio =
      nombreNorm !== a.nombre ||
      calNorm !== a.calorias ||
      protNorm !== a.proteinas ||
      carbNorm !== a.carbohidratos ||
      grasNorm !== a.grasas ||
      fibraNorm !== a.fibra;

    if (cambio) {
      await prisma.alimento.update({
        where: { id: a.id },
        data: {
          nombre: nombreNorm,
          nombreNormalizado: normalizarParaBusqueda(nombreNorm),
          calorias: calNorm,
          proteinas: protNorm,
          carbohidratos: carbNorm,
          grasas: grasNorm,
          fibra: fibraNorm,
        },
      });
      normalizados++;
      if (nombreNorm !== a.nombre) {
        console.log(`  Renombrado: "${a.nombre}" → "${nombreNorm}"`);
      }
    }
  }
  console.log(`Alimentos normalizados: ${normalizados}\n`);

  // 3. Detectar y fusionar duplicados por nombre (case-insensitive)
  const alimentosActualizados = await prisma.alimento.findMany({
    orderBy: { createdAt: "asc" },
  });

  // Agrupar por nombre en minúsculas
  const grupos = new Map<
    string,
    typeof alimentosActualizados
  >();
  for (const a of alimentosActualizados) {
    const key = a.nombre.toLowerCase();
    if (!grupos.has(key)) grupos.set(key, []);
    grupos.get(key)!.push(a);
  }

  let duplicadosEliminados = 0;
  for (const [nombre, grupo] of grupos) {
    if (grupo.length <= 1) continue;

    console.log(
      `Duplicados encontrados para "${nombre}": ${grupo.length} registros`
    );

    // Conservar: primero el global (dietistaId: null), si no el más antiguo
    const conservar =
      grupo.find((a) => a.dietistaId === null) || grupo[0];
    const eliminar = grupo.filter((a) => a.id !== conservar.id);

    console.log(`  Conservando: id=${conservar.id} (dietistaId=${conservar.dietistaId})`);

    for (const dup of eliminar) {
      console.log(`  Eliminando:  id=${dup.id} (dietistaId=${dup.dietistaId})`);

      // Reasignar referencias en AlimentoEnComida
      const enComida = await prisma.alimentoEnComida.updateMany({
        where: { alimentoId: dup.id },
        data: { alimentoId: conservar.id },
      });
      if (enComida.count > 0) {
        console.log(`    → ${enComida.count} AlimentoEnComida reasignados`);
      }

      // Reasignar referencias en RecetaIngrediente
      const enReceta = await prisma.recetaIngrediente.updateMany({
        where: { alimentoId: dup.id },
        data: { alimentoId: conservar.id },
      });
      if (enReceta.count > 0) {
        console.log(`    → ${enReceta.count} RecetaIngrediente reasignados`);
      }

      // Reasignar referencias en EntradaDiario
      const enDiario = await prisma.entradaDiario.updateMany({
        where: { alimentoId: dup.id },
        data: { alimentoId: conservar.id },
      });
      if (enDiario.count > 0) {
        console.log(`    → ${enDiario.count} EntradaDiario reasignados`);
      }

      // Borrar el duplicado
      await prisma.alimento.delete({ where: { id: dup.id } });
      duplicadosEliminados++;
    }
  }

  console.log(`\nDuplicados eliminados: ${duplicadosEliminados}`);
  console.log("=== Normalización completada ===");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

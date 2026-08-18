/**
 * Compara el esquema de PRODUCCIÓN con el de DESARROLLO y avisa de las diferencias.
 *
 *     npx tsx scripts/comparar-esquemas.ts
 *
 * POR QUÉ EXISTE: las migraciones son scripts manuales que se ejecutan a mano. Es fácil
 * aplicarlas en producción y olvidarse de desarrollo. Cuando eso pasa, el colaborador hace
 * `git pull` + `prisma generate`, su cliente espera una columna que su base no tiene, y le
 * salta un `column ... does not exist` que parece un fallo suyo y no lo es.
 *
 * SOLO LEE (information_schema y pg_enum). No escribe nada en ninguna de las dos bases.
 * No usa _guard porque necesita conectarse a las dos a la vez.
 */
import dotenv from "dotenv";
import { Client } from "pg";

function urlDe(fichero: string): string {
  const env = dotenv.config({ path: fichero, processEnv: {} }).parsed;
  const url = env?.DATABASE_URL;
  if (!url) {
    console.error(`✗ No encuentro DATABASE_URL en ${fichero}`);
    process.exit(1);
  }
  return url;
}

async function leerEsquema(url: string) {
  const cliente = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await cliente.connect();
  try {
    const columnas = await cliente.query<{ c: string }>(
      `SELECT table_name || '.' || column_name AS c
         FROM information_schema.columns
        WHERE table_schema = 'public' ORDER BY 1`,
    );
    const enums = await cliente.query<{ c: string }>(
      `SELECT t.typname || ':' || e.enumlabel AS c
         FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid ORDER BY 1`,
    );
    return {
      columnas: new Set(columnas.rows.map((r) => r.c)),
      enums: new Set(enums.rows.map((r) => r.c)),
    };
  } finally {
    await cliente.end();
  }
}

async function main() {
  const produccion = await leerEsquema(urlDe(".env.local"));
  const desarrollo = await leerEsquema(urlDe(".env.dev.local"));

  const faltanColumnas = [...produccion.columnas].filter((c) => !desarrollo.columnas.has(c));
  const sobranColumnas = [...desarrollo.columnas].filter((c) => !produccion.columnas.has(c));
  const faltanEnums = [...produccion.enums].filter((e) => !desarrollo.enums.has(e));
  const sobranEnums = [...desarrollo.enums].filter((e) => !produccion.enums.has(e));

  console.log(`producción: ${produccion.columnas.size} columnas, ${produccion.enums.size} valores de enum`);
  console.log(`desarrollo: ${desarrollo.columnas.size} columnas, ${desarrollo.enums.size} valores de enum\n`);

  if (!faltanColumnas.length && !sobranColumnas.length && !faltanEnums.length && !sobranEnums.length) {
    console.log("✓ Los dos esquemas son idénticos.");
    return;
  }

  if (faltanColumnas.length || faltanEnums.length) {
    console.log("⚠️  FALTA EN DESARROLLO (aplica ahí la migración: DB=dev npx tsx scripts/<migracion>.ts)");
    faltanColumnas.forEach((c) => console.log(`   · columna  ${c}`));
    faltanEnums.forEach((e) => console.log(`   · enum     ${e}`));
    console.log();
  }
  if (sobranColumnas.length || sobranEnums.length) {
    console.log("⚠️  ESTÁ EN DESARROLLO Y NO EN PRODUCCIÓN (¿migración sin desplegar, o un db push?)");
    sobranColumnas.forEach((c) => console.log(`   · columna  ${c}`));
    sobranEnums.forEach((e) => console.log(`   · enum     ${e}`));
    console.log();
  }
  process.exitCode = 1;
}

main().catch((error) => {
  console.error("✗ Error comparando los esquemas:", error);
  process.exit(1);
});

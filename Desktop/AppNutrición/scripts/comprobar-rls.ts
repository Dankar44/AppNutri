/**
 * Comprueba que ninguna tabla del esquema público se ha quedado sin Row-Level Security, y que
 * los roles públicos (`anon` y `authenticated`) no tienen permisos sobre ellas.
 *
 *   DB=dev npx tsx scripts/comprobar-rls.ts
 *   DB=prod npx tsx scripts/comprobar-rls.ts
 *
 * POR QUÉ EXISTE: el 26 de agosto de 2026 las 34 tablas de producción estaban SIN RLS y la clave
 * anónima —que viaja en el JavaScript del navegador— podía leerlas y borrarlas. Se cerró activando
 * RLS y revocando privilegios, pero **una tabla nueva creada por Prisma nace sin RLS**, así que el
 * agujero se puede volver a abrir sin que nadie se dé cuenta. Esto lo detecta en un comando.
 *
 * Solo lee: no modifica nada. Devuelve código de salida 1 si encuentra algo mal.
 */
import "./_guard";
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
  let problemas = 0;
  try {
    const { rows: tablas } = await client.query(`
      SELECT c.relname AS tabla, c.relrowsecurity AS rls
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r'
      ORDER BY c.relname
    `);

    const sinRls = tablas.filter((t) => !t.rls);
    console.log(`Tablas en el esquema público: ${tablas.length}`);
    if (sinRls.length === 0) {
      console.log("✓ Todas tienen Row-Level Security activado");
    } else {
      problemas += sinRls.length;
      console.log(`\n✗ ${sinRls.length} tabla(s) SIN RLS — arréglalo con:`);
      for (const t of sinRls) {
        console.log(`    ALTER TABLE public.${t.tabla} ENABLE ROW LEVEL SECURITY;`);
      }
    }

    const { rows: permisos } = await client.query(`
      SELECT table_name AS tabla, grantee AS rol, string_agg(DISTINCT privilege_type, ', ') AS permisos
      FROM information_schema.role_table_grants
      WHERE table_schema = 'public' AND grantee IN ('anon', 'authenticated')
      GROUP BY table_name, grantee
      ORDER BY table_name, grantee
    `);

    if (permisos.length === 0) {
      console.log("✓ Los roles públicos (anon/authenticated) no tienen permisos sobre ninguna tabla");
    } else {
      problemas += permisos.length;
      console.log(`\n✗ ${permisos.length} permiso(s) concedidos a roles públicos:`);
      for (const p of permisos.slice(0, 20)) {
        console.log(`    ${p.rol} → ${p.tabla}: ${p.permisos}`);
      }
      if (permisos.length > 20) console.log(`    … y ${permisos.length - 20} más`);
      console.log("  Revocar con: REVOKE ALL ON public.<tabla> FROM anon, authenticated;");
    }

    console.log(problemas === 0 ? "\n✓ Sin problemas\n" : `\n✗ ${problemas} problema(s)\n`);
    if (problemas > 0) process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

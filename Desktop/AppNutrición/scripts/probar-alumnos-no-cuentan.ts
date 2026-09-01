/**
 * #39 — Comprueba que un alumno NO cuenta como nutricionista en el panel de administración.
 *
 * Es condición de entrada de la fase 2: el día que una universidad dé de alta a sus 200 alumnos,
 * el panel no puede decir 600 nutricionistas ni contarlos como altas del mes. La única forma de
 * saberlo es crear alumnos de verdad y comparar las cifras antes y después.
 *
 *   1. npm run dev:desarrollo        (puerto 3001)
 *   2. DB=dev npx tsx scripts/probar-alumnos-no-cuentan.ts
 *
 * Crea 30 alumnos y los borra al terminar. Solo con DB=dev: contra producción aborta.
 */
import "./_guard-solo-dev";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";
import { SignJWT } from "jose";

const BASE = process.env.PRUEBAS_URL ?? "http://localhost:3001";
const CUANTOS = 30;
const MARCA = "alumno.masivo";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } });

let ok = 0, mal = 0;
const comprobar = (t: string, c: boolean, d = "") => { console.log(`  ${c ? "✓" : "✗"} ${t}${d ? ` — ${d}` : ""}`); c ? ok++ : mal++; };

async function cookieAdmin() {
  const token = await new SignJWT({ email: (process.env.ADMIN_EMAILS ?? "").split(",")[0].trim(), role: "admin" })
    .setProtectedHeader({ alg: "HS256" }).setExpirationTime("1d")
    .sign(new TextEncoder().encode(process.env.PATIENT_JWT_SECRET!));
  return `annonia-admin-session=${token}`;
}

/** Cifras que se le enseñan a Guillermo en el panel, leídas de la propia pantalla. */
async function cifrasDelPanel(cookie: string) {
  const res = await fetch(`${BASE}/admin`, { headers: { cookie } });
  const html = (await res.text()).replace(/<!--[\s\S]*?-->/g, "");
  // El número grande que hay junto a la etiqueta de nutricionistas
  const total = html.match(/Nutricionistas[\s\S]{0,400}?>(\d[\d.]*)</)?.[1] ?? "?";
  return { estado: res.status, total };
}

async function contarEnListado(cookie: string) {
  const res = await fetch(`${BASE}/admin/dietistas`, { headers: { cookie } });
  const html = await res.text();
  return (html.match(new RegExp(MARCA, "g")) || []).length;
}

async function borrarAlumnos(client: pg.PoolClient) {
  const { rows } = await client.query(`SELECT id FROM auth.users WHERE email LIKE $1`, [`${MARCA}%`]);
  for (const r of rows) {
    await client.query(`DELETE FROM dietistas WHERE "authId" = $1`, [r.id]);
    await client.query(`DELETE FROM auth.identities WHERE user_id = $1::uuid`, [r.id]);
    await client.query(`DELETE FROM auth.users WHERE id = $1::uuid`, [r.id]);
  }
}

async function main() {
  const client = await pool.connect();
  try {
    const cookie = await cookieAdmin();
    await borrarAlumnos(client);

    console.log("\n── Antes de crear ningún alumno ──");
    const antes = await cifrasDelPanel(cookie);
    const antesListado = await contarEnListado(cookie);
    comprobar("el panel responde", antes.estado === 200, `estado ${antes.estado}`);
    console.log(`  nutricionistas en el panel: ${antes.total}`);

    const { rows: lic } = await client.query(`SELECT id FROM licencias_docentes ORDER BY "createdAt" LIMIT 1`);
    const licenciaId = lic[0]?.id ?? null;

    console.log(`\n── Creando ${CUANTOS} alumnos ──`);
    for (let i = 1; i <= CUANTOS; i++) {
      const email = `${MARCA}${i}@annonia.dev`;
      const { rows: u } = await client.query(
        `INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
           created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous,
           confirmation_token, recovery_token, email_change_token_new, email_change,
           email_change_token_current, reauthentication_token, phone_change, phone_change_token)
         VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
           $1, crypt('x', gen_salt('bf')), NOW(), NOW(), NOW(),
           '{"provider":"email","providers":["email"]}', '{}'::jsonb, false, false, '','','','','','','','')
         RETURNING id`, [email]);
      await client.query(
        // `cuentaDeClase` marca las cuentas NACIDAS en una clase, que son las que no cuentan como
        // clientes. Las tres vías de alta reales la ponen siempre.
        `INSERT INTO dietistas (id, "authId", email, nombre, apellidos, verificado, "rolDocente", "licenciaDocenteId", "cuentaDeClase", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, $2, 'Alumno', $3, true, 'ALUMNO', $4, true, NOW(), NOW())`,
        [u[0].id, email, `Numero${i}`, licenciaId]);
    }
    const { rows: creados } = await client.query(
      `SELECT count(*)::int AS n FROM dietistas WHERE email LIKE $1`, [`${MARCA}%`]);
    comprobar(`${CUANTOS} alumnos creados`, creados[0].n === CUANTOS, `${creados[0].n}`);

    console.log("\n── Después: las cifras NO pueden moverse ──");
    const despues = await cifrasDelPanel(cookie);
    comprobar("el total de nutricionistas es el mismo", despues.total === antes.total, `${antes.total} → ${despues.total}`);
    comprobar("no aparecen en el listado de nutricionistas", (await contarEnListado(cookie)) === antesListado);

    const pendientes = await fetch(`${BASE}/admin/verificaciones`, { headers: { cookie } });
    comprobar("no aparecen en verificaciones", !(await pendientes.text()).includes(MARCA));

    const susc = await fetch(`${BASE}/admin/suscripciones`, { headers: { cookie } });
    comprobar("no aparecen en suscripciones", !(await susc.text()).includes(MARCA));

    const seg = await fetch(`${BASE}/admin/seguimiento`, { headers: { cookie } });
    comprobar("no aparecen en seguimiento", !(await seg.text()).includes(MARCA));

    const act = await fetch(`${BASE}/admin/actividad`, { headers: { cookie } });
    comprobar("no aparecen en actividad", !(await act.text()).includes(MARCA));

    // Donde SÍ tienen que contarse: en la bolsa de su licencia.
    if (licenciaId) {
      const detalle = await fetch(`${BASE}/admin/universidades/${licenciaId}`, { headers: { cookie } });
      const html = (await detalle.text()).replace(/<!--[\s\S]*?-->/g, "");
      comprobar("pero SÍ cuentan en la bolsa de su licencia", html.includes(String(CUANTOS)), `buscando ${CUANTOS}`);
    }

    console.log("\n── Limpieza ──");
    await borrarAlumnos(client);
    const { rows: quedan } = await client.query(
      `SELECT count(*)::int AS n FROM dietistas WHERE email LIKE $1`, [`${MARCA}%`]);
    comprobar("alumnos de prueba borrados", quedan[0].n === 0);
    const final = await cifrasDelPanel(cookie);
    comprobar("el panel vuelve a su cifra", final.total === antes.total, `${final.total}`);

    console.log(`\n${mal === 0 ? "✓ TODO CORRECTO" : "✗ HAY FALLOS"} — ${ok} bien, ${mal} mal\n`);
    if (mal > 0) process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exitCode = 1; });

/**
 * Las plazas de alumno se consumen por CURSO y no vuelven hasta el 31 de agosto.
 *
 * De esto depende lo que se cobra, así que se comprueba contra la base y no de leída:
 *  - quien entra gasta plaza, y sigue gastándola aunque se le retire o se archive su clase;
 *  - el mismo alumno en dos clases de la facultad gasta UNA, y volver tras irse no gasta otra;
 *  - un alta del curso pasado ya no cuenta;
 *  - y el cupo propio de una clase corta antes que el de la facultad.
 *
 *   1. npm run dev:desarrollo        (puerto 3001)
 *   2. DB=dev npx tsx scripts/probar-plazas-por-curso.ts
 */
import "./_guard-solo-dev";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";
import puppeteer, { type Page, type Browser } from "puppeteer-core";
import { createClient } from "@supabase/supabase-js";

// Las funciones de la bolsa son de servidor (`server-only`) y no se pueden importar aquí, así que
// se comprueba lo que de verdad importa: lo que la aplicación enseña y deja hacer.
const BASE = "http://localhost:3001";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PASS = "PruebaCurso2026";

/** El 1 de septiembre con el que empezó el curso en el que estamos. */
function inicioDeAnioEscolar(hoy = new Date()): Date {
  const anio = hoy.getUTCMonth() >= 8 ? hoy.getUTCFullYear() : hoy.getUTCFullYear() - 1;
  return new Date(Date.UTC(anio, 8, 1));
}

const MARCA = "PRUEBACURSO";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } });

let ok = 0, mal = 0;
const comprobar = (t: string, c: boolean, d = "") => { console.log(`  ${c ? "✓" : "✗"} ${t}${d ? ` — ${d}` : ""}`); c ? ok++ : mal++; };

async function main() {
  const client = await pool.connect();
  const navegador = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });
  try {
    await limpiar(client);

    const { rows: lic } = await client.query(
      `INSERT INTO licencias_docentes (id, institucion, "maxProfesores", "maxAlumnos", activa, "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, '${MARCA} Facultad', 2, 5, true, NOW(), NOW()) RETURNING id`);
    const licenciaId = lic[0].id as string;
    const profesorId = await crearCuenta(client, `${MARCA.toLowerCase()}.profe@prueba.dev`, "Profe", "PROFESOR", licenciaId);
    const claseA = await crearClase(client, licenciaId, profesorId, "A", null);
    const claseB = await crearClase(client, licenciaId, profesorId, "B", null);

    const profe = await sesion(navegador, `${MARCA.toLowerCase()}.profe@prueba.dev`);
    const plazasEnPantalla = async (claseId: string) => {
      await profe.goto(`${BASE}/profesor/clases/${claseId}`, { waitUntil: "networkidle0" });
      await esperar(2200);
      const txt = await profe.evaluate(() => document.body.innerText);
      const m = txt.match(/(\d+)\s+plazas? libres?/i) ?? (/sin plazas libres/i.test(txt) ? ["", "0"] : null);
      return m ? Number(m[1]) : null;
    };

    console.log("\n── Una plaza se gasta al entrar ──");
    comprobar("de partida hay 5 libres", (await plazasEnPantalla(claseA)) === 5, `${await plazasEnPantalla(claseA)}`);
    const ana = await crearCuenta(client, `${MARCA.toLowerCase()}.ana@prueba.dev`, "Ana", "ALUMNO", licenciaId);
    await matricular(client, claseA, ana, new Date());
    comprobar("con una alumna dentro quedan 4", (await plazasEnPantalla(claseA)) === 4, `${await plazasEnPantalla(claseA)}`);

    console.log("\n── Y NO vuelve aunque se le retire ──");
    await client.query(`UPDATE alumnos_clase SET activa = false, "bajaAt" = NOW() WHERE "alumnoId" = $1`, [ana]);
    comprobar("siguen siendo 4", (await plazasEnPantalla(claseA)) === 4, `${await plazasEnPantalla(claseA)}`);

    console.log("\n── Ni aunque se archive su clase ──");
    await client.query(`UPDATE clases SET archivada = true WHERE id = $1`, [claseA]);
    comprobar("siguen siendo 4", (await plazasEnPantalla(claseB)) === 4, `${await plazasEnPantalla(claseB)}`);
    await client.query(`UPDATE clases SET archivada = false WHERE id = $1`, [claseA]);

    console.log("\n── El mismo alumno en dos clases gasta UNA ──");
    await matricular(client, claseB, ana, new Date());
    comprobar("siguen siendo 4", (await plazasEnPantalla(claseB)) === 4, `${await plazasEnPantalla(claseB)}`);

    console.log("\n── Lo del curso pasado ya no cuenta ──");
    const luis = await crearCuenta(client, `${MARCA.toLowerCase()}.luis@prueba.dev`, "Luis", "ALUMNO", licenciaId);
    const cursoPasado = new Date(inicioDeAnioEscolar().getTime() - 30 * 24 * 60 * 60 * 1000);
    await matricular(client, claseA, luis, cursoPasado, false);
    comprobar("su alta vieja no resta plaza", (await plazasEnPantalla(claseB)) === 4, `${await plazasEnPantalla(claseB)}`);

    console.log("\n── El cupo de una clase corta antes que el de la facultad ──");
    await client.query(`UPDATE clases SET "cupoEnlace" = 1, "invitacionAbierta" = true,
        "tokenInvitacion" = replace(gen_random_uuid()::text,'-','') WHERE id = $1`, [claseB]);
    const { rows: tk } = await client.query(`SELECT "tokenInvitacion" FROM clases WHERE id = $1`, [claseB]);
    const page = await (await navegador.createBrowserContext()).newPage();
    await page.setViewport({ width: 1440, height: 950 });
    await page.goto(`${BASE}/clase/${tk[0].tokenInvitacion}`, { waitUntil: "networkidle0" });
    await esperar(2000);
    await altaPorElEnlace(page, `${MARCA.toLowerCase()}.nueva@prueba.dev`);
    const { rows: entro } = await client.query(
      `SELECT 1 FROM dietistas WHERE email = $1`, [`${MARCA.toLowerCase()}.nueva@prueba.dev`]);
    comprobar("con el cupo lleno (1 y ya hay 1), no deja entrar", entro.length === 0, `${entro.length} creada(s)`);
    comprobar("y a la facultad le quedaban plazas", (await plazasEnPantalla(claseB) ?? 0) > 0);

    console.log("\n── Con sitio en el cupo, sí entra ──");
    await client.query(`UPDATE clases SET "cupoEnlace" = 3 WHERE id = $1`, [claseB]);
    await page.goto(`${BASE}/clase/${tk[0].tokenInvitacion}`, { waitUntil: "networkidle0" });
    await esperar(2000);
    await altaPorElEnlace(page, `${MARCA.toLowerCase()}.nueva@prueba.dev`);
    const { rows: entro2 } = await client.query(
      `SELECT 1 FROM dietistas WHERE email = $1`, [`${MARCA.toLowerCase()}.nueva@prueba.dev`]);
    comprobar("ahora sí se da de alta", entro2.length === 1);

    await limpiar(client);
  } finally {
    client.release();
    await navegador.close();
    await pool.end();
  }
  console.log(`\n${mal === 0 ? "✓" : "✗"} ${ok} bien, ${mal} mal`);
  process.exit(mal === 0 ? 0 : 1);
}

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Rellena y envía el alta del enlace de clase. El botón, dentro del formulario: por texto se
 *  pulsaba el «Aceptar todas» del aviso de cookies. */
async function altaPorElEnlace(page: Page, email: string) {
  await page.evaluate((correo, clave) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!;
    const inputs = Array.from(document.querySelectorAll("form input"));
    const textos = inputs.filter((i) => (i as HTMLInputElement).type === "text");
    if (textos[0]) { setter.call(textos[0], "Nueva"); textos[0].dispatchEvent(new Event("input", { bubbles: true })); }
    if (textos[1]) { setter.call(textos[1], "Alumna"); textos[1].dispatchEvent(new Event("input", { bubbles: true })); }
    const c = inputs.find((i) => (i as HTMLInputElement).type === "email");
    if (c) { setter.call(c, correo); c.dispatchEvent(new Event("input", { bubbles: true })); }
    for (const p of inputs.filter((i) => (i as HTMLInputElement).type === "password")) {
      setter.call(p, clave);
      p.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }, email, PASS);
  await esperar(800);
  await page.evaluate(() => (document.querySelector('form button[type="submit"]') as HTMLElement | null)?.click());
  await esperar(7000);
}

async function sesion(nav: Browser, email: string): Promise<Page> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const sb = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  const { data, error } = await sb.auth.signInWithPassword({ email, password: PASS });
  if (error) throw new Error(`login de ${email}: ${error.message}`);
  const page = await (await nav.createBrowserContext()).newPage();
  await page.setViewport({ width: 1440, height: 950 });
  await page.evaluateOnNewDocument(() => { try { localStorage.setItem("annonia-welcome-dietista", "1"); } catch { /* ignore */ } });
  await page.setCookie({
    name: `sb-${url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1]}-auth-token`,
    value: "base64-" + Buffer.from(JSON.stringify(data.session)).toString("base64"),
    domain: "localhost", path: "/",
  });
  return page;
}

/** Cuenta de verdad, con su usuario de autenticación, para poder entrar con ella. */
async function crearCuenta(c: pg.PoolClient, email: string, apellidos: string, rol: string, licenciaId: string) {
  const { rows: u } = await c.query(
    `INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
       created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous,
       confirmation_token, recovery_token, email_change_token_new, email_change,
       email_change_token_current, reauthentication_token, phone_change, phone_change_token)
     VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
       $1, crypt($2, gen_salt('bf')), NOW(), NOW(), NOW(),
       '{"provider":"email","providers":["email"]}', '{}'::jsonb, false, false, '','','','','','','','')
     RETURNING id`, [email, PASS]);
  const authId = u[0].id as string;
  await c.query(
    `INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
     VALUES (gen_random_uuid(), $1::uuid, $1::text, 'email',
       jsonb_build_object('sub',$1::text,'email',$2::text,'email_verified',true,'provider','email'), NOW(), NOW(), NOW())`,
    [authId, email]);
  const { rows } = await c.query(
    `INSERT INTO dietistas (id, "authId", email, nombre, apellidos, verificado, "rolDocente", "licenciaDocenteId", "createdAt", "updatedAt")
     VALUES (gen_random_uuid()::text, $1, $2, '${MARCA}', $3, true, $4::"RolDocente", $5, NOW(), NOW()) RETURNING id`,
    [authId, email, apellidos, rol, licenciaId]);
  return rows[0].id as string;
}

async function crearClase(c: pg.PoolClient, licenciaId: string, profesorId: string, nombre: string, cupo: number | null) {
  const { rows } = await c.query(
    `INSERT INTO clases (id, "profesorId", "licenciaDocenteId", nombre, "cupoEnlace", "createdAt", "updatedAt")
     VALUES (gen_random_uuid()::text, $1, $2, '${MARCA} ' || $3, $4, NOW(), NOW()) RETURNING id`,
    [profesorId, licenciaId, nombre, cupo]);
  return rows[0].id as string;
}

async function matricular(c: pg.PoolClient, claseId: string, alumnoId: string, altaAt: Date, activa = true) {
  await c.query(
    `INSERT INTO alumnos_clase (id, "claseId", "alumnoId", activa, "altaAt", "createdAt", "updatedAt")
     VALUES (gen_random_uuid()::text, $1, $2, $3, $4, NOW(), NOW())
     ON CONFLICT ("claseId", "alumnoId") DO UPDATE SET activa = $3, "altaAt" = $4`,
    [claseId, alumnoId, activa, altaAt]);
}

async function limpiar(c: pg.PoolClient) {
  await c.query(`DELETE FROM clases WHERE nombre LIKE '${MARCA}%'`);
  const { rows } = await c.query(`SELECT "authId" FROM dietistas WHERE nombre = '${MARCA}'`);
  await c.query(`DELETE FROM dietistas WHERE nombre = '${MARCA}'`);
  for (const r of rows) {
    if (!r.authId) continue;
    await c.query(`DELETE FROM auth.identities WHERE user_id = $1::uuid`, [r.authId]);
    await c.query(`DELETE FROM auth.users WHERE id = $1::uuid`, [r.authId]);
  }
  await c.query(`DELETE FROM licencias_docentes WHERE institucion LIKE '${MARCA}%'`);
}

main().catch((e) => { console.error(e); process.exit(1); });

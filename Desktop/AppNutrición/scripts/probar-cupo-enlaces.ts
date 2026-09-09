/**
 * El enlace de profesorado REPARTE plazas de la universidad; no las inventa.
 *
 * Sale de un fallo real: con 5 licencias de profesor vendidas y 4 ocupadas, el admin dejaba crear
 * un enlace de 4 plazas más, porque al crearlo se le sumaban al tope de la licencia. Acababan
 * entrando 8 profesores en una universidad de 5 (Guillermo, 9 sep 2026).
 *
 *   1. npm run dev:desarrollo        (puerto 3001)
 *   2. DB=dev npx tsx scripts/probar-cupo-enlaces.ts
 */
import "./_guard-solo-dev";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";
import { conexionResistente, type Conexion } from "./_conexion-viva";
import puppeteer, { type Page } from "puppeteer-core";

const BASE = "http://localhost:3001";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const MARCA = "CUPO";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } });

let ok = 0, mal = 0;
const comprobar = (t: string, c: boolean, d = "") => { console.log(`  ${c ? "✓" : "✗"} ${t}${d ? ` — ${d}` : ""}`); c ? ok++ : mal++; };
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
const texto = (p: Page) => p.evaluate(() => document.body.innerText);
const anio = (hoy = new Date()) => (hoy.getUTCMonth() >= 8 ? hoy.getUTCFullYear() : hoy.getUTCFullYear() - 1);

/** Escribe las plazas del enlace nuevo y pulsa «Crear enlace». */
async function crearEnlaceDe(page: Page, plazas: number) {
  await page.evaluate((n) => {
    const campo = Array.from(document.querySelectorAll("input")).find(
      (i) => (i as HTMLInputElement).inputMode === "numeric");
    if (!campo) return;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(campo, String(n));
    campo.dispatchEvent(new Event("input", { bubbles: true }));
  }, plazas);
  await esperar(500);
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll("button")).find((x) => /Crear enlace/i.test(x.textContent ?? ""));
    (b as HTMLButtonElement | undefined)?.click();
  });
  await esperar(3000);
}

async function limpiar(c: Conexion) {
  await c.query(`DELETE FROM enlaces_profesores WHERE "licenciaDocenteId" IN (SELECT id FROM licencias_docentes WHERE institucion LIKE '${MARCA}%')`);
  const { rows } = await c.query(`SELECT "authId" FROM dietistas WHERE email LIKE '%@cupo.dev'`);
  await c.query(`DELETE FROM pacientes WHERE "dietistaId" IN (SELECT id FROM dietistas WHERE email LIKE '%@cupo.dev')`);
  await c.query(`DELETE FROM dietistas WHERE email LIKE '%@cupo.dev'`);
  for (const r of rows) {
    if (!r.authId) continue;
    await c.query(`DELETE FROM auth.identities WHERE user_id = $1::uuid`, [r.authId]);
    await c.query(`DELETE FROM auth.users WHERE id = $1::uuid`, [r.authId]);
  }
  await c.query(`DELETE FROM licencias_docentes WHERE institucion LIKE '${MARCA}%'`);
}

async function main() {
  const client = conexionResistente(pool);
  const navegador = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });
  try {
    await limpiar(client);

    // Una universidad de 5 licencias con 4 profesores dentro: quedan 1.
    const { rows: lic } = await client.query(
      `INSERT INTO licencias_docentes (id, institucion, "maxProfesores", "maxAlumnos", activa, "fechaInicio", "fechaFin", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, '${MARCA} Universidad', 5, 50, true, $1::date, $2::date, NOW(), NOW())
       RETURNING id`, [`${anio()}-09-01`, `${anio() + 1}-08-31`]);
    const licenciaId = lic[0].id as string;
    for (let i = 1; i <= 4; i++) {
      // La ficha necesita su usuario de autenticación: `authId` no admite nulos.
      const { rows: u } = await client.query(
        `INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
           created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous,
           confirmation_token, recovery_token, email_change_token_new, email_change,
           email_change_token_current, reauthentication_token, phone_change, phone_change_token)
         VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
           $1, crypt('CupoPrueba2026', gen_salt('bf')), NOW(), NOW(), NOW(),
           '{"provider":"email","providers":["email"]}', '{}'::jsonb, false, false, '','','','','','','','')
         RETURNING id`, [`p${i}@cupo.dev`]);
      await client.query(
        `INSERT INTO dietistas (id, "authId", email, nombre, apellidos, verificado, "rolDocente", "licenciaDocenteId", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, $2, 'Profe', $3, true, 'PROFESOR', $4, NOW(), NOW())`,
        [u[0].id, `p${i}@cupo.dev`, `${i}`, licenciaId]);
    }

    const admin = await navegador.newPage();
    await admin.setViewport({ width: 1440, height: 950 });
    admin.setDefaultNavigationTimeout(90_000);
    await admin.goto(`${BASE}/admin-login`, { waitUntil: "networkidle0" });
    await admin.evaluate((email, pass) => {
      const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
      const campos = Array.from(document.querySelectorAll("input"));
      const correo = campos.find((c) => c.type === "email") ?? campos[0];
      const clave = campos.find((c) => c.type === "password");
      if (correo) { set.call(correo, email); correo.dispatchEvent(new Event("input", { bubbles: true })); }
      if (clave) { set.call(clave, pass); clave.dispatchEvent(new Event("input", { bubbles: true })); }
    }, process.env.ADMIN_EMAILS!.split(",")[0].trim(), process.env.ADMIN_PASSWORD!);
    await admin.evaluate(() => (document.querySelector('form button[type="submit"]') as HTMLElement | null)?.click());
    await esperar(3000);

    console.log("\n── Con 5 licencias y 4 profesores dentro ──");
    await admin.goto(`${BASE}/admin/universidades/${licenciaId}`, { waitUntil: "networkidle0" });
    await esperar(1500);
    let visible = await texto(admin);
    comprobar("la ficha dice cuántas quedan por repartir", /Queda 1 plaza de profesor por repartir/i.test(visible),
      visible.split("\n").find((l) => /por repartir|No quedan plazas/i.test(l)) ?? "no lo dice");

    console.log("\n── Un enlace de 4 no puede crearse: solo queda 1 ──");
    await crearEnlaceDe(admin, 4);
    let { rows: enl } = await client.query(
      `SELECT plazas FROM enlaces_profesores WHERE "licenciaDocenteId" = $1`, [licenciaId]);
    comprobar("no se crea", enl.length === 0, enl.length ? `se creó de ${enl[0].plazas}` : "");
    const { rows: tope } = await client.query(`SELECT "maxProfesores" FROM licencias_docentes WHERE id = $1`, [licenciaId]);
    comprobar("y el tope de la universidad no se ha tocado", tope[0].maxProfesores === 5, `${tope[0].maxProfesores}`);

    console.log("\n── Un enlace de 1 sí ──");
    await admin.goto(`${BASE}/admin/universidades/${licenciaId}`, { waitUntil: "networkidle0" });
    await esperar(1200);
    await crearEnlaceDe(admin, 1);
    ({ rows: enl } = await client.query(
      `SELECT plazas, usadas FROM enlaces_profesores WHERE "licenciaDocenteId" = $1`, [licenciaId]));
    comprobar("se crea con su plaza", enl.length === 1 && enl[0].plazas === 1, `${enl.length} enlace(s)`);
    const { rows: tope2 } = await client.query(`SELECT "maxProfesores" FROM licencias_docentes WHERE id = $1`, [licenciaId]);
    comprobar("y sigue sin tocar el tope", tope2[0].maxProfesores === 5, `${tope2[0].maxProfesores}`);

    console.log("\n── Y ese enlace ya promete la última: no queda nada ──");
    await admin.goto(`${BASE}/admin/universidades/${licenciaId}`, { waitUntil: "networkidle0" });
    await esperar(1500);
    visible = await texto(admin);
    comprobar("la ficha lo dice", /No quedan plazas de profesor libres/i.test(visible),
      visible.split("\n").find((l) => /por repartir|No quedan plazas/i.test(l)) ?? "no lo dice");
    await crearEnlaceDe(admin, 1);
    ({ rows: enl } = await client.query(
      `SELECT plazas FROM enlaces_profesores WHERE "licenciaDocenteId" = $1`, [licenciaId]));
    comprobar("y no deja crear otro", enl.length === 1, `${enl.length} enlaces`);

    await limpiar(client);
  } finally {
    await navegador.close();
    await pool.end();
  }
  console.log(`\n${mal === 0 ? "✓ TODO CORRECTO" : "✗ HAY FALLOS"} — ${ok} bien, ${mal} mal`);
  process.exit(mal === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });

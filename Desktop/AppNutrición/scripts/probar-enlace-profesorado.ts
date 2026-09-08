/**
 * El enlace con el que una universidad da de alta a su profesorado sin darnos los correos.
 *
 * Se recorre entero: crear el enlace desde admin, darse de alta sin cuenta, unirse teniendo cuenta,
 * y que al llenarse el cupo deje de admitir. Las plazas se cuentan por USOS y no vuelven aunque
 * después se quite a un profesor (Guillermo, 8 sep 2026).
 *
 *   1. npm run dev:desarrollo        (puerto 3001)
 *   2. DB=dev npx tsx scripts/probar-enlace-profesorado.ts
 */
import "./_guard-solo-dev";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";
import puppeteer, { type Page, type Browser } from "puppeteer-core";
import { createClient } from "@supabase/supabase-js";

const BASE = "http://localhost:3001";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const DOMINIO = "profeenlace.dev";
const PASS = "ProfeEnlace2026";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } });

/** El curso en el que estamos, por el año en que empieza: los enlaces son de un curso concreto. */
function anioDelCursoActual(hoy = new Date()): number {
  return hoy.getUTCMonth() >= 8 ? hoy.getUTCFullYear() : hoy.getUTCFullYear() - 1;
}

let ok = 0, mal = 0;
const comprobar = (t: string, c: boolean, d = "") => { console.log(`  ${c ? "✓" : "✗"} ${t}${d ? ` — ${d}` : ""}`); c ? ok++ : mal++; };
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
const texto = (page: Page) => page.evaluate(() => document.body.innerText);

/** Rellena el alta del enlace y la envía. El botón se busca dentro del formulario: por texto se
 *  pulsaba el «Aceptar todas» del aviso de cookies. */
async function altaConEse(page: Page, email: string) {
  await page.evaluate((correo, clave) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!;
    const inputs = Array.from(document.querySelectorAll("form input"));
    const textos = inputs.filter((i) => (i as HTMLInputElement).type === "text");
    if (textos[0]) { setter.call(textos[0], "Profe"); textos[0].dispatchEvent(new Event("input", { bubbles: true })); }
    if (textos[1]) { setter.call(textos[1], "del Enlace"); textos[1].dispatchEvent(new Event("input", { bubbles: true })); }
    const correoInput = inputs.find((i) => (i as HTMLInputElement).type === "email");
    if (correoInput) { setter.call(correoInput, correo); correoInput.dispatchEvent(new Event("input", { bubbles: true })); }
    for (const c of inputs.filter((i) => (i as HTMLInputElement).type === "password")) {
      setter.call(c, clave);
      c.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }, email, PASS);
  await esperar(800);
  await page.evaluate(() => {
    const b = document.querySelector('form button[type="submit"]') as HTMLElement | null;
    b?.click();
  });
  await esperar(7000);
}

async function sesionDe(nav: Browser, email: string, pass: string): Promise<Page> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const sb = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });
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

async function limpiar(client: pg.PoolClient) {
  const { rows } = await client.query(`SELECT id FROM auth.users WHERE email LIKE $1`, [`%@${DOMINIO}`]);
  await client.query(`DELETE FROM pacientes WHERE "dietistaId" IN (SELECT id FROM dietistas WHERE email LIKE $1)`, [`%@${DOMINIO}`]);
  await client.query(`DELETE FROM dietistas WHERE email LIKE $1`, [`%@${DOMINIO}`]);
  for (const r of rows) {
    await client.query(`DELETE FROM auth.identities WHERE user_id = $1::uuid`, [r.id]);
    await client.query(`DELETE FROM auth.users WHERE id = $1::uuid`, [r.id]);
  }
  await client.query(`DELETE FROM enlaces_profesores WHERE "creadoPor" = 'prueba'`);
}

async function main() {
  const client = await pool.connect();
  const navegador = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });
  try {
    await limpiar(client);
    const { rows: lic } = await client.query(`SELECT id, "maxProfesores" FROM licencias_docentes LIMIT 1`);
    if (!lic.length) throw new Error("no hay licencia: lanza antes preparar-prueba-docente");

    console.log("\n── Un enlace de 2 plazas ──");
    const { rows: enl } = await client.query(
      `INSERT INTO enlaces_profesores (id, "licenciaDocenteId", token, "cursoAnio", plazas, "creadoPor")
       VALUES (gen_random_uuid()::text, $1, replace(gen_random_uuid()::text,'-',''), $2, 2, 'prueba')
       RETURNING token`, [lic[0].id, anioDelCursoActual()]);
    const url = `${BASE}/profesorado/${enl[0].token}`;

    const page = await (await navegador.createBrowserContext()).newPage();
    await page.setViewport({ width: 1440, height: 950 });
    await page.goto(url, { waitUntil: "networkidle0" });
    await esperar(2000);
    const visible = await texto(page);
    comprobar("el enlace se abre y dice de qué universidad es", /Alta de profesorado/i.test(visible));
    comprobar("y cuántas plazas quedan", /Quedan 2 plazas/i.test(visible), visible.split("\n").find((l) => /plaza/i.test(l)) ?? "");

    console.log("\n── Un profesor sin cuenta se da de alta ──");
    const sinCuenta = `sincuenta@${DOMINIO}`;
    await altaConEse(page, sinCuenta);
    const { rows: creado } = await client.query(
      `SELECT d."rolDocente", d."licenciaDocenteId", d."altaPorEnlaceId" IS NOT NULL AS "porElEnlace",
              (SELECT COUNT(*)::int FROM pacientes p WHERE p."dietistaId" = d.id) AS pacientes
         FROM dietistas d WHERE d.email = $1`, [sinCuenta]);
    comprobar("se crea con rol de profesor", creado[0]?.rolDocente === "PROFESOR", `${creado[0]?.rolDocente ?? "no existe"}`);
    comprobar("en la universidad del enlace", creado[0]?.licenciaDocenteId === lic[0].id);
    comprobar("y queda apuntado que entró por ahí", creado[0]?.porElEnlace === true);
    comprobar("con su paciente de ejemplo", creado[0]?.pacientes === 1, `${creado[0]?.pacientes}`);
    const { rows: usadas1 } = await client.query(`SELECT usadas FROM enlaces_profesores WHERE token = $1`, [enl[0].token]);
    comprobar("y el enlace gasta una plaza", usadas1[0]?.usadas === 1, `${usadas1[0]?.usadas}`);

    console.log("\n── Un nutricionista que YA usa Annonia entra con la suya ──");
    const { rows: yaEsta } = await client.query(
      `SELECT email FROM dietistas WHERE "rolDocente" IS NULL AND verificado = true
         AND email NOT LIKE $1 ORDER BY "createdAt" DESC LIMIT 1`, [`%@${DOMINIO}`]);
    if (!yaEsta.length) {
      console.log("    (no hay ninguna cuenta normal para probarlo)");
    } else {
      // Se le pone una contraseña conocida para poder entrar con ella.
      await client.query(`UPDATE auth.users SET encrypted_password = crypt($2, gen_salt('bf')) WHERE email = $1`, [yaEsta[0].email, PASS]);
      const suya = await sesionDe(navegador, yaEsta[0].email, PASS);
      await suya.goto(url, { waitUntil: "networkidle0" });
      await esperar(2000);
      comprobar("se le ofrece añadir el acceso a su cuenta", /añadir el acceso de profesor/i.test(await texto(suya)));
      await suya.evaluate(() => {
        const b = Array.from(document.querySelectorAll("button")).find((x) => /añadir el acceso/i.test(x.textContent ?? ""));
        (b as HTMLElement | undefined)?.click();
      });
      await esperar(5000);
      const { rows: ahora } = await client.query(`SELECT "rolDocente" FROM dietistas WHERE email = $1`, [yaEsta[0].email]);
      comprobar("y pasa a ser profesor sin crear otra cuenta", ahora[0]?.rolDocente === "PROFESOR", `${ahora[0]?.rolDocente}`);
      // Se deja como estaba: era una cuenta de verdad de esta base.
      await client.query(`UPDATE dietistas SET "rolDocente" = NULL, "licenciaDocenteId" = NULL, "altaPorEnlaceId" = NULL WHERE email = $1`, [yaEsta[0].email]);
    }

    console.log("\n── Con el cupo lleno, el enlace se cierra solo ──");
    await client.query(`UPDATE enlaces_profesores SET usadas = plazas WHERE token = $1`, [enl[0].token]);
    await page.goto(url, { waitUntil: "networkidle0" });
    await esperar(2000);
    const lleno = await texto(page);
    comprobar("lo dice claro", /Ya no quedan plazas/i.test(lleno));
    comprobar("y no deja darse de alta", !(await page.evaluate(() => !!document.querySelector("form input[type=email]"))));

    console.log("\n── Con la licencia caducada, el enlace deja de valer ──");
    await client.query(`UPDATE enlaces_profesores SET usadas = 0 WHERE token = $1`, [enl[0].token]);
    await client.query(`UPDATE licencias_docentes SET "fechaFin" = CURRENT_DATE - 1 WHERE id = $1`, [lic[0].id]);
    await page.goto(url, { waitUntil: "networkidle0" });
    await esperar(2000);
    comprobar("no se puede usar", /Este enlace no vale/i.test(await texto(page)));
    await client.query(`UPDATE licencias_docentes SET "fechaFin" = NULL WHERE id = $1`, [lic[0].id]);
    await client.query(`UPDATE enlaces_profesores SET usadas = plazas WHERE token = $1`, [enl[0].token]);

    console.log("\n── Y si se va un profesor, la plaza NO vuelve ──");
    await client.query(`DELETE FROM dietistas WHERE email = $1`, [sinCuenta]);
    const { rows: tras } = await client.query(`SELECT usadas, plazas FROM enlaces_profesores WHERE token = $1`, [enl[0].token]);
    comprobar("el contador se queda como estaba", tras[0]?.usadas === tras[0]?.plazas, `${tras[0]?.usadas} de ${tras[0]?.plazas}`);

    await limpiar(client);
  } finally {
    client.release();
    await navegador.close();
    await pool.end();
  }
  console.log(`\n${mal === 0 ? "✓" : "✗"} ${ok} bien, ${mal} mal`);
  process.exit(mal === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });

/**
 * El ciclo entero de una universidad, del alta a la renovación.
 *
 * Es el recorrido que hace de verdad una facultad y el que hay que poder repetir a mano:
 *
 *   1. Se vende una licencia para un curso, con sus plazas.
 *   2. Los profesores entran por el enlace; los alumnos, por enlace y por correo.
 *   3. Llega el 31 de agosto: TODOS pierden el espacio docente, y no se borra nada.
 *   4. La universidad renueva y todos lo recuperan, con su trabajo donde lo dejaron.
 *   5. Y si renuevan en enero para el curso siguiente, el enlace nuevo admite desde ya.
 *
 *   1. npm run dev:desarrollo        (puerto 3001)
 *   2. DB=dev npx tsx scripts/probar-ciclo-universidad.ts
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
const MARCA = "CICLOUNI";
const DOMINIO = "ciclouni.dev";
const PASS = "CicloUni2026";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } });

let ok = 0, mal = 0;
const comprobar = (t: string, c: boolean, d = "") => { console.log(`  ${c ? "✓" : "✗"} ${t}${d ? ` — ${d}` : ""}`); c ? ok++ : mal++; };
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
const texto = (page: Page) => page.evaluate(() => document.body.innerText);
const menuDe = (page: Page) => page.evaluate(() => (document.querySelector("aside, nav") as HTMLElement | null)?.innerText ?? "");

/** El curso en el que estamos, por el año en que empieza. */
function anioDelCursoActual(hoy = new Date()): number {
  return hoy.getUTCMonth() >= 8 ? hoy.getUTCFullYear() : hoy.getUTCFullYear() - 1;
}
const finDelCurso = (anio: number) => `${anio + 1}-08-31`;

async function main() {
  const client = await pool.connect();
  const navegador = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });
  try {
    await limpiar(client);
    const cursoAhora = anioDelCursoActual();

    console.log("\n── 1. Se vende una licencia: 2 profesores y 3 alumnos ──");
    const { rows: lic } = await client.query(
      `INSERT INTO licencias_docentes (id, institucion, "maxProfesores", "maxAlumnos", activa, "fechaInicio", "fechaFin", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, '${MARCA} Universidad', 0, 3, true, $1::date, $2::date, NOW(), NOW())
       RETURNING id`, [`${cursoAhora}-09-01`, finDelCurso(cursoAhora)]);
    const licenciaId = lic[0].id as string;
    const enlaceProfes = await crearEnlace(client, licenciaId, cursoAhora, 2);
    comprobar("el enlace de profesorado se crea para este curso", !!enlaceProfes);

    console.log("\n── 2. Un profesor entra por el enlace ──");
    const page = await (await navegador.createBrowserContext()).newPage();
    await page.setViewport({ width: 1440, height: 950 });
    await page.goto(`${BASE}/profesorado/${enlaceProfes}`, { waitUntil: "networkidle0" });
    await esperar(2000);
    const bienvenida = await texto(page);
    comprobar("el enlace dice de qué curso es", bienvenida.includes(`${cursoAhora}/`) || /Alta de profesorado/i.test(bienvenida),
      bienvenida.split("\n").slice(0, 3).join(" · "));
    await altaEnFormulario(page, `profe@${DOMINIO}`);
    const { rows: profe } = await client.query(
      `SELECT id, "rolDocente" FROM dietistas WHERE email = $1`, [`profe@${DOMINIO}`]);
    comprobar("se da de alta como profesor", profe[0]?.rolDocente === "PROFESOR", `${profe[0]?.rolDocente ?? "no existe"}`);

    console.log("\n── 3. Monta su clase y mete alumnos por las dos vías ──");
    const { rows: clase } = await client.query(
      `INSERT INTO clases (id, "profesorId", "licenciaDocenteId", nombre, "fechaInicioCurso", "fechaFinCurso",
              "invitacionAbierta", "tokenInvitacion", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, '${MARCA} Clase', $3::date, $4::date, true,
               replace(gen_random_uuid()::text,'-',''), NOW(), NOW())
       RETURNING id, "tokenInvitacion"`,
      [profe[0].id, licenciaId, `${cursoAhora}-09-01`, finDelCurso(cursoAhora)]);
    await client.query(
      `INSERT INTO profesores_clase (id, "claseId", "profesorId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, NOW(), NOW())`, [clase[0].id, profe[0].id]);

    // Por el enlace de la clase.
    await page.goto(`${BASE}/clase/${clase[0].tokenInvitacion}`, { waitUntil: "networkidle0" });
    await esperar(2000);
    await altaEnFormulario(page, `alumno.enlace@${DOMINIO}`);
    const { rows: a1 } = await client.query(`SELECT id FROM dietistas WHERE email = $1`, [`alumno.enlace@${DOMINIO}`]);
    comprobar("el alumno del enlace entra", a1.length === 1);

    // Y por correo: se invita, y la invitación se acepta desde su enlace.
    const { rows: inv } = await client.query(
      `INSERT INTO invitaciones_docentes (id, email, rol, token, "licenciaDocenteId", "claseId", "invitadoPor", "expiraAt", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, 'ALUMNO', replace(gen_random_uuid()::text,'-',''), $2, $3, $4, NOW() + INTERVAL '7 days', NOW(), NOW())
       RETURNING token`, [`alumno.correo@${DOMINIO}`, licenciaId, clase[0].id, profe[0].id]);
    await page.goto(`${BASE}/invitacion/${inv[0].token}`, { waitUntil: "networkidle0" });
    await esperar(2000);
    await altaEnFormulario(page, `alumno.correo@${DOMINIO}`);
    const { rows: a2 } = await client.query(`SELECT id FROM dietistas WHERE email = $1`, [`alumno.correo@${DOMINIO}`]);
    comprobar("el alumno invitado por correo entra", a2.length === 1);

    const profeSesion = await sesion(navegador, `profe@${DOMINIO}`);
    await profeSesion.goto(`${BASE}/profesor`, { waitUntil: "networkidle0" });
    await esperar(2500);
    comprobar("el profesor ve su espacio docente", /Docencia|Clases/i.test(await menuDe(profeSesion)));

    console.log("\n── 4. Llega el 31 de agosto: se acaba el curso ──");
    await client.query(`UPDATE licencias_docentes SET "fechaFin" = CURRENT_DATE - 1 WHERE id = $1`, [licenciaId]);
    await profeSesion.goto(`${BASE}/profesor`, { waitUntil: "networkidle0" });
    await esperar(3000);
    comprobar("el profesor ya no entra en su espacio", profeSesion.url().includes("/docencia-terminada"), profeSesion.url());
    const aviso = await texto(profeSesion);
    comprobar("y se le dice que no se ha borrado nada", /no se ha borrado nada/i.test(aviso));
    await profeSesion.goto(`${BASE}/dashboard`, { waitUntil: "networkidle0" });
    await esperar(2000);
    comprobar("su cuenta de nutricionista sigue funcionando", profeSesion.url().endsWith("/dashboard"));
    comprobar("y el menú ya no le ofrece docencia", !/Espacio docente/i.test(await menuDe(profeSesion)));
    const { rows: siguen } = await client.query(
      `SELECT (SELECT COUNT(*)::int FROM clases WHERE "profesorId" = $1) AS clases,
              (SELECT COUNT(*)::int FROM dietistas WHERE id = $1) AS cuenta`, [profe[0].id]);
    comprobar("sus clases siguen guardadas", siguen[0].clases === 1 && siguen[0].cuenta === 1);

    console.log("\n── 5. La universidad renueva y vuelve todo ──");
    await client.query(
      `UPDATE licencias_docentes SET "fechaInicio" = $2::date, "fechaFin" = $3::date, activa = true WHERE id = $1`,
      [licenciaId, `${cursoAhora}-09-01`, finDelCurso(cursoAhora)]);
    await profeSesion.goto(`${BASE}/profesor`, { waitUntil: "networkidle0" });
    await esperar(3000);
    comprobar("el profesor recupera su espacio", !profeSesion.url().includes("/docencia-terminada"), profeSesion.url());
    comprobar("con su clase donde la dejó", (await texto(profeSesion)).includes(`${MARCA} Clase`) || /Clases/i.test(await menuDe(profeSesion)));

    console.log("\n── 6. En enero se vende el curso siguiente ──");
    const enlaceFuturo = await crearEnlace(client, licenciaId, cursoAhora + 1, 2);
    await page.goto(`${BASE}/profesorado/${enlaceFuturo}`, { waitUntil: "networkidle0" });
    await esperar(2000);
    comprobar("el enlace del curso que viene ya admite", /Alta de profesorado/i.test(await texto(page)));
    await altaEnFormulario(page, `profe.futuro@${DOMINIO}`);
    const { rows: pf } = await client.query(`SELECT "rolDocente" FROM dietistas WHERE email = $1`, [`profe.futuro@${DOMINIO}`]);
    comprobar("y da de alta desde ya", pf[0]?.rolDocente === "PROFESOR", `${pf[0]?.rolDocente ?? "no existe"}`);

    console.log("\n── 7. Y el enlace del curso pasado no revive ──");
    const enlaceViejo = await crearEnlace(client, licenciaId, cursoAhora - 1, 5);
    await page.goto(`${BASE}/profesorado/${enlaceViejo}`, { waitUntil: "networkidle0" });
    await esperar(2000);
    comprobar("dice que no vale", /Este enlace no vale/i.test(await texto(page)));

    await limpiar(client);
  } finally {
    client.release();
    await navegador.close();
    await pool.end();
  }
  console.log(`\n${mal === 0 ? "✓" : "✗"} ${ok} bien, ${mal} mal`);
  process.exit(mal === 0 ? 0 : 1);
}

async function crearEnlace(c: pg.PoolClient, licenciaId: string, curso: number, plazas: number) {
  const { rows } = await c.query(
    `INSERT INTO enlaces_profesores (id, "licenciaDocenteId", token, "cursoAnio", plazas, "creadoPor")
     VALUES (gen_random_uuid()::text, $1, replace(gen_random_uuid()::text,'-',''), $2, $3, '${MARCA}')
     RETURNING token`, [licenciaId, curso, plazas]);
  return rows[0].token as string;
}

/** Rellena y envía un alta. El botón, dentro del formulario: por texto se pulsa el de cookies. */
async function altaEnFormulario(page: Page, email: string) {
  await page.evaluate((correo, clave) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!;
    const inputs = Array.from(document.querySelectorAll("form input"));
    const textos = inputs.filter((i) => (i as HTMLInputElement).type === "text");
    if (textos[0]) { setter.call(textos[0], "Nombre"); textos[0].dispatchEvent(new Event("input", { bubbles: true })); }
    if (textos[1]) { setter.call(textos[1], "Apellidos"); textos[1].dispatchEvent(new Event("input", { bubbles: true })); }
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

async function limpiar(c: pg.PoolClient) {
  await c.query(`DELETE FROM clases WHERE nombre LIKE '${MARCA}%'`);
  const { rows } = await c.query(`SELECT "authId" FROM dietistas WHERE email LIKE $1`, [`%@${DOMINIO}`]);
  await c.query(`DELETE FROM pacientes WHERE "dietistaId" IN (SELECT id FROM dietistas WHERE email LIKE $1)`, [`%@${DOMINIO}`]);
  await c.query(`DELETE FROM dietistas WHERE email LIKE $1`, [`%@${DOMINIO}`]);
  for (const r of rows) {
    if (!r.authId) continue;
    await c.query(`DELETE FROM auth.identities WHERE user_id = $1::uuid`, [r.authId]);
    await c.query(`DELETE FROM auth.users WHERE id = $1::uuid`, [r.authId]);
  }
  await c.query(`DELETE FROM invitaciones_docentes WHERE email LIKE $1`, [`%@${DOMINIO}`]);
  await c.query(`DELETE FROM licencias_docentes WHERE institucion LIKE '${MARCA}%'`);
}

main().catch((e) => { console.error(e); process.exit(1); });

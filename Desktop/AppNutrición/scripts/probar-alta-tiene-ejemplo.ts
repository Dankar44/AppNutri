/**
 * Toda cuenta nueva nace con su paciente de ejemplo, se cree por donde se cree.
 *
 * Es lo primero que ve alguien el primer día, y sin él la cuenta está vacía y no sabe por dónde
 * empezar. La llamada que lo crea va sin esperar y con el error silenciado en algunos caminos, así
 * que leerlo en el código no basta: aquí se recorren los tres caminos docentes de verdad y se mira
 * la base (Guillermo, 8 sep 2026: "verifícame cien por cien que cuando se crea un alumno lo tiene").
 *
 *   1. npm run dev:desarrollo        (puerto 3001)
 *   2. DB=dev npx tsx scripts/probar-alta-tiene-ejemplo.ts
 */
import "./_guard-solo-dev";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";
import puppeteer, { type Page, type Browser } from "puppeteer-core";

const BASE = "http://localhost:3001";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PASS = "AltaPrueba2026";
const DOMINIO = "altaprueba.dev";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } });

let ok = 0, mal = 0;
const comprobar = (t: string, c: boolean, d = "") => { console.log(`  ${c ? "✓" : "✗"} ${t}${d ? ` — ${d}` : ""}`); c ? ok++ : mal++; };
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Rellena nombre, apellidos, correo y contraseñas de un alta y la envía. */
async function rellenarYEnviar(page: Page, email: string) {
  await page.evaluate((correo, clave) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!;
    const inputs = Array.from(document.querySelectorAll("input"));
    const textos = inputs.filter((i) => i.type === "text");
    if (textos[0]) { setter.call(textos[0], "Nueva"); textos[0].dispatchEvent(new Event("input", { bubbles: true })); }
    if (textos[1]) { setter.call(textos[1], "Cuenta"); textos[1].dispatchEvent(new Event("input", { bubbles: true })); }
    const correoInput = inputs.find((i) => i.type === "email");
    if (correoInput) { setter.call(correoInput, correo); correoInput.dispatchEvent(new Event("input", { bubbles: true })); }
    for (const c of inputs.filter((i) => i.type === "password")) {
      setter.call(c, clave);
      c.dispatchEvent(new Event("input", { bubbles: true }));
    }
  }, email, PASS);
  await esperar(900);
  // El botón se busca DENTRO del formulario: por texto se pulsaba el «Aceptar todas» del aviso de
  // cookies, que también encaja y va después en la página.
  await page.evaluate(() => {
    const form = document.querySelector("form");
    const submit = form?.querySelector('button[type="submit"], button:not([type])') as HTMLElement | null;
    if (submit) { submit.click(); return; }
    const b = Array.from(document.querySelectorAll("form button"))
      .filter((x) => !(x as HTMLButtonElement).disabled);
    (b[b.length - 1] as HTMLElement | undefined)?.click();
  });
  await esperar(8000);
}

/** Cuántos pacientes tiene esa cuenta, y cómo se llama el primero. */
async function pacientesDe(client: pg.PoolClient, email: string) {
  const { rows } = await client.query(
    `SELECT p.nombre FROM pacientes p JOIN dietistas d ON d.id = p."dietistaId" WHERE d.email = $1`, [email]);
  return rows.map((r) => r.nombre as string);
}

async function limpiar(client: pg.PoolClient) {
  const { rows } = await client.query(`SELECT id FROM auth.users WHERE email LIKE $1`, [`%@${DOMINIO}`]);
  await client.query(`DELETE FROM dietistas WHERE email LIKE $1`, [`%@${DOMINIO}`]);
  for (const r of rows) {
    await client.query(`DELETE FROM auth.identities WHERE user_id = $1::uuid`, [r.id]);
    await client.query(`DELETE FROM auth.users WHERE id = $1::uuid`, [r.id]);
  }
  await client.query(`DELETE FROM invitaciones_docentes WHERE email LIKE $1`, [`%@${DOMINIO}`]);
}

async function main() {
  const client = await pool.connect();
  const navegador = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });
  try {
    await limpiar(client);
    const { rows: clase } = await client.query(`SELECT id, "tokenInvitacion" FROM clases LIMIT 1`);
    if (!clase.length) throw new Error("no hay clase: lanza antes preparar-prueba-docente");
    if (!clase[0].tokenInvitacion) {
      await client.query(
        `UPDATE clases SET "tokenInvitacion" = replace(gen_random_uuid()::text, '-', ''), "invitacionAbierta" = true WHERE id = $1`,
        [clase[0].id]);
    }
    const { rows: c2 } = await client.query(`SELECT "tokenInvitacion" FROM clases WHERE id = $1`, [clase[0].id]);

    console.log("\n── Alumno que se apunta por el enlace de la clase ──");
    const porEnlace = `enlace@${DOMINIO}`;
    const page = await (await navegador.createBrowserContext()).newPage();
    await page.setViewport({ width: 1440, height: 950 });
    await page.goto(`${BASE}/clase/${c2[0].tokenInvitacion}`, { waitUntil: "networkidle0" });
    await esperar(2000);
    await rellenarYEnviar(page, porEnlace);
    const { rows: creado1 } = await client.query(`SELECT "rolDocente" FROM dietistas WHERE email = $1`, [porEnlace]);
    comprobar("la cuenta se crea como alumno", creado1[0]?.rolDocente === "ALUMNO", `${creado1[0]?.rolDocente ?? "no existe"}`);
    const pac1 = await pacientesDe(client, porEnlace);
    comprobar("y nace con su paciente de ejemplo", pac1.length === 1, pac1.join(", ") || "ninguno");

    console.log("\n── Alumno invitado por correo ──");
    const porCorreo = `correo@${DOMINIO}`;
    const { rows: lic } = await client.query(`SELECT id FROM licencias_docentes LIMIT 1`);
    const { rows: profe } = await client.query(`SELECT id FROM dietistas WHERE "rolDocente" = 'PROFESOR' LIMIT 1`);
    const { rows: inv } = await client.query(
      `INSERT INTO invitaciones_docentes (id, email, rol, token, "licenciaDocenteId", "claseId", "invitadoPor", "expiraAt", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, 'ALUMNO', replace(gen_random_uuid()::text, '-', ''), $2, $3, $4, NOW() + INTERVAL '7 days', NOW(), NOW())
       RETURNING token`, [porCorreo, lic[0]?.id ?? null, clase[0].id, profe[0]?.id ?? null]);
    await page.goto(`${BASE}/invitacion/${inv[0].token}`, { waitUntil: "networkidle0" });
    await esperar(2000);
    await rellenarYEnviar(page, porCorreo);
    const { rows: creado2 } = await client.query(`SELECT "rolDocente" FROM dietistas WHERE email = $1`, [porCorreo]);
    comprobar("la cuenta se crea como alumno", creado2[0]?.rolDocente === "ALUMNO", `${creado2[0]?.rolDocente ?? "no existe"}`);
    const pac2 = await pacientesDe(client, porCorreo);
    comprobar("y nace con su paciente de ejemplo", pac2.length === 1, pac2.join(", ") || "ninguno");

    console.log("\n── Profesor invitado por correo ──");
    const profeNuevo = `profe@${DOMINIO}`;
    const { rows: inv2 } = await client.query(
      `INSERT INTO invitaciones_docentes (id, email, rol, token, "licenciaDocenteId", "invitadoPor", "expiraAt", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, 'PROFESOR', replace(gen_random_uuid()::text, '-', ''), $2, $3, NOW() + INTERVAL '7 days', NOW(), NOW())
       RETURNING token`, [profeNuevo, lic[0]?.id ?? null, profe[0]?.id ?? null]);
    await page.goto(`${BASE}/invitacion/${inv2[0].token}`, { waitUntil: "networkidle0" });
    await esperar(2000);
    await rellenarYEnviar(page, profeNuevo);
    const { rows: creado3 } = await client.query(`SELECT "rolDocente" FROM dietistas WHERE email = $1`, [profeNuevo]);
    comprobar("la cuenta se crea como profesor", creado3[0]?.rolDocente === "PROFESOR", `${creado3[0]?.rolDocente ?? "no existe"}`);
    const pac3 = await pacientesDe(client, profeNuevo);
    comprobar("y nace con su paciente de ejemplo", pac3.length === 1, pac3.join(", ") || "ninguno");

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

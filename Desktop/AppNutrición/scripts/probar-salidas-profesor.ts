/**
 * #39 — Las tres salidas de un profesor, a clics (Guillermo, 6 sep 2026):
 *
 *   1. Salir de UNA clase, siguiendo en la facultad. Si la creó él, pasa a quien se queda.
 *   2. Salir de la UNIVERSIDAD: libera la plaza, pierde las clases, sigue siendo docente.
 *   3. Dejar de ser profesor: vuelve a su cuenta de nutricionista.
 *
 * Y lo que las hace útiles: a un docente sin universidad se le puede meter en otra.
 *
 *   1. npm run dev:desarrollo        (puerto 3001)
 *   2. DB=dev npx tsx scripts/probar-salidas-profesor.ts
 *
 * Crea sus datos y los borra. Solo con DB=dev.
 */
import "./_guard-solo-dev";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";
import puppeteer, { type Page, type Browser } from "puppeteer-core";
import { createClient } from "@supabase/supabase-js";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3001";
const DIR = "/tmp/annonia-salidas";
const MARCA = "PRUEBA Salidas";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } });

const ANA = { email: "salidas.ana@annonia.dev", pass: "SalidasPrueba_1", apellidos: "Ana" };
const BEA = { email: "salidas.bea@annonia.dev", pass: "SalidasPrueba_2", apellidos: "Bea" };

let ok = 0, mal = 0;
const comprobar = (t: string, c: boolean, d = "") => { console.log(`  ${c ? "✓" : "✗"} ${t}${d ? ` — ${d}` : ""}`); c ? ok++ : mal++; };
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
const texto = (p: Page) => p.evaluate(() => document.body.innerText);
let nFoto = 0;
/** Una captura de cada pantalla nueva, para poder mirarlas y no fiarse solo de las aserciones. */
async function foto(p: Page, nombre: string) {
  await esperar(700);
  nFoto++;
  await p.screenshot({ path: `${DIR}/${String(nFoto).padStart(2, "0")}-${nombre}.png` as `${string}.png`, fullPage: true });
}

/** Pulsa lo que esté encima: si hay un diálogo abierto, solo dentro de él. */
async function pulsar(page: Page, tx: string) {
  const hecho = await page.evaluate((t) => {
    const modales = Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"]'));
    const raiz: ParentNode = modales.length > 0 ? modales[modales.length - 1] : document;
    const n = Array.from(raiz.querySelectorAll("button, a, summary")).find((x) => x.textContent?.trim().startsWith(t));
    if (!n) return false;
    (n as HTMLElement).click();
    return true;
  }, tx);
  if (!hecho) console.log(`  (no encontré «${tx}»)`);
  await esperar(900);
  return hecho;
}

async function crearProfesor(client: pg.PoolClient, quien: typeof ANA, licenciaId: string | null) {
  const { rows } = await client.query(
    `INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
       created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous,
       confirmation_token, recovery_token, email_change_token_new, email_change,
       email_change_token_current, reauthentication_token, phone_change, phone_change_token)
     VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
       $1, crypt($2, gen_salt('bf')), NOW(), NOW(), NOW(),
       '{"provider":"email","providers":["email"]}', '{}'::jsonb, false, false, '','','','','','','','')
     RETURNING id`, [quien.email, quien.pass]);
  const authId = rows[0].id as string;
  await client.query(
    `INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
     VALUES (gen_random_uuid(), $1::uuid, $1::text, 'email',
       jsonb_build_object('sub',$1::text,'email',$2::text,'email_verified',true,'provider','email'), NOW(), NOW(), NOW())`,
    [authId, quien.email]);
  const { rows: d } = await client.query(
    `INSERT INTO dietistas (id, "authId", email, nombre, apellidos, verificado, "rolDocente", "licenciaDocenteId", "createdAt", "updatedAt")
     VALUES (gen_random_uuid()::text, $1, $2, 'Profesora', $3, true, 'PROFESOR', $4, NOW(), NOW()) RETURNING id`,
    [authId, quien.email, quien.apellidos, licenciaId]);
  return d[0].id as string;
}

async function sesionDe(navegador: Browser, email: string, pass: string): Promise<Page> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const sb = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });
  if (error) throw new Error(`login de ${email}: ${error.message}`);
  const ref = url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1];
  const page = await (await navegador.createBrowserContext()).newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.evaluateOnNewDocument(() => {
    try { localStorage.setItem("annonia-welcome-dietista", "1"); localStorage.setItem("annonia-cookie-consent", "rejected"); } catch { /* da igual */ }
  });
  await page.setCookie({
    name: `sb-${ref}-auth-token`,
    value: "base64-" + Buffer.from(JSON.stringify(data.session)).toString("base64"),
    domain: "localhost", path: "/",
  });
  return page;
}

async function limpiar(client: pg.PoolClient) {
  await client.query(`DELETE FROM clases WHERE nombre LIKE '${MARCA}%'`);
  for (const p of [ANA, BEA]) {
    const { rows } = await client.query(`SELECT id FROM auth.users WHERE email = $1`, [p.email]);
    for (const r of rows) {
      await client.query(`DELETE FROM dietistas WHERE "authId" = $1`, [r.id]);
      await client.query(`DELETE FROM auth.identities WHERE user_id = $1::uuid`, [r.id]);
      await client.query(`DELETE FROM auth.users WHERE id = $1::uuid`, [r.id]);
    }
  }
  await client.query(`DELETE FROM licencias_docentes WHERE institucion LIKE '${MARCA}%'`);
}

async function main() {
  mkdirSync(DIR, { recursive: true });
  const client = await pool.connect();
  const navegador = await puppeteer.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true, args: ["--no-sandbox"],
  });

  try {
    await limpiar(client);

    const { rows: lic } = await client.query(
      `INSERT INTO licencias_docentes (id, institucion, "maxProfesores", "maxAlumnos", "fechaFin", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, 4, 20, '2027-08-31', NOW(), NOW()) RETURNING id`, [`${MARCA} Uno`]);
    const { rows: lic2 } = await client.query(
      `INSERT INTO licencias_docentes (id, institucion, "maxProfesores", "maxAlumnos", "fechaFin", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, 4, 20, '2027-08-31', NOW(), NOW()) RETURNING id`, [`${MARCA} Dos`]);
    const licenciaId = lic[0].id as string;
    const otraLicenciaId = lic2[0].id as string;

    const anaId = await crearProfesor(client, ANA, licenciaId);
    const beaId = await crearProfesor(client, BEA, licenciaId);

    // Dos clases: una compartida (la creó Ana y Bea la lleva con ella) y otra solo de Ana.
    const crearClase = async (nombre: string, duenoId: string, tambien: string[] = []) => {
      const { rows } = await client.query(
        `INSERT INTO clases (id, "profesorId", "licenciaDocenteId", nombre, "fechaInicioCurso", "fechaFinCurso", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, NOW(), '2027-08-31', NOW(), NOW()) RETURNING id`,
        [duenoId, licenciaId, nombre]);
      const claseId = rows[0].id as string;
      for (const p of [duenoId, ...tambien]) {
        await client.query(
          `INSERT INTO profesores_clase (id, "claseId", "profesorId", "createdAt", "updatedAt")
           VALUES (gen_random_uuid()::text, $1, $2, NOW(), NOW())`, [claseId, p]);
      }
      return claseId;
    };
    const compartida = await crearClase(`${MARCA} compartida`, anaId, [beaId]);
    // Otra que Ana y Bea llevan juntas y de la que Bea NO se va: es la que tiene que cambiar de
    // manos cuando Ana deje la facultad, en vez de archivarse.
    const conRelevo = await crearClase(`${MARCA} con relevo`, anaId, [beaId]);
    const suya = await crearClase(`${MARCA} solo de Ana`, anaId);

    const ana = await sesionDe(navegador, ANA.email, ANA.pass);
    const bea = await sesionDe(navegador, BEA.email, BEA.pass);

    console.log("\n── 1. Salir de una clase que llevo con otra profesora ──");
    await bea.goto(`${BASE}/profesor/clases/${compartida}`, { waitUntil: "networkidle0" });
    let visible = await texto(bea);
    const meVeoMarcada = await bea.evaluate(() =>
      Array.from(document.querySelectorAll("span")).some((n) => n.textContent?.trim() === "Tú"));
    comprobar("Bea se ve a sí misma en la lista, marcada", meVeoMarcada);
    comprobar("y tiene «Salir de esta clase»", visible.includes("Salir de esta clase"));
    comprobar("pero no puede quitar a Ana: no creó la clase", !visible.includes("Quitar de la clase"));
    // Borrar es irreversible: quien no creó la clase no puede llevarse por delante los alumnos y
    // las entregas de quien sí la creó.
    comprobar("ni eliminar la clase de otra", !visible.includes("Eliminar"));
    await foto(bea, "clase-con-dos-profesoras");
    await pulsar(bea, "Salir de esta clase");
    await esperar(500);
    comprobar("el aviso dice que sigue siendo profesora de su facultad", /sigues siendo profesor/i.test(await texto(bea)));
    await foto(bea, "aviso-salir-de-clase");
    await pulsar(bea, "Salir de esta clase");
    await esperar(2200);
    const { rows: sigueBea } = await client.query(
      `SELECT 1 FROM profesores_clase WHERE "claseId" = $1 AND "profesorId" = $2`, [compartida, beaId]);
    comprobar("sale de la clase", sigueBea.length === 0);
    const { rows: rolBea } = await client.query(`SELECT "rolDocente", "licenciaDocenteId" FROM dietistas WHERE id = $1`, [beaId]);
    comprobar("y sigue siendo profesora de su universidad", rolBea[0].rolDocente === "PROFESOR" && rolBea[0].licenciaDocenteId === licenciaId);
    await bea.goto(`${BASE}/profesor/clases`, { waitUntil: "networkidle0" });
    comprobar("ya no la ve en su lista", !(await texto(bea)).includes("compartida"));

    console.log("\n── 2. La única profesora sí puede salir: la clase se borra con ella ──");
    await ana.goto(`${BASE}/profesor/clases/${suya}`, { waitUntil: "networkidle0" });
    visible = await texto(ana);
    comprobar("se le ofrece salir", visible.includes("Salir de esta clase"));
    comprobar("y se le avisa de que la clase se borra", /la clase se borra entera/i.test(visible));
    await foto(ana, "unica-profesora");
    await pulsar(ana, "Salir de esta clase");
    await esperar(600);
    visible = await texto(ana);
    comprobar("el aviso lo dice con todas las letras", /se borra entera/i.test(visible) && /No se puede deshacer/i.test(visible));
    comprobar("y promete que sus casos y pacientes no se tocan", /son tuyos y no se tocan/i.test(visible));
    await foto(ana, "unica-profesora-aviso");
    await pulsar(ana, "Salir y borrar la clase");
    await esperar(3000);
    const { rows: borrada } = await client.query(`SELECT 1 FROM clases WHERE id = $1`, [suya]);
    comprobar("la clase se va con ella", borrada.length === 0);
    const { rows: sigueSiendo } = await client.query(`SELECT "rolDocente", "licenciaDocenteId" FROM dietistas WHERE id = $1`, [anaId]);
    comprobar("pero ella sigue siendo profesora de su facultad",
      sigueSiendo[0].rolDocente === "PROFESOR" && sigueSiendo[0].licenciaDocenteId === licenciaId);

    console.log("\n── 3. Salir de la universidad ──");
    await ana.goto(`${BASE}/profesor`, { waitUntil: "networkidle0" });
    await pulsar(ana, "Dejar la docencia");
    await esperar(400);
    visible = await texto(ana);
    comprobar("desde el panel se ofrece salir de su universidad", visible.includes(`Salir de ${MARCA} Uno`));
    comprobar("y dejar de ser profesor", visible.includes("Dejar de ser profesor"));
    await foto(ana, "panel-salidas");
    // Un caso suyo antes de irse: lo que hay que comprobar es que salir de la universidad no se
    // lleva su trabajo por delante, y sin ningún caso eso no se prueba.
    await client.query(
      `INSERT INTO casos_clinicos (id, "profesorId", "licenciaDocenteId", nombre, "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, '${MARCA} Caso de Ana', NOW(), NOW())`, [anaId, licenciaId]);
    await pulsar(ana, `Salir de ${MARCA} Uno`);
    await esperar(500);
    comprobar("el aviso avisa de que pierde el acceso a sus clases", /pierdes el acceso a sus clases/i.test(await texto(ana)));
    await foto(ana, "aviso-dejar-universidad");
    await pulsar(ana, "Salir de la universidad");
    await esperar(2500);
    const { rows: rolAna } = await client.query(`SELECT "rolDocente", "licenciaDocenteId" FROM dietistas WHERE id = $1`, [anaId]);
    comprobar("deja la universidad", rolAna[0].licenciaDocenteId === null);
    comprobar("pero sigue siendo docente", rolAna[0].rolDocente === "PROFESOR");
    const { rows: clases } = await client.query(
      `SELECT nombre, archivada, "profesorId" FROM clases WHERE nombre LIKE '${MARCA}%' ORDER BY nombre`);
    const laVacia = clases.find((c) => c.nombre.includes("compartida"))!;
    const conOtra = clases.find((c) => c.nombre.includes("con relevo"))!;
    comprobar("la que se quedó sin nadie más se archiva, no se borra", laVacia.archivada === true);
    comprobar("y la que lleva otra profesora pasa a ella, sin archivarse",
      conOtra.profesorId === beaId && conOtra.archivada === false,
      conOtra.profesorId === beaId ? "es de Bea" : "sigue siendo de Ana");
    await ana.goto(`${BASE}/profesor`, { waitUntil: "networkidle0" });
    visible = await texto(ana);
    // Sin universidad no hay espacio docente (cambiado el 8 sep 2026): se le explica y se le manda
    // a su cuenta, en vez de dejarle un panel vacío que podría seguir usando sin pagar.
    comprobar("se le dice que no está en ninguna universidad", /no estás en ninguna universidad/i.test(visible),
      ana.url());
    comprobar("y que no se le ha borrado nada", /no se ha borrado nada|no se apagou nada/i.test(visible));
    // Lo que de verdad importa no es lo que ponga la pantalla, sino que su trabajo siga en pie: se
    // comprueba en la base, que es donde no hay interpretaciones.
    const { rows: suyo } = await client.query(
      `SELECT (SELECT COUNT(*)::int FROM casos_clinicos WHERE "profesorId" = $1) AS casos,
              (SELECT "rolDocente" FROM dietistas WHERE id = $1) AS rol`, [anaId]);
    comprobar("su cuenta sigue siendo de profesora", suyo[0]?.rol === "PROFESOR", `${suyo[0]?.rol}`);
    comprobar("y sus casos siguen siendo suyos", suyo[0]?.casos > 0, `${suyo[0]?.casos} casos`);
    await foto(ana, "panel-sin-universidad");
    await ana.goto(`${BASE}/profesor/clases`, { waitUntil: "networkidle0" });
    comprobar("sin acceso a las clases de la facultad que dejó", !(await texto(ana)).includes(MARCA));
    await ana.goto(`${BASE}/profesor/clases/${suya}`, { waitUntil: "networkidle0" });
    comprobar("ni entrando por la dirección directa", !(await texto(ana)).includes(`${MARCA} solo de Ana`), ana.url().replace(BASE, ""));

    console.log("\n── 4. Y a esa docente sin universidad se la puede meter en otra ──");
    const admin = await navegador.newPage();
    await admin.setViewport({ width: 1440, height: 900 });
    await admin.goto(`${BASE}/admin-login`, { waitUntil: "networkidle0" });
    await admin.evaluate((email, pass) => {
      const campos = Array.from(document.querySelectorAll("input"));
      const escribir = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
      const correo = campos.find((c) => c.type === "email") ?? campos[0];
      const clave = campos.find((c) => c.type === "password");
      if (correo) {
        escribir.call(correo, email);
        correo.dispatchEvent(new Event("input", { bubbles: true }));
      }
      if (clave) {
        escribir.call(clave, pass);
        clave.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }, process.env.ADMIN_EMAILS!.split(",")[0].trim(), process.env.ADMIN_PASSWORD!);
    await admin.evaluate(() => (document.querySelector('form button[type="submit"]') as HTMLElement | null)?.click());
    await esperar(3000);

    await admin.goto(`${BASE}/admin/universidades/${otraLicenciaId}`, { waitUntil: "networkidle0" });
    await esperar(800);
    comprobar("la administración deja entrar", admin.url().includes("/admin"), admin.url().replace(BASE, ""));
    await admin.evaluate((v) => {
      const c = document.querySelector('input[placeholder^="Buscar por nombre"]') as HTMLInputElement | null;
      if (!c) return;
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(c, v);
      c.dispatchEvent(new Event("input", { bubbles: true }));
    }, ANA.email);
    await esperar(2000);
    visible = await texto(admin);
    comprobar("el buscador sí la encuentra ahora", visible.includes(ANA.email), visible.includes(ANA.email) ? "" : "no sale en la lista");
    comprobar("y avisa de que ya es profesora, solo sin universidad", /ya es profesor/i.test(visible));
    await foto(admin, "admin-buscador");
    await pulsar(admin, "Profesora Ana");
    await esperar(600);
    await pulsar(admin, "Asignar como profesor");
    await esperar(2500);
    const { rows: anaOtra } = await client.query(`SELECT "rolDocente", "licenciaDocenteId" FROM dietistas WHERE id = $1`, [anaId]);
    comprobar("entra en la segunda universidad", anaOtra[0].licenciaDocenteId === otraLicenciaId);
    comprobar("con su rol de siempre", anaOtra[0].rolDocente === "PROFESOR");

    console.log("\n── 5. Dejar de ser profesora del todo ──");
    await ana.goto(`${BASE}/profesor`, { waitUntil: "networkidle0" });
    await pulsar(ana, "Dejar la docencia");
    await esperar(400);
    await pulsar(ana, "Dejar de ser profesor");
    await esperar(500);
    comprobar("el aviso promete que sus pacientes siguen ahí", /pacientes y tu trabajo intactos/i.test(await texto(ana)));
    await foto(ana, "aviso-dejar-docencia");
    await pulsar(ana, "Dejar de ser profesor");
    await esperar(2500);
    const { rows: exAna } = await client.query(`SELECT "rolDocente", "licenciaDocenteId" FROM dietistas WHERE id = $1`, [anaId]);
    comprobar("deja de ser docente", exAna[0].rolDocente === null && exAna[0].licenciaDocenteId === null);
    await ana.goto(`${BASE}/profesor`, { waitUntil: "networkidle0" });
    comprobar("y el espacio docente ya no es suyo", !ana.url().includes("/profesor"), ana.url().replace(BASE, ""));

    // Antes de la limpieza: la ficha de administración con las dos salidas, que solo existe
    // mientras haya un profesor en la licencia.
    await admin.goto(`${BASE}/admin/universidades/${licenciaId}`, { waitUntil: "networkidle0" });
    await esperar(1200);
    const fichaAdmin = await texto(admin);
    comprobar("administración ofrece las dos salidas por separado",
      fichaAdmin.includes("Sacar de la universidad") && fichaAdmin.includes("Quitar rol"));
    await foto(admin, "admin-dos-salidas");

    console.log(`\n${mal === 0 ? "✓ TODO CORRECTO" : "✗ HAY FALLOS"} — ${ok} bien, ${mal} mal`);
    console.log(`  capturas en ${DIR}`);
  } finally {
    await navegador.close();
    await limpiar(client).catch(() => {});
    client.release();
    await pool.end();
  }
  if (mal > 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });

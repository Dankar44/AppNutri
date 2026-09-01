/**
 * #39 — Clases del profesor, con navegador de verdad.
 *
 * Crea, edita y archiva desde la interfaz, y comprueba lo que no se ve mirando el código: que un
 * profesor NO pueda abrir ni tocar la clase de otro, aunque sean de la misma universidad.
 *
 *   1. npm run dev:desarrollo        (puerto 3001)
 *   2. DB=dev npx tsx scripts/probar-clases-docentes.ts
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

const BASE = "http://localhost:3001";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } });

const PROFES = [
  { email: "clases.profe1@annonia.dev", pass: "ClasesPrueba_1", nombre: "Uno" },
  { email: "clases.profe2@annonia.dev", pass: "ClasesPrueba_2", nombre: "Dos" },
];

let ok = 0, mal = 0;
const comprobar = (t: string, c: boolean, d = "") => { console.log(`  ${c ? "✓" : "✗"} ${t}${d ? ` — ${d}` : ""}`); c ? ok++ : mal++; };
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function rellenar(page: Page, etiqueta: string, valor: string) {
  const hecho = await page.evaluate((tx, v) => {
    const l = Array.from(document.querySelectorAll("label")).find((x) => x.textContent?.trim().startsWith(tx));
    const c = l?.parentElement?.querySelector("input") as HTMLInputElement | null;
    if (!c) return false;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(c, v);
    c.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  }, etiqueta, valor);
  if (!hecho) throw new Error(`campo "${etiqueta}" no encontrado`);
}

async function pulsar(page: Page, texto: string, dentroDe?: string) {
  const hecho = await page.evaluate((tx, ambito) => {
    const raiz = ambito ? document.querySelector(ambito) : document;
    if (!raiz) return false;
    const n = Array.from(raiz.querySelectorAll("button, a")).find((x) => x.textContent?.trim().startsWith(tx));
    if (!n) return false;
    (n as HTMLElement).click();
    return true;
  }, texto, dentroDe ?? null);
  if (!hecho) throw new Error(`botón "${texto}" no encontrado`);
}

async function crearProfesor(client: pg.PoolClient, email: string, pass: string, apellidos: string, licenciaId: string) {
  const { rows } = await client.query(
    `INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
       created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous,
       confirmation_token, recovery_token, email_change_token_new, email_change,
       email_change_token_current, reauthentication_token, phone_change, phone_change_token)
     VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
       $1, crypt($2, gen_salt('bf')), NOW(), NOW(), NOW(),
       '{"provider":"email","providers":["email"]}', '{}'::jsonb, false, false, '','','','','','','','')
     RETURNING id`, [email, pass]);
  const authId = rows[0].id as string;
  await client.query(
    `INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
     VALUES (gen_random_uuid(), $1::uuid, $1::text, 'email',
       jsonb_build_object('sub',$1::text,'email',$2::text,'email_verified',true,'provider','email'), NOW(), NOW(), NOW())`,
    [authId, email]);
  const { rows: d } = await client.query(
    `INSERT INTO dietistas (id, "authId", email, nombre, apellidos, verificado, "rolDocente", "licenciaDocenteId", "createdAt", "updatedAt")
     VALUES (gen_random_uuid()::text, $1, $2, 'Profesor', $3, true, 'PROFESOR', $4, NOW(), NOW()) RETURNING id`,
    [authId, email, apellidos, licenciaId]);
  return d[0].id as string;
}

async function sesionDe(navegador: Browser, email: string, pass: string): Promise<Page> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const sb = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });
  if (error) throw new Error(`login de ${email}: ${error.message}`);
  const ref = url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1];
  const ctx = await navegador.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.evaluateOnNewDocument(() => { try { localStorage.setItem("annonia-welcome-dietista", "1"); } catch { /* ignore */ } });
  await page.setCookie({
    name: `sb-${ref}-auth-token`,
    value: "base64-" + Buffer.from(JSON.stringify(data.session)).toString("base64"),
    domain: "localhost", path: "/",
  });
  return page;
}

async function limpiar(client: pg.PoolClient) {
  await client.query(`DELETE FROM clases WHERE nombre LIKE 'PRUEBA clase%'`);
  for (const p of PROFES) {
    const { rows } = await client.query(`SELECT id FROM auth.users WHERE email = $1`, [p.email]);
    for (const r of rows) {
      await client.query(`DELETE FROM dietistas WHERE "authId" = $1`, [r.id]);
      await client.query(`DELETE FROM auth.identities WHERE user_id = $1::uuid`, [r.id]);
      await client.query(`DELETE FROM auth.users WHERE id = $1::uuid`, [r.id]);
    }
  }
  await client.query(`DELETE FROM licencias_docentes WHERE institucion = 'PRUEBA Clases'`);
}

async function main() {
  const client = await pool.connect();
  const navegador = await puppeteer.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true, args: ["--no-sandbox"],
  });
  try {
    await limpiar(client);
    const { rows: lic } = await client.query(
      `INSERT INTO licencias_docentes (institucion, "maxProfesores", "maxAlumnos", curso, "fechaFin")
       VALUES ('PRUEBA Clases', 3, 50, '2026/27', '2027-08-31') RETURNING id`);
    const licenciaId = lic[0].id as string;
    await crearProfesor(client, PROFES[0].email, PROFES[0].pass, PROFES[0].nombre, licenciaId);
    await crearProfesor(client, PROFES[1].email, PROFES[1].pass, PROFES[1].nombre, licenciaId);

    const p1 = await sesionDe(navegador, PROFES[0].email, PROFES[0].pass);

    console.log("\n── Sin clases todavía ──");
    await p1.goto(`${BASE}/profesor/clases`, { waitUntil: "networkidle0" });
    await esperar(800);
    comprobar("el estado vacío se explica", (await p1.content()).includes("Todavía no tienes ninguna clase"));

    console.log("\n── Crear una clase ──");
    await pulsar(p1, "Nueva clase");
    await esperar(500);
    await rellenar(p1, "Nombre de la clase", "PRUEBA clase Dietoterapia");
    await rellenar(p1, "Curso", "2026/27");
    await pulsar(p1, "Nueva clase", "form");
    await esperar(3000);

    const { rows: creada } = await client.query(
      `SELECT id, nombre, curso, "fechaFinCurso", archivada, "profesorId" FROM clases WHERE nombre = 'PRUEBA clase Dietoterapia'`);
    comprobar("la clase se guarda", creada.length === 1);
    if (!creada.length) throw new Error("sin clase no se puede seguir");
    const claseId = creada[0].id as string;
    comprobar("con su curso", creada[0].curso === "2026/27", String(creada[0].curso));
    comprobar("y con fin de curso puesto solo", creada[0].fechaFinCurso !== null, String(creada[0].fechaFinCurso)?.slice(0, 10));
    comprobar("lleva al detalle de la clase", p1.url().includes(`/profesor/clases/${claseId}`), p1.url().replace(BASE, ""));
    comprobar("y dice que aún no hay alumnos", (await p1.content()).includes("Todavía no hay alumnos"));

    console.log("\n── Editarla ──");
    await pulsar(p1, "Editar");
    await esperar(500);
    await rellenar(p1, "Nombre de la clase", "PRUEBA clase Dietoterapia 3B");
    await pulsar(p1, "Guardar", "form");
    await esperar(3000);
    const { rows: editada } = await client.query(`SELECT nombre FROM clases WHERE id = $1`, [claseId]);
    comprobar("el nombre se guarda", editada[0].nombre === "PRUEBA clase Dietoterapia 3B", editada[0].nombre);
    comprobar("y la pantalla ya lo muestra", (await p1.content()).includes("Dietoterapia 3B"));

    console.log("\n── Archivarla y recuperarla ──");
    await pulsar(p1, "Archivar");
    await esperar(800);
    const avisoClaro = await p1.evaluate(() =>
      document.querySelector(".fixed.inset-0.z-50")?.textContent?.includes("No se borra nada") ?? false);
    comprobar("el aviso deja claro que no se borra nada", avisoClaro);
    await pulsar(p1, "Archivar", ".fixed.inset-0.z-50");
    await esperar(3000);
    const { rows: arch } = await client.query(`SELECT archivada, "archivadaAt" FROM clases WHERE id = $1`, [claseId]);
    comprobar("queda archivada", arch[0].archivada === true);
    comprobar("con su fecha", arch[0].archivadaAt !== null);

    await p1.goto(`${BASE}/profesor/clases`, { waitUntil: "networkidle0" });
    await esperar(800);
    comprobar("desaparece del listado normal", !(await p1.content()).includes("Dietoterapia 3B"));
    await p1.goto(`${BASE}/profesor/clases?archivadas=1`, { waitUntil: "networkidle0" });
    await esperar(800);
    comprobar("pero sale al pedir las archivadas", (await p1.content()).includes("Dietoterapia 3B"));

    await p1.goto(`${BASE}/profesor/clases/${claseId}`, { waitUntil: "networkidle0" });
    await esperar(600);
    await pulsar(p1, "Desarchivar");
    await esperar(800);
    await pulsar(p1, "Desarchivar", ".fixed.inset-0.z-50");
    await esperar(3000);
    const { rows: rec } = await client.query(`SELECT archivada FROM clases WHERE id = $1`, [claseId]);
    comprobar("se recupera", rec[0].archivada === false);

    console.log("\n── Otro profesor NO puede tocarla ──");
    const p2 = await sesionDe(navegador, PROFES[1].email, PROFES[1].pass);
    await p2.goto(`${BASE}/profesor/clases/${claseId}`, { waitUntil: "networkidle0" });
    await esperar(1000);
    const contenido = await p2.content();
    comprobar(
      "no ve la clase de su compañero (aunque sean de la misma universidad)",
      !contenido.includes("Dietoterapia 3B"),
      p2.url().replace(BASE, ""),
    );
    await p2.goto(`${BASE}/profesor/clases`, { waitUntil: "networkidle0" });
    await esperar(800);
    comprobar("y su listado está vacío", (await p2.content()).includes("Todavía no tienes ninguna clase"));

    console.log("\n── Varios profesores en la misma clase ──");
    const { rows: miClase } = await client.query(
      `SELECT id FROM clases WHERE nombre LIKE 'PRUEBA clase%' AND "profesorId" = (
         SELECT id FROM dietistas WHERE email = $1) LIMIT 1`, [PROFES[0].email]);
    const claseCompartida = miClase[0]?.id as string | undefined;
    if (!claseCompartida) throw new Error("no hay clase del profesor 1 para la prueba");

    const otroProfe = await sesionDe(navegador, PROFES[1].email, PROFES[1].pass);
    await otroProfe.goto(`${BASE}/profesor/clases/${claseCompartida}`, { waitUntil: "domcontentloaded" });
    await esperar(1200);
    comprobar("antes de añadirle, el otro profesor no la ve",
      !(await otroProfe.evaluate(() => document.body.innerText)).includes("PRUEBA clase"), otroProfe.url());

    await p1.goto(`${BASE}/profesor/clases/${claseCompartida}`, { waitUntil: "networkidle0" });
    await esperar(1200);
    comprobar("el creador sale como tal en la lista de profesores",
      (await p1.evaluate(() => document.body.innerText)).includes("Creó la clase"));
    await pulsar(p1, "Añadir profesor");
    await esperar(500);
    await pulsar(p1, "Profesor Dos");
    await esperar(3500);
    const { rows: llevan } = await client.query(
      `SELECT COUNT(*)::int n FROM profesores_clase WHERE "claseId" = $1`, [claseCompartida]);
    comprobar("la clase pasa a tener dos profesores", llevan[0].n === 2, `${llevan[0].n}`);

    await otroProfe.goto(`${BASE}/profesor/clases/${claseCompartida}`, { waitUntil: "networkidle0" });
    await esperar(1500);
    const vistaDelSegundo = await otroProfe.evaluate(() => document.body.innerText);
    comprobar("y ahora el segundo profesor la ve entera", vistaDelSegundo.includes("Dar de alta alumnos"),
      vistaDelSegundo.split("\n").slice(0, 3).join(" / "));
    await otroProfe.goto(`${BASE}/profesor/clases`, { waitUntil: "networkidle0" });
    await esperar(1200);
    comprobar("y le sale en su lista de clases",
      (await otroProfe.evaluate(() => document.body.innerText)).includes("PRUEBA clase"));

    console.log("\n── Y se le puede quitar (menos al creador) ──");
    await p1.goto(`${BASE}/profesor/clases/${claseCompartida}`, { waitUntil: "networkidle0" });
    await esperar(1200);
    const equis = await p1.evaluate(() => {
      const b = Array.from(document.querySelectorAll("button")).find(
        (x) => x.getAttribute("aria-label") === "Quitar de la clase");
      if (!b) return false;
      (b as HTMLElement).click();
      return true;
    });
    comprobar("hay una equis para quitarle, y no para el creador", equis);
    await esperar(600);
    await pulsar(p1, "Quitar de la clase", "[role='dialog']");
    await esperar(3500);
    const { rows: trasQuitar } = await client.query(
      `SELECT COUNT(*)::int n FROM profesores_clase WHERE "claseId" = $1`, [claseCompartida]);
    comprobar("la clase vuelve a tener un solo profesor", trasQuitar[0].n === 1, `${trasQuitar[0].n}`);
    await otroProfe.goto(`${BASE}/profesor/clases/${claseCompartida}`, { waitUntil: "domcontentloaded" });
    await esperar(1200);
    comprobar("y el otro deja de verla",
      !(await otroProfe.evaluate(() => document.body.innerText)).includes("Dar de alta alumnos"), otroProfe.url());

    console.log("\n── Limpieza ──");
    await limpiar(client);
    const { rows: quedan } = await client.query(`SELECT count(*)::int AS n FROM clases WHERE nombre LIKE 'PRUEBA clase%'`);
    comprobar("no queda nada de la prueba", quedan[0].n === 0);

    console.log(`\n${mal === 0 ? "✓ TODO CORRECTO" : "✗ HAY FALLOS"} — ${ok} bien, ${mal} mal\n`);
    if (mal > 0) process.exitCode = 1;
  } finally {
    await navegador.close();
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exitCode = 1; });

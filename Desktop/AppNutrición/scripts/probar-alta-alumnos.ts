/**
 * #39 — Alta de alumnos: los dos caminos, con navegador de verdad.
 *
 * Lo que se comprueba aquí no es que la pantalla pinte, sino las reglas que cuestan dinero si
 * fallan: que la bolsa vendida no se pueda pasar, que un alumno de dos profesores consuma UNA
 * plaza, que retirar el acceso libere sitio sin borrar nada, y que quien ya tiene cuenta en
 * Annonia se matricule sin perder lo suyo.
 *
 *   1. npm run dev:desarrollo        (puerto 3001)
 *   2. DB=dev npx tsx scripts/probar-alta-alumnos.ts
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
  { email: "alta.profe1@annonia.dev", pass: "AltaPrueba_1", apellidos: "Uno" },
  { email: "alta.profe2@annonia.dev", pass: "AltaPrueba_2", apellidos: "Dos" },
];
const MARCA = "PRUEBAALTA";

let ok = 0, mal = 0;
const comprobar = (t: string, c: boolean, d = "") => { console.log(`  ${c ? "✓" : "✗"} ${t}${d ? ` — ${d}` : ""}`); c ? ok++ : mal++; };
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function escribirCorreos(page: Page, texto: string) {
  const hecho = await page.evaluate((v) => {
    const c = document.querySelector("textarea") as HTMLTextAreaElement | null;
    if (!c) return false;
    Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(c, v);
    c.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  }, texto);
  if (!hecho) throw new Error("no hay textarea de correos");
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

/**
 * Lo que se VE. No vale `page.content()`: next-intl mete en el HTML todos los textos del
 * namespace, así que buscar ahí da por bueno lo que ni siquiera se ha pintado.
 */
async function texto(page: Page): Promise<string> {
  return page.evaluate(() => document.body.innerText);
}

/** Lo que dice el aviso que sale al terminar: es el resumen que lee el profesor. */
async function textoDelToast(page: Page): Promise<string> {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll("[data-sonner-toast]")).map((t) => t.textContent ?? "").join(" | "));
}

async function crearCuenta(client: pg.PoolClient, email: string, pass: string, apellidos: string, extra: Record<string, unknown> = {}) {
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
  const campos = Object.keys(extra);
  const { rows: d } = await client.query(
    `INSERT INTO dietistas (id, "authId", email, nombre, apellidos, verificado, "createdAt", "updatedAt"${campos.map((c) => `, "${c}"`).join("")})
     VALUES (gen_random_uuid()::text, $1, $2, $3, $4, true, NOW(), NOW()${campos.map((_, i) => `, $${5 + i}`).join("")}) RETURNING id`,
    [authId, email, MARCA, apellidos, ...campos.map((c) => extra[c])]);
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
  await client.query(`DELETE FROM invitaciones_docentes WHERE email LIKE '%@pruebaalta.dev' OR email LIKE 'alta.%@annonia.dev'`);
  await client.query(`DELETE FROM clases WHERE nombre LIKE '${MARCA}%'`);
  const { rows } = await client.query(
    `SELECT u.id FROM auth.users u WHERE u.email LIKE '%@pruebaalta.dev' OR u.email LIKE 'alta.%@annonia.dev'`);
  for (const r of rows) {
    await client.query(`DELETE FROM dietistas WHERE "authId" = $1`, [r.id]);
    await client.query(`DELETE FROM auth.identities WHERE user_id = $1::uuid`, [r.id]);
    await client.query(`DELETE FROM auth.users WHERE id = $1::uuid`, [r.id]);
  }
  await client.query(`DELETE FROM licencias_docentes WHERE institucion = '${MARCA} Facultad'`);
}

/** El alta pregunta antes de gastar plazas: hay que confirmar en el cuadro. */
async function confirmarAlta(page: Page) {
  await esperar(900);
  await page.evaluate(() => {
    const dialogo = document.querySelector("[role='dialog']");
    const b = Array.from(dialogo?.querySelectorAll("button") ?? [])
      .find((x) => /Enviar invitaciones/i.test(x.textContent ?? ""));
    (b as HTMLElement | undefined)?.click();
  });
}

async function main() {
  const client = await pool.connect();
  const navegador = await puppeteer.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true, args: ["--no-sandbox"],
  });
  try {
    await limpiar(client);

    // Bolsa pequeña a propósito: cuatro plazas se agotan en una prueba y se ve el tope de verdad.
    const { rows: lic } = await client.query(
      `INSERT INTO licencias_docentes (id, institucion, "maxProfesores", "maxAlumnos", "fechaFin", "dominioEmail", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, '${MARCA} Facultad', 3, 4, '2027-08-31', 'pruebaalta.dev', NOW(), NOW()) RETURNING id`);
    const licenciaId = lic[0].id as string;

    const profe1 = await crearCuenta(client, PROFES[0].email, PROFES[0].pass, PROFES[0].apellidos,
      { rolDocente: "PROFESOR", licenciaDocenteId: licenciaId });
    const profe2 = await crearCuenta(client, PROFES[1].email, PROFES[1].pass, PROFES[1].apellidos,
      { rolDocente: "PROFESOR", licenciaDocenteId: licenciaId });

    const { rows: c1 } = await client.query(
      `INSERT INTO clases (id, "profesorId", "licenciaDocenteId", nombre, "fechaFinCurso", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, '${MARCA} clase de uno', '2027-08-31', NOW(), NOW()) RETURNING id`, [profe1, licenciaId]);
    const clase1 = c1[0].id as string;
    const { rows: c2 } = await client.query(
      `INSERT INTO clases (id, "profesorId", "licenciaDocenteId", nombre, "fechaFinCurso", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, '${MARCA} clase de dos', '2027-08-31', NOW(), NOW()) RETURNING id`, [profe2, licenciaId]);
    const clase2 = c2[0].id as string;

    const p1 = await sesionDe(navegador, PROFES[0].email, PROFES[0].pass);

    console.log("\n── La pantalla del alta ──");
    await p1.goto(`${BASE}/profesor/clases/${clase1}`, { waitUntil: "networkidle0" });
    await esperar(1200);
    let visible = await texto(p1);
    comprobar("se ve el alta de alumnos", visible.includes("Dar de alta alumnos"));
    comprobar("dice cuántas van y cuántas quedan", /0 de 4/.test(visible) && /4 libres/.test(visible),
      visible.match(/\d+ de \d+[^\n]*/)?.[0] ?? "no sale");
    comprobar("no se ve el aviso de curso cerrado", !visible.includes("El curso está cerrado"));

    console.log("\n── Tres correos de golpe, uno repetido y uno mal escrito ──");
    await escribirCorreos(p1, "ana@pruebaalta.dev\nluis@pruebaalta.dev\nana@pruebaalta.dev\nesto-no-es-un-correo");
    await pulsar(p1, "Enviar invitaciones", "form");
    await confirmarAlta(p1);
    await esperar(3500);
    const toast1 = await textoDelToast(p1);
    comprobar("el aviso cuenta 2 invitados", /2 invitados/.test(toast1), toast1);
    comprobar("el aviso cuenta 1 mal escrito", /1 correo mal escrito/.test(toast1), toast1);

    const { rows: inv } = await client.query(
      `SELECT email, rol, "claseId", "aceptadaAt" FROM invitaciones_docentes WHERE "claseId" = $1 ORDER BY email`, [clase1]);
    comprobar("se crean exactamente 2 invitaciones", inv.length === 2, `hay ${inv.length}`);
    comprobar("el repetido no se duplica", inv.filter((i) => i.email === "ana@pruebaalta.dev").length === 1);
    comprobar("el mal escrito no crea nada", !inv.some((i) => i.email.includes("esto-no-es")));
    comprobar("van con rol de alumno", inv.every((i) => i.rol === "ALUMNO"));

    console.log("\n── Las invitaciones sin usar ya ocupan plaza ──");
    await p1.reload({ waitUntil: "networkidle0" });
    await esperar(1000);
    visible = await texto(p1);
    comprobar("van 2 de 4 y quedan 2", /2 de 4/.test(visible) && /2 libres/.test(visible),
      visible.match(/\d+ de \d+[^\n]*/)?.[0] ?? "no sale");

    console.log("\n── Un correo que ya tiene cuenta de nutricionista ──");
    const nutriId = await crearCuenta(client, "nutri@pruebaalta.dev", "NutriPrueba_1", "Nutricionista");
    await client.query(
      `INSERT INTO suscripciones (id, "dietistaId", plan, estado, "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, 'PROFESIONAL', 'ACTIVA', NOW(), NOW())`, [nutriId]);
    await escribirCorreos(p1, "nutri@pruebaalta.dev");
    await pulsar(p1, "Enviar invitaciones", "form");
    await confirmarAlta(p1);
    await esperar(3500);
    const toast2 = await textoDelToast(p1);
    comprobar("se le matricula, no se le invita", /1 añadido/.test(toast2), toast2);

    const { rows: nutri } = await client.query(
      `SELECT d."rolDocente", d."cuentaDeClase", s.plan, s.estado
         FROM dietistas d LEFT JOIN suscripciones s ON s."dietistaId" = d.id WHERE d.id = $1`, [nutriId]);
    comprobar("conserva su suscripción", nutri[0].plan === "PROFESIONAL" && nutri[0].estado === "ACTIVA");
    comprobar("no se le marca como cuenta de clase", nutri[0].cuentaDeClase === false);
    comprobar("no se le crea una cuenta nueva",
      (await client.query(`SELECT COUNT(*)::int n FROM dietistas WHERE email = 'nutri@pruebaalta.dev'`)).rows[0].n === 1);

    console.log("\n── El mismo correo otra vez ──");
    await escribirCorreos(p1, "nutri@pruebaalta.dev");
    await pulsar(p1, "Enviar invitaciones", "form");
    await confirmarAlta(p1);
    await esperar(3500);
    const toast3 = await textoDelToast(p1);
    comprobar("dice que ya estaba", /1 ya estaba/.test(toast3), toast3);
    comprobar("no se duplica la matrícula",
      (await client.query(`SELECT COUNT(*)::int n FROM alumnos_clase WHERE "claseId" = $1 AND "alumnoId" = $2`, [clase1, nutriId])).rows[0].n === 1);

    console.log("\n── El tope de la bolsa ──");
    await escribirCorreos(p1, "sobra1@pruebaalta.dev\nsobra2@pruebaalta.dev\nsobra3@pruebaalta.dev");
    await pulsar(p1, "Enviar invitaciones", "form");
    await confirmarAlta(p1);
    await esperar(4000);
    const toast4 = await textoDelToast(p1);
    comprobar("entra uno y sobran dos", /1 invitado/.test(toast4) && /2 sin plaza/.test(toast4), toast4);
    const { rows: total } = await client.query(
      `SELECT COUNT(*)::int n FROM invitaciones_docentes WHERE "claseId" = $1 AND "aceptadaAt" IS NULL`, [clase1]);
    comprobar("nunca se pasa de las 4 vendidas", total[0].n + 1 === 4, `${total[0].n} invitaciones + 1 matriculado`);

    console.log("\n── Retirar el acceso NO libera plaza, y no borra nada ──");
    await p1.reload({ waitUntil: "networkidle0" });
    await esperar(1200);
    comprobar("ya no quedan plazas", /sin plazas libres/.test(await texto(p1)),
      (await texto(p1)).match(/\d+ de \d+[^\n]*/)?.[0] ?? "no sale");
    comprobar("el alumno matriculado sale en la lista", (await texto(p1)).includes("nutri@pruebaalta.dev"),
      (await texto(p1)).split("\n").filter((l) => l.includes("@")).join(" / ") || "lista vacía");
    await pulsar(p1, "Retirar acceso");
    await esperar(600);
    await pulsar(p1, "Retirar acceso", "[role='dialog']");
    await esperar(3000);
    const { rows: retirado } = await client.query(
      `SELECT activa, "bajaAt" FROM alumnos_clase WHERE "claseId" = $1 AND "alumnoId" = $2`, [clase1, nutriId]);
    comprobar("la matrícula queda inactiva", retirado[0]?.activa === false);
    comprobar("se guarda cuándo se le retiró", retirado[0]?.bajaAt !== null);
    comprobar("la cuenta del alumno sigue existiendo",
      (await client.query(`SELECT COUNT(*)::int n FROM dietistas WHERE id = $1`, [nutriId])).rows[0].n === 1);
    await p1.reload({ waitUntil: "networkidle0" });
    await esperar(1200);
    // La plaza se consume para todo el curso: retirar a alguien no la devuelve, y no vuelve hasta
    // el 31 de agosto (Guillermo, 8 sep 2026). Antes se liberaba y se podía rotar gente.
    comprobar("su plaza NO vuelve a la bolsa", /sin plazas libres/.test(await texto(p1)),
      (await texto(p1)).split("\n").find((l) => /plaza/i.test(l)) ?? "");

    console.log("\n── Un alumno en las clases de dos profesores = una plaza ──");
    // El profesor 2 mete al mismo alumno que ya tiene el 1: no puede consumir una segunda plaza.
    await client.query(
      `INSERT INTO alumnos_clase (id, "claseId", "alumnoId", "altaAt") VALUES (gen_random_uuid()::text, $1, $2, NOW())`, [clase2, nutriId]);
    await client.query(`UPDATE alumnos_clase SET activa = true, "bajaAt" = NULL WHERE "claseId" = $1 AND "alumnoId" = $2`, [clase1, nutriId]);
    const { rows: ocupadas } = await client.query(
      `SELECT COUNT(DISTINCT ac."alumnoId")::int n FROM alumnos_clase ac
         JOIN clases c ON c.id = ac."claseId"
        WHERE ac.activa = true AND c."licenciaDocenteId" = $1 AND c.archivada = false`, [licenciaId]);
    comprobar("cuenta alumnos distintos, no matrículas", ocupadas[0].n === 1, `${ocupadas[0].n} plazas ocupadas`);

    console.log("\n── El enlace de la clase ──");
    await p1.goto(`${BASE}/profesor/clases/${clase1}`, { waitUntil: "networkidle0" });
    await esperar(1200);
    await pulsar(p1, "Con un enlace");
    await esperar(400);
    // Para abrir el enlace hace falta que a la facultad le queden plazas: a estas alturas la bolsa
    // está llena de los pasos anteriores, así que se le venden tres más.
    await client.query(`UPDATE licencias_docentes SET "maxAlumnos" = "maxAlumnos" + 3 WHERE id = $1`, [licenciaId]);
    await p1.reload({ waitUntil: "networkidle0" });
    await esperar(1200);
    await pulsar(p1, "Con un enlace");
    await esperar(400);
    comprobar("por defecto está cerrado", (await texto(p1)).includes("nadie puede apuntarse"));
    // El cupo es obligatorio desde el 9 sep 2026: sin número, el botón de abrir está bloqueado.
    comprobar("sin decir cuántos caben, no deja abrirlo", await p1.evaluate(() => {
      const b = Array.from(document.querySelectorAll("button")).find((x) => /Abrir el enlace/i.test(x.textContent ?? ""));
      return (b as HTMLButtonElement | undefined)?.disabled ?? false;
    }));
    await p1.evaluate(() => {
      const caja = Array.from(document.querySelectorAll("input")).find((i) => i.inputMode === "numeric");
      if (!caja) return;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!;
      setter.call(caja, "3");
      caja.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await esperar(500);
    await pulsar(p1, "Abrir el enlace");
    await esperar(3000);
    const { rows: tok } = await client.query(
      `SELECT "tokenInvitacion", "invitacionAbierta" FROM clases WHERE id = $1`, [clase1]);
    comprobar("se genera un token", typeof tok[0].tokenInvitacion === "string" && tok[0].tokenInvitacion.length >= 20);
    comprobar("queda abierto", tok[0].invitacionAbierta === true);

    const token = tok[0].tokenInvitacion as string;
    const anonimo = await (await navegador.createBrowserContext()).newPage();
    await anonimo.goto(`${BASE}/clase/${token}`, { waitUntil: "networkidle0" });
    await esperar(800);
    const publica = await texto(anonimo);
    comprobar("el enlace abre sin sesión", !anonimo.url().includes("/login"), anonimo.url());
    comprobar("se ve el nombre de la clase", publica.includes("clase de uno"));
    comprobar("se ve la institución", publica.includes(`${MARCA} Facultad`));
    comprobar("el enlace no filtra los correos de los compañeros", !publica.includes("nutri@pruebaalta.dev"));

    console.log("\n── Cerrar el enlace lo desactiva de verdad ──");
    await client.query(`UPDATE clases SET "invitacionAbierta" = false WHERE id = $1`, [clase1]);
    await anonimo.goto(`${BASE}/clase/${token}`, { waitUntil: "networkidle0" });
    await esperar(600);
    comprobar("con el enlace cerrado no se puede apuntar nadie",
      !(await texto(anonimo)).includes("Apuntarme"), anonimo.url());

    console.log("\n── Un profesor no puede dar de alta en la clase de otro ──");
    await p1.goto(`${BASE}/profesor/clases/${clase2}`, { waitUntil: "domcontentloaded" });
    await esperar(900);
    const otraClase = await texto(p1);
    comprobar("la clase del otro profesor no se abre",
      !otraClase.includes("clase de dos"), otraClase.slice(0, 60).replace(/\n/g, " "));

    console.log("\n── Con la licencia caducada no se dan más altas ──");
    await client.query(`UPDATE licencias_docentes SET "fechaFin" = '2020-01-01' WHERE id = $1`, [licenciaId]);
    await p1.goto(`${BASE}/profesor/clases/${clase1}`, { waitUntil: "networkidle0" });
    await esperar(1200);
    visible = await texto(p1);
    // Con la licencia caducada el profesor ya no entra en su espacio (cambiado el 9 sep 2026):
    // se le manda a la pantalla que se lo explica, en vez de dejarle dentro sin poder hacer nada.
    comprobar("se le explica y no entra en sus clases", p1.url().includes("/docencia-terminada"), p1.url());
    comprobar("con el aviso de que no se ha borrado nada", /no se ha borrado nada/i.test(visible));
    comprobar("y no hay caja para pegar correos", (await p1.$("textarea")) === null);
  } finally {
    await limpiar(client);
    client.release();
    await navegador.close();
    await pool.end();
  }

  console.log(`\n${mal === 0 ? "✓" : "✗"} ${ok} bien, ${mal} mal`);
  process.exit(mal === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });

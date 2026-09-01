/**
 * #39 — El alumno entrando: los dos caminos, desde su lado.
 *
 * Aquí se prueba lo que hace la persona que recibe el correo o el enlace: rellenar sus datos,
 * elegir SU contraseña y entrar. Lo importante que se vigila es que no se le cree una cuenta
 * suelta de nutricionista (sería una venta falsa en el panel), que si ya tenía cuenta no se le
 * duplique, y que una plaza que se agota entre medias no se pueda colar.
 *
 *   1. npm run dev:desarrollo        (puerto 3001)
 *   2. DB=dev npx tsx scripts/probar-alumno-se-apunta.ts
 *
 * Crea sus datos y los borra. Solo con DB=dev.
 */
import "./_guard-solo-dev";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";
import { randomBytes } from "node:crypto";
import puppeteer, { type Page, type Browser } from "puppeteer-core";
import { createClient } from "@supabase/supabase-js";

const BASE = "http://localhost:3001";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } });

const MARCA = "PRUEBAAPUNTA";
const DOMINIO = "pruebaapunta.dev";
const PROFE = { email: `profe@${DOMINIO}`, pass: "ApuntaPrueba_1" };

let ok = 0, mal = 0;
const comprobar = (t: string, c: boolean, d = "") => { console.log(`  ${c ? "✓" : "✗"} ${t}${d ? ` — ${d}` : ""}`); c ? ok++ : mal++; };
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
const texto = (page: Page) => page.evaluate(() => document.body.innerText);

/**
 * Los avisos se van solos a los pocos segundos, así que no vale mirar cuando ya ha terminado la
 * espera: hay que estar pendiente mientras salen.
 */
async function esperarToast(page: Page, maxMs = 8000): Promise<string> {
  const hasta = Date.now() + maxMs;
  while (Date.now() < hasta) {
    const t = await page.evaluate(() =>
      Array.from(document.querySelectorAll("[data-sonner-toast]")).map((x) => x.textContent ?? "").join(" | "));
    if (t.trim()) return t;
    await esperar(200);
  }
  return "";
}

async function rellenar(page: Page, etiqueta: string, valor: string) {
  const hecho = await page.evaluate((tx, v) => {
    const l = Array.from(document.querySelectorAll("label")).find((x) => x.textContent?.trim().startsWith(tx));
    const c = (l?.parentElement?.querySelector("input") ?? l?.nextElementSibling?.querySelector("input")) as HTMLInputElement | null;
    if (!c) return false;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(c, v);
    c.dispatchEvent(new Event("input", { bubbles: true }));
    return true;
  }, etiqueta, valor);
  if (!hecho) throw new Error(`campo "${etiqueta}" no encontrado`);
}

async function pulsar(page: Page, tx: string) {
  const hecho = await page.evaluate((t) => {
    const n = Array.from(document.querySelectorAll("button, a")).find((x) => x.textContent?.trim().startsWith(t));
    if (!n) return false;
    (n as HTMLElement).click();
    return true;
  }, tx);
  if (!hecho) throw new Error(`botón "${tx}" no encontrado`);
}

async function crearAuth(client: pg.PoolClient, email: string, pass: string) {
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
  return authId;
}

async function crearDietista(client: pg.PoolClient, authId: string, email: string, extra: Record<string, unknown> = {}) {
  const campos = Object.keys(extra);
  const { rows } = await client.query(
    `INSERT INTO dietistas (id, "authId", email, nombre, apellidos, verificado, "createdAt", "updatedAt"${campos.map((c) => `, "${c}"`).join("")})
     VALUES (gen_random_uuid()::text, $1, $2, '${MARCA}', 'Prueba', true, NOW(), NOW()${campos.map((_, i) => `, $${3 + i}`).join("")}) RETURNING id`,
    [authId, email, ...campos.map((c) => extra[c])]);
  return rows[0].id as string;
}

async function puedeEntrar(email: string, pass: string): Promise<boolean> {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  const { error } = await sb.auth.signInWithPassword({ email, password: pass });
  return !error;
}

async function limpiar(client: pg.PoolClient) {
  await client.query(`DELETE FROM invitaciones_docentes WHERE email LIKE '%@${DOMINIO}'`);
  await client.query(`DELETE FROM clases WHERE nombre LIKE '${MARCA}%'`);
  const { rows } = await client.query(`SELECT id FROM auth.users WHERE email LIKE '%@${DOMINIO}'`);
  for (const r of rows) {
    await client.query(`DELETE FROM dietistas WHERE "authId" = $1`, [r.id]);
    await client.query(`DELETE FROM auth.identities WHERE user_id = $1::uuid`, [r.id]);
    await client.query(`DELETE FROM auth.users WHERE id = $1::uuid`, [r.id]);
  }
  await client.query(`DELETE FROM licencias_docentes WHERE institucion = '${MARCA} Facultad'`);
}

async function main() {
  const client = await pool.connect();
  const navegador = await puppeteer.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true, args: ["--no-sandbox"],
  });
  const anonimo = async (): Promise<Page> => {
    const p = await (await navegador.createBrowserContext()).newPage();
    await p.setViewport({ width: 1280, height: 900 });
    return p;
  };

  try {
    await limpiar(client);
    const { rows: lic } = await client.query(
      `INSERT INTO licencias_docentes (id, institucion, "maxProfesores", "maxAlumnos", curso, "fechaFin", "dominioEmail", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, '${MARCA} Facultad', 2, 3, '2026/27', '2027-08-31', '${DOMINIO}', NOW(), NOW()) RETURNING id`);
    const licenciaId = lic[0].id as string;
    const profeId = await crearDietista(client, await crearAuth(client, PROFE.email, PROFE.pass), PROFE.email,
      { rolDocente: "PROFESOR", licenciaDocenteId: licenciaId });
    const token = randomBytes(18).toString("base64url");
    const { rows: cl } = await client.query(
      `INSERT INTO clases (id, "profesorId", "licenciaDocenteId", nombre, curso, "fechaFinCurso", "tokenInvitacion", "invitacionAbierta", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, '${MARCA} Dietoterapia', '2026/27', '2027-08-31', $3, true, NOW(), NOW()) RETURNING id`,
      [profeId, licenciaId, token]);
    const claseId = cl[0].id as string;

    console.log("\n── Lo que ve el alumno al abrir el enlace ──");
    let page = await anonimo();
    await page.goto(`${BASE}/clase/${token}`, { waitUntil: "networkidle0" });
    await esperar(700);
    let visible = await texto(page);
    comprobar("se ve a qué clase se apunta", visible.includes(`${MARCA} Dietoterapia`));
    comprobar("se ve de qué facultad es", visible.includes(`${MARCA} Facultad`));
    comprobar("le dice el correo que se espera", visible.includes(`@${DOMINIO}`));
    comprobar("no se le pide ninguna tarjeta", !/tarjeta|pago|precio/i.test(visible));

    console.log("\n── Se apunta con su propia contraseña ──");
    const ana = { email: `ana@${DOMINIO}`, pass: "AnaAlumna_2026" };
    await rellenar(page, "Nombre", "Ana");
    await rellenar(page, "Apellidos", "Ruiz");
    await rellenar(page, "Correo", ana.email);
    await rellenar(page, "Contraseña", ana.pass);
    await pulsar(page, "Apuntarme");
    await esperar(5000);

    const { rows: creada } = await client.query(
      `SELECT d.id, d."rolDocente", d."cuentaDeClase", d."licenciaDocenteId", d.verificado, d."fuenteContacto",
              (SELECT COUNT(*)::int FROM suscripciones s WHERE s."dietistaId" = d.id) AS subs,
              (SELECT COUNT(*)::int FROM alumnos_clase a WHERE a."alumnoId" = d.id AND a.activa) AS matriculas
         FROM dietistas d WHERE d.email = $1`, [ana.email]);
    comprobar("se le crea la cuenta", creada.length === 1);
    comprobar("queda como alumna", creada[0]?.rolDocente === "ALUMNO");
    comprobar("marcada como cuenta de clase", creada[0]?.cuentaDeClase === true);
    comprobar("colgada de la licencia de su facultad", creada[0]?.licenciaDocenteId === licenciaId);
    comprobar("SIN suscripción: no es una venta", creada[0]?.subs === 0, `${creada[0]?.subs} suscripciones`);
    comprobar("matriculada en la clase", creada[0]?.matriculas === 1);
    comprobar("no tiene que verificar el correo", creada[0]?.verificado === true);
    comprobar("entra con la contraseña que ella eligió", await puedeEntrar(ana.email, ana.pass));

    console.log("\n── Al entrar va a su sitio, no al de profesor ──");
    const sesion = await anonimo();
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const sb = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
    const { data } = await sb.auth.signInWithPassword({ email: ana.email, password: ana.pass });
    await sesion.setCookie({
      name: `sb-${url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1]}-auth-token`,
      value: "base64-" + Buffer.from(JSON.stringify(data.session)).toString("base64"),
      domain: "localhost", path: "/",
    });
    await sesion.goto(`${BASE}/entrar`, { waitUntil: "networkidle0" });
    await esperar(1500);
    comprobar("no aterriza en el espacio de docencia", !sesion.url().includes("/profesor"), sesion.url());
    const menu = await sesion.evaluate(() => (document.querySelector("aside, nav") as HTMLElement | null)?.innerText ?? "");
    comprobar("no ve el menú de profesor", !menu.includes("Clases"), menu.split("\n").slice(0, 8).join(" / "));
    await sesion.goto(`${BASE}/profesor/clases`, { waitUntil: "domcontentloaded" });
    await esperar(1200);
    comprobar("y si escribe la ruta a mano, tampoco entra", !sesion.url().includes("/profesor"), sesion.url());

    console.log("\n── Sale en la lista de su profesor ──");
    const { rows: enLista } = await client.query(
      `SELECT COUNT(*)::int n FROM alumnos_clase WHERE "claseId" = $1 AND activa = true`, [claseId]);
    comprobar("el profesor la tiene en su clase", enLista[0].n === 1);

    console.log("\n── Alguien que ya tiene cuenta en Annonia ──");
    const luis = { email: `luis@${DOMINIO}`, pass: "LuisNutri_2026" };
    const luisId = await crearDietista(client, await crearAuth(client, luis.email, luis.pass), luis.email);
    await client.query(
      `INSERT INTO pacientes (id, "dietistaId", nombre, apellidos, "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, 'Paciente', 'Suyo', NOW(), NOW())`, [luisId]);
    page = await anonimo();
    await page.goto(`${BASE}/clase/${token}`, { waitUntil: "networkidle0" });
    await esperar(700);
    await rellenar(page, "Nombre", "Luis");
    await rellenar(page, "Apellidos", "Otro");
    await rellenar(page, "Correo", luis.email);
    await rellenar(page, "Contraseña", "LaQueMeInventoAhora_9");
    await pulsar(page, "Apuntarme");
    const avisoContrasena = await esperarToast(page);
    comprobar("con una contraseña inventada no se le matricula",
      (await client.query(`SELECT COUNT(*)::int n FROM alumnos_clase a JOIN dietistas d ON d.id = a."alumnoId" WHERE d.email = $1`, [luis.email])).rows[0].n === 0);
    comprobar("y se le dice que use la suya", /contraseña de tu cuenta/i.test(avisoContrasena), avisoContrasena);

    // Con SU contraseña de siempre sí: es lo que demuestra que la cuenta es suya.
    await rellenar(page, "Contraseña", luis.pass);
    await pulsar(page, "Apuntarme");
    await esperar(5000);
    const { rows: luisAhora } = await client.query(
      `SELECT COUNT(*)::int total FROM dietistas WHERE email = $1`, [luis.email]);
    comprobar("no se le crea una segunda cuenta", luisAhora[0].total === 1, `${luisAhora[0].total} cuentas`);
    const { rows: luisDatos } = await client.query(
      `SELECT d.nombre, d."cuentaDeClase", (SELECT COUNT(*)::int FROM pacientes p WHERE p."dietistaId" = d.id) pac,
              (SELECT COUNT(*)::int FROM alumnos_clase a WHERE a."alumnoId" = d.id AND a.activa) mat
         FROM dietistas d WHERE d.email = $1`, [luis.email]);
    comprobar("conserva sus pacientes", luisDatos[0].pac === 1);
    comprobar("no se le pisa el nombre con el del formulario", luisDatos[0].nombre === MARCA, luisDatos[0].nombre);
    comprobar("su cuenta no se convierte en cuenta de clase", luisDatos[0].cuentaDeClase === false);
    comprobar("queda matriculado", luisDatos[0].mat === 1);
    comprobar("sigue entrando con SU contraseña de siempre", await puedeEntrar(luis.email, luis.pass));

    console.log("\n── Cuando se acaban las plazas ──");
    // Quedan 3 plazas y hay 2 alumnos: se ocupa la tercera y la siguiente no debe entrar.
    const relleno = await crearDietista(client, await crearAuth(client, `relleno@${DOMINIO}`, "Relleno_2026"), `relleno@${DOMINIO}`,
      { rolDocente: "ALUMNO", licenciaDocenteId: licenciaId, cuentaDeClase: true });
    await client.query(
      `INSERT INTO alumnos_clase (id, "claseId", "alumnoId", "altaAt") VALUES (gen_random_uuid()::text, $1, $2, NOW())`,
      [claseId, relleno]);
    page = await anonimo();
    await page.goto(`${BASE}/clase/${token}`, { waitUntil: "networkidle0" });
    await esperar(700);
    comprobar("la página avisa de que no quedan plazas", /no quedan plazas|sin plazas/i.test(await texto(page)),
      (await texto(page)).split("\n").filter((l) => /plaza/i.test(l)).join(" / ") || "no dice nada");
    comprobar("y ni siquiera se le pide que rellene nada", (await page.$("form input")) === null);

    console.log("\n── La última plaza, cogida mientras rellenaba el formulario ──");
    // El caso feo de verdad: abre la página con una plaza libre y, mientras escribe, otro se la
    // queda. Si la plaza se comprobase solo al pintar, se colaría un alumno de más.
    await client.query(`UPDATE licencias_docentes SET "maxAlumnos" = 4 WHERE id = $1`, [licenciaId]);
    page = await anonimo();
    await page.goto(`${BASE}/clase/${token}`, { waitUntil: "networkidle0" });
    await esperar(700);
    await rellenar(page, "Nombre", "Tarde");
    await rellenar(page, "Apellidos", "Llego");
    await rellenar(page, "Correo", `tarde@${DOMINIO}`);
    await rellenar(page, "Contraseña", "LlegoTarde_2026");
    const otro = await crearDietista(client, await crearAuth(client, `rapido@${DOMINIO}`, "Rapido_2026"), `rapido@${DOMINIO}`,
      { rolDocente: "ALUMNO", licenciaDocenteId: licenciaId, cuentaDeClase: true });
    await client.query(
      `INSERT INTO alumnos_clase (id, "claseId", "alumnoId", "altaAt") VALUES (gen_random_uuid()::text, $1, $2, NOW())`,
      [claseId, otro]);
    await pulsar(page, "Apuntarme");
    const avisoPlaza = await esperarToast(page);
    await esperar(2000);
    comprobar("no se le crea cuenta al que llega tarde",
      (await client.query(`SELECT COUNT(*)::int n FROM dietistas WHERE email = $1`, [`tarde@${DOMINIO}`])).rows[0].n === 0);
    comprobar("tampoco se queda un usuario suelto en auth",
      (await client.query(`SELECT COUNT(*)::int n FROM auth.users WHERE email = $1`, [`tarde@${DOMINIO}`])).rows[0].n === 0);
    comprobar("y se le dice por qué", /plaza/i.test(avisoPlaza), avisoPlaza);

    console.log("\n── El correo de invitación del profesor ──");
    const tokenInv = randomBytes(24).toString("base64url");
    await client.query(`UPDATE licencias_docentes SET "maxAlumnos" = 10 WHERE id = $1`, [licenciaId]);
    await client.query(
      `INSERT INTO invitaciones_docentes (id, token, email, rol, "claseId", "licenciaDocenteId", "invitadoPor", "expiraAt", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, 'ALUMNO', $3, $4, $5, NOW() + INTERVAL '30 days', NOW(), NOW())`,
      [tokenInv, `marta@${DOMINIO}`, claseId, licenciaId, profeId]);
    page = await anonimo();
    await page.goto(`${BASE}/invitacion/${tokenInv}`, { waitUntil: "networkidle0" });
    await esperar(900);
    visible = await texto(page);
    comprobar("el enlace del correo abre sin sesión", !page.url().includes("/login"), page.url());
    comprobar("no le llama profesora", !visible.includes("cuenta de profesor"),
      visible.split("\n")[0]);
    comprobar("le dice a qué clase entra", visible.includes(`${MARCA} Dietoterapia`));
    comprobar("le dice que no paga nada", /no tienes que pagar/i.test(visible));
    // innerText no trae lo que hay dentro de un input: el correo hay que leerlo del campo.
    comprobar("sale su correo ya puesto, y no se puede cambiar",
      await page.evaluate((e) => {
        const c = document.querySelector('input[type="email"]') as HTMLInputElement | null;
        return c?.value === e && c.disabled;
      }, `marta@${DOMINIO}`));
    await rellenar(page, "Nombre", "Marta");
    await rellenar(page, "Apellidos", "Gil");
    await rellenar(page, "Contraseña", "MartaAlumna_2026");
    await pulsar(page, "Crear mi cuenta");
    await esperar(5000);
    const { rows: marta } = await client.query(
      `SELECT d."rolDocente", d."cuentaDeClase",
              (SELECT COUNT(*)::int FROM suscripciones s WHERE s."dietistaId" = d.id) subs,
              (SELECT COUNT(*)::int FROM alumnos_clase a WHERE a."alumnoId" = d.id AND a."claseId" = $2) mat
         FROM dietistas d WHERE d.email = $1`, [`marta@${DOMINIO}`, claseId]);
    comprobar("la invitación por correo también crea la cuenta", marta.length === 1);
    comprobar("con rol de alumna", marta[0]?.rolDocente === "ALUMNO");
    comprobar("marcada como cuenta de clase", marta[0]?.cuentaDeClase === true);
    comprobar("sin suscripción", marta[0]?.subs === 0);
    comprobar("matriculada en la clase del correo", marta[0]?.mat === 1);
    comprobar("entra con su contraseña", await puedeEntrar(`marta@${DOMINIO}`, "MartaAlumna_2026"));
    const { rows: usada } = await client.query(`SELECT "aceptadaAt" FROM invitaciones_docentes WHERE token = $1`, [tokenInv]);
    comprobar("la invitación queda marcada como usada", usada[0]?.aceptadaAt !== null);

    console.log("\n── La misma invitación dos veces ──");
    page = await anonimo();
    await page.goto(`${BASE}/invitacion/${tokenInv}`, { waitUntil: "networkidle0" });
    await esperar(900);
    comprobar("una invitación ya usada no vale", !(await texto(page)).includes("Crear mi cuenta"),
      (await texto(page)).split("\n").slice(0, 3).join(" / "));
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

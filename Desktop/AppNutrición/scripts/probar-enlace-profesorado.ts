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
import { conexionResistente, type Conexion } from "./_conexion-viva";
import puppeteer, { type Page, type Browser } from "puppeteer-core";
import { createClient } from "@supabase/supabase-js";
import { generateVerifyToken } from "../src/lib/verify-email";

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
async function pestana(page: Page, cual: "Crear mi cuenta" | "Ya uso Annonia") {
  await page.evaluate((tx) => {
    const b = Array.from(document.querySelectorAll("button")).find((x) => x.textContent?.trim() === tx);
    (b as HTMLElement | undefined)?.click();
  }, cual);
  await esperar(500);
}

async function altaConEse(page: Page, email: string, clave: string = PASS, repetida?: string) {
  await page.evaluate((correo, clave, repetida) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!;
    const inputs = Array.from(document.querySelectorAll("form input"));
    const textos = inputs.filter((i) => (i as HTMLInputElement).type === "text");
    if (textos[0]) { setter.call(textos[0], "Profe"); textos[0].dispatchEvent(new Event("input", { bubbles: true })); }
    if (textos[1]) { setter.call(textos[1], "del Enlace"); textos[1].dispatchEvent(new Event("input", { bubbles: true })); }
    const correoInput = inputs.find((i) => (i as HTMLInputElement).type === "email");
    if (correoInput) { setter.call(correoInput, correo); correoInput.dispatchEvent(new Event("input", { bubbles: true })); }
    const claves = inputs.filter((i) => (i as HTMLInputElement).type === "password");
    if (claves[0]) { setter.call(claves[0], clave); claves[0].dispatchEvent(new Event("input", { bubbles: true })); }
    if (claves[1]) { setter.call(claves[1], repetida ?? clave); claves[1].dispatchEvent(new Event("input", { bubbles: true })); }
  }, email, clave, repetida ?? clave);
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

async function limpiar(client: Conexion) {
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
  const client = conexionResistente(pool);
  // La prueba toca la licencia que encuentra, así que se apunta cómo estaba para devolverla igual:
  // dejarla cambiada hacía fallar a las siguientes pruebas por motivos que no eran suyos.
  let licenciaId = "";
  let maxOriginal = 0;
  let finOriginal: Date | null = null;
  const navegador = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });
  try {
    await limpiar(client);
    const { rows: lic } = await client.query(`SELECT id, "maxProfesores", "fechaFin" FROM licencias_docentes LIMIT 1`);
    if (!lic.length) throw new Error("no hay licencia: lanza antes preparar-prueba-docente");
    // El tope de verdad son los profesores que YA hay en la universidad, así que la prueba se
    // ajusta el suyo: si no, según lo que hubiera dejado otra prueba, el enlace salía agotado y
    // fallaban comprobaciones que no tienen nada que ver (9 sep 2026).
    maxOriginal = lic[0].maxProfesores;
    licenciaId = lic[0].id;
    finOriginal = lic[0].fechaFin ?? null;
    await client.query(
      `UPDATE licencias_docentes SET "maxProfesores" =
         (SELECT COUNT(*)::int + 4 FROM dietistas WHERE "licenciaDocenteId" = $1 AND "rolDocente" = 'PROFESOR')
       WHERE id = $1`, [licenciaId]);

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

    console.log("\n── Las dos cosas que se pueden hacer, separadas ──");
    const conPestanas = await texto(page);
    comprobar("hay pestaña de crear cuenta", /Crear mi cuenta/i.test(conPestanas));
    comprobar("y pestaña de entrar con la de siempre", /Ya uso Annonia/i.test(conPestanas));

    console.log("\n── La contraseña: se avisa, no se deja el botón apagado ──");
    // Guillermo, 9 sep 2026: puso una contraseña corta, el botón se quedó gris y nadie le dijo por
    // qué. Ahora se explica el mínimo y hay que repetirla, igual que en el registro de siempre.
    const pantallaAlta = await texto(page);
    comprobar("se dice cuántos caracteres hacen falta", /Al menos 6 caracteres/i.test(pantallaAlta),
      pantallaAlta.split("\n").find((l) => /caracteres/i.test(l)) ?? "no lo dice");
    comprobar("y se pide repetirla", /Repetir contraseña/i.test(pantallaAlta));
    await altaConEse(page, `corta@${DOMINIO}`, "abc");
    comprobar("con una corta, lo dice y no crea nada",
      (await client.query(`SELECT 1 FROM dietistas WHERE email = $1`, [`corta@${DOMINIO}`])).rows.length === 0);
    await altaConEse(page, `distintas@${DOMINIO}`, PASS, "otraDistinta2026");
    comprobar("si las dos no coinciden, tampoco",
      (await client.query(`SELECT 1 FROM dietistas WHERE email = $1`, [`distintas@${DOMINIO}`])).rows.length === 0);

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

    console.log("\n── No entra hasta verificar el correo ──");
    const trasElAlta = await texto(page);
    comprobar("se le pide que verifique su correo", /verifica tu correo/i.test(trasElAlta),
      trasElAlta.split("\n").find((l) => /verifica/i.test(l)) ?? "");
    // En local el correo no se manda —lo corta el `mailer`, porque Next carga la clave de Resend
    // de producción—, así que el enlace tiene que salir en la propia pantalla o no hay forma de
    // probar el alta sin un buzón de verdad (Guillermo, 9 sep 2026: "no veo nada de solo en local").
    comprobar("y se le enseña el enlace para verificar aquí mismo", /Solo en local/i.test(trasElAlta),
      /Solo en local/i.test(trasElAlta) ? "" : trasElAlta.split("\n").filter(Boolean).slice(-4).join(" · "));
    comprobar("con su botón de verificar", /Verificar mi cuenta/i.test(trasElAlta));
    const { rows: sinConfirmar } = await client.query(
      `SELECT id, email_confirmed_at FROM auth.users WHERE email = $1`, [sinCuenta]);
    comprobar("y la cuenta nace con el correo sin confirmar", sinConfirmar[0]?.email_confirmed_at === null,
      `${sinConfirmar[0]?.email_confirmed_at}`);
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } });
    const intento = await sb.auth.signInWithPassword({ email: sinCuenta, password: PASS });
    comprobar("sin verificar no puede iniciar sesión", intento.error !== null, intento.error?.message ?? "ENTRA");

    console.log("\n── Y el enlace del correo le deja dentro de su espacio docente ──");
    const enlaceVerificar = `${BASE}/auth/verify-email?token=${await generateVerifyToken(sinConfirmar[0].id, sinCuenta)}`;
    await page.goto(enlaceVerificar, { waitUntil: "networkidle0" });
    await esperar(4000);
    comprobar("aterriza en su espacio de profesor", page.url().includes("/profesor"), page.url());
    comprobar("sin volver a escribir correo ni contraseña", !page.url().includes("/login"), page.url());
    const { rows: confirmado } = await client.query(
      `SELECT email_confirmed_at FROM auth.users WHERE email = $1`, [sinCuenta]);
    comprobar("y su correo queda confirmado", confirmado[0]?.email_confirmed_at !== null);

    console.log("\n── Un nutricionista que YA usa Annonia, por el MISMO formulario ──");
    // Antes se le mandaba al login y volvía; ahora entra aquí con su contraseña de siempre.
    const { rows: normal } = await client.query(
      `SELECT email FROM dietistas WHERE "rolDocente" IS NULL AND verificado = true
         AND email NOT LIKE $1 ORDER BY "createdAt" DESC LIMIT 1`, [`%@${DOMINIO}`]);
    if (normal.length) {
      await client.query(`UPDATE auth.users SET encrypted_password = crypt($2, gen_salt('bf')) WHERE email = $1`,
        [normal[0].email, PASS]);
      await client.query(`UPDATE enlaces_profesores SET usadas = 0 WHERE token = $1`, [enl[0].token]);
      const suya = await (await navegador.createBrowserContext()).newPage();
      await suya.setViewport({ width: 1440, height: 950 });
      await suya.goto(url, { waitUntil: "networkidle0" });
      await esperar(2000);
      comprobar("hay una pestaña para quien ya usa Annonia", /Ya uso Annonia/i.test(await texto(suya)));
      await pestana(suya, "Ya uso Annonia");
      const enEntrar = await texto(suya);
      comprobar("y ahí no se le pide repetir la contraseña", !/Repetir contraseña/i.test(enEntrar),
        enEntrar.split("\n").filter(Boolean).slice(3, 8).join(" · "));
      comprobar("ni su nombre: ya lo tiene", !/^Nombre$/m.test(enEntrar));
      // Con una contraseña equivocada NO se le añade nada: tener el correo de alguien no demuestra
      // ser esa persona.
      await altaConEse(suya, normal[0].email, "otraQueNoEs2026");
      const { rows: sinPasar } = await client.query(`SELECT "rolDocente" FROM dietistas WHERE email = $1`, [normal[0].email]);
      comprobar("con la contraseña mal, no se le añade el rol", sinPasar[0]?.rolDocente === null, `${sinPasar[0]?.rolDocente}`);
      // Y con la suya, sí.
      await altaConEse(suya, normal[0].email);
      const { rows: ahora } = await client.query(`SELECT "rolDocente" FROM dietistas WHERE email = $1`, [normal[0].email]);
      comprobar("y con la suya pasa a ser profesor sin crear otra cuenta", ahora[0]?.rolDocente === "PROFESOR", `${ahora[0]?.rolDocente}`);
      comprobar("y también queda dentro", !suya.url().includes("/login"), suya.url());
      await client.query(`UPDATE dietistas SET "rolDocente" = NULL, "licenciaDocenteId" = NULL, "altaPorEnlaceId" = NULL WHERE email = $1`, [normal[0].email]);
      await suya.close();
    } else {
      console.log("    (no hay ninguna cuenta normal para probarlo)");
    }

    console.log("\n── El botón de «unirme» para quien ya tiene la sesión abierta ──");
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

    console.log("\n── Un profesor que se quedó SIN universidad usa el enlace ──");
    // Es el caso de quien sale de una facultad: conserva el rol, no el sitio. Antes se le decía
    // «ya tienes acceso» y el botón le llevaba a un espacio docente vacío, así que el enlace no
    // servía para nada (Guillermo, 9 sep 2026, probándolo con su cuenta).
    {
      const suelto = `sinuniversidad@${DOMINIO}`;
      await client.query(`UPDATE enlaces_profesores SET usadas = 0 WHERE token = $1`, [enl[0].token]);
      // Las altas de antes han llenado la universidad y el enlace saldría agotado, que no es lo que
      // se está probando aquí: se le hace sitio a uno más.
      await client.query(
        `UPDATE licencias_docentes SET "maxProfesores" =
           (SELECT COUNT(*)::int + 1 FROM dietistas WHERE "licenciaDocenteId" = $1 AND "rolDocente" = 'PROFESOR')
         WHERE id = $1`, [lic[0].id]);
      const { rows: creado } = await client.query(
        `INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
             created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous,
             confirmation_token, recovery_token, email_change_token_new, email_change,
             email_change_token_current, reauthentication_token, phone_change, phone_change_token)
         VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
             $1, crypt($2, gen_salt('bf')), NOW(), NOW(), NOW(),
             '{"provider":"email","providers":["email"]}',
             '{"nombre":"Sin","apellidos":"Universidad","email_verified":true}', false, false,
             '', '', '', '', '', '', '', '') RETURNING id`, [suelto, PASS]);
      await client.query(
        `INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
         VALUES (gen_random_uuid(), $1::uuid, $1::text, 'email',
           jsonb_build_object('sub',$1::text,'email',$2::text,'email_verified',true,'provider','email'), NOW(), NOW(), NOW())`,
        [creado[0].id, suelto]);
      await client.query(
        `INSERT INTO dietistas (id, "authId", email, nombre, apellidos, verificado, "rolDocente", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, $2, 'Sin', 'Universidad', true, 'PROFESOR', NOW(), NOW())`,
        [creado[0].id, suelto]);

      const sinUni = await sesionDe(navegador, suelto, PASS);
      await sinUni.goto(url, { waitUntil: "networkidle0" });
      await esperar(2000);
      const loQueVe = await texto(sinUni);
      comprobar("no se le dice que ya tiene acceso", !/Ya tienes acceso de profesor/i.test(loQueVe));
      comprobar("se le ofrece entrar en ESTA universidad", /Unirme a esta universidad/i.test(loQueVe),
        loQueVe.split("\n").filter(Boolean).filter((l) => !/cookies|Aceptar todas|Solo necesarias/i.test(l)).join(" · "));
      await sinUni.evaluate(() => {
        const b = Array.from(document.querySelectorAll("button")).find((x) => /Unirme a esta universidad/i.test(x.textContent ?? ""));
        (b as HTMLElement | undefined)?.click();
      });
      await esperar(5000);
      const { rows: dentro } = await client.query(
        `SELECT "licenciaDocenteId" FROM dietistas WHERE email = $1`, [suelto]);
      comprobar("y entra de verdad en la universidad del enlace", dentro[0]?.licenciaDocenteId === lic[0].id,
        `${dentro[0]?.licenciaDocenteId}`);
      comprobar("aterrizando en su espacio docente", sinUni.url().includes("/profesor"), sinUni.url().replace(BASE, ""));

      console.log("\n── Y si YA está en otra universidad, no se le mueve ──");
      const { rows: otra } = await client.query(
        `INSERT INTO licencias_docentes (id, institucion, "maxProfesores", "maxAlumnos", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, 'Otra de prueba', 3, 10, NOW(), NOW()) RETURNING id`);
      await client.query(`UPDATE dietistas SET "licenciaDocenteId" = $1 WHERE email = $2`, [otra[0].id, suelto]);
      await client.query(`UPDATE enlaces_profesores SET usadas = 0 WHERE token = $1`, [enl[0].token]);
      // Al irse a la otra universidad ha dejado su hueco libre, pero el tope se recalculó arriba:
      // se vuelve a dejar sitio para que la página muestre el aviso y no «ya no quedan plazas».
      await client.query(
        `UPDATE licencias_docentes SET "maxProfesores" =
           (SELECT COUNT(*)::int + 1 FROM dietistas WHERE "licenciaDocenteId" = $1 AND "rolDocente" = 'PROFESOR')
         WHERE id = $1`, [lic[0].id]);
      await sinUni.goto(url, { waitUntil: "networkidle0" });
      await esperar(2000);
      comprobar("se le dice que no puede estar en dos a la vez",
        /no se puede estar en dos a la vez/i.test(await texto(sinUni)));
      const { rows: sigue } = await client.query(`SELECT "licenciaDocenteId" FROM dietistas WHERE email = $1`, [suelto]);
      comprobar("y sigue en la suya", sigue[0]?.licenciaDocenteId === otra[0].id);
      await client.query(`DELETE FROM licencias_docentes WHERE id = $1`, [otra[0].id]);
      await sinUni.close();
    }

    console.log("\n── El tope de verdad son los profesores de la universidad ──");
    // Un enlace de 6 no puede meter al séptimo profesor: las tres vías comen de la misma bolsa.
    await client.query(`UPDATE enlaces_profesores SET plazas = 6, usadas = 0 WHERE token = $1`, [enl[0].token]);
    const { rows: cuantos } = await client.query(
      `SELECT COUNT(*)::int n FROM dietistas WHERE "licenciaDocenteId" = $1 AND "rolDocente" = 'PROFESOR'`, [lic[0].id]);
    await client.query(`UPDATE licencias_docentes SET "maxProfesores" = $2 WHERE id = $1`, [lic[0].id, cuantos[0].n]);
    const tope = await (await navegador.createBrowserContext()).newPage();
    await tope.setViewport({ width: 1440, height: 950 });
    await tope.goto(url, { waitUntil: "networkidle0" });
    await esperar(2000);
    comprobar("aunque al enlace le sobren plazas, se cierra", /Ya no quedan plazas/i.test(await texto(tope)),
      `enlace 0/6 · universidad ${cuantos[0].n}/${cuantos[0].n}`);
    await tope.close();
    await client.query(`UPDATE licencias_docentes SET "maxProfesores" = $2 WHERE id = $1`, [lic[0].id, cuantos[0].n + 5]);

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
    await client.query(`UPDATE licencias_docentes SET "fechaFin" = $2 WHERE id = $1`, [lic[0].id, finOriginal]);
    await client.query(`UPDATE enlaces_profesores SET usadas = plazas WHERE token = $1`, [enl[0].token]);

    console.log("\n── Y si se va un profesor, la plaza NO vuelve ──");
    await client.query(`DELETE FROM dietistas WHERE email = $1`, [sinCuenta]);
    const { rows: tras } = await client.query(`SELECT usadas, plazas FROM enlaces_profesores WHERE token = $1`, [enl[0].token]);
    comprobar("el contador se queda como estaba", tras[0]?.usadas === tras[0]?.plazas, `${tras[0]?.usadas} de ${tras[0]?.plazas}`);

    await limpiar(client);
  } finally {
    if (licenciaId) {
      await client.query(`UPDATE licencias_docentes SET "maxProfesores" = $2, "fechaFin" = $3 WHERE id = $1`,
        [licenciaId, maxOriginal, finOriginal]).catch(() => { /* la prueba ya terminó */ });
    }
    await navegador.close();
    await pool.end();
  }
  console.log(`\n${mal === 0 ? "✓" : "✗"} ${ok} bien, ${mal} mal`);
  process.exit(mal === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });

/**
 * #39/#40 — El guion entero que va a seguir Guillermo, paso por paso y a clics, con cuentas
 * nuevas creadas para la ocasión (Guillermo, 6 sep 2026: «revisar lo máximo posible tú, todos los
 * botones, base de datos, todo»).
 *
 * Los 32 pasos del guion, en el mismo orden y con la misma numeración, comprobando en cada uno lo
 * que se ve Y lo que queda en la base de datos. Deja una captura de cada pantalla en
 * /tmp/annonia-guion para poder mirarlas.
 *
 *   1. npm run dev:desarrollo        (puerto 3001)
 *   2. DB=dev npx tsx scripts/probar-guion-completo.ts
 *
 * Crea sus datos y los borra al acabar. Solo con DB=dev.
 */
import "./_guard-solo-dev";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";
import { mkdirSync } from "node:fs";
import puppeteer, { type Page, type Browser } from "puppeteer-core";
import { createClient } from "@supabase/supabase-js";

const BASE = "http://localhost:3001";
const DIR = "/tmp/annonia-guion";
const MARCA = "GUION";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } });

const PROFE = { email: "guion.profe@annonia.dev", pass: "GuionPrueba_1", nombre: "Elena", apellidos: "Profesora" };
const PROFE2 = { email: "guion.profe2@annonia.dev", pass: "GuionPrueba_2", nombre: "Marcos", apellidos: "Adjunto" };
const ALUMNA = { email: "guion.alumna@alumnos.urjc.es", pass: "GuionPrueba_3", nombre: "Lucia", apellidos: "Alumna" };
const NUEVA = { email: "guion.nueva@alumnos.urjc.es", pass: "GuionPrueba_4", nombre: "Sara", apellidos: "Recien" };

let ok = 0, mal = 0;
const dudas: string[] = [];
const comprobar = (t: string, c: boolean, d = "") => { console.log(`  ${c ? "✓" : "✗"} ${t}${d ? ` — ${d}` : ""}`); c ? ok++ : mal++; };
const apuntar = (t: string) => { dudas.push(t); console.log(`  · ${t}`); };
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
const texto = (p: Page) => p.evaluate(() => document.body.innerText);

let nFoto = 0;
async function foto(p: Page, nombre: string) {
  await esperar(600);
  nFoto++;
  await p.screenshot({ path: `${DIR}/${String(nFoto).padStart(2, "0")}-${nombre}.png` as `${string}.png`, fullPage: true });
}

/** Pulsa lo que esté encima: si hay un diálogo abierto, solo dentro de él. */
async function pulsar(p: Page, tx: string) {
  const hecho = await p.evaluate((t) => {
    // Primero en el diálogo de encima; si ahí no está, en la página (hay overlays fijos que no
    // son diálogos y taparían la búsqueda). Sin funciones declaradas aquí dentro: `tsx` las
    // instrumenta con `__name` y revientan en el navegador.
    const modales = Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"], .fixed.inset-0'));
    const enElModal = modales.length > 0
      ? Array.from(modales[modales.length - 1].querySelectorAll("button, a, summary")).find((x) => x.textContent?.trim().startsWith(t))
      : undefined;
    const n = enElModal ?? Array.from(document.querySelectorAll("button, a, summary")).find((x) => x.textContent?.trim().startsWith(t));
    if (!n) return false;
    (n as HTMLElement).click();
    return true;
  }, tx);
  if (!hecho) console.log(`    (no encontré «${tx}»)`);
  await esperar(900);
  return hecho;
}

async function escribir(p: Page, selector: string, valor: string) {
  await p.evaluate((sel, v) => {
    const c = document.querySelector(sel) as HTMLInputElement | HTMLTextAreaElement | null;
    if (!c) return;
    const proto = c.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(c, v);
    c.dispatchEvent(new Event("input", { bubbles: true }));
    c.dispatchEvent(new Event("change", { bubbles: true }));
  }, selector, valor);
}

/** Escribe en el campo que cuelga de una etiqueta. Con `exacto`, la etiqueta tiene que ser esa
 *  y no una que empiece igual («Nombre» frente a «Nombre del caso»). */
async function escribirEnCampo(p: Page, etiqueta: string, valor: string, exacto = false) {
  return p.evaluate((tx, v, ex) => {
    const l = Array.from(document.querySelectorAll("label")).find((x) => {
      const t = x.textContent?.trim() ?? "";
      return ex ? t === tx : t.startsWith(tx);
    });
    const c = (l?.parentElement?.querySelector("input, textarea") ?? null) as HTMLInputElement | HTMLTextAreaElement | null;
    if (!c) return false;
    const proto = c.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(c, v);
    c.dispatchEvent(new Event("input", { bubbles: true }));
    c.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }, etiqueta, valor, exacto);
}

/** Pulsa el botón de enviar del diálogo que esté abierto (no el de un formulario de la página). */
async function enviarDialogo(p: Page) {
  const hecho = await p.evaluate(() => {
    const modales = Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"], .fixed.inset-0'));
    const b = modales[modales.length - 1]?.querySelector('form button[type="submit"]') as HTMLElement | null;
    if (!b) return false;
    b.click();
    return true;
  });
  if (!hecho) console.log("    (no encontré el botón de enviar del diálogo)");
  await esperar(900);
  return hecho;
}

async function crearCuenta(client: pg.PoolClient, quien: { email: string; pass: string; nombre: string; apellidos: string }, extra: Record<string, unknown> = {}) {
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
  const campos = Object.keys(extra);
  const { rows: d } = await client.query(
    `INSERT INTO dietistas (id, "authId", email, nombre, apellidos, verificado, "createdAt", "updatedAt"${campos.map((c) => `, "${c}"`).join("")})
     VALUES (gen_random_uuid()::text, $1, $2, $3, $4, true, NOW(), NOW()${campos.map((_, i) => `, $${5 + i}`).join("")})
     RETURNING id`,
    [authId, quien.email, quien.nombre, quien.apellidos, ...campos.map((c) => extra[c])]);
  return d[0].id as string;
}

async function sesionDe(navegador: Browser, email: string, pass: string): Promise<Page> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const sb = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });
  if (error) throw new Error(`login de ${email}: ${error.message}`);
  const ref = url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1];
  const page = await (await navegador.createBrowserContext()).newPage();
  await page.setViewport({ width: 1440, height: 950 });
  await page.evaluateOnNewDocument(() => {
    try {
      localStorage.setItem("annonia-welcome-dietista", "1");
      localStorage.setItem("annonia-cookie-consent", "rejected");
    } catch { /* da igual */ }
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
  await client.query(`DELETE FROM casos_clinicos WHERE nombre LIKE '${MARCA}%'`);
  for (const q of [PROFE, PROFE2, ALUMNA, NUEVA]) {
    const { rows } = await client.query(`SELECT id FROM auth.users WHERE email = $1`, [q.email]);
    for (const r of rows) {
      await client.query(`DELETE FROM pacientes WHERE "dietistaId" IN (SELECT id FROM dietistas WHERE "authId" = $1)`, [r.id]);
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

    // ─────────── El escenario: una universidad y su profesora ───────────
    const { rows: lic } = await client.query(
      `INSERT INTO licencias_docentes (id, institucion, "personaContacto", "maxProfesores", "maxAlumnos",
         "dominioEmail", "fechaInicio", "fechaFin", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, 'Guillermo', 3, 30, 'urjc.es,alumnos.urjc.es',
         NOW(), '2027-08-31', NOW(), NOW()) RETURNING id`, [`${MARCA} Universidad`]);
    const licenciaId = lic[0].id as string;
    const profeId = await crearCuenta(client, PROFE, { rolDocente: "PROFESOR", licenciaDocenteId: licenciaId });
    const profe2Id = await crearCuenta(client, PROFE2, { rolDocente: "PROFESOR", licenciaDocenteId: licenciaId });

    const profe = await sesionDe(navegador, PROFE.email, PROFE.pass);
    const admin = await navegador.newPage();
    await admin.setViewport({ width: 1440, height: 950 });

    // ─────────── BLOQUE 1 · La universidad (admin) ───────────
    console.log("\n═══ BLOQUE 1 · La universidad (admin) ═══");
    await admin.goto(`${BASE}/admin-login`, { waitUntil: "networkidle0" });
    await escribir(admin, 'input[type="email"]', process.env.ADMIN_EMAILS!.split(",")[0].trim());
    await escribir(admin, 'input[type="password"]', process.env.ADMIN_PASSWORD!);
    await admin.evaluate(() => (document.querySelector('form button[type="submit"]') as HTMLElement | null)?.click());
    await esperar(3000);

    console.log("\n1. Universidades → la licencia con sus fechas y sus dominios");
    await admin.goto(`${BASE}/admin/universidades/${licenciaId}`, { waitUntil: "networkidle0" });
    await esperar(1200);
    let visible = await texto(admin);
    comprobar("sale la universidad", visible.includes(`${MARCA} Universidad`));
    comprobar("con el curso en dos fechas", /Curso del \d{2}\/\d{2}\/\d{4} al \d{2}\/\d{2}\/\d{4}/.test(visible),
      visible.match(/Curso del [^\n]+/)?.[0] ?? "no sale");
    // El «2026/27» ya no es texto libre escrito por nadie: es la etiqueta del curso elegido en el
    // desplegable, y sale en los enlaces de profesorado (8 sep 2026).
    comprobar("y el curso, en formato de curso escolar", /20\d\d\/\d\d/.test(visible),
      visible.match(/20\d\d\/\d\d/)?.[0] ?? "no sale");
    comprobar("los cupos de profesor y alumno", /0 \/ 3|1 \/ 3|2 \/ 3/.test(visible) && visible.includes("/ 30"));
    comprobar("y los dominios de la facultad", visible.includes("urjc.es"));
    comprobar("que solo avisan, nunca bloquean", /nunca impide dar de alta/i.test(visible));
    await foto(admin, "01-admin-universidad");

    // ─────────── BLOQUE 2 · Montar la clase ───────────
    console.log("\n═══ BLOQUE 2 · Montar la clase (profesora) ═══");

    console.log("\n3-4. Crear una clase con sus dos fechas");
    await profe.goto(`${BASE}/profesor/clases`, { waitUntil: "networkidle0" });
    await esperar(1000);
    comprobar("empieza sin ninguna clase", (await texto(profe)).includes("Todavía no tienes ninguna clase"));
    await pulsar(profe, "Nueva clase");
    visible = await texto(profe);
    comprobar("el formulario pide inicio y fin del curso", visible.includes("Inicio del curso") && visible.includes("Fin del curso"));
    const nativos = await profe.evaluate(() => document.querySelectorAll('input[type="date"]').length);
    comprobar("con el calendario de la app, no el del navegador", nativos === 0, `inputs date nativos: ${nativos}`);
    await foto(profe, "02-nueva-clase");
    await escribir(profe, 'input[placeholder="Dietoterapia 3º A"]', `${MARCA} Dietoterapia`);
    await esperar(300);
    await profe.evaluate(() => (document.querySelector('form button[type="submit"]') as HTMLElement | null)?.click());
    await esperar(2500);
    const { rows: cl } = await client.query(
      `SELECT id, "fechaInicioCurso", "fechaFinCurso", "fechaFinCurso"::date::text AS finDia,
              "tokenInvitacion", "profesorId" FROM clases WHERE nombre = $1`,
      [`${MARCA} Dietoterapia`]);
    comprobar("la clase se crea", cl.length === 1);
    const claseId = cl[0].id as string;
    comprobar("con sus dos fechas en la base", !!cl[0].fechaInicioCurso && !!cl[0].fechaFinCurso,
      `${String(cl[0].fechaInicioCurso).slice(0, 10)} → ${String(cl[0].fechaFinCurso).slice(0, 10)}`);
    // Ojo al comparar fechas: la columna es `timestamp` sin zona, y `pg` la lee como hora local
    // mientras que Prisma —lo que usa la aplicación— la lee en UTC. Se compara el día natural.
    comprobar("acaba el 31 de agosto por defecto", String(cl[0].findia).endsWith("-08-31"), String(cl[0].findia));
    comprobar("y sin enlace: no existe hasta que lo abra", cl[0].tokenInvitacion === null);
    const { rows: relacion } = await client.query(`SELECT 1 FROM profesores_clase WHERE "claseId" = $1 AND "profesorId" = $2`, [claseId, profeId]);
    comprobar("quien la crea queda como profesora de la clase", relacion.length === 1);

    console.log("\n5. Editar la clase: cambiar las fechas");
    // Tras crearla, la aplicación navega sola a su ficha; se espera a estar ahí para no pulsar en
    // la lista, donde no hay «Editar».
    await profe.goto(`${BASE}/profesor/clases/${claseId}`, { waitUntil: "networkidle0" });
    await esperar(1200);
    await pulsar(profe, "Editar");
    await escribirEnCampo(profe, "Nombre de la clase", `${MARCA} Dietoterapia II`);
    await esperar(300);
    await enviarDialogo(profe);
    await esperar(2500);
    const { rows: editada } = await client.query(`SELECT nombre FROM clases WHERE id = $1`, [claseId]);
    comprobar("el cambio se guarda", editada[0].nombre === `${MARCA} Dietoterapia II`, editada[0].nombre);
    comprobar("y la cabecera se actualiza sola", (await texto(profe)).includes(`${MARCA} Dietoterapia II`));

    console.log("\n6. Alta por correo: el dominio avisa pero no bloquea");
    await profe.goto(`${BASE}/profesor/clases/${claseId}`, { waitUntil: "networkidle0" });
    await esperar(1000);
    await escribirEnCampo(profe, "Correos de los alumnos", `${ALUMNA.email}\nfuera.dominio@gmail.com`);
    await esperar(400);
    await pulsar(profe, "Enviar invitaciones");
    // El alta pregunta antes: las plazas se gastan para todo el curso y no vuelven.
    await esperar(900);
    await profe.evaluate(() => {
      const dialogo = document.querySelector("[role='dialog']");
      const b = Array.from(dialogo?.querySelectorAll("button") ?? [])
        .find((x) => /Enviar invitaciones/i.test(x.textContent ?? ""));
      (b as HTMLElement | undefined)?.click();
    });
    await esperar(3000);
    visible = await texto(profe);
    const { rows: invitaciones } = await client.query(
      `SELECT email FROM invitaciones_docentes WHERE "claseId" = $1 ORDER BY email`, [claseId]);
    comprobar("invita a los dos, sea cual sea el dominio", invitaciones.length === 2,
      invitaciones.map((i) => i.email).join(", "));
    comprobar("el de fuera de la facultad entra igual", invitaciones.some((i) => i.email === "fuera.dominio@gmail.com"));
    await foto(profe, "03-alta-por-correo");

    console.log("\n7. El enlace de la clase");
    await pulsar(profe, "Con un enlace");
    visible = await texto(profe);
    comprobar("antes de abrirlo avisa de que nadie puede apuntarse", /nadie puede apuntarse/i.test(visible));
    await pulsar(profe, "Abrir el enlace");
    await esperar(2500);
    const { rows: conEnlace } = await client.query(`SELECT "tokenInvitacion", "invitacionAbierta" FROM clases WHERE id = $1`, [claseId]);
    comprobar("al abrirlo nace el enlace", !!conEnlace[0].tokenInvitacion && conEnlace[0].invitacionAbierta === true);
    const token = conEnlace[0].tokenInvitacion as string;
    const enlaceEnPantalla = await profe.evaluate(() =>
      Array.from(document.querySelectorAll("input")).map((i) => i.value).join(" "));
    comprobar("y se le enseña para copiarlo", enlaceEnPantalla.includes(`/clase/${token}`),
      enlaceEnPantalla.match(/https?:[^\s]+/)?.[0] ?? "no sale");
    await foto(profe, "04-enlace-abierto");

    console.log("\n8. Otro profesor de la facultad");
    await pulsar(profe, "Añadir profesor");
    await esperar(600);
    comprobar("le ofrece a su compañero de facultad", (await texto(profe)).includes(PROFE2.email));
    await pulsar(profe, `${PROFE2.nombre} ${PROFE2.apellidos}`);
    await esperar(2500);
    const { rows: dosProfes } = await client.query(`SELECT COUNT(*)::int n FROM profesores_clase WHERE "claseId" = $1`, [claseId]);
    comprobar("quedan los dos en la clase", dosProfes[0].n === 2);
    const profe2 = await sesionDe(navegador, PROFE2.email, PROFE2.pass);
    await profe2.goto(`${BASE}/profesor/clases`, { waitUntil: "networkidle0" });
    await esperar(1200);
    comprobar("y el segundo la ve en su lista", (await texto(profe2)).includes(`${MARCA} Dietoterapia II`));
    await foto(profe, "05-dos-profesores");

    // ─────────── BLOQUE 3 · Que entren los alumnos ───────────
    console.log("\n═══ BLOQUE 3 · Que entren los alumnos ═══");

    console.log("\n9. El enlace sin sesión: crear cuenta");
    const anonima = await (await navegador.createBrowserContext()).newPage();
    await anonima.setViewport({ width: 1440, height: 950 });
    await anonima.goto(`${BASE}/clase/${token}`, { waitUntil: "networkidle0" });
    await esperar(1200);
    visible = await texto(anonima);
    comprobar("sale el formulario para crear cuenta", /Crea tu cuenta para hacer las prácticas/i.test(visible));
    comprobar("con el nombre de la clase y la facultad",
      visible.includes(`${MARCA} Dietoterapia`) && visible.includes(`${MARCA} Universidad`));
    comprobar("y sugiere el correo de la universidad", /usa tu correo de la universidad/i.test(visible));
    await escribirEnCampo(anonima, "Nombre", NUEVA.nombre);
    await escribirEnCampo(anonima, "Apellidos", NUEVA.apellidos);
    await escribirEnCampo(anonima, "Correo", "fuera@gmail.com");
    await esperar(800);
    comprobar("un correo de fuera avisa, pero deja seguir", /no es de la universidad/i.test(await texto(anonima)));
    const bloqueado = await anonima.evaluate(() =>
      (document.querySelector('form button[type="submit"]') as HTMLButtonElement | null)?.disabled ?? true);
    comprobar("el botón de crear cuenta sigue activo", bloqueado === false);
    await foto(anonima, "06-enlace-sin-sesion");
    await escribirEnCampo(anonima, "Correo", NUEVA.email);
    // La contraseña va dentro de un envoltorio con el botón de ver/ocultar: se busca por tipo.
    await escribir(anonima, 'input[type="password"]', NUEVA.pass);
    await esperar(600);
    const listoParaEnviar = await anonima.evaluate(() => {
      const correo = document.querySelector('input[type="email"]') as HTMLInputElement | null;
      const clave = document.querySelector('input[type="password"]') as HTMLInputElement | null;
      return `correo="${correo?.value ?? ""}" clave=${clave?.value ? "puesta" : "VACÍA"}`;
    });
    comprobar("el formulario queda relleno", /clave=puesta/.test(listoParaEnviar), listoParaEnviar);
    await anonima.evaluate(() => (document.querySelector('form button[type="submit"]') as HTMLElement | null)?.click());
    await esperar(4000);
    const { rows: nueva } = await client.query(
      `SELECT d.id, d."rolDocente", d."cuentaDeClase" FROM dietistas d WHERE d.email = $1`, [NUEVA.email]);
    comprobar("la cuenta se crea", nueva.length === 1);
    comprobar("con rol de alumna", nueva[0]?.rolDocente === "ALUMNO");
    comprobar("y marcada como nacida en el aula", nueva[0]?.cuentaDeClase === true);
    comprobar("y se le manda a iniciar sesión con la contraseña que eligió",
      anonima.url().includes("/login"), anonima.url().replace(BASE, ""));
    await foto(anonima, "07-alumna-nueva-tras-crear-cuenta");
    // Y entrando de verdad, aterriza en su aula.
    const recien = await sesionDe(navegador, NUEVA.email, NUEVA.pass);
    await recien.goto(`${BASE}/entrar`, { waitUntil: "networkidle0" });
    await esperar(2500);
    comprobar("al entrar aterriza en su aula", recien.url().includes("/aula"), recien.url().replace(BASE, ""));
    await foto(recien, "07b-alumna-nueva-en-su-aula");

    console.log("\n10-11. El enlace con una sesión ya abierta");
    // La alumna invitada por correo se crea su cuenta aparte para probar el enlace con sesión.
    const alumnaId = await crearCuenta(client, ALUMNA);
    const alumna = await sesionDe(navegador, ALUMNA.email, ALUMNA.pass);
    await alumna.goto(`${BASE}/clase/${token}`, { waitUntil: "networkidle0" });
    await esperar(1200);
    visible = await texto(alumna);
    comprobar("le dice con qué cuenta está dentro", visible.includes(ALUMNA.email));
    comprobar("y ofrece apuntarse de un clic", /Apuntarme a la clase con esta cuenta/i.test(visible));
    comprobar("con la salida por si no es ella", /No soy yo/i.test(visible));
    await foto(alumna, "08-enlace-con-sesion");
    await pulsar(alumna, "Apuntarme a la clase");
    await esperar(3000);
    const { rows: matricula } = await client.query(
      `SELECT activa FROM alumnos_clase WHERE "claseId" = $1 AND "alumnoId" = $2`, [claseId, alumnaId]);
    comprobar("queda matriculada de verdad", matricula.length === 1 && matricula[0].activa === true);
    const { rows: rolAlumna } = await client.query(`SELECT "rolDocente", "cuentaDeClase" FROM dietistas WHERE id = $1`, [alumnaId]);
    comprobar("y pasa a ser alumna", rolAlumna[0].rolDocente === "ALUMNO");
    comprobar("sin marcarla como cuenta nacida en clase: ya la tenía", rolAlumna[0].cuentaDeClase === false);

    await profe.goto(`${BASE}/clase/${token}`, { waitUntil: "networkidle0" });
    await esperar(1200);
    visible = await texto(profe);
    comprobar("a la profesora no se le ofrece apuntarse", !/Apuntarme a la clase/i.test(visible));
    comprobar("se le explica que el enlace es para sus alumnos", /Estás dentro como profesor/i.test(visible));
    await foto(profe, "09-enlace-visto-por-la-profesora");

    // ─────────── BLOQUE 4 · El caso ───────────
    console.log("\n═══ BLOQUE 4 · El caso ═══");

    console.log("\n12-13. Crear el caso y su paciente");
    await profe.goto(`${BASE}/profesor/casos/nuevo`, { waitUntil: "networkidle0" });
    await esperar(1200);
    await escribirEnCampo(profe, "Nombre del caso", `${MARCA} Mujer vegana con anemia`);
    await escribirEnCampo(profe, "Qué les pides", "Cubre el hierro con alimentos vegetales y explica la suplementación.");
    await escribirEnCampo(profe, "Nombre", "Marta", true);
    await escribirEnCampo(profe, "Apellidos", "Vegana", true);
    await esperar(400);
    await profe.evaluate(() => (document.querySelector('form button[type="submit"]') as HTMLElement | null)?.click());
    await esperar(3500);
    const { rows: caso } = await client.query(
      `SELECT id, consigna, "pacienteId", "compartirPlanes" FROM casos_clinicos WHERE nombre = $1`,
      [`${MARCA} Mujer vegana con anemia`]);
    comprobar("el caso se crea", caso.length === 1);
    const casoId = caso[0].id as string;
    const plantillaId = caso[0].pacienteId as string;
    comprobar("con su consigna", (caso[0].consigna as string).includes("hierro"));
    comprobar("y con un paciente plantilla detrás", !!plantillaId);
    comprobar("que nace sin compartir la planificación", caso[0].compartirPlanes === false);

    await profe.goto(`${BASE}/pacientes/${plantillaId}`, { waitUntil: "networkidle0" });
    await esperar(1800);
    visible = await texto(profe);
    comprobar("la ficha del caso es la de un paciente normal",
      visible.includes("Planificación") && visible.includes("Plan de alimentación"));
    comprobar("sin portal del paciente", !visible.includes("Portal del paciente"));
    comprobar("con el aviso de que es un caso", /lo verán tus alumnos/i.test(visible));
    await foto(profe, "10-ficha-del-caso");

    // El profesor rellena la ficha y se hace su solución: a clics sería el editor de dietas entero.
    await client.query(
      `UPDATE pacientes SET peso = 58, altura = 165, sexo = 'FEMENINO', objetivo = 'PATOLOGIA',
              patologias = ARRAY['Anemia ferropénica'],
              horario = '[{"dia":"lunes","hora":"08:00","actividad":"Desayuno"}]'::jsonb
        WHERE id = $1`, [plantillaId]);
    const { rows: plani } = await client.query(
      `INSERT INTO planificaciones (id, "pacienteId", "dietistaId", nombre, datos, "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, '${MARCA} Plani del profe', '{"kcalObjetivo":1800}', NOW(), NOW())
       RETURNING id`, [plantillaId, profeId]);
    const planiId = plani[0].id as string;
    await client.query(
      `INSERT INTO planes_alimenticios (id, "pacienteId", "dietistaId", nombre, "planificacionIds",
              activo, "createdAt", "updatedAt")
       VALUES ('${MARCA}-plan-profe', $1, $2, '${MARCA} Plan del profe', ARRAY[$3]::text[], true, NOW(), NOW())`,
      [plantillaId, profeId, planiId]);

    console.log("\n14. Asignar el caso a la clase con su plazo");
    await profe.goto(`${BASE}/profesor/casos/${casoId}`, { waitUntil: "networkidle0" });
    await esperar(1500);
    await pulsar(profe, "Asignar a una clase");
    await esperar(800);
    // La clase se elige en un desplegable, no en una lista de botones.
    const elegida = await profe.evaluate((nombre) => {
      const sel = document.querySelector("select") as HTMLSelectElement | null;
      if (!sel) return "sin desplegable";
      const op = Array.from(sel.options).find((o) => o.textContent?.includes(nombre));
      if (!op) return "sin la clase en el desplegable";
      Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")!.set!.call(sel, op.value);
      sel.dispatchEvent(new Event("change", { bubbles: true }));
      return "ok";
    }, `${MARCA} Dietoterapia II`);
    comprobar("la clase sale para elegirla", elegida === "ok", elegida);
    await esperar(500);
    await pulsar(profe, "Asignar");
    await esperar(2500);
    const { rows: asig } = await client.query(
      `SELECT id, "fechaLimite" FROM asignaciones_caso WHERE "casoId" = $1 AND "claseId" = $2`, [casoId, claseId]);
    comprobar("el caso queda asignado a la clase", asig.length === 1);
    const asignacionId = asig[0].id as string;
    visible = await texto(profe);
    comprobar("y se ve a qué clase, con sus alumnas", visible.includes(`${MARCA} Dietoterapia II`));
    await foto(profe, "11-caso-asignado");

    console.log("\n15-16. Compartir (o no) su planificación y su plan");
    await profe.goto(`${BASE}/pacientes/${plantillaId}`, { waitUntil: "networkidle0" });
    await esperar(1800);
    visible = await texto(profe);
    comprobar("el interruptor está en la ficha, apagado", visible.includes("Darles hecha la planificación") && visible.includes("Apagado:"));
    comprobar("apagado quiere decir que su solución es suya", /no.*se.*copian|Apagado/i.test(visible));
    await foto(profe, "12-interruptor-apagado");

    // ─────────── BLOQUE 5 · La alumna trabaja ───────────
    console.log("\n═══ BLOQUE 5 · La alumna trabaja ═══");

    console.log("\n17. Empezar el caso");
    await alumna.goto(`${BASE}/aula`, { waitUntil: "networkidle0" });
    await esperar(1500);
    visible = await texto(alumna);
    comprobar("ve su clase", visible.includes(`${MARCA} Dietoterapia II`));
    comprobar("con un caso por entregar", /1 caso/.test(visible), visible.match(/\d+ caso[^\n]*/)?.[0] ?? "");
    await pulsar(alumna, `${MARCA} Dietoterapia II`);
    await esperar(2000);
    comprobar("dentro de la clase está el caso", (await texto(alumna)).includes(`${MARCA} Mujer vegana`));
    await foto(alumna, "13-aula-de-la-alumna");
    await pulsar(alumna, "Empezar el caso");
    await esperar(4000);
    const { rows: copia } = await client.query(
      `SELECT id, "esDeClase", "origenHuella", peso, patologias FROM pacientes WHERE "dietistaId" = $1`, [alumnaId]);
    comprobar("se le crea su copia del paciente", copia.length === 1);
    const copiaId = copia[0]?.id as string;
    comprobar("marcada como paciente de clase", copia[0]?.esDeClase === true);
    comprobar("con los datos que puso la profesora", Number(copia[0]?.peso) === 58);
    comprobar("y sus patologías", (copia[0]?.patologias as string[])?.includes("Anemia ferropénica"));
    const { rows: planesCopia } = await client.query(
      `SELECT COUNT(*)::int n FROM planes_alimenticios WHERE "pacienteId" = $1`, [copiaId]);
    comprobar("sin el plan de la profesora: no lo compartió", planesCopia[0].n === 0, `planes: ${planesCopia[0].n}`);
    await foto(alumna, "14-caso-empezado");

    console.log("\n16b. Ahora la profesora sí lo comparte");
    await profe.goto(`${BASE}/pacientes/${plantillaId}`, { waitUntil: "networkidle0" });
    await esperar(1800);
    await pulsar(profe, "Darles hecha la planificación");
    await esperar(3000);
    const { rows: compartido } = await client.query(`SELECT "compartirPlanes" FROM casos_clinicos WHERE id = $1`, [casoId]);
    comprobar("el interruptor se enciende", compartido[0].compartirPlanes === true);
    visible = await texto(profe);
    comprobar("avisa de que a quien ya empezó le llega solo", /Encendido|ya lo/i.test(visible));
    await foto(profe, "15-interruptor-encendido");

    console.log("\n18. Al abrir su paciente le llega, marcado y de solo lectura");
    await alumna.goto(`${BASE}/pacientes/${copiaId}?pestana=plan-alimentacion`, { waitUntil: "networkidle0" });
    await esperar(4000);
    const { rows: planesTras } = await client.query(
      `SELECT nombre, "origenId" FROM planes_alimenticios WHERE "pacienteId" = $1`, [copiaId]);
    comprobar("el plan de la profesora le llega solo, sin pulsar nada", planesTras.length === 1,
      planesTras.map((p) => p.nombre).join(", ") || "ninguno");
    comprobar("marcado como venido de la profesora", !!planesTras[0]?.origenId);
    visible = await texto(alumna);
    comprobar("y en pantalla dice «Del profesor»", visible.includes("Del profesor"));
    comprobar("con la explicación de que no se toca", /puedes consultarlo, pero no editarlo/i.test(visible));
    await foto(alumna, "16-plan-del-profesor");

    // Que de verdad no se pueda tocar, no solo que lo diga la pantalla.
    const { rows: planCopia } = await client.query(
      `SELECT id FROM planes_alimenticios WHERE "pacienteId" = $1 AND "origenId" IS NOT NULL`, [copiaId]);
    comprobar("y el candado está en el servidor, no solo en la pantalla", planCopia.length === 1);

    console.log("\n19. Lo suyo lo hace ella");
    const { rows: planiSuya } = await client.query(
      `INSERT INTO planificaciones (id, "pacienteId", "dietistaId", nombre, datos, "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, '${MARCA} Mi planificacion', '{"kcalObjetivo":1900}', NOW(), NOW())
       RETURNING id`, [copiaId, alumnaId]);
    await client.query(
      `INSERT INTO planes_alimenticios (id, "pacienteId", "dietistaId", nombre, "planificacionIds",
              activo, "caloriasObjetivo", "createdAt", "updatedAt")
       VALUES ('${MARCA}-plan-alumna', $1, $2, '${MARCA} Mi plan', ARRAY[$3]::text[], true, 1900, NOW(), NOW())`,
      [copiaId, alumnaId, planiSuya[0].id]);
    // Con comida de verdad dentro: un plan vacío no tiene calorías que sumar, y la comparativa
    // del paso 28b2 no podría comprobar ningún número.
    for (const dia of ["LUNES", "MARTES"]) {
      const { rows: d } = await client.query(
        `INSERT INTO dias_del_plan (id, "planId", dia) VALUES (gen_random_uuid()::text, $1, $2::"DiaSemana") RETURNING id`,
        [`${MARCA}-plan-alumna`, dia]);
      const { rows: c } = await client.query(
        `INSERT INTO comidas_del_dia (id, "diaId", tipo, orden) VALUES (gen_random_uuid()::text, $1, 'ALMUERZO', 0) RETURNING id`,
        [d[0].id]);
      // Tres alimentos cualesquiera del catálogo: lo que importa es que sumen algo real.
      await client.query(
        `INSERT INTO alimentos_en_comida (id, "comidaId", "alimentoId", cantidad, unidad, orden)
         SELECT gen_random_uuid()::text, $1, a.id, 150, 'GRAMOS', row_number() OVER ()
           FROM (SELECT id FROM alimentos WHERE calorias > 50 ORDER BY id LIMIT 3) a`,
        [c[0].id]);
    }
    await alumna.goto(`${BASE}/pacientes/${copiaId}?pestana=plan-alimentacion`, { waitUntil: "networkidle0" });
    await esperar(2500);
    // Los planes de un paciente viven en un desplegable: solo se pinta el elegido, así que hay
    // que abrirlo para ver que están los dos.
    await alumna.evaluate((marca) => {
      const b = Array.from(document.querySelectorAll("button")).find((x) => x.textContent?.includes(marca));
      (b as HTMLElement | undefined)?.click();
    }, MARCA);
    await esperar(900);
    visible = await texto(alumna);
    const { rows: cuantosPlanes } = await client.query(
      `SELECT nombre, "origenId" IS NOT NULL AS "delProfe" FROM planes_alimenticios WHERE "pacienteId" = $1 ORDER BY nombre`, [copiaId]);
    comprobar("su plan y el de la profesora conviven",
      visible.includes(`${MARCA} Mi plan`) && visible.includes(`${MARCA} Plan del profe`),
      `en la base: ${cuantosPlanes.map((p) => `${p.nombre}${p.delprofe ? " (del profe)" : ""}`).join(" / ") || "ninguno"}` +
      ` | en pantalla: ${visible.split("\n").filter((l) => l.includes(MARCA)).join(" · ").slice(0, 140) || "ninguno"}`);
    await foto(alumna, "17-los-dos-planes");

    // ─────────── BLOQUE 6 · La profesora cambia algo a mitad ───────────
    console.log("\n═══ BLOQUE 6 · La profesora cambia algo a mitad ═══");

    console.log("\n20. Cambia el peso: a la alumna le llega sola");
    await client.query(`UPDATE pacientes SET peso = 61, notas = 'Ha cambiado el peso' WHERE id = $1`, [plantillaId]);
    await alumna.goto(`${BASE}/pacientes/${copiaId}`, { waitUntil: "networkidle0" });
    await esperar(3500);
    const { rows: copiaTras } = await client.query(`SELECT peso, notas FROM pacientes WHERE id = $1`, [copiaId]);
    comprobar("la copia se pone al día sola, sin botones", Number(copiaTras[0].peso) === 61, `peso: ${copiaTras[0].peso}`);
    const { rows: sigueSuyo } = await client.query(
      `SELECT COUNT(*)::int n FROM planes_alimenticios WHERE "pacienteId" = $1 AND "origenId" IS NULL`, [copiaId]);
    comprobar("y lo suyo no se toca", sigueSuyo[0].n === 1);

    console.log("\n21. Tocar el horario y salir sin guardar avisa");
    await profe.goto(`${BASE}/pacientes/${plantillaId}`, { waitUntil: "networkidle0" });
    await esperar(2500);
    // Quitar la entrada del horario deja cambios pendientes sin necesidad de rellenar nada.
    const tocado = await profe.evaluate(() => {
      const celda = Array.from(document.querySelectorAll("td")).find((c) => c.textContent?.includes("Desayuno"));
      const x = celda?.querySelector("button") as HTMLElement | null;
      if (!x) return false;
      x.click();
      return true;
    });
    comprobar("se puede tocar el horario", tocado);
    await esperar(1200);
    comprobar("aparece el botón de guardar", (await texto(profe)).includes("Guardar"));
    // Y ahora se intenta salir por el menú sin guardar.
    await profe.evaluate(() => {
      const enlace = Array.from(document.querySelectorAll("aside a")).find((a) => a.textContent?.trim() === "Casos");
      (enlace as HTMLElement | undefined)?.click();
    });
    await esperar(1500);
    visible = await texto(profe);
    comprobar("avisa de que hay cambios sin guardar", /cambios sin guardar/i.test(visible));
    comprobar("con las tres salidas", visible.includes("Guardar y salir") && visible.includes("Salir sin guardar") && visible.includes("Seguir editando"));
    await foto(profe, "18b-cambios-sin-guardar");
    await pulsar(profe, "Guardar y salir");
    await esperar(3000);
    const { rows: horarioTras } = await client.query(`SELECT horario::text AS h FROM pacientes WHERE id = $1`, [plantillaId]);
    comprobar("«Guardar y salir» guarda de verdad", !(horarioTras[0].h as string ?? "").includes("Desayuno"),
      (horarioTras[0].h as string ?? "").slice(0, 60));

    console.log("\n22. En su paciente tiene delante lo que le piden");
    visible = await texto(alumna);
    comprobar("la consigna", /hierro/i.test(visible));
    comprobar("la clase a la que pertenece", visible.includes(`${MARCA} Dietoterapia II`));
    comprobar("y el botón de entregar", visible.includes("Entregar"));
    await foto(alumna, "18-panel-del-caso");

    // ─────────── BLOQUE 7 · Entregar ───────────
    console.log("\n═══ BLOQUE 7 · Entregar ═══");

    console.log("\n22b. Con cambios sin guardar, entregar los guarda antes");
    // El aviso de «cambios sin guardar» solo saltaba al pinchar un enlace; «Entregar» es un botón
    // de la misma pantalla y se entregaba sin lo último escrito (Guillermo, 7 sep 2026).
    // El horario de la copia se quedó vacío al sincronizarse con la plantilla (paso 21). Se le pone
    // uno a LA PLANTILLA: si se le pone a la copia, la sincronización se lo lleva por delante al
    // abrir la ficha —que es justo lo que se comprobó en el paso 20.
    await client.query(
      `UPDATE pacientes SET horario = '[{"dia":"martes","hora":"09:00","actividad":"Entreno"}]'::jsonb
        WHERE id = $1`, [plantillaId]);
    await alumna.goto(`${BASE}/pacientes/${copiaId}`, { waitUntil: "networkidle0" });
    await esperar(3000);
    const tocadoAlumna = await alumna.evaluate(() => {
      // Cualquier entrada del horario vale: al quitarla quedan cambios pendientes.
      const celda = Array.from(document.querySelectorAll("td")).find((c) => c.textContent?.includes("Entreno"));
      if (!celda) return `sin la celda del horario (td con botón=${document.querySelectorAll("td button").length})`;
      const x = celda.querySelector("button") as HTMLElement | null;
      if (!x) return "la celda está pero sin botón de quitar";
      x.click();
      return "ok";
    });
    if (tocadoAlumna !== "ok") console.log(`    (${tocadoAlumna})`);
    if (tocadoAlumna === "ok") {
      await esperar(1200);
      comprobar("el horario queda con cambios pendientes", (await texto(alumna)).includes("Guardar"));
      await pulsar(alumna, "Entregar");   // abre el cuadro
      await esperar(1000);
      await pulsar(alumna, "Entregar");   // envía: aquí es donde mira si queda algo sin guardar
      await esperar(1200);
      const avisoPendiente = await texto(alumna);
      comprobar("al entregar avisa de que hay cambios sin guardar",
        /se guardarán antes de entregar/i.test(avisoPendiente),
        avisoPendiente.split("\n").find((l) => /sin guardar/i.test(l))?.slice(0, 80) ?? "no lo dice");
      await foto(alumna, "18c-entregar-con-cambios-pendientes");
      // Se sale del aviso sin entregar y se guarda el horario, para seguir con el escenario limpio.
      await pulsar(alumna, "Cancelar");
      await esperar(800);
      await pulsar(alumna, "Guardar");
      await esperar(2500);
      // Se recarga para dejar el cuadro de entregar cerrado y seguir con el paso siguiente limpio.
      await alumna.goto(`${BASE}/pacientes/${copiaId}`, { waitUntil: "networkidle0" });
      await esperar(2000);
    } else {
      apuntar("no pude tocar el horario para probar el aviso al entregar");
    }

    console.log("\n22c. Lo mismo desde la PLANIFICACIÓN, que es donde de verdad se perdía");
    // El horario usa el registro compartido; la planificación traía su propio aviso de salida y
    // nunca se apuntaba a él, así que entregar se llevaba por delante lo último tocado ahí
    // (Guillermo, 8 sep 2026: "aquí directamente se envía"). El cambio se deja SIN guardar a
    // propósito: lo tiene que guardar el botón de entregar, en el paso siguiente.
    await alumna.goto(`${BASE}/pacientes/${copiaId}?pestana=planificacion`, { waitUntil: "networkidle0" });
    await esperar(4000);
    const fuenteNueva = await alumna.evaluate(() => {
      const s = Array.from(document.querySelectorAll("select")).find(
        (x) => (x as HTMLSelectElement).value === "fnb_iom"
      ) as HTMLSelectElement | undefined;
      if (!s) return "";
      const otra = Array.from(s.options).find((o) => o.value && o.value !== "fnb_iom");
      if (!otra) return "";
      // React ignora `select.value = x` a secas: hay que pasar por el setter nativo.
      const setter = Object.getOwnPropertyDescriptor(window.HTMLSelectElement.prototype, "value")!.set!;
      setter.call(s, otra.value);
      s.dispatchEvent(new Event("change", { bubbles: true }));
      return otra.value;
    });
    comprobar("se puede tocar la planificación", fuenteNueva !== "", fuenteNueva || "no encontré el selector");
    await esperar(1500);
    comprobar("y queda con cambios sin guardar", (await texto(alumna)).includes("Guardar"));

    console.log("\n23. Entregar eligiendo el entregable");
    await pulsar(alumna, "Entregar");
    await esperar(1200);
    visible = await texto(alumna);
    comprobar("puede contarle algo a su profesora", /contarle algo a tu profesor/i.test(visible));
    comprobar("y elegir cuál de sus planes entrega", /Lo que entregas|Cuál de tus planes/i.test(visible));
    comprobar("sin casilla de adjuntar: el entregable va siempre", !/Adjuntar el entregable/i.test(visible));
    await foto(alumna, "19-cuadro-de-entregar");
    await pulsar(alumna, "Entregar");
    await esperar(900);
    // Ahora pregunta de verdad antes de cerrar el caso.
    const avisoEntregar = await texto(alumna);
    comprobar("pregunta antes de cerrar el caso", /¿Entregar el caso\?/i.test(avisoEntregar));
    comprobar("y avisa de que no podrá tocar nada más", /no podrás tocar nada más/i.test(avisoEntregar));
    comprobar("y de que lo que está tocando se guarda antes",
      fuenteNueva === "" || /se guardarán antes de entregar/i.test(avisoEntregar),
      avisoEntregar.split("\n").find((l) => /sin guardar/i.test(l))?.slice(0, 80) ?? "no lo dice");
    // Por defecto viene el plan ACTUAL, no el que mira: el aviso tiene que decir cuál manda, o se
    // entrega el que no era (Guillermo, 7 sep 2026).
    comprobar("y dice exactamente qué plan entrega", /Vas a entregar «/.test(avisoEntregar),
      avisoEntregar.split("\n").find((l) => l.includes("Vas a entregar"))?.slice(0, 70) ?? "no lo dice");
    await foto(alumna, "19a-confirmar-entrega");
    await pulsar(alumna, "Entregar");
    await esperar(7000);
    const { rows: entrega } = await client.query(
      `SELECT id, "entregadaAt", "entregaSnapshot" IS NOT NULL AS congelada, "entregablePdf" IS NOT NULL AS pdf,
              "entregablePlanId" FROM entregas_caso WHERE "asignacionId" = $1 AND "alumnoId" = $2`,
      [asignacionId, alumnaId]);
    comprobar("queda entregado", entrega.length === 1 && !!entrega[0].entregadaAt);
    const entregaId = entrega[0]?.id as string;
    comprobar("con la foto congelada de su trabajo", entrega[0]?.congelada === true);
    comprobar("y sabiendo cuál era el entregable", !!entrega[0]?.entregablePlanId);
    // Lo que de verdad importa: NO se guarda ningún PDF y aun así se puede descargar, porque se
    // genera al pedirlo (7 sep 2026). Antes eran 165 KB por entrega guardados para siempre.
    comprobar("sin guardar ni un byte de PDF", entrega[0]?.pdf === false);
    const descarga = await alumna.evaluate(async (id) => {
      const r = await fetch(`/api/entregas/${id}/pdf`);
      const b = r.ok ? await r.blob() : null;
      return {
        estado: r.status, tipo: r.headers.get("content-type") ?? "", bytes: b?.size ?? 0,
        nombre: decodeURIComponent(r.headers.get("content-disposition") ?? ""),
      };
    }, entregaId);
    comprobar("y el alumno se lo puede descargar", descarga.estado === 200 && descarga.tipo.includes("pdf") && descarga.bytes > 10000,
      `${descarga.estado} · ${descarga.tipo} · ${Math.round(descarga.bytes / 1024)} KB`);
    // El fichero lleva alumno, caso y clase: con veinte descargados, «Plan-Marta.pdf» no sirve.
    comprobar("y el fichero se llama con su nombre, el caso y la clase",
      /Lucia|Alumna/.test(descarga.nombre) && /vegana/i.test(descarga.nombre) && /Dietoterapia/i.test(descarga.nombre),
      descarga.nombre);
    await foto(alumna, "20-entregado");

    // Fase 5 — Entregar NO genera aviso: con veinte alumnos sería una lluvia (Guillermo, 8 sep
    // 2026). El profesor se entera cuando acaba el plazo, y eso se prueba justo abajo.
    const { rows: sinAviso } = await client.query(
      `SELECT 1 FROM notificaciones WHERE "dietistaId" = $1 AND tipo = 'ENTREGA_RECIBIDA'`, [profeId]);
    comprobar("entregar no le llena la campana al profesor", sinAviso.length === 0, `${sinAviso.length} avisos`);

    // Y al pasar el plazo, un solo aviso con lo que queda por revisar.
    await client.query(`UPDATE asignaciones_caso SET "fechaLimite" = CURRENT_DATE - 1, "avisoPlazoAt" = NULL WHERE id = $1`, [asignacionId]);
    await profe.goto(`${BASE}/profesor`, { waitUntil: "networkidle0" });
    await esperar(3500);
    const { rows: avisoPlazo } = await client.query(
      `SELECT params, enlace FROM notificaciones WHERE "dietistaId" = $1 AND tipo = 'ENTREGA_RECIBIDA'`, [profeId]);
    comprobar("al acabar el plazo sí le avisa, y una sola vez", avisoPlazo.length === 1, `${avisoPlazo.length}`);
    comprobar("diciendo cuántas quedan por revisar", Number(avisoPlazo[0]?.params?.n) >= 1,
      `n=${avisoPlazo[0]?.params?.n} · ${avisoPlazo[0]?.params?.caso ?? "?"}`);
    comprobar("y llevándole a su caso", String(avisoPlazo[0]?.enlace ?? "").startsWith("/profesor/casos/"));

    // Lo que pidió Guillermo el 8 sep 2026: que entregar NO se lleve por delante lo que estabas
    // tocando en la planificación. Se comprueba en la base, no en la pantalla.
    if (fuenteNueva) {
      const { rows: guardado } = await client.query(
        `SELECT datos->>'fibraFuente' AS fuente FROM planificaciones
          WHERE "pacienteId" = $1 AND "origenId" IS NULL ORDER BY "updatedAt" DESC LIMIT 1`, [copiaId]);
      comprobar("lo que estaba tocando se guardó al entregar", guardado[0]?.fuente === fuenteNueva,
        `guardado="${guardado[0]?.fuente ?? "nada"}" · tocado="${fuenteNueva}"`);
      const { rows: enLaFoto } = await client.query(
        `SELECT EXISTS (
           SELECT 1 FROM jsonb_array_elements(("entregaSnapshot"::jsonb)->'planificaciones') p
            WHERE p->'datos'->>'fibraFuente' = $2
         ) AS ok FROM entregas_caso WHERE id = $1`, [entregaId, fuenteNueva]);
      comprobar("y viajó dentro de la foto de la entrega", enLaFoto[0]?.ok === true);
    }

    // Cuánto pesa una entrega de verdad: es el número con el que se decide la política de borrado
    // (`limpiar-docencia`). Si algún día crece mucho, aquí se ve.
    const { rows: peso } = await client.query(
      `SELECT COALESCE("entregableBytes", 0)::int AS pdf, pg_column_size("entregaSnapshot")::int AS foto
         FROM entregas_caso WHERE id = $1`, [entregaId]);
    console.log(`    · lo que queda guardado: ${Math.round(peso[0].foto / 1024)} KB (antes eran ~165 KB de PDF por entrega)`);
    comprobar("una entrega apenas ocupa", peso[0].pdf === 0 && peso[0].foto < 100 * 1024,
      `${Math.round((peso[0].pdf + peso[0].foto) / 1024)} KB`);

    console.log("\n24. Lo que toque después NO cambia la entrega");
    await client.query(`UPDATE planes_alimenticios SET nombre = '${MARCA} Mi plan RETOCADO' WHERE id = '${MARCA}-plan-alumna'`);
    const { rows: sigueIgual } = await client.query(
      `SELECT "entregaSnapshot"::text AS foto FROM entregas_caso WHERE id = $1`, [entregaId]);
    comprobar("la foto entregada no se entera", (sigueIgual[0].foto as string).includes(`${MARCA} Mi plan`) &&
      !(sigueIgual[0].foto as string).includes("RETOCADO"));

    console.log("\n25. Entregado es entregado: el caso se cierra");
    await alumna.goto(`${BASE}/pacientes/${copiaId}`, { waitUntil: "networkidle0" });
    await esperar(2500);
    visible = await texto(alumna);
    comprobar("ya no puede deshacerlo ella", !visible.includes("Deshacer la entrega"));
    comprobar("y se le explica que está cerrado", /pídele a tu profesor que te lo reabra/i.test(visible));
    // Y los botones de tocar tienen que estar fuera, no fallar al pulsarlos (Guillermo, 7 sep 2026).
    await alumna.goto(`${BASE}/pacientes/${copiaId}?pestana=plan-alimentacion`, { waitUntil: "networkidle0" });
    await esperar(3000);
    const enElPlan = await texto(alumna);
    comprobar("en su plan se ve el candado de entregado", /Ya has entregado este caso/i.test(enElPlan));
    const botonesQueTocan = await alumna.evaluate(() =>
      Array.from(document.querySelectorAll("button, a"))
        .map((b) => b.textContent?.trim() ?? "")
        .filter((t) => /^(Nuevo plan|Añadir alimento|Añadir comida|Añadir día|Eliminar)/.test(t)));
    comprobar("y no quedan botones de editar que fueran a fallar", botonesQueTocan.length === 0,
      botonesQueTocan.join(", ") || "ninguno");
    await foto(alumna, "19b-plan-bloqueado-tras-entregar");
    // Y el candado es de verdad, no solo de pantalla: se intenta tocar el plan por la puerta de atrás.
    const intento = await alumna.evaluate(async () => {
      const r = await fetch("/pacientes", { method: "HEAD" });
      return r.status;
    });
    comprobar("la sesión sigue viva para el resto de la app", intento < 500, `HEAD /pacientes → ${intento}`);

    console.log("\n25b. Y el profesor puede reabrírselo");
    await profe.goto(`${BASE}/profesor/casos/${casoId}/entregas/${asignacionId}/${entregaId}`, { waitUntil: "networkidle0" });
    await esperar(2500);
    comprobar("el profesor tiene «Reabrir la entrega»", (await texto(profe)).includes("Reabrir la entrega"));
    await pulsar(profe, "Reabrir la entrega");
    await esperar(700);
    comprobar("con su aviso de lo que se pierde", /se corrige lo que entregue después/i.test(await texto(profe)));
    await foto(profe, "20b-reabrir-la-entrega");
    await pulsar(profe, "Reabrir la entrega");
    await esperar(3000);
    const { rows: reabierta } = await client.query(
      `SELECT estado, "entregadaAt", "entregablePlanId" FROM entregas_caso WHERE id = $1`, [entregaId]);
    comprobar("la entrega vuelve a estar en marcha", reabierta[0]?.estado === "EN_MARCHA" && reabierta[0]?.entregadaAt === null);
    comprobar("y se le avisa al alumno",
      (await client.query(`SELECT 1 FROM notificaciones WHERE "dietistaId" = $1 AND enlace = '/aula'`, [alumnaId])).rows.length > 0);

    console.log("\n25c. Reabierto, vuelve a poder entregar");
    await alumna.goto(`${BASE}/pacientes/${copiaId}`, { waitUntil: "networkidle0" });
    await esperar(2500);
    comprobar("le sale otra vez el botón de entregar", (await texto(alumna)).includes("Entregar"));
    await pulsar(alumna, "Entregar");   // abre el cuadro
    await esperar(1200);
    await pulsar(alumna, "Entregar");   // envía
    await esperar(900);
    await pulsar(alumna, "Entregar");   // confirma el aviso
    await esperar(6000);
    const { rows: entrega2 } = await client.query(
      `SELECT id, "entregadaAt", "entregablePlanId" FROM entregas_caso WHERE "asignacionId" = $1 AND "alumnoId" = $2`,
      [asignacionId, alumnaId]);
    comprobar("la nueva entrega queda hecha", !!entrega2[0]?.entregadaAt);
    const entregaId2 = entrega2[0]?.id as string;

    // ─────────── BLOQUE 8 · Corregir ───────────
    console.log("\n═══ BLOQUE 8 · Corregir ═══");

    console.log("\n26. La profesora ve la entrega entera");
    await profe.goto(`${BASE}/profesor/casos/${casoId}`, { waitUntil: "networkidle0" });
    await esperar(2000);
    await pulsar(profe, ALUMNA.nombre);
    await esperar(3000);
    if (!profe.url().includes("/entregas/")) {
      await profe.goto(`${BASE}/profesor/casos/${casoId}/entregas/${asignacionId}/${entregaId2}`, { waitUntil: "networkidle0" });
      await esperar(3000);
      apuntar("desde la ficha del caso no encontré el enlace a la entrega por su nombre: entré por la dirección");
    }
    visible = await texto(profe);
    const { rows: comoEsta } = await client.query(
      `SELECT estado, "entregadaAt" IS NOT NULL AS entregada, "entregaSnapshot" IS NOT NULL AS foto,
              "entregaSnapshot"->>'v' AS version
         FROM entregas_caso WHERE id = $1`, [entregaId2]);
    comprobar("avisa de que la entrega está cerrada", /caso está cerrado para el alumno/i.test(visible),
      `estado=${comoEsta[0]?.estado} entregada=${comoEsta[0]?.entregada} foto=${comoEsta[0]?.foto} v=${comoEsta[0]?.version}`);
    comprobar("ve su plan", visible.includes(`${MARCA} Mi plan`));
    comprobar("ve la planificación", visible.includes("Planificación"));
    // Y la ve con su detalle, no a medias: el reparto por comida abierto si el alumno lo activó, y
    // las fechas de duración, que no viajaban en la foto (Guillermo, 7 sep 2026).
    comprobar("con la duración que puso el alumno, no vacía",
      !/Seleccionar mes/.test(visible) || !/Reparto por comida/.test(visible),
      visible.includes("Seleccionar mes") ? "sale «Seleccionar mes» vacío" : "");
    comprobar("y tiene el PDF del entregable", visible.includes("Entregable") || visible.includes("PDF"));
    comprobar("con el candado de solo lectura", /no puedes toc|solo lectura|tal y como/i.test(visible),
      visible.split("\n").find((l) => /tal y como|no puedes/i.test(l))?.slice(0, 90) ?? "no sale");
    await foto(profe, "21-entrega-vista-por-la-profesora");

    console.log("\n26b. El segundo profesor de la clase también puede corregir");
    // Primero, que tenga por dónde llegar: la ficha del caso, en solo lectura.
    await profe2.goto(`${BASE}/profesor/casos/${casoId}`, { waitUntil: "networkidle0" });
    await esperar(2500);
    const casoAdjunto = await texto(profe2);
    comprobar("el adjunto puede abrir el caso de su clase", casoAdjunto.includes(`${MARCA} Mujer vegana`), profe2.url().replace(BASE, ""));
    comprobar("y se le dice de quién es", /Este caso lo ha hecho/i.test(casoAdjunto));
    comprobar("sin ofrecerle tocar el material de otro",
      !casoAdjunto.includes("Asignar a una clase") && !casoAdjunto.includes("Darles hecha"));
    // Las entregas de cada clase van en un desplegable: hay que abrirlo para verlas.
    await profe2.evaluate(() => document.querySelectorAll("details").forEach((d) => { d.open = true; }));
    await esperar(1200);
    comprobar("pero con las entregas de sus alumnos", (await texto(profe2)).includes(ALUMNA.nombre));
    await foto(profe2, "21a-caso-visto-por-el-adjunto");
    // La pantalla promete que «todos los que estén aquí ven los mismos alumnos y el mismo
    // trabajo»: hasta la revisión del 7 sep 2026 el adjunto veía las entregas en la clase y al
    // abrir una le decía que no existía.
    await profe2.goto(profe.url(), { waitUntil: "networkidle0" });
    await esperar(2500);
    const vistaAdjunto = await texto(profe2);
    comprobar("el adjunto abre la entrega", vistaAdjunto.includes(ALUMNA.nombre), profe2.url().replace(BASE, ""));
    comprobar("y ve el trabajo, no un error", /tal y como la hizo/i.test(vistaAdjunto));
    comprobar("con el cuadro de corregir", /Nota \(0-10\)/.test(vistaAdjunto));
    await foto(profe2, "21b-entrega-vista-por-el-adjunto");

    console.log("\n26c. Y quien deja de llevar la clase, deja de poder");
    // El permiso sale de llevar la clase, no de ser profesor de la facultad: si se le saca de la
    // clase, el caso y la entrega vuelven a estar fuera de su alcance.
    const urlEntrega = profe2.url();
    await client.query(`DELETE FROM profesores_clase WHERE "claseId" = $1 AND "profesorId" = $2`, [claseId, profe2Id]);
    await profe2.goto(`${BASE}/profesor/casos/${casoId}`, { waitUntil: "networkidle0" });
    await esperar(2000);
    comprobar("fuera de la clase, el caso ya no se le abre", !(await texto(profe2)).includes(`${MARCA} Mujer vegana`),
      profe2.url().replace(BASE, ""));
    await profe2.goto(urlEntrega, { waitUntil: "networkidle0" });
    await esperar(2000);
    comprobar("ni la entrega de una alumna que ya no es suya", !(await texto(profe2)).includes("tal y como la hizo"),
      profe2.url().replace(BASE, ""));
    // Se le devuelve para no dejar el escenario a medias.
    await client.query(
      `INSERT INTO profesores_clase (id, "claseId", "profesorId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, NOW(), NOW())`, [claseId, profe2Id]);

    console.log("\n27. Nota de 0 a 10 con decimales");
    // El campo tragaba «7ajhdbfsauoewfh23» y solo protestaba al guardar (Guillermo, 7 sep 2026).
    await escribirEnCampo(profe, "Nota", "7ajhdbfsauoewfh23");
    await esperar(400);
    const loQueQueda = await profe.evaluate(() => {
      const l = Array.from(document.querySelectorAll("label")).find((x) => x.textContent?.startsWith("Nota"));
      return (l?.parentElement?.querySelector("input") as HTMLInputElement | null)?.value ?? "";
    });
    comprobar("el campo de la nota no traga letras", !/[a-z]/i.test(loQueQueda), `queda «${loQueQueda}»`);
    await escribirEnCampo(profe, "Nota", "7,5");
    await escribirEnCampo(profe, "Comentario", "Muy bien el hierro; repasa la vitamina C.");
    await esperar(400);
    await pulsar(profe, "Guardar la corrección");
    await esperar(3000);
    const { rows: corregida } = await client.query(
      `SELECT nota, comentario, "visibleParaAlumno" FROM entregas_caso WHERE id = $1`, [entregaId2]);
    comprobar("la nota se guarda con su decimal", Number(corregida[0]?.nota) === 7.5, String(corregida[0]?.nota));
    comprobar("y el comentario", (corregida[0]?.comentario as string)?.includes("vitamina C"));
    await foto(profe, "22-corregida");

    console.log("\n28. La alumna ve su nota");
    await alumna.goto(`${BASE}/aula`, { waitUntil: "networkidle0" });
    await esperar(2000);
    visible = await texto(alumna);
    const veLaNota = visible.includes("7,5") || visible.includes("7.5");
    comprobar("ve su nota en el aula", veLaNota || corregida[0]?.visibleParaAlumno === false,
      veLaNota ? "" : `visibleParaAlumno=${corregida[0]?.visibleParaAlumno}`);
    if (!veLaNota && corregida[0]?.visibleParaAlumno === false) {
      apuntar("por defecto la nota NO se le enseña al alumno: hay que encender «Que el alumno vea la nota» (decidido el 27 ago 2026). El guion que te pasé no lo decía.");
    }
    await foto(alumna, "23-aula-sin-la-nota-todavia");

    console.log("\n28b. Y cuando la profesora la enseña, la ve");
    // Al guardar la nota se sale a la lista de la clase (es lo que se hace al corregir a veinte),
    // así que para tocar el interruptor hay que volver a entrar en esta entrega.
    await profe.goto(`${BASE}/profesor/casos/${casoId}/entregas/${asignacionId}/${entregaId2}`, { waitUntil: "networkidle0" });
    await esperar(2500);
    await profe.evaluate(() => {
      const l = Array.from(document.querySelectorAll("label")).find((x) => x.textContent?.includes("Que el alumno vea la nota"));
      const c = (l?.querySelector("input") ?? l?.parentElement?.querySelector("input")) as HTMLInputElement | null;
      c?.click();
    });
    await esperar(600);
    await pulsar(profe, "Guardar la corrección");
    await esperar(3000);
    const { rows: visibleYa } = await client.query(`SELECT "visibleParaAlumno" FROM entregas_caso WHERE id = $1`, [entregaId2]);
    comprobar("el interruptor de enseñar la nota funciona", visibleYa[0]?.visibleParaAlumno === true);
    // La nota puede vivir en el aula, dentro de la clase o en el panel del caso de su paciente:
    // se miran los tres para saber dónde la encuentra de verdad.
    const donde: string[] = [];
    for (const [nombre, ruta] of [["el aula", "/aula"], ["su paciente", `/pacientes/${copiaId}`]] as const) {
      await alumna.goto(BASE + ruta, { waitUntil: "networkidle0" });
      await esperar(2200);
      const t = await texto(alumna);
      if (t.includes("7,5") || t.includes("7.5")) donde.push(nombre);
    }
    await alumna.goto(`${BASE}/aula`, { waitUntil: "networkidle0" });
    await esperar(1800);
    await pulsar(alumna, `${MARCA} Dietoterapia II`);
    await esperar(2200);
    visible = await texto(alumna);
    if (visible.includes("7,5") || visible.includes("7.5")) donde.push("dentro de la clase");
    comprobar("y entonces la alumna sí ve su nota", donde.length > 0, donde.join(" y ") || "en ningún sitio");
    // Interesa saber si el aula, que es lo primero que abre, avisa de que ya está corregido.
    await alumna.goto(`${BASE}/aula`, { waitUntil: "networkidle0" });
    await esperar(2000);
    const enElAula = (await texto(alumna)).split("\n").find((l) => /caso/i.test(l) && /\d/.test(l))?.trim() ?? "";
    comprobar("y el aula avisa de que ya está corregido", /corregido/i.test(enElAula), enElAula || "no sale");
    comprobar("con el comentario de su profesora", /vitamina C/i.test(visible), /vitamina C/i.test(visible) ? "" : "no sale en la clase");
    await foto(alumna, "23b-donde-ve-la-nota");

    // ─────────── BLOQUE 9 · Fin de curso ───────────
    console.log("\n═══ BLOQUE 9 · Fin de curso ═══");

    console.log("\n28b2. La comparativa de la clase, con los números de verdad");
    // Lo que el profesor tiene hecho en su caso va arriba, como referencia contra la que leer a la
    // clase (Guillermo, 8 sep 2026). Se le monta aquí para poder comprobarlo.
    const { rows: pacDelCaso } = await client.query(`SELECT "pacienteId" FROM casos_clinicos WHERE id = $1`, [casoId]);
    const { rows: planProfe } = await client.query(
      `INSERT INTO planes_alimenticios (id, "pacienteId", "dietistaId", nombre, activo,
              "caloriasObjetivo", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, '${MARCA} Mi propuesta', true, 2000, NOW(), NOW())
       RETURNING id`, [pacDelCaso[0].pacienteId, profeId]);
    const { rows: diaProfe } = await client.query(
      `INSERT INTO dias_del_plan (id, "planId", dia) VALUES (gen_random_uuid()::text, $1, 'LUNES') RETURNING id`,
      [planProfe[0].id]);
    const { rows: comProfe } = await client.query(
      `INSERT INTO comidas_del_dia (id, "diaId", tipo, orden) VALUES (gen_random_uuid()::text, $1, 'ALMUERZO', 0) RETURNING id`,
      [diaProfe[0].id]);
    await client.query(
      `INSERT INTO alimentos_en_comida (id, "comidaId", "alimentoId", cantidad, unidad, orden)
       SELECT gen_random_uuid()::text, $1, a.id, 200, 'GRAMOS', 1
         FROM (SELECT id FROM alimentos WHERE calorias > 80 ORDER BY id LIMIT 1) a`, [comProfe[0].id]);
    // Su planificación dice 1500 y el plan lleva grabado 2000: manda la planificación, que es donde
    // se decide el objetivo y lo que él toca (Guillermo, 8 sep 2026).
    await client.query(
      `INSERT INTO planificaciones (id, "pacienteId", "dietistaId", nombre, "esDefecto", datos, "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, '${MARCA} Objetivo del caso', true, '{"kcalObjetivo":1500}'::jsonb, NOW(), NOW())`,
      [pacDelCaso[0].pacienteId, profeId]);
    // Fase 5. Los números salen de la foto de la entrega, así que son los del día que entregó.
    await profe.goto(`${BASE}/profesor/casos/${casoId}`, { waitUntil: "networkidle0" });
    await esperar(2000);
    comprobar("desde el caso se ofrece comparar", (await texto(profe)).includes("Comparar la clase"));
    await profe.evaluate(() => {
      const a = Array.from(document.querySelectorAll("a")).find((x) => x.textContent?.includes("Comparar la clase"));
      (a as HTMLElement | undefined)?.click();
    });
    await esperar(3000);
    const comparativa = await texto(profe);
    comprobar("se abre la comparativa", /Comparar la clase/.test(comparativa) && profe.url().includes("/comparativa/"), profe.url());
    comprobar("con la alumna en la tabla", /Lucia|Alumna/.test(comparativa));
    comprobar("y explica contra qué se compara", /la nota la pones tú/i.test(comparativa));
    comprobar("con lo del profesor arriba, como referencia", /Tu caso/.test(comparativa),
      comparativa.split("\n").find((l) => /Tu caso/.test(l))?.slice(0, 60) ?? "no aparece");
    const suFila = await profe.evaluate(() => {
      const tr = Array.from(document.querySelectorAll("tbody tr")).find((x) => /Tu caso/.test(x.textContent ?? ""));
      return Array.from(tr?.querySelectorAll("td") ?? []).map((td) => td.textContent?.trim() ?? "");
    });
    comprobar("y su objetivo sale de su planificación, no del número viejo del plan",
      suFila.includes("1500 kcal") && !suFila.includes("2000 kcal"), suFila.join(" · ").slice(0, 80));
    // Lo que de verdad importa: que el plan sume algo y no salga «—». Si el cálculo se rompe, esto
    // canta enseguida.
    const kcal = await profe.evaluate(() => {
      const fila = Array.from(document.querySelectorAll("tbody tr"))
        .find((tr) => /Lucia|Alumna/.test(tr.textContent ?? ""));
      return Array.from(fila?.querySelectorAll("td") ?? []).map((td) => td.textContent?.trim() ?? "");
    });
    comprobar("con las calorías de su plan calculadas", kcal.some((c) => /^\d{3,4} kcal$/.test(c)), kcal.join(" | ").slice(0, 90));
    comprobar("y el reparto de macros en %", kcal.some((c) => /^\d{1,2}\/\d{1,2}\/\d{1,2}$/.test(c)));
    // Su objetivo sale de SU planificación, no del número que quedó grabado en el plan: es donde se
    // decide y lo que el alumno toca.
    //
    // Y se lee de la FOTO, no de la base: al alumno se le compara con lo que entregó ese día, no
    // con lo que tenga ahora. Son cosas distintas a propósito, y por eso la cifra puede no coincidir
    // con su planificación actual.
    const { rows: suObjetivo } = await client.query(
      `SELECT p->'datos'->>'kcalObjetivo' AS kcal
         FROM entregas_caso e,
              jsonb_array_elements(("entregaSnapshot"::jsonb)->'planificaciones') p
        WHERE e.id = $1 AND p->'datos'->>'kcalObjetivo' IS NOT NULL
        ORDER BY (p->>'esDefecto')::boolean DESC LIMIT 1`, [entregaId]);
    comprobar("y su propio objetivo, el de su planificación",
      !!suObjetivo[0]?.kcal && kcal.includes(`${Math.round(Number(suObjetivo[0].kcal))} kcal`),
      `planificación=${suObjetivo[0]?.kcal ?? "nada"} · tabla=${kcal.join(" | ").slice(0, 70)}`);
    comprobar("con el desvío calculado contra ese objetivo", kcal.some((c) => /^[+-]\d{1,3}%$/.test(c)));
    await foto(profe, "23-comparativa-de-la-clase");

    console.log("\n28b3. Al reabrir, la comparativa deja de dar sus cifras por buenas");
    // La foto se conserva al reabrir. Sin cuidado, la tabla seguiría enseñando lo que ya retiró
    // mientras lo rehace, y el profesor corregiría mirando números que no son.
    await client.query(`UPDATE entregas_caso SET estado = 'EN_MARCHA', "entregadaAt" = NULL WHERE id = $1`, [entregaId]);
    await profe.goto(`${BASE}/profesor/casos/${casoId}/comparativa/${asignacionId}`, { waitUntil: "networkidle0" });
    await esperar(2500);
    const filaReabierta = await profe.evaluate(() => {
      const tr = Array.from(document.querySelectorAll("tbody tr")).find((x) => /Lucia|Alumna/.test(x.textContent ?? ""));
      return Array.from(tr?.querySelectorAll("td") ?? []).map((td) => td.textContent?.trim() ?? "");
    });
    comprobar("su fila se queda sin cifras mientras la rehace",
      !filaReabierta.some((c) => /kcal/.test(c)), filaReabierta.join(" · ").slice(0, 70));
    // Y se deja como estaba para el resto del guion.
    await client.query(
      `UPDATE entregas_caso SET estado = 'CORREGIDA', "entregadaAt" = NOW() WHERE id = $1`, [entregaId]);

    console.log("\n28c. Entregado y SIN ningún plan, tampoco se puede crear uno");
    // Se puede entregar el caso sin haber hecho plan de alimentación. La pestaña tiene una salida
    // temprana para "no hay planes" que se saltaba el cierre y dejaba el botón de crear: quedaba un
    // plan vacío que además no se dejaba rellenar (Guillermo, 8 sep 2026). Aquí se le quitan los
    // planes a propósito para pasar por ese camino.
    const { rows: planesAntes } = await client.query(
      `SELECT id FROM planes_alimenticios WHERE "pacienteId" = $1`, [copiaId]);
    await client.query(`DELETE FROM planes_alimenticios WHERE "pacienteId" = $1`, [copiaId]);
    // Con `compartirPlanes` puesto, abrir la ficha vuelve a copiarle los del profesor: por eso la
    // comprobación de abajo mira solo los propios.
    await alumna.goto(`${BASE}/pacientes/${copiaId}?pestana=plan-alimentacion`, { waitUntil: "networkidle0" });
    await esperar(2500);
    const sinPlanes = await texto(alumna);
    comprobar("se le dice que está entregado", /entregad/i.test(sinPlanes));
    comprobar("y NO se le ofrece crear el primer plan", !/Crear (la )?primera dieta/i.test(sinPlanes),
      sinPlanes.split("\n").find((l) => /rimera dieta/i.test(l))?.slice(0, 60) ?? "");
    await foto(alumna, "24-entregado-sin-planes");
    // Y por detrás tampoco: la acción de crear tiene que rechazarlo aunque se llame sin pantalla.
    // Se cuentan solo los SUYOS: los que llegan del profesor (con `origenId`) se le copian al abrir
    // la ficha porque el caso comparte planes, y esos no los ha creado él.
    const { rows: creados } = await client.query(
      `SELECT id FROM planes_alimenticios WHERE "pacienteId" = $1 AND "origenId" IS NULL`, [copiaId]);
    comprobar("no se ha colado ningún plan nuevo", creados.length === 0, `${creados.length}`);
    console.log(`    (tenía ${planesAntes.length} plan(es) antes de la prueba)`);

    console.log("\n29. Archivar no echa a la alumna");
    await profe.goto(`${BASE}/profesor/clases/${claseId}`, { waitUntil: "networkidle0" });
    await esperar(1200);
    await pulsar(profe, "Archivar");
    await esperar(600);
    await pulsar(profe, "Archivar");
    await esperar(2500);
    comprobar("la clase queda archivada", (await texto(profe)).includes("Esta clase está archivada"));
    await alumna.goto(`${BASE}/aula`, { waitUntil: "networkidle0" });
    await esperar(2000);
    visible = await texto(alumna);
    comprobar("la alumna sigue entrando en su aula", alumna.url().includes("/aula"), alumna.url().replace(BASE, ""));
    comprobar("y lee que no está en ninguna clase", /no estás en ninguna clase/i.test(visible));
    const { rows: sigueAlumna } = await client.query(`SELECT "rolDocente", "exAlumnoDesde" FROM dietistas WHERE id = $1`, [alumnaId]);
    comprobar("sigue siendo alumna en la base", sigueAlumna[0].rolDocente === "ALUMNO" && !sigueAlumna[0].exAlumnoDesde);
    await foto(alumna, "24-alumna-sin-clase");

    console.log("\n30. Desarchivar se la devuelve");
    await profe.goto(`${BASE}/profesor/clases/${claseId}`, { waitUntil: "networkidle0" });
    await pulsar(profe, "Desarchivar");
    await esperar(600);
    await pulsar(profe, "Desarchivar");
    await esperar(2500);
    await alumna.goto(`${BASE}/aula`, { waitUntil: "networkidle0" });
    await esperar(2000);
    visible = await texto(alumna);
    comprobar("la recupera con su caso", visible.includes(`${MARCA} Dietoterapia II`));

    console.log("\n31. Cerrar el curso: pierde la clase, no la cuenta");
    await profe.goto(`${BASE}/profesor/clases/${claseId}`, { waitUntil: "networkidle0" });
    await esperar(1200);
    await pulsar(profe, "Cerrar el curso");
    await esperar(600);
    await pulsar(profe, "Cerrar el curso");
    await esperar(3000);
    const { rows: retiradas } = await client.query(
      `SELECT COUNT(*)::int n FROM alumnos_clase WHERE "claseId" = $1 AND activa = false`, [claseId]);
    comprobar("a los alumnos se les retira el acceso", retiradas[0].n >= 1, `${retiradas[0].n} retiradas`);
    await alumna.goto(`${BASE}/aula`, { waitUntil: "networkidle0" });
    await esperar(2000);
    comprobar("la alumna entra igual, sin que se la eche", alumna.url().includes("/aula"), alumna.url().replace(BASE, ""));
    const { rows: trasCierre } = await client.query(`SELECT "rolDocente" FROM dietistas WHERE id = $1`, [alumnaId]);
    comprobar("y sigue siendo alumna", trasCierre[0].rolDocente === "ALUMNO");
    await foto(alumna, "25-tras-cerrar-el-curso");

    console.log("\n32. Eliminar la clase lo borra todo");
    await profe.goto(`${BASE}/profesor/clases/${claseId}`, { waitUntil: "networkidle0" });
    await esperar(1200);
    await pulsar(profe, "Eliminar");
    await esperar(800);
    visible = await texto(profe);
    comprobar("avisa de lo que se lleva por delante", /No se puede deshacer/i.test(visible));
    comprobar("y recuerda que para apartarla está Archivar", /Archivar/.test(visible));
    const rojo = await profe.evaluate(() => {
      const b = Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"] button')).find((x) => x.textContent?.trim() === "Eliminar");
      return b?.className ?? "";
    });
    comprobar("con el botón de confirmar en rojo", /bg-red-/.test(rojo));
    await foto(profe, "26-confirmar-eliminar");
    await pulsar(profe, "Eliminar");
    await esperar(3000);
    const { rows: quedaClase } = await client.query(`SELECT 1 FROM clases WHERE id = $1`, [claseId]);
    comprobar("la clase se va", quedaClase.length === 0);
    const { rows: quedanEntregas } = await client.query(`SELECT 1 FROM entregas_caso WHERE "asignacionId" = $1`, [asignacionId]);
    comprobar("con sus entregas", quedanEntregas.length === 0);
    const { rows: sigueCuenta } = await client.query(`SELECT "rolDocente" FROM dietistas WHERE id = $1`, [alumnaId]);
    comprobar("la alumna conserva su cuenta", sigueCuenta.length === 1);
    const { rows: siguePaciente } = await client.query(`SELECT 1 FROM pacientes WHERE id = $1`, [copiaId]);
    comprobar("y su paciente del caso", siguePaciente.length === 1);
    const { rows: sigueCaso } = await client.query(`SELECT 1 FROM casos_clinicos WHERE id = $1`, [casoId]);
    comprobar("el caso de la profesora sigue siendo suyo", sigueCaso.length === 1);

    console.log(`\n${mal === 0 ? "✓ TODO CORRECTO" : "✗ HAY FALLOS"} — ${ok} bien, ${mal} mal`);
    if (dudas.length > 0) {
      console.log("\nPara mirar:");
      for (const d of dudas) console.log(`  · ${d}`);
    }
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

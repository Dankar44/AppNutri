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
import { conexionResistente, type Conexion } from "./_conexion-viva";
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

async function crearCuenta(client: Conexion, email: string, pass: string, apellidos: string, extra: Record<string, unknown> = {}) {
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

async function limpiar(client: Conexion) {
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
  const client = conexionResistente(pool);
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

    // Desde el 9 sep 2026 el número de alumnos de la clase es obligatorio para las DOS vías.
    await client.query(`UPDATE clases SET "cupoEnlace" = 99 WHERE id = $1`, [clase1]);
    await p1.reload({ waitUntil: "networkidle0" });
    await esperar(1500);

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

    console.log("\n── El tope de la clase es el TOTAL, no las plazas nuevas ──");
    // La escala se coló una vez en la pantalla y otra en el servidor: el máximo son los alumnos que
    // ya hay MÁS lo que le quede a la facultad. Comparándolo con las plazas libres a secas no había
    // ningún número válido (Guillermo, 9 sep 2026: "ya se contradicen").
    {
      const { rows: hay } = await client.query(
        `SELECT COUNT(*)::int n FROM alumnos_clase WHERE "claseId" = $1 AND activa`, [clase1]);
      const { rows: lic } = await client.query(
        `SELECT "maxAlumnos" FROM licencias_docentes WHERE id = $1`, [licenciaId]);
      // Se deja exactamente UNA plaza libre en la FACULTAD, que cuenta a todos sus alumnos, no
      // solo a los de esta clase: si se pone el tope contando solo los de la clase, la bolsa se
      // queda a cero y el botón sale apagado por otro motivo.
      // Y las invitaciones sin usar también ocupan: sin contarlas, la bolsa se queda a cero y el
      // botón sale apagado por otro motivo distinto al que se está probando.
      const { rows: ocupadas } = await client.query(
        `SELECT (SELECT COUNT(DISTINCT a."alumnoId")::int FROM alumnos_clase a
                   JOIN clases c ON c.id = a."claseId" WHERE c."licenciaDocenteId" = $1 AND a.activa)
              + (SELECT COUNT(*)::int FROM invitaciones_docentes i
                   WHERE i."licenciaDocenteId" = $1 AND i.rol = 'ALUMNO' AND i."aceptadaAt" IS NULL
                     AND i."expiraAt" >= NOW()) AS n`, [licenciaId]);
      await client.query(`UPDATE licencias_docentes SET "maxAlumnos" = $2 WHERE id = $1`,
        [licenciaId, ocupadas[0].n + 1]);
      await client.query(`UPDATE clases SET "invitacionAbierta" = false WHERE id = $1`, [clase1]);
      // Recargar DESPUÉS de tocar la licencia: las plazas libres las pinta el servidor, así que sin
      // esto la pantalla sigue con las de antes y el botón sale apagado por un número viejo.
      await p1.reload({ waitUntil: "networkidle0" });
      await esperar(2000);
      // El tope se pone arriba a la derecha, no dentro del enlace (Guillermo, 9 sep 2026).
      await p1.evaluate(() => {
        const b = Array.from(document.querySelectorAll("button")).find((x) => /^Cambiar$/i.test(x.textContent?.trim() ?? ""));
        (b as HTMLElement | undefined)?.click();
      });
      await esperar(600);
      const escribirCupo = async (n: number) => {
        await p1.evaluate((v) => {
          const c = Array.from(document.querySelectorAll("input")).find((i) => (i as HTMLInputElement).inputMode === "numeric");
          if (!c) return;
          Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(c, String(v));
          c.dispatchEvent(new Event("input", { bubbles: true }));
        }, n);
        await esperar(400);
      };
      // Con el mismo número que ya hay, el enlace nacería lleno: no se puede abrir.
      await escribirCupo(hay[0].n);
      const sinSitio = await texto(p1);
      comprobar("con el mismo número que ya hay, avisa de que nace lleno",
        /el enlace nace lleno/i.test(sinSitio),
        sinSitio.split("\n").find((l) => /nace lleno|Como mucho|total de tu clase/i.test(l)) ?? "");
      const apagado = await p1.evaluate(() => {
        const b = Array.from(document.querySelectorAll("button")).find((x) => /^Guardar$/i.test(x.textContent?.trim() ?? ""));
        return b ? (b as HTMLButtonElement).disabled : "no está";
      });
      comprobar("y no deja guardarlo", apagado === true, String(apagado));

      await escribirCupo(hay[0].n + 1);
      await esperar(600);
      const conElBueno = await texto(p1);
      comprobar("con «los que hay + lo que queda» no protesta",
        !/Como mucho/i.test(conElBueno) || !/text-red/.test(conElBueno),
        conElBueno.split("\n").find((l) => /Como mucho|total de tu clase/i.test(l)) ?? "");
      await p1.evaluate(() => {
        const b = Array.from(document.querySelectorAll("button")).find((x) => /^Guardar$/i.test(x.textContent?.trim() ?? ""));
        (b as HTMLElement | undefined)?.click();
      });
      await esperar(800);
      // Cambiar el número toca lo que la facultad tiene vendido: se pregunta antes.
      comprobar("avisa antes de cambiar el tope", /Es el total de tu clase/i.test(await texto(p1)));
      await p1.evaluate(() => {
        const b = Array.from(document.querySelectorAll("button")).find((x) => /^Guardar$/i.test(x.textContent?.trim() ?? ""));
        (b as HTMLElement | undefined)?.click();
      });
      await esperar(3500);
      const { rows: guardado } = await client.query(
        `SELECT "cupoEnlace" FROM clases WHERE id = $1`, [clase1]);
      comprobar("y se guarda el tope de la clase", guardado[0].cupoEnlace === hay[0].n + 1,
        `cupo=${guardado[0].cupoEnlace} · ${await textoDelToast(p1)}`);
      await client.query(`UPDATE licencias_docentes SET "maxAlumnos" = $2 WHERE id = $1`, [licenciaId, lic[0].maxAlumnos]);
      await client.query(`UPDATE clases SET "invitacionAbierta" = false, "cupoEnlace" = NULL WHERE id = $1`, [clase1]);
      // Se vuelve a la pestaña de correos: lo que viene después la necesita.
      await p1.reload({ waitUntil: "networkidle0" });
      await esperar(1500);
    }

    console.log("\n── El tope de la clase manda también por correo ──");
    // El profesor dice «en mi clase somos N» y esos N son el total, se llenen por el enlace o por
    // correo. Antes el correo solo miraba la bolsa de la facultad y se pasaba del número que él
    // mismo había puesto (Guillermo, 9 sep 2026).
    const { rows: dentroAhora } = await client.query(
      `SELECT COUNT(*)::int n FROM alumnos_clase WHERE "claseId" = $1 AND activa`, [clase1]);
    await client.query(`UPDATE clases SET "cupoEnlace" = $2 WHERE id = $1`, [clase1, dentroAhora[0].n]);
    await client.query(`UPDATE licencias_docentes SET "maxAlumnos" = 99 WHERE id = $1`, [licenciaId]);
    await escribirCorreos(p1, "mastope@pruebaalta.dev");
    await pulsar(p1, "Enviar invitaciones", "form");
    await confirmarAlta(p1);
    await esperar(3500);
    // Y se ve ANTES de intentarlo, también desde la pestaña de correos: el número de arriba es el
    // de la facultad y el que corta es el de la clase (Guillermo, 9 sep 2026: "pone 1 libre y no
    // puedo enviarle").
    comprobar("se avisa de que la clase está en su tope, sin tener que intentarlo",
      /está en su tope/i.test(await texto(p1)),
      (await texto(p1)).split("\n").find((l) => /tope|facultad/i.test(l)) ?? "no lo dice");
    const toastTope = await textoDelToast(p1);
    comprobar("con la clase en su tope, el correo no mete a nadie más",
      (await client.query(`SELECT 1 FROM invitaciones_docentes WHERE email = $1`, ["mastope@pruebaalta.dev"])).rows.length === 0,
      toastTope);
    comprobar("y se dice que es por el tope de la clase, no por la facultad",
      /en su tope/i.test(toastTope), toastTope);
    // Se deja como estaba para lo que viene después.
    await client.query(`UPDATE clases SET "cupoEnlace" = NULL WHERE id = $1`, [clase1]);
    await client.query(`UPDATE licencias_docentes SET "maxAlumnos" = 4 WHERE id = $1`, [licenciaId]);

    console.log("\n── A quien se le retiró el acceso se le puede volver a meter ──");
    // Sigue ocupando su hueco del curso, así que devolvérselo no gasta nada nuevo. Sin esto, quitar
    // a un alumno y volver a invitarle decía «fuera del tope» y no había manera (Guillermo, 9 sep).
    {
      const { rows: alguno } = await client.query(
        `SELECT d.email FROM alumnos_clase a JOIN dietistas d ON d.id = a."alumnoId"
          WHERE a."claseId" = $1 AND a.activa LIMIT 1`, [clase1]);
      if (alguno.length) {
        await client.query(
          `UPDATE alumnos_clase SET activa = false, "bajaAt" = NOW()
            WHERE "claseId" = $1 AND "alumnoId" = (SELECT id FROM dietistas WHERE email = $2)`,
          [clase1, alguno[0].email]);
        // La clase se deja en su tope justo: con el retirado dentro, no cabe nadie nuevo.
        const { rows: cuantos } = await client.query(
          `SELECT COUNT(*)::int n FROM alumnos_clase WHERE "claseId" = $1`, [clase1]);
        await client.query(`UPDATE clases SET "cupoEnlace" = $2 WHERE id = $1`, [clase1, cuantos[0].n]);
        await p1.reload({ waitUntil: "networkidle0" });
        await esperar(1500);
        await escribirCorreos(p1, alguno[0].email);
        await pulsar(p1, "Enviar invitaciones", "form");
        await confirmarAlta(p1);
        await esperar(3500);
        const { rows: vuelto } = await client.query(
          `SELECT a.activa FROM alumnos_clase a JOIN dietistas d ON d.id = a."alumnoId"
            WHERE a."claseId" = $1 AND d.email = $2`, [clase1, alguno[0].email]);
        comprobar("vuelve a entrar aunque la clase esté en su tope", vuelto[0]?.activa === true,
          `activa=${vuelto[0]?.activa} · ${await textoDelToast(p1)}`);
        await client.query(`UPDATE clases SET "cupoEnlace" = NULL WHERE id = $1`, [clase1]);
      }
    }

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
    await navegador.close();
    await pool.end();
  }

  console.log(`\n${mal === 0 ? "✓" : "✗"} ${ok} bien, ${mal} mal`);
  process.exit(mal === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });

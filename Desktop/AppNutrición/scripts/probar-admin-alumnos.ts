/**
 * #39 — La pantalla de alumnos de administración.
 *
 * Es la que se mira cuando llama una facultad ("¿cuántas plazas nos quedan?", "¿este alumno
 * está dentro?") y la que dice si la licencia se renueva o se ajusta. Lo que se comprueba es
 * que los números que enseña son los que se facturan, no una aproximación: un alumno en dos
 * clases ocupa UNA plaza, y quien tiene el acceso retirado no ocupa ninguna.
 *
 *   1. npm run dev:desarrollo        (puerto 3001)
 *   2. DB=dev npx tsx scripts/probar-admin-alumnos.ts
 *
 * Crea sus datos y los borra. Solo con DB=dev.
 */
import "./_guard-solo-dev";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";
import { conexionResistente, type Conexion } from "./_conexion-viva";
import { SignJWT } from "jose";
import puppeteer, { type Page } from "puppeteer-core";

const BASE = "http://localhost:3001";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } });

const MARCA = "PRUEBAADMINAL";
const DOMINIO = "pruebaadminal.dev";

let ok = 0, mal = 0;
const comprobar = (t: string, c: boolean, d = "") => { console.log(`  ${c ? "✓" : "✗"} ${t}${d ? ` — ${d}` : ""}`); c ? ok++ : mal++; };
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
const texto = (page: Page) => page.evaluate(() => document.body.innerText);

async function cookieAdmin() {
  const email = (process.env.ADMIN_EMAILS ?? "").split(",")[0].trim();
  const token = await new SignJWT({ email, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1d")
    .sign(new TextEncoder().encode(process.env.PATIENT_JWT_SECRET!));
  return { name: "annonia-admin-session", value: token, domain: "localhost", path: "/" };
}

async function crearDietista(client: Conexion, email: string, apellidos: string, extra: Record<string, unknown> = {}) {
  const { rows: usuarios } = await client.query(
    `INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
       created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous,
       confirmation_token, recovery_token, email_change_token_new, email_change,
       email_change_token_current, reauthentication_token, phone_change, phone_change_token)
     VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
       $1, crypt('AdminAl_2026', gen_salt('bf')), NOW(), NOW(), NOW(),
       '{"provider":"email","providers":["email"]}', '{}'::jsonb, false, false, '','','','','','','','')
     RETURNING id`, [email]);
  const campos = Object.keys(extra);
  const { rows } = await client.query(
    `INSERT INTO dietistas (id, "authId", email, nombre, apellidos, verificado, "createdAt", "updatedAt"${campos.map((c) => `, "${c}"`).join("")})
     VALUES (gen_random_uuid()::text, $1, $2, '${MARCA}', $3, true, NOW(), NOW()${campos.map((_, i) => `, $${4 + i}`).join("")}) RETURNING id`,
    [usuarios[0].id, email, apellidos, ...campos.map((c) => extra[c])]);
  return rows[0].id as string;
}

async function limpiar(client: Conexion) {
  await client.query(`DELETE FROM clases WHERE nombre LIKE '${MARCA}%'`);
  const { rows } = await client.query(`SELECT id FROM auth.users WHERE email LIKE '%@${DOMINIO}'`);
  for (const r of rows) {
    await client.query(`DELETE FROM dietistas WHERE "authId" = $1`, [r.id]);
    await client.query(`DELETE FROM auth.identities WHERE user_id = $1::uuid`, [r.id]);
    await client.query(`DELETE FROM auth.users WHERE id = $1::uuid`, [r.id]);
  }
  await client.query(`DELETE FROM licencias_docentes WHERE institucion LIKE '${MARCA}%'`);
}

async function main() {
  const client = conexionResistente(pool);
  const navegador = await puppeteer.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true, args: ["--no-sandbox"],
  });
  try {
    await limpiar(client);

    const { rows: lic } = await client.query(
      `INSERT INTO licencias_docentes (id, institucion, "maxProfesores", "maxAlumnos", "fechaFin", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, '${MARCA} Universidad', 3, 10, '2027-08-31', NOW(), NOW()) RETURNING id`);
    const licenciaId = lic[0].id as string;

    const profe1 = await crearDietista(client, `profe1@${DOMINIO}`, "Uno", { rolDocente: "PROFESOR", licenciaDocenteId: licenciaId });
    const profe2 = await crearDietista(client, `profe2@${DOMINIO}`, "Dos", { rolDocente: "PROFESOR", licenciaDocenteId: licenciaId });
    const { rows: c1 } = await client.query(
      `INSERT INTO clases (id, "profesorId", "licenciaDocenteId", nombre, "fechaFinCurso", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, '${MARCA} clase A', '2027-08-31', NOW(), NOW()) RETURNING id`,
      [profe1, licenciaId]);
    const { rows: c2 } = await client.query(
      `INSERT INTO clases (id, "profesorId", "licenciaDocenteId", nombre, "fechaFinCurso", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, '${MARCA} clase B', '2027-08-31', NOW(), NOW()) RETURNING id`,
      [profe2, licenciaId]);

    // Cuatro personas, tres situaciones distintas y un alumno compartido por dos profesores.
    const compartido = await crearDietista(client, `compartido@${DOMINIO}`, "Compartido", { rolDocente: "ALUMNO", licenciaDocenteId: licenciaId, cuentaDeClase: true });
    const normal = await crearDietista(client, `normal@${DOMINIO}`, "Normal", { rolDocente: "ALUMNO", licenciaDocenteId: licenciaId, cuentaDeClase: true });
    const retirado = await crearDietista(client, `retirado@${DOMINIO}`, "Retirado", { rolDocente: "ALUMNO", licenciaDocenteId: licenciaId, cuentaDeClase: true });
    const yaTenia = await crearDietista(client, `yatenia@${DOMINIO}`, "Yatenia", { rolDocente: "ALUMNO", licenciaDocenteId: licenciaId, cuentaDeClase: false });

    const matricular = async (claseId: string, alumnoId: string, activa = true) =>
      client.query(
        `INSERT INTO alumnos_clase (id, "claseId", "alumnoId", activa, "altaAt", "bajaAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, NOW(), $4)`,
        [claseId, alumnoId, activa, activa ? null : new Date()]);
    await matricular(c1[0].id, compartido);
    await matricular(c2[0].id, compartido);
    await matricular(c1[0].id, normal);
    await matricular(c1[0].id, retirado, false);
    await matricular(c2[0].id, yaTenia);
    await client.query(`UPDATE dietistas SET "lastAccessAt" = NOW() WHERE id = $1`, [normal]);

    const page = await (await navegador.createBrowserContext()).newPage();
    await page.setViewport({ width: 1440, height: 950 });
    await page.setCookie(await cookieAdmin());

    console.log("\n── La pantalla existe y se llega desde el menú ──");
    await page.goto(`${BASE}/admin`, { waitUntil: "networkidle0" });
    await esperar(900);
    comprobar("hay entrada de Alumnos en el menú", (await page.evaluate(() =>
      Array.from(document.querySelectorAll("a")).some((a) => a.getAttribute("href") === "/admin/alumnos"))));

    await page.goto(`${BASE}/admin/alumnos`, { waitUntil: "networkidle0" });
    await esperar(1200);
    let visible = await texto(page);
    comprobar("la pantalla carga", visible.includes("Alumnos"), page.url());

    console.log("\n── Los números son los que se facturan ──");
    // Son 4 alumnos distintos y 5 matrículas: el que está en dos clases cuenta UNA vez, y el
    // retirado SIGUE contando, porque la plaza se consume para todo el curso y no vuelve hasta el
    // 31 de agosto (cambiado el 8 sep 2026; antes se liberaba y la bolsa bajaba sola).
    comprobar("cuenta alumnos distintos, no matrículas", /4\/10/.test(visible),
      visible.match(/\d+\/10/)?.[0] ?? "no sale");
    comprobar("dice cuántas quedan libres", /6 plazas libres/.test(visible),
      visible.match(/\d+ plazas? libres?/)?.[0] ?? "no sale");
    comprobar("y el retirado sigue ocupando la suya", !/3\/10/.test(visible));
    // El resumen de arriba es de TODA la base, no solo de lo que monta esta prueba: si se compara
    // contra números escritos a mano, cualquier clase que haya sembrada la tumba. Se contrasta
    // contra la base de datos, que es de donde salen.
    const { rows: totales } = await client.query(
      `SELECT (SELECT COUNT(*) FROM alumnos_clase) AS matriculas,
              (SELECT COUNT(DISTINCT "alumnoId") FROM alumnos_clase WHERE activa) AS alumnos`);
    const esperadas = Number(totales[0].matriculas), ocupando = Number(totales[0].alumnos);
    const resumen = visible.split("\n").find((l) => l.includes("matrícula")) ?? "";
    comprobar("resume matrículas y alumnos aparte",
      new RegExp(`${esperadas} matrículas?`).test(resumen) && new RegExp(`${ocupando} alumnos? ocupando plaza`).test(resumen),
      `${resumen || "no sale"} (en la base: ${esperadas} y ${ocupando})`);

    console.log("\n── Lo que hace falta para responder al teléfono ──");
    comprobar("sale el alumno con su correo", visible.includes(`normal@${DOMINIO}`));
    comprobar("sale de qué institución es", visible.includes(`${MARCA} Universidad`));
    comprobar("sale su clase", visible.includes(`${MARCA} clase A`));
    comprobar("sale su profesor", visible.includes(`${MARCA} Uno`));
    comprobar("el compartido sale en las dos clases", visible.includes(`${MARCA} clase B`));
    comprobar("se distingue quién ya tenía cuenta", visible.includes("Ya tenía cuenta"));
    comprobar("se ve quién está retirado", /Retirado el/.test(visible));
    comprobar("se avisa de los que nunca han entrado", /nunca/i.test(visible));

    console.log("\n── Los filtros ──");
    await page.goto(`${BASE}/admin/alumnos?estado=retirados`, { waitUntil: "networkidle0" });
    await esperar(1000);
    visible = await texto(page);
    comprobar("filtrando por retirados solo sale el retirado", visible.includes(`retirado@${DOMINIO}`) && !visible.includes(`normal@${DOMINIO}`));

    await page.goto(`${BASE}/admin/alumnos?buscar=normal@${DOMINIO}`, { waitUntil: "networkidle0" });
    await esperar(1000);
    visible = await texto(page);
    comprobar("buscando por correo sale solo ese", visible.includes(`normal@${DOMINIO}`) && !visible.includes(`compartido@${DOMINIO}`));

    await page.goto(`${BASE}/admin/alumnos?licencia=${licenciaId}`, { waitUntil: "networkidle0" });
    await esperar(1000);
    comprobar("filtrando por institución salen los suyos", (await texto(page)).includes(`compartido@${DOMINIO}`));

    console.log("\n── Se llega desde la ficha de la universidad ──");
    await page.goto(`${BASE}/admin/universidades/${licenciaId}`, { waitUntil: "networkidle0" });
    await esperar(1000);
    comprobar("hay un enlace al detalle de sus alumnos", (await page.evaluate((id) =>
      Array.from(document.querySelectorAll("a")).some((a) => a.getAttribute("href") === `/admin/alumnos?licencia=${id}`), licenciaId)));

    console.log("\n── Desde aquí se le puede quitar el acceso, como haría su profesor ──");
    // Antes se veían pero no se podía tocar nada: cuando llamaba una facultad había que pedirle al
    // profesor que lo hiciera él (Guillermo, 9 sep 2026).
    await page.goto(`${BASE}/admin/alumnos?licencia=${licenciaId}&buscar=normal@${DOMINIO}`, { waitUntil: "networkidle0" });
    await esperar(1200);
    comprobar("hay un botón para quitarle el acceso", /Quitar acceso/i.test(await texto(page)));
    await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll("button")).find((x) => /Quitar acceso/i.test(x.textContent ?? ""));
      (b as HTMLElement | undefined)?.click();
    });
    await esperar(700);
    comprobar("avisa antes de hacerlo", /no se borra nada/i.test(await texto(page)));
    await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll("button")).find((x) => x.textContent?.trim() === "Quitar el acceso");
      (b as HTMLElement | undefined)?.click();
    });
    await esperar(3000);
    const { rows: fuera } = await client.query(
      `SELECT a.activa, a."bajaAt" FROM alumnos_clase a JOIN dietistas d ON d.id = a."alumnoId"
        WHERE d.email = $1`, [`normal@${DOMINIO}`]);
    comprobar("se le retira de verdad", fuera[0]?.activa === false, `activa=${fuera[0]?.activa}`);
    comprobar("y queda apuntado cuándo", fuera[0]?.bajaAt !== null);

    await page.reload({ waitUntil: "networkidle0" });
    await esperar(1200);
    comprobar("y se le puede devolver", /Devolver acceso/i.test(await texto(page)));
    await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll("button")).find((x) => /Devolver acceso/i.test(x.textContent ?? ""));
      (b as HTMLElement | undefined)?.click();
    });
    await esperar(3000);
    const { rows: devuelto } = await client.query(
      `SELECT a.activa FROM alumnos_clase a JOIN dietistas d ON d.id = a."alumnoId" WHERE d.email = $1`,
      [`normal@${DOMINIO}`]);
    comprobar("y vuelve a estar dentro", devuelto[0]?.activa === true);

    console.log("\n── Y no la ve cualquiera ──");
    const sinCookie = await (await navegador.createBrowserContext()).newPage();
    await sinCookie.goto(`${BASE}/admin/alumnos`, { waitUntil: "networkidle0" });
    await esperar(800);
    comprobar("sin sesión de administración no se entra", !sinCookie.url().includes("/admin/alumnos"), sinCookie.url());
  } finally {
    await limpiar(client);
    await navegador.close();
    await pool.end();
  }

  console.log(`\n${mal === 0 ? "✓" : "✗"} ${ok} bien, ${mal} mal`);
  process.exit(mal === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });

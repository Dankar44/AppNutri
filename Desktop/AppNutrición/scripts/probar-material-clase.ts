/**
 * #39 — El material que el profesor comparte con su clase.
 *
 * La regla es la misma que la del centro, para no tener dos sistemas: lo que uno marca como
 * compartido lo ven los suyos, y lo que no, no lo ve nadie. Lo que se vigila aquí es justo eso —
 * que lo NO compartido siga siendo privado — y que el alumno pueda copiarlo y tocar su copia sin
 * que al profesor le cambie nada.
 *
 *   1. npm run dev:desarrollo        (puerto 3001)
 *   2. DB=dev npx tsx scripts/probar-material-clase.ts
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

const MARCA = "PRUEBAMAT";
const DOMINIO = "pruebamat.dev";
const PASS = "Material_2026_Prueba";

let ok = 0, mal = 0;
const comprobar = (t: string, c: boolean, d = "") => { console.log(`  ${c ? "✓" : "✗"} ${t}${d ? ` — ${d}` : ""}`); c ? ok++ : mal++; };
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
const texto = (page: Page) => page.evaluate(() => document.body.innerText);

async function pulsar(page: Page, tx: string) {
  const hecho = await page.evaluate((t) => {
    const n = Array.from(document.querySelectorAll("button, a")).find((x) => x.textContent?.trim().startsWith(t));
    if (!n) return false;
    (n as HTMLElement).click();
    return true;
  }, tx);
  if (!hecho) throw new Error(`botón "${tx}" no encontrado`);
}

async function crearCuenta(client: pg.PoolClient, email: string, extra: Record<string, unknown> = {}) {
  const { rows: u } = await client.query(
    `INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
       created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous,
       confirmation_token, recovery_token, email_change_token_new, email_change,
       email_change_token_current, reauthentication_token, phone_change, phone_change_token)
     VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
       $1, crypt($2, gen_salt('bf')), NOW(), NOW(), NOW(),
       '{"provider":"email","providers":["email"]}', '{}'::jsonb, false, false, '','','','','','','','')
     RETURNING id`, [email, PASS]);
  const authId = u[0].id as string;
  await client.query(
    `INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
     VALUES (gen_random_uuid(), $1::uuid, $1::text, 'email',
       jsonb_build_object('sub',$1::text,'email',$2::text,'email_verified',true,'provider','email'), NOW(), NOW(), NOW())`,
    [authId, email]);
  const campos = Object.keys(extra);
  const { rows } = await client.query(
    `INSERT INTO dietistas (id, "authId", email, nombre, apellidos, verificado, "createdAt", "updatedAt"${campos.map((c) => `, "${c}"`).join("")})
     VALUES (gen_random_uuid()::text, $1, $2, '${MARCA}', 'Prueba', true, NOW(), NOW()${campos.map((_, i) => `, $${3 + i}`).join("")}) RETURNING id`,
    [authId, email, ...campos.map((c) => extra[c])]);
  return rows[0].id as string;
}

async function sesionDe(navegador: Browser, email: string): Promise<Page> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const sb = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  const { data, error } = await sb.auth.signInWithPassword({ email, password: PASS });
  if (error) throw new Error(`login de ${email}: ${error.message}`);
  const ctx = await navegador.createBrowserContext();
  const page = await ctx.newPage();
  await page.setViewport({ width: 1440, height: 950 });
  await page.evaluateOnNewDocument(() => { try { localStorage.setItem("annonia-welcome-dietista", "1"); } catch { /* ignore */ } });
  await page.setCookie({
    name: `sb-${url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1]}-auth-token`,
    value: "base64-" + Buffer.from(JSON.stringify(data.session)).toString("base64"),
    domain: "localhost", path: "/",
  });
  return page;
}

async function crearAlimento(client: pg.PoolClient, dietistaId: string, nombre: string, compartido: boolean) {
  const { rows } = await client.query(
    `INSERT INTO alimentos (id, nombre, "nombreNormalizado", categoria, calorias, proteinas, carbohidratos,
       grasas, fibra, porcion, unidad, origen, "dietistaId", compartido, "createdAt", "updatedAt")
     VALUES (gen_random_uuid()::text, $1, lower($1), 'LEGUMBRES', 100, 20, 5, 2, 1, 100, 'GRAMOS',
       'PERSONALIZADO', $2, $3, NOW(), NOW()) RETURNING id`,
    [nombre, dietistaId, compartido]);
  return rows[0].id as string;
}

async function crearReceta(client: pg.PoolClient, dietistaId: string, nombre: string, compartido: boolean, alimentoId: string) {
  const { rows } = await client.query(
    `INSERT INTO recetas (id, nombre, "nombreNormalizado", porciones, calorias, proteinas, carbohidratos,
       grasas, fibra, "dietistaId", compartido, "createdAt", "updatedAt")
     VALUES (gen_random_uuid()::text, $1, lower($1), 2, 300, 20, 30, 10, 3, $2, $3, NOW(), NOW()) RETURNING id`,
    [nombre, dietistaId, compartido]);
  const recetaId = rows[0].id as string;
  await client.query(
    `INSERT INTO receta_ingredientes (id, "recetaId", "alimentoId", cantidad, unidad)
     VALUES (gen_random_uuid()::text, $1, $2, 150, 'GRAMOS')`, [recetaId, alimentoId]);
  return recetaId;
}

async function limpiar(client: pg.PoolClient) {
  await client.query(`DELETE FROM recetas WHERE nombre LIKE '${MARCA}%'`);
  await client.query(`DELETE FROM empresas WHERE nombre LIKE '${MARCA}%'`);
  await client.query(`DELETE FROM alimentos WHERE nombre LIKE '${MARCA}%'`);
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
  const client = await pool.connect();
  const navegador = await puppeteer.launch({
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true, args: ["--no-sandbox"],
  });
  try {
    await limpiar(client);
    const { rows: lic } = await client.query(
      `INSERT INTO licencias_docentes (id, institucion, "maxProfesores", "maxAlumnos", "fechaFin", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, '${MARCA} Facultad', 3, 20, '2027-08-31', NOW(), NOW()) RETURNING id`);
    const licenciaId = lic[0].id as string;
    const profesorId = await crearCuenta(client, `profe@${DOMINIO}`, { rolDocente: "PROFESOR", licenciaDocenteId: licenciaId });
    const alumnoId = await crearCuenta(client, `alumno@${DOMINIO}`, { rolDocente: "ALUMNO", licenciaDocenteId: licenciaId, cuentaDeClase: true });
    const ajenoId = await crearCuenta(client, `ajeno@${DOMINIO}`);

    const { rows: cl } = await client.query(
      `INSERT INTO clases (id, "profesorId", "licenciaDocenteId", nombre, "fechaFinCurso", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, '${MARCA} clase', '2027-08-31', NOW(), NOW()) RETURNING id`,
      [profesorId, licenciaId]);
    await client.query(
      `INSERT INTO alumnos_clase (id, "claseId", "alumnoId", "altaAt") VALUES (gen_random_uuid()::text, $1, $2, NOW())`,
      [cl[0].id, alumnoId]);

    const compartido = await crearAlimento(client, profesorId, `${MARCA} tofu compartido`, true);
    const privado = await crearAlimento(client, profesorId, `${MARCA} tofu privado`, false);
    const recetaCompartida = await crearReceta(client, profesorId, `${MARCA} receta compartida`, true, compartido);
    const recetaPrivada = await crearReceta(client, profesorId, `${MARCA} receta privada`, false, privado);

    console.log("\n── El alumno ve lo compartido y solo lo compartido ──");
    const alumno = await sesionDe(navegador, `alumno@${DOMINIO}`);
    await alumno.goto(`${BASE}/alimentos?busqueda=${MARCA}`, { waitUntil: "networkidle0" });
    await esperar(1500);
    let visible = await texto(alumno);
    comprobar("ve el alimento que su profesor comparte", visible.includes("tofu compartido"));
    comprobar("NO ve el que no comparte", !visible.includes("tofu privado"));
    comprobar("se le dice de dónde viene", visible.includes("De mi clase"),
      visible.split("\n").filter((l) => /clase|centro/i.test(l)).join(" / ") || "sin etiqueta");

    await alumno.goto(`${BASE}/recetas?tab=clase`, { waitUntil: "networkidle0" });
    await esperar(1500);
    visible = await texto(alumno);
    comprobar("tiene una pestaña con lo que le comparten", visible.includes("Compartidas conmigo"));
    comprobar("ve la receta compartida", visible.includes("receta compartida"));
    comprobar("NO ve la receta privada", !visible.includes("receta privada"));

    console.log("\n── Lo que le comparten no lo puede editar ──");
    await alumno.goto(`${BASE}/alimentos/${compartido}`, { waitUntil: "networkidle0" });
    await esperar(1200);
    visible = await texto(alumno);
    comprobar("puede abrir la ficha", visible.includes("tofu compartido"));
    comprobar("no se le ofrece editarlo", !visible.includes("Editar"),
      (await alumno.evaluate(() => Array.from(document.querySelectorAll("a,button")).map((b) => b.textContent?.trim()).filter((x) => /editar|elimin|copiar/i.test(x ?? "")).join(" | "))));
    comprobar("se le ofrece copiarlo", visible.includes("Copiar a lo mío"));
    await alumno.goto(`${BASE}/alimentos/${compartido}/editar`, { waitUntil: "domcontentloaded" });
    await esperar(1200);
    comprobar("y por la ruta directa tampoco edita", !(await texto(alumno)).includes("Guardar"), alumno.url());

    console.log("\n── Copiar el alimento del profesor ──");
    await alumno.goto(`${BASE}/alimentos/${compartido}`, { waitUntil: "networkidle0" });
    await esperar(1200);
    await pulsar(alumno, "Copiar a lo mío");
    await esperar(4000);
    const { rows: copia } = await client.query(
      `SELECT id, "dietistaId", compartido, calorias FROM alimentos WHERE nombre LIKE '%tofu compartido (copia)%'`);
    comprobar("se crea la copia", copia.length === 1);
    comprobar("la copia es del alumno", copia[0]?.dietistaId === alumnoId);
    comprobar("la copia nace sin compartir", copia[0]?.compartido === false);
    comprobar("la copia trae los datos", Number(copia[0]?.calorias) === 100);
    comprobar("le lleva a editar su copia", alumno.url().includes(`/alimentos/${copia[0]?.id}/editar`), alumno.url());
    const { rows: original } = await client.query(`SELECT nombre, calorias FROM alimentos WHERE id = $1`, [compartido]);
    comprobar("el original del profesor no se toca", original[0].nombre === `${MARCA} tofu compartido`);

    console.log("\n── Copiar la receta, con sus ingredientes ──");
    await alumno.goto(`${BASE}/recetas/${recetaCompartida}`, { waitUntil: "networkidle0" });
    await esperar(1500);
    comprobar("puede abrir la receta compartida", (await texto(alumno)).includes("receta compartida"));
    await pulsar(alumno, "Copiar a lo mío");
    await esperar(5000);
    const { rows: copiaR } = await client.query(
      `SELECT r.id, r."dietistaId", r.compartido, COUNT(ri.id)::int AS ingredientes
         FROM recetas r LEFT JOIN receta_ingredientes ri ON ri."recetaId" = r.id
        WHERE r.nombre LIKE '%receta compartida (copia)%' GROUP BY r.id`);
    comprobar("se crea la copia de la receta", copiaR.length === 1);
    comprobar("es del alumno", copiaR[0]?.dietistaId === alumnoId);
    comprobar("se lleva los ingredientes", copiaR[0]?.ingredientes === 1, `${copiaR[0]?.ingredientes} ingredientes`);
    comprobar("y nace sin compartir", copiaR[0]?.compartido === false);

    console.log("\n── Lo privado del profesor no se puede ni copiar a mano ──");
    await alumno.goto(`${BASE}/alimentos/${privado}`, { waitUntil: "domcontentloaded" });
    await esperar(1200);
    comprobar("la ficha del alimento privado no se abre", !(await texto(alumno)).includes("tofu privado"), alumno.url());
    await alumno.goto(`${BASE}/recetas/${recetaPrivada}`, { waitUntil: "domcontentloaded" });
    await esperar(1200);
    comprobar("ni la de la receta privada", !(await texto(alumno)).includes("receta privada"), alumno.url());

    console.log("\n── Un nutricionista de fuera no ve nada de esa clase ──");
    const ajeno = await sesionDe(navegador, `ajeno@${DOMINIO}`);
    await ajeno.goto(`${BASE}/alimentos?busqueda=${MARCA}`, { waitUntil: "networkidle0" });
    await esperar(1500);
    visible = await texto(ajeno);
    comprobar("no ve ni lo compartido", !visible.includes("tofu compartido"));
    await ajeno.goto(`${BASE}/recetas?tab=clase`, { waitUntil: "networkidle0" });
    await esperar(1200);
    comprobar("ni la receta", !(await texto(ajeno)).includes("receta compartida"));
    await ajeno.goto(`${BASE}/recetas`, { waitUntil: "networkidle0" });
    await esperar(1200);
    comprobar("y no le sale una pestaña que no le sirve", !(await texto(ajeno)).includes("Compartidas conmigo"));
    void ajenoId;

    console.log("\n── El profesor tiene el interruptor de compartir ──");
    const profe = await sesionDe(navegador, `profe@${DOMINIO}`);
    await profe.goto(`${BASE}/alimentos/nuevo`, { waitUntil: "networkidle0" });
    await esperar(1500);
    comprobar("le ofrece compartir con sus clases", (await texto(profe)).includes("Compartir con mis clases"));
    await profe.goto(`${BASE}/recetas/nueva`, { waitUntil: "networkidle0" });
    await esperar(1500);
    comprobar("también en las recetas", (await texto(profe)).includes("Compartir con mis clases"));

    console.log("\n── Y un nutricionista suelto no ve un interruptor que no le sirve ──");
    await ajeno.goto(`${BASE}/alimentos/nuevo`, { waitUntil: "networkidle0" });
    await esperar(1500);
    comprobar("sin centro ni clase, no hay interruptor", !/Compartir con/.test(await texto(ajeno)));

    console.log("\n── Al cerrarse el curso deja de ver el material ──");
    await client.query(`UPDATE alumnos_clase SET activa = false WHERE "alumnoId" = $1`, [alumnoId]);
    // Sigue entrando porque le queda su copia: lo que se comprueba es lo que ve, no si entra.
    await client.query(
      `INSERT INTO suscripciones (id, "dietistaId", plan, estado, "fechaInicio", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, 'PROFESIONAL', 'ACTIVA', NOW(), NOW(), NOW())`, [alumnoId]);
    const alumno2 = await sesionDe(navegador, `alumno@${DOMINIO}`);
    await alumno2.goto(`${BASE}/dashboard`, { waitUntil: "networkidle0" });
    await esperar(1800);
    // Al quedarse sin clase pasa a cuenta normal y ve el aviso una vez; se le da a entrar.
    comprobar("primero ve el aviso de fin de curso", alumno2.url().includes("/curso-terminado"), alumno2.url());
    await pulsar(alumno2, "Entrar a mi cuenta");
    await esperar(3000);
    await alumno2.goto(`${BASE}/alimentos?busqueda=${MARCA}`, { waitUntil: "networkidle0" });
    await esperar(1500);
    visible = await texto(alumno2);
    const suyos = visible.split("\n").filter((l) => l.includes("tofu compartido"));
    comprobar("ya no ve el alimento del profesor", suyos.every((l) => l.includes("(copia)")),
      suyos.join(" / ") || "lista vacía");
    comprobar("pero conserva su copia", visible.includes("(copia)"));
    console.log("\n── Lo del centro sigue funcionando igual que antes ──");
    // El material de la clase reutiliza la mecánica del centro. Esta parte no es del módulo
    // docente: está aquí para que no se rompa por el camino lo que ya usan los que pagan.
    const jefeId = await crearCuenta(client, `jefe@${DOMINIO}`);
    const { rows: emp } = await client.query(
      `INSERT INTO empresas (id, nombre, slug, "liderId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, '${MARCA} Centro', '${MARCA.toLowerCase()}-centro', $1, NOW(), NOW()) RETURNING id`,
      [jefeId]);
    const socioId = await crearCuenta(client, `socio@${DOMINIO}`, { empresaId: emp[0].id });
    await client.query(`UPDATE dietistas SET "empresaId" = $1 WHERE id = $2`, [emp[0].id, jefeId]);
    const delCentro = await crearAlimento(client, jefeId, `${MARCA} salmon del centro`, true);
    await crearAlimento(client, jefeId, `${MARCA} salmon suyo`, false);

    const socio = await sesionDe(navegador, `socio@${DOMINIO}`);
    await socio.goto(`${BASE}/alimentos?busqueda=${MARCA}`, { waitUntil: "networkidle0" });
    await esperar(1500);
    visible = await texto(socio);
    comprobar("el compañero de centro ve lo compartido", visible.includes("salmon del centro"));
    comprobar("y no ve lo que su compañero no comparte", !visible.includes("salmon suyo"));
    comprobar("se le sigue llamando centro, no clase", visible.includes("De centro") && !visible.includes("De mi clase"),
      visible.split("\n").filter((l) => /centro|clase/i.test(l)).slice(0, 2).join(" / "));
    await socio.goto(`${BASE}/alimentos/${delCentro}`, { waitUntil: "networkidle0" });
    await esperar(1200);
    comprobar("puede copiarlo a lo suyo", (await texto(socio)).includes("Copiar a lo mío"));
    await socio.goto(`${BASE}/alimentos/nuevo`, { waitUntil: "networkidle0" });
    await esperar(1500);
    comprobar("le ofrece compartir con su centro", (await texto(socio)).includes("Compartir con el centro"));
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

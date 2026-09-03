/**
 * #40 — Casos clínicos, de punta a punta.
 *
 * El profesor crea un caso, lo asigna a su clase; la alumna lo abre (y se le crea su paciente),
 * lo entrega; el profesor ve su trabajo y le pone nota. Lo que más se vigila: que el caso NO se
 * mezcle con los pacientes reales de nadie, y que la nota no se vea hasta que el profesor quiere.
 *
 *   1. npm run dev:desarrollo        (puerto 3001)
 *   2. DB=dev npx tsx scripts/probar-casos-clinicos.ts
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
const MARCA = "PRUEBACASO";
const DOMINIO = "pruebacaso.dev";
const PASS = "Casos_2026_Prueba";

let ok = 0, mal = 0;
const comprobar = (t: string, c: boolean, d = "") => { console.log(`  ${c ? "✓" : "✗"} ${t}${d ? ` — ${d}` : ""}`); c ? ok++ : mal++; };
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
const texto = (page: Page) => page.evaluate(() => document.body.innerText);

async function pulsar(page: Page, tx: string, dentroDe?: string) {
  const hecho = await page.evaluate((t, ambito) => {
    const raiz = ambito ? document.querySelector(ambito) : document;
    if (!raiz) return false;
    const n = Array.from(raiz.querySelectorAll("button, a")).find((x) => x.textContent?.trim().startsWith(t));
    if (!n) return false;
    (n as HTMLElement).click();
    return true;
  }, tx, dentroDe ?? null);
  if (!hecho) throw new Error(`botón "${tx}" no encontrado`);
}

async function rellenar(page: Page, etiqueta: string, valor: string) {
  const hecho = await page.evaluate((tx, v) => {
    // Exacto primero: "Nombre" y "Nombre del caso" conviven en el mismo formulario, y buscar por
    // "empieza por" rellenaba el campo equivocado sin decir nada.
    const etiquetas = Array.from(document.querySelectorAll("label"));
    const l = etiquetas.find((x) => x.textContent?.trim() === tx)
      ?? etiquetas.find((x) => x.textContent?.trim().startsWith(tx));
    const c = (l?.parentElement?.querySelector("input, textarea, select")) as HTMLInputElement | null;
    if (!c) return false;
    const proto = c.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype
      : c.tagName === "SELECT" ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(c, v);
    c.dispatchEvent(new Event(c.tagName === "SELECT" ? "change" : "input", { bubbles: true }));
    return true;
  }, etiqueta, valor);
  if (!hecho) throw new Error(`campo "${etiqueta}" no encontrado`);
}

async function crearCuenta(client: pg.PoolClient, email: string, apellidos: string, extra: Record<string, unknown> = {}) {
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
     VALUES (gen_random_uuid()::text, $1, $2, '${MARCA}', $3, true, NOW(), NOW()${campos.map((_, i) => `, $${4 + i}`).join("")}) RETURNING id`,
    [authId, email, apellidos, ...campos.map((c) => extra[c])]);
  return rows[0].id as string;
}

async function sesionDe(navegador: Browser, email: string): Promise<Page> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const sb = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  const { data, error } = await sb.auth.signInWithPassword({ email, password: PASS });
  if (error) throw new Error(`login de ${email}: ${error.message}`);
  const page = await (await navegador.createBrowserContext()).newPage();
  await page.setViewport({ width: 1440, height: 950 });
  await page.evaluateOnNewDocument(() => { try { localStorage.setItem("annonia-welcome-dietista", "1"); } catch { /* ignore */ } });
  await page.setCookie({
    name: `sb-${url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1]}-auth-token`,
    value: "base64-" + Buffer.from(JSON.stringify(data.session)).toString("base64"),
    domain: "localhost", path: "/",
  });
  return page;
}

async function limpiar(client: pg.PoolClient) {
  await client.query(`DELETE FROM casos_clinicos WHERE nombre LIKE '${MARCA}%'`);
  await client.query(`DELETE FROM pacientes WHERE "dietistaId" IN (SELECT id FROM dietistas WHERE email LIKE '%@${DOMINIO}')`);
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
      `INSERT INTO licencias_docentes (id, institucion, "maxProfesores", "maxAlumnos", curso, "fechaFin", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, '${MARCA} Universidad', 3, 20, '2026/27', '2027-08-31', NOW(), NOW()) RETURNING id`);
    const licenciaId = lic[0].id as string;
    const profesorId = await crearCuenta(client, `profe@${DOMINIO}`, "Marín",
      { rolDocente: "PROFESOR", licenciaDocenteId: licenciaId });
    const { rows: cl } = await client.query(
      `INSERT INTO clases (id, "profesorId", "licenciaDocenteId", nombre, curso, "fechaFinCurso", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, '${MARCA} Dietoterapia', '2026/27', '2027-08-31', NOW(), NOW()) RETURNING id`,
      [profesorId, licenciaId]);
    const claseId = cl[0].id as string;
    await client.query(
      `INSERT INTO profesores_clase (id, "claseId", "profesorId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, NOW(), NOW())`, [claseId, profesorId]);
    const alumnaId = await crearCuenta(client, `alumna@${DOMINIO}`, "Alonso",
      { rolDocente: "ALUMNO", licenciaDocenteId: licenciaId, cuentaDeClase: true });
    await client.query(
      `INSERT INTO alumnos_clase (id, "claseId", "alumnoId", "altaAt") VALUES (gen_random_uuid()::text, $1, $2, NOW())`,
      [claseId, alumnaId]);

    console.log("\n── El profesor crea el caso ──");
    const profe = await sesionDe(navegador, `profe@${DOMINIO}`);
    await profe.goto(`${BASE}/profesor/casos`, { waitUntil: "networkidle0" });
    await esperar(1200);
    comprobar("el estado vacío se explica", (await texto(profe)).includes("Todavía no has creado ningún caso"));
    await pulsar(profe, "Nuevo caso");
    await esperar(2000);
    await rellenar(profe, "Nombre del caso", `${MARCA} Mujer vegana con anemia`);
    await rellenar(profe, "Qué les pides", "Cubre el hierro con alimentos vegetales.");
    await rellenar(profe, "Nombre", "Marta");
    await rellenar(profe, "Apellidos", "Vegana");
    await pulsar(profe, "Crear y rellenar el paciente");
    await esperar(5000);
    const { rows: creado } = await client.query(
      `SELECT c.id, c."pacienteId", p."esCasoDocente", p.nombre
         FROM casos_clinicos c LEFT JOIN pacientes p ON p.id = c."pacienteId"
        WHERE c.nombre LIKE '${MARCA}%'`);
    comprobar("se crea el caso", creado.length === 1, `${creado.length}`);
    comprobar("con un paciente de verdad del profesor", creado[0]?.pacienteId !== null);
    comprobar("marcado como plantilla del caso", creado[0]?.esCasoDocente === true);
    const casoId = creado[0].id as string;
    const plantillaId = creado[0].pacienteId as string;

    console.log("\n── Y se le lleva a la ficha de siempre, a rellenarlo como uno de verdad ──");
    comprobar("aterriza en la ficha del paciente", profe.url().includes(`/pacientes/${plantillaId}`), profe.url());
    let visible = await texto(profe);
    comprobar("con el aviso de que es un caso", visible.includes("Este paciente es el caso"));
    comprobar("que no le dice cómo tienen que trabajar sus alumnos", !/lo hacen ellos/.test(visible));
    comprobar("con la pestaña de planificación, por si quiere dársela hecha", visible.includes("Planificación"));
    comprobar("y la del plan de alimentación", visible.includes("Plan de alimentación"));
    comprobar("pero sin el portal del paciente, que es para gente real", !visible.includes("Portal del paciente"));
    comprobar("con la anamnesis y las mediciones", visible.includes("Anamnesis") && visible.includes("Mediciones"));
    comprobar("y con el botón de asignarlo a una clase aquí mismo", visible.includes("Asignar a una clase"));
    comprobar("y con el menú docente, no el de nutricionista",
      (await profe.evaluate(() => (document.querySelector("aside, nav") as HTMLElement | null)?.innerText ?? "")).includes("Casos"));
    // Lo que rellenaría en la ficha: aquí se mete por debajo, que lo que se prueba es que viaja.
    await client.query(
      `UPDATE pacientes SET peso = 58, altura = 165, patologias = ARRAY['Anemia ferropénica'],
              alergias = ARRAY['Frutos secos'], notas = 'Mujer de 28 años, vegana desde hace tres. Ferritina baja.',
              horario = '[{"dia":"lunes","hora":"08:00","actividad":"Desayuno"}]'::jsonb,
              recomendaciones = 'Beber 2 litros de agua'
        WHERE id = $1`, [plantillaId]);
    await client.query(
      `INSERT INTO medidas_antropometricas (id, "pacienteId", fecha, peso, altura, "createdAt")
       VALUES (gen_random_uuid()::text, $1, NOW(), 58, 165, NOW())`, [plantillaId]);
    // Y una planificación con un plan a medias: el profesor puede dárselo hecho y pedir otra cosa.
    const { rows: plani } = await client.query(
      `INSERT INTO planificaciones (id, "pacienteId", "dietistaId", nombre, datos, "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, '${MARCA} Plani', '{"kcalObjetivo":1800}', NOW(), NOW()) RETURNING id`,
      [plantillaId, profesorId]);
    const planiId = plani[0].id as string;
    const { rows: alis } = await client.query(`SELECT id FROM alimentos WHERE "dietistaId" IS NULL LIMIT 2`);
    await client.query(
      `INSERT INTO planes_alimenticios (id, "pacienteId", "dietistaId", nombre, "planificacionIds", "objetivosPorPlani",
              "repartoPorComida", activo, "createdAt", "updatedAt")
       VALUES ('${MARCA}-plan', $1, $2, '${MARCA} Plan base', ARRAY[$3]::text[],
               jsonb_build_object($3::text, '{"kcal":1800}'::jsonb),
               jsonb_build_object('v', 2, 'porPlani', jsonb_build_object($3::text, '{"activo":true,"comidas":[]}'::jsonb)),
               true, NOW(), NOW())`, [plantillaId, profesorId, planiId]);
    await client.query(
      `INSERT INTO dias_del_plan (id, "planId", dia, "planificacionId", "grupoId") VALUES
         ('${MARCA}-lunes', '${MARCA}-plan', 'LUNES', $1, '${MARCA}-grupo'),
         ('${MARCA}-martes', '${MARCA}-plan', 'MARTES', $1, '${MARCA}-grupo')`, [planiId]);
    await client.query(
      `INSERT INTO comidas_del_dia (id, "diaId", tipo, orden, nombre, hora)
       VALUES ('${MARCA}-desayuno', '${MARCA}-lunes', 'DESAYUNO', 0, 'Desayuno de hierro', '08:30')`);
    await client.query(
      `INSERT INTO alimentos_en_comida (id, "comidaId", "alimentoId", cantidad, unidad, orden)
       VALUES ('${MARCA}-ali', '${MARCA}-desayuno', $1, 100, 'GRAMOS', 0)`, [alis[0].id]);
    await client.query(
      `INSERT INTO alternativas_alimento (id, "alimentoEnComidaId", "alimentoId", cantidad, unidad, orden)
       VALUES ('${MARCA}-alt', '${MARCA}-ali', $1, 50, 'GRAMOS', 0)`, [alis[1].id]);

    console.log("\n── Y NO aparece entre sus pacientes ──");
    await profe.goto(`${BASE}/pacientes`, { waitUntil: "networkidle0" });
    await esperar(1500);
    comprobar("el paciente del caso no está en la lista de pacientes del profesor",
      !(await texto(profe)).includes("Marta Vegana"));

    console.log("\n── Decide darles hecho el plan (por defecto no se comparte) ──");
    await profe.goto(`${BASE}/pacientes/${plantillaId}?espacio=docente`, { waitUntil: "networkidle0" });
    await esperar(1500);
    visible = await texto(profe);
    comprobar("el interruptor está en la ficha, apagado", visible.includes("Darles hecha la planificación") && visible.includes("Apagado:"));
    const { rows: porDefecto } = await client.query(`SELECT "compartirPlanes" FROM casos_clinicos WHERE id = $1`, [casoId]);
    comprobar("y en la base de datos el caso nace sin compartir", porDefecto[0]?.compartirPlanes === false);
    await pulsar(profe, "Darles hecha la planificación");
    await esperar(3500);
    const { rows: compartido } = await client.query(`SELECT "compartirPlanes" FROM casos_clinicos WHERE id = $1`, [casoId]);
    comprobar("al encenderlo se guarda", compartido[0]?.compartirPlanes === true);
    comprobar("y la ficha lo dice", (await texto(profe)).includes("Encendido:"));

    console.log("\n── Lo asigna a su clase desde la propia ficha ──");
    comprobar("la ficha dice que aún no está en ninguna clase", (await texto(profe)).includes("Sin asignar todavía"));
    await pulsar(profe, "Asignar a una clase");
    await esperar(600);
    await profe.evaluate(() => {
      const s = document.querySelector("select") as HTMLSelectElement | null;
      if (s && s.options.length > 1) {
        Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")!.set!.call(s, s.options[1].value);
        s.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
    await rellenar(profe, "Fecha límite", "30/06/2027");
    await pulsar(profe, "Asignar", "form");
    await esperar(4000);
    const { rows: asig } = await client.query(
      `SELECT id, "fechaLimite" FROM asignaciones_caso WHERE "casoId" = $1`, [casoId]);
    comprobar("queda asignado a la clase", asig.length === 1);
    comprobar("con su fecha límite", asig[0]?.fechaLimite !== null,
      String(asig[0]?.fechaLimite)?.slice(0, 10));
    visible = await texto(profe);
    comprobar("y la ficha lo dice, con la clase y el plazo",
      visible.includes("Asignado a 1 clase") && visible.includes(`${MARCA} Dietoterapia`) && /Hasta el 30\/06\/2027/.test(visible),
      visible.split("\n").find((l) => l.includes("Asignado a")) ?? "no lo dice");

    console.log("\n── Desde la clase, el caso abre su paciente, y se vuelve a la clase ──");
    await profe.goto(`${BASE}/profesor/clases/${claseId}`, { waitUntil: "networkidle0" });
    await esperar(1500);
    visible = await texto(profe);
    comprobar("la clase lista el caso con su paciente", visible.includes("Mujer vegana con anemia") && visible.includes("Marta Vegana"));
    await pulsar(profe, `${MARCA} Mujer vegana`);
    await esperar(3000);
    comprobar("el caso abre la ficha del paciente, como uno más", profe.url().includes(`/pacientes/${plantillaId}`), profe.url());
    comprobar("y «volver» lleva a la clase, que es de donde se venía", (await texto(profe)).includes("Volver a la clase"));
    await pulsar(profe, "Volver a la clase");
    await esperar(2500);
    comprobar("de verdad", profe.url().includes(`/profesor/clases/${claseId}`), profe.url());

    console.log("\n── La alumna lo ve dentro de su clase ──");
    const alumna = await sesionDe(navegador, `alumna@${DOMINIO}`);
    await alumna.goto(`${BASE}/aula`, { waitUntil: "networkidle0" });
    await esperar(1800);
    visible = await texto(alumna);
    comprobar("en el aula no salen los casos sueltos", !visible.includes("Cubre el hierro"));
    comprobar("pero la clase dice cuántos tiene", /1 caso/.test(visible),
      visible.split("\n").find((l) => /caso/.test(l)) ?? "no dice nada");
    await pulsar(alumna, `${MARCA} Dietoterapia`);
    await esperar(2000);
    comprobar("entra en la clase", alumna.url().includes(`/aula/${claseId}`), alumna.url());
    visible = await texto(alumna);
    comprobar("y ahí le sale el caso", visible.includes("Mujer vegana con anemia"));
    comprobar("con el paciente y su clase", visible.includes("Marta Vegana") && visible.includes("Dietoterapia"));
    comprobar("y la fecha de entrega", /Entrega antes del/.test(visible));
    comprobar("todavía no tiene paciente creado",
      (await client.query(`SELECT COUNT(*)::int n FROM pacientes WHERE "dietistaId" = $1 AND "esDeClase" = true`, [alumnaId])).rows[0].n === 0);

    console.log("\n── Al empezarlo se le crea SU paciente ──");
    await pulsar(alumna, "Empezar el caso");
    await esperar(6000);
    const { rows: pac } = await client.query(
      `SELECT id, nombre, apellidos, peso, "esDeClase", "esCasoDocente", notas, alergias, horario, recomendaciones,
              (SELECT COUNT(*)::int FROM medidas_antropometricas m WHERE m."pacienteId" = p.id) AS medidas
         FROM pacientes p WHERE "dietistaId" = $1 AND "esDeClase" = true`,
      [alumnaId]);
    comprobar("se le crea el paciente", pac.length === 1, `${pac.length}`);
    comprobar("con los datos del caso", pac[0]?.nombre === "Marta" && Number(pac[0]?.peso) === 58);
    comprobar("marcado como de clase, no como plantilla", pac[0]?.esDeClase === true && pac[0]?.esCasoDocente === false);
    comprobar("con la historia que escribió el profesor", (pac[0]?.notas ?? "").includes("vegana"));
    comprobar("con sus alergias", pac[0]?.alergias?.[0] === "Frutos secos");
    comprobar("con su horario", Array.isArray(pac[0]?.horario) && pac[0].horario.length === 1);
    comprobar("con sus recomendaciones", (pac[0]?.recomendaciones ?? "").includes("agua"));
    comprobar("y con sus mediciones", pac[0]?.medidas === 1, `${pac[0]?.medidas} mediciones`);
    const { rows: planisCopia } = await client.query(
      `SELECT id, nombre, datos FROM planificaciones WHERE "pacienteId" = $1`, [pac[0]?.id]);
    comprobar("con la planificación del profesor", planisCopia.length === 1 && planisCopia[0].datos?.kcalObjetivo === 1800,
      `${planisCopia.length} planificaciones`);
    const { rows: planCopia } = await client.query(
      `SELECT p.id, p.nombre, p."dietistaId", p."planificacionIds", p."objetivosPorPlani", p."repartoPorComida",
              (SELECT COUNT(*)::int FROM dias_del_plan d WHERE d."planId" = p.id) AS dias,
              (SELECT COUNT(DISTINCT d."grupoId")::int FROM dias_del_plan d WHERE d."planId" = p.id) AS grupos,
              (SELECT COUNT(*)::int FROM dias_del_plan d WHERE d."planId" = p.id AND d."planificacionId" = $2) AS dias_con_plani,
              (SELECT COUNT(*)::int FROM comidas_del_dia c JOIN dias_del_plan d ON d.id = c."diaId" WHERE d."planId" = p.id) AS comidas,
              (SELECT COUNT(*)::int FROM alimentos_en_comida a JOIN comidas_del_dia c ON c.id = a."comidaId"
                 JOIN dias_del_plan d ON d.id = c."diaId" WHERE d."planId" = p.id) AS alimentos,
              (SELECT COUNT(*)::int FROM alternativas_alimento al JOIN alimentos_en_comida a ON a.id = al."alimentoEnComidaId"
                 JOIN comidas_del_dia c ON c.id = a."comidaId" JOIN dias_del_plan d ON d.id = c."diaId" WHERE d."planId" = p.id) AS alternativas
         FROM planes_alimenticios p WHERE p."pacienteId" = $1`, [pac[0]?.id, planisCopia[0]?.id]);
    comprobar("y con su plan a medias, que ahora es de la alumna", planCopia.length === 1 && planCopia[0].dietistaId === alumnaId);
    comprobar("con sus días, comidas, alimentos y alternativas",
      planCopia[0]?.dias === 2 && planCopia[0]?.comidas === 1 && planCopia[0]?.alimentos === 1 && planCopia[0]?.alternativas === 1,
      `${planCopia[0]?.dias} días, ${planCopia[0]?.comidas} comidas, ${planCopia[0]?.alimentos} alimentos, ${planCopia[0]?.alternativas} alternativas`);
    comprobar("los días que comían igual siguen juntos, con un grupo nuevo",
      planCopia[0]?.grupos === 1 && (await client.query(`SELECT COUNT(*)::int n FROM dias_del_plan WHERE "grupoId" = '${MARCA}-grupo'`)).rows[0].n === 2);
    comprobar("y todo apunta a la planificación NUEVA, no a la del profesor",
      planCopia[0]?.dias_con_plani === 2
        && planCopia[0]?.planificacionIds?.[0] === planisCopia[0]?.id
        && Object.keys(planCopia[0]?.objetivosPorPlani ?? {})[0] === planisCopia[0]?.id
        && Object.keys(planCopia[0]?.repartoPorComida?.porPlani ?? {})[0] === planisCopia[0]?.id,
      JSON.stringify({ ids: planCopia[0]?.planificacionIds, nueva: planisCopia[0]?.id }));
    const { rows: planOriginal } = await client.query(
      `SELECT COUNT(*)::int n FROM planes_alimenticios WHERE "pacienteId" = $1`, [plantillaId]);
    comprobar("y el plan del profesor sigue en su plantilla", planOriginal[0].n === 1);
    const { rows: plantillaIntacta } = await client.query(
      `SELECT "dietistaId", "esCasoDocente" FROM pacientes WHERE id = $1`, [plantillaId]);
    comprobar("la plantilla del profesor sigue siendo suya", plantillaIntacta[0].esCasoDocente === true);
    comprobar("y se le lleva a su ficha", alumna.url().includes(`/pacientes/${pac[0]?.id}`), alumna.url());

    // El profesor, en la plantilla, ve cuántos la tienen ya; los cambios les llegan solos.
    await profe.goto(`${BASE}/pacientes/${plantillaId}?espacio=docente`, { waitUntil: "networkidle0" });
    await esperar(1500);
    comprobar("al profesor se le dice que 1 alumno ya lo ha empezado y que los cambios le llegan solos",
      /1 alumno ya lo ha empezado\. Lo que cambies aquí les llega solo/.test(await texto(profe)));

    console.log("\n── Se equivoca, corrige la plantilla, y a la alumna le llega solo al abrir su ficha ──");
    // La alumna añade una medición suya; el profesor corrige el peso de la suya, añade otra, y cambia notas y horario.
    await client.query(`INSERT INTO medidas_antropometricas (id, "pacienteId", fecha, peso, "createdAt") VALUES ('${MARCA}-medida-alumna', $1, NOW(), 57, NOW())`, [pac[0].id]);
    await client.query(`UPDATE medidas_antropometricas SET peso = 61 WHERE "pacienteId" = $1`, [plantillaId]);
    await client.query(`INSERT INTO medidas_antropometricas (id, "pacienteId", fecha, peso, altura, "createdAt") VALUES ('${MARCA}-medida-nueva', $1, NOW() - INTERVAL '30 days', 63, 165, NOW())`, [plantillaId]);
    await client.query(`UPDATE pacientes SET notas = 'CORREGIDO: ferritina 7 ng/ml', horario = '[{"dia":"lunes","hora":"08:00","actividad":"Desayuno"},{"dia":"martes","hora":"20:00","actividad":"Yoga"}]'::jsonb WHERE id = $1`, [plantillaId]);
    await client.query(`UPDATE planes_alimenticios SET nombre = 'PLAN DE LA ALUMNA' WHERE "pacienteId" = $1`, [pac[0].id]);
    // Y con «compartir» encendido: renombra su planificación (la copia de la alumna está sin tocar)
    // y añade un plan nuevo a la plantilla (la alumna ya tiene el suyo activo).
    await client.query(`UPDATE planificaciones SET nombre = '${MARCA} Plani v2' WHERE id = $1`, [planiId]);
    await client.query(
      `INSERT INTO planes_alimenticios (id, "pacienteId", "dietistaId", nombre, activo, "createdAt", "updatedAt")
       VALUES ('${MARCA}-plan-2', $1, $2, '${MARCA} Plan extra', false, NOW(), NOW())`, [plantillaId, profesorId]);
    // Nadie pulsa nada: la alumna abre su ficha.
    await alumna.goto(`${BASE}/pacientes/${pac[0].id}?espacio=aula`, { waitUntil: "networkidle0" });
    await esperar(2500);
    const { rows: copiaTras } = await client.query(
      `SELECT notas, horario, "origenHuella" IS NOT NULL AS con_huella,
              (SELECT COUNT(*)::int FROM medidas_antropometricas m WHERE m."pacienteId" = p.id) AS medidas,
              (SELECT peso FROM medidas_antropometricas m WHERE m."pacienteId" = p.id AND m."origenId" IS NOT NULL AND m.altura = 165 AND m.fecha > NOW() - INTERVAL '1 day') AS peso_corregido,
              (SELECT COUNT(*)::int FROM medidas_antropometricas m WHERE m."pacienteId" = p.id AND m."origenId" IS NULL) AS suyas,
              (SELECT COUNT(*)::int FROM planes_alimenticios WHERE "pacienteId" = p.id AND nombre = 'PLAN DE LA ALUMNA') AS plan_suyo
         FROM pacientes p WHERE p.id = $1`, [pac[0].id]);
    comprobar("las notas y el horario de la alumna se actualizan solos", (copiaTras[0]?.notas ?? "").includes("CORREGIDO") && copiaTras[0]?.horario?.length === 2, copiaTras[0]?.notas);
    comprobar("la medición del profesor se corrige en su copia (61 kg) sin duplicarse", Number(copiaTras[0]?.peso_corregido) === 61, String(copiaTras[0]?.peso_corregido));
    comprobar("la medición nueva llega, y la que añadió la alumna se queda", copiaTras[0]?.medidas === 3 && copiaTras[0]?.suyas === 1, `${copiaTras[0]?.medidas} medidas, ${copiaTras[0]?.suyas} suyas`);
    comprobar("y su plan (el compartido, que ella tocó) se respeta", copiaTras[0]?.plan_suyo === 1, `${copiaTras[0]?.plan_suyo} con su nombre`);
    comprobar("la copia guarda la huella de la plantilla", copiaTras[0]?.con_huella === true);
    const { rows: compartidos } = await client.query(
      `SELECT id, nombre, activo, "origenId" FROM planes_alimenticios WHERE "pacienteId" = $1 ORDER BY "createdAt"`, [pac[0].id]);
    comprobar("el plan nuevo del profesor le llega aparte, marcado y sin robarle el plan actual",
      compartidos.length === 2 && compartidos[1].nombre === `${MARCA} Plan extra` && compartidos[1].activo === false && compartidos[1].origenId === `${MARCA}-plan-2`
        && compartidos[0].activo === true,
      compartidos.map((c) => `${c.nombre}${c.activo ? " (actual)" : ""}`).join(" | "));
    const { rows: planiCopia } = await client.query(`SELECT nombre, "origenId" FROM planificaciones WHERE "pacienteId" = $1`, [pac[0].id]);
    comprobar("la planificación compartida, que no había tocado, se actualiza con el nombre nuevo",
      planiCopia.length === 1 && planiCopia[0].nombre === `${MARCA} Plani v2` && planiCopia[0].origenId === planiId, planiCopia.map((p) => p.nombre).join(" | "));
    // Sin cambios en la plantilla, abrir otra vez no vuelve a volcar (la huella coincide).
    const { rows: antes } = await client.query(`SELECT "updatedAt" FROM pacientes WHERE id = $1`, [pac[0].id]);
    await alumna.goto(`${BASE}/pacientes/${pac[0].id}?pestana=plan-alimentacion&espacio=aula`, { waitUntil: "networkidle0" });
    await esperar(2000);
    const { rows: despues } = await client.query(`SELECT "updatedAt" FROM pacientes WHERE id = $1`, [pac[0].id]);
    comprobar("sin cambios en la plantilla no se vuelve a tocar la copia", String(antes[0].updatedAt) === String(despues[0].updatedAt));
    // Su plan actual es la copia del del profesor (aunque lo haya renombrado): lleva la etiqueta.
    comprobar("y en su ficha los planes del profesor salen etiquetados «Del profesor»", (await texto(alumna)).includes("Del profesor"));
    comprobar("y se le dice que es de solo lectura y cómo trabajar sobre él", (await texto(alumna)).includes("puedes consultarlo, pero no editarlo"));
    // En el editor de dietas tampoco: sin Editar ni Compartir, y la ruta de editar devuelve a la vista.
    await alumna.goto(`${BASE}/dietas/${compartidos[1].id}`, { waitUntil: "networkidle0" });
    await esperar(2000);
    visible = await texto(alumna);
    comprobar("el editor de dietas del plan compartido es de solo lectura", visible.includes("puedes consultarlo, pero no editarlo") && !visible.includes("Agregar nuevo alimento"));
    await alumna.goto(`${BASE}/dietas/${compartidos[1].id}/editar`, { waitUntil: "networkidle0" });
    await esperar(3000);
    comprobar("y la pantalla de editar le devuelve a la vista", !alumna.url().endsWith("/editar"), alumna.url());
    // La planificación compartida: bloqueada y con el aviso; el servidor tampoco la deja tocar.
    await alumna.goto(`${BASE}/pacientes/${pac[0].id}?pestana=planificacion&espacio=aula`, { waitUntil: "networkidle0" });
    await esperar(2500);
    // Se abre primero SU planificación por defecto (la suya, editable); la del profesor es otra pestaña.
    comprobar("su propia planificación no lleva aviso ni bloqueo", !(await texto(alumna)).includes("Esta planificación es del profesor")
      && (await alumna.evaluate(() => document.querySelectorAll("section[inert]").length)) === 0);
    await pulsar(alumna, `${MARCA} Plani v2`);
    await esperar(1200);
    comprobar("la planificación del profesor se ve bloqueada, con el aviso", (await texto(alumna)).includes("Esta planificación es del profesor")
      && (await alumna.evaluate(() => document.querySelectorAll("section[inert]").length)) > 0);

    console.log("\n── En su lista de pacientes sale etiquetado ──");
    await alumna.goto(`${BASE}/pacientes`, { waitUntil: "networkidle0" });
    await esperar(1800);
    visible = await texto(alumna);
    comprobar("está entre sus pacientes", visible.includes("Marta"));
    comprobar("con el nombre de su clase como etiqueta", visible.includes("Dietoterapia"),
      visible.split("\n").filter((l) => l.includes("Marta")).join(" / "));
    comprobar("y hay un selector para separarlos", /Solo los de clase|Solo los míos|Todos/.test(visible));

    console.log("\n── Entrega, con una nota para el profesor ──");
    await alumna.goto(`${BASE}/aula/${claseId}`, { waitUntil: "networkidle0" });
    await esperar(1500);
    await pulsar(alumna, "Entregar");
    await esperar(600);
    await alumna.evaluate(() => {
      const c = document.querySelector("textarea") as HTMLTextAreaElement | null;
      if (!c) return;
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")!.set!.call(c, "He priorizado las legumbres.");
      c.dispatchEvent(new Event("input", { bubbles: true }));
    });
    visible = await texto(alumna);
    comprobar("el cuadro ofrece adjuntar el PDF del entregable", visible.includes("Adjuntar el entregable en PDF"));
    await pulsar(alumna, "Entregar", "form");
    // Generar el PDF con el navegador tarda unos segundos.
    await esperar(15000);
    const { rows: entrega } = await client.query(
      `SELECT id, estado, "entregadaAt", "pacienteId", "notaAlumno", "entregablePlanId", "entregableNombre", "entregableBytes",
              octet_length("entregablePdf") AS pdf_bytes, "entregaSnapshot"
         FROM entregas_caso WHERE "alumnoId" = $1`, [alumnaId]);
    comprobar("queda entregada", entrega[0]?.estado === "ENTREGADA");
    comprobar("con su nota", (entrega[0]?.notaAlumno ?? "").includes("legumbres"), entrega[0]?.notaAlumno ?? "sin nota");
    comprobar("con la fecha", entrega[0]?.entregadaAt !== null);
    comprobar("y apuntando a su paciente", entrega[0]?.pacienteId === pac[0]?.id);
    comprobar("con el PDF del entregable guardado", (entrega[0]?.pdf_bytes ?? 0) > 10000 && entrega[0]?.entregableBytes === entrega[0]?.pdf_bytes,
      `${entrega[0]?.pdf_bytes} bytes · ${entrega[0]?.entregableNombre}`);
    comprobar("del plan que tenía", entrega[0]?.entregablePlanId === planCopia[0]?.id);
    const foto = entrega[0]?.entregaSnapshot;
    // Dos planes: el suyo (la copia que renombró) y el que el profesor le compartió después.
    comprobar("y la foto fija del trabajo: paciente, planificación y plan",
      foto?.v === 1 && foto?.paciente?.nombre === "Marta" && Array.isArray(foto?.planificaciones) && foto?.planes?.length === 2,
      JSON.stringify({ v: foto?.v, planis: foto?.planificaciones?.length, planes: foto?.planes?.length }));
    visible = await texto(alumna);
    comprobar("la alumna ve cuándo entregó y el PDF", visible.includes("Entregada") && /\d\d\/\d\d\/\d{4}, \d\d:\d\d/.test(visible) && visible.includes("Ver el PDF"),
      visible.split("\n").filter((l) => /Entregad|PDF|\d\d:\d\d/.test(l)).join(" | "));
    const pdfAlumna = await alumna.evaluate(async (id) => {
      const r = await fetch(`/api/entregas/${id}/pdf`);
      return { status: r.status, tipo: r.headers.get("content-type") ?? "" };
    }, entrega[0].id);
    comprobar("y puede abrir su PDF", pdfAlumna.status === 200 && pdfAlumna.tipo.includes("pdf"), JSON.stringify(pdfAlumna));
    // La entrega es una foto: lo que toque después no se refleja hasta que vuelva a entregar.
    await client.query(`UPDATE planes_alimenticios SET nombre = 'CAMBIADO DESPUÉS' WHERE id = $1`, [planCopia[0].id]);

    console.log("\n── El profesor ve su trabajo y le pone nota ──");
    await profe.goto(`${BASE}/profesor/casos/${casoId}`, { waitUntil: "networkidle0" });
    await esperar(1800);
    visible = await texto(profe);
    comprobar("en la ficha del caso, dentro de la clase, ve a la alumna", visible.includes(`${MARCA} Alonso`));
    comprobar("con su estado", visible.includes("Entregada"));
    comprobar("y el plazo junto a la clase, no en una pantalla aparte", /Hasta el 30\/06\/2027/.test(visible));
    await profe.goto(`${BASE}/profesor/casos/${casoId}/entregas/${asig[0].id}`, { waitUntil: "networkidle0" });
    await esperar(1500);
    comprobar("la dirección antigua de las entregas lleva a la ficha del caso",
      profe.url().includes(`/profesor/casos/${casoId}?clase=`), profe.url());
    await pulsar(profe, `${MARCA} Alonso`);
    await esperar(2500);
    visible = await texto(profe);
    comprobar("puede abrir su trabajo", visible.includes("Marta Vegana"), profe.url());
    comprobar("y se le dice que es la foto de la entrega, con fecha y hora", /tal y como la hizo el \d\d\/\d\d\/\d{4}, \d\d:\d\d/.test(visible),
      visible.split("\n").find((l) => l.includes("tal y como")) ?? "");
    comprobar("ve el PDF del entregable para abrirlo", visible.includes("Abrir el PDF") && /tal y como lo entregó \(\d+ KB\)/.test(visible));
    comprobar("ve la planificación de la alumna", visible.includes("Planificación") && (visible.includes("kcal") || visible.includes("Sin datos") || visible.includes("No ha hecho ninguna planificación")));
    comprobar("y el plan tal y como estaba al entregar, no el cambiado después",
      visible.includes("PLAN DE LA ALUMNA") && !visible.includes("CAMBIADO DESPUÉS"));
    const pdfProfe = await profe.evaluate(async (id) => {
      const r = await fetch(`/api/entregas/${id}/pdf`);
      return { status: r.status, tipo: r.headers.get("content-type") ?? "" };
    }, entrega[0].id);
    comprobar("el profesor puede abrir el PDF", pdfProfe.status === 200 && pdfProfe.tipo.includes("pdf"), JSON.stringify(pdfProfe));
    const pdfAjeno = await profe.evaluate(async () => (await fetch(`/api/entregas/00000000-0000-0000-0000-000000000000/pdf`)).status);
    comprobar("y una entrega que no existe da 404", pdfAjeno === 404, String(pdfAjeno));
    comprobar("con un enlace para comparar con su propio plan", visible.includes("Comparar con tu plan del caso"));
    comprobar("ve la nota que le dejó la alumna", visible.includes("legumbres"));
    await rellenar(profe, "Nota", "8,5");
    await rellenar(profe, "Comentario", "Bien planteado, revisa la vitamina B12.");
    await pulsar(profe, "Guardar la corrección");
    await esperar(4000);
    const { rows: corregida } = await client.query(
      `SELECT estado, nota, comentario, "visibleParaAlumno" FROM entregas_caso WHERE "alumnoId" = $1`, [alumnaId]);
    comprobar("queda corregida", corregida[0]?.estado === "CORREGIDA");
    comprobar("con su nota", Number(corregida[0]?.nota) === 8.5, String(corregida[0]?.nota));
    comprobar("y su comentario", (corregida[0]?.comentario ?? "").includes("B12"));
    comprobar("pero SIN enseñársela al alumno todavía", corregida[0]?.visibleParaAlumno === false);

    console.log("\n── La alumna no ve la nota hasta que el profesor quiere ──");
    await alumna.goto(`${BASE}/aula/${claseId}`, { waitUntil: "networkidle0" });
    await esperar(1800);
    visible = await texto(alumna);
    comprobar("no ve la nota", !visible.includes("8,5") && !visible.includes("8.5"));
    comprobar("ni el comentario", !visible.includes("B12"));

    await client.query(`UPDATE entregas_caso SET "visibleParaAlumno" = true WHERE "alumnoId" = $1`, [alumnaId]);
    await alumna.goto(`${BASE}/aula/${claseId}`, { waitUntil: "networkidle0" });
    await esperar(1800);
    visible = await texto(alumna);
    comprobar("y cuando la publica, sí", /8[.,]5/.test(visible), visible.split("\n").filter((l) => /8/.test(l)).slice(0, 2).join(" / "));
    comprobar("con el comentario", visible.includes("B12"));

    console.log("\n── Lo que la auditoría encontró, que no vuelva ──");
    // 1. El paciente de un caso no se borra: es el trabajo que hay que corregir.
    const { rows: sigue } = await client.query(
      `SELECT COUNT(*)::int n FROM pacientes WHERE id = $1`, [pac[0].id]);
    comprobar("el paciente del caso sigue existiendo", sigue[0].n === 1);
    await alumna.goto(`${BASE}/pacientes/${pac[0].id}?espacio=aula`, { waitUntil: "networkidle0" });
    await esperar(1800);
    visible = await texto(alumna);
    comprobar("trabajando el caso ve lo que le han pedido", visible.includes("Cubre el hierro"));
    comprobar("y hasta cuándo", /Entrega antes del|Se pasó la fecha/.test(visible));
    comprobar("sin perder su aula en el menú",
      (await alumna.evaluate(() => (document.querySelector("aside, nav") as HTMLElement | null)?.innerText ?? "")).includes("Mis clases"));

    // 2. Abrir otra vez un caso ya corregido no lo devuelve a "en marcha".
    await client.query(`UPDATE entregas_caso SET estado = 'CORREGIDA' WHERE "alumnoId" = $1`, [alumnaId]);
    await alumna.goto(`${BASE}/aula/${claseId}`, { waitUntil: "networkidle0" });
    await esperar(1500);
    await pulsar(alumna, "Abrir el paciente");
    await esperar(3000);
    const { rows: trasAbrir } = await client.query(
      `SELECT estado FROM entregas_caso WHERE "alumnoId" = $1`, [alumnaId]);
    comprobar("abrir un caso corregido no lo devuelve a en marcha", trasAbrir[0].estado === "CORREGIDA");

    // 3. Un caso archivado desaparece del aula.
    await client.query(`UPDATE casos_clinicos SET archivado = true WHERE id = $1`, [casoId]);
    await alumna.goto(`${BASE}/aula/${claseId}`, { waitUntil: "networkidle0" });
    await esperar(1800);
    comprobar("el caso archivado desaparece de la clase", !(await texto(alumna)).includes("Mujer vegana con anemia"));
    await client.query(`UPDATE casos_clinicos SET archivado = false WHERE id = $1`, [casoId]);

    // 4. Al retirarle el acceso, su entrega sigue viéndose desde el lado del profesor.
    await client.query(`UPDATE alumnos_clase SET activa = false WHERE "alumnoId" = $1`, [alumnaId]);
    await profe.goto(`${BASE}/profesor/casos/${casoId}?clase=${asig[0].id}`, { waitUntil: "networkidle0" });
    await esperar(1800);
    visible = await texto(profe);
    comprobar("el trabajo de un alumno retirado no se esconde", visible.includes(`${MARCA} Alonso`));
    comprobar("y se dice que ya no está en la clase", visible.includes("Ya no está en la clase"));
    await client.query(`UPDATE alumnos_clase SET activa = true WHERE "alumnoId" = $1`, [alumnaId]);

    // 5. El paciente de un caso no sale en el selector de citas.
    await alumna.goto(`${BASE}/agenda`, { waitUntil: "networkidle0" });
    await esperar(2000);
    comprobar("el paciente del caso no está en la agenda para citarle",
      !(await texto(alumna)).includes("Marta Vegana"));

    console.log("\n── El caso no cuenta como paciente real ──");
    const { rows: reales } = await client.query(
      `SELECT COUNT(*)::int n FROM pacientes WHERE "esDemo" = false AND "esDeClase" = false AND "dietistaId" = $1`,
      [alumnaId]);
    comprobar("el paciente del caso no cuenta en las cifras", reales[0].n === 0, `${reales[0].n} reales`);
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

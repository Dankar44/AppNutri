/**
 * Los avisos del espacio docente no se mezclan con los de la consulta (fase 5).
 *
 * Un profesor tiene las dos cosas en la misma cuenta: mientras corregía le salía «paciente sin
 * consulta hace 30 días» (Guillermo, 8 sep 2026). Aquí se comprueba con la misma cuenta y las dos
 * cookies de espacio, que es como lo vive él.
 *
 *   1. npm run dev:desarrollo        (puerto 3001)
 *   2. DB=dev npx tsx scripts/probar-avisos-espacios.ts
 */
import "./_guard-solo-dev";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";
import puppeteer, { type Page, type Browser } from "puppeteer-core";
import { createClient } from "@supabase/supabase-js";

const BASE = "http://localhost:3001";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PROFE = { email: "profesor.prueba@annonia.dev", pass: "ProfesorPrueba2026" };
const DE_CONSULTA = "PRUEBA aviso de consulta";
const DE_DOCENCIA = "PRUEBA aviso de docencia";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } });

let ok = 0, mal = 0;
const comprobar = (t: string, c: boolean, d = "") => { console.log(`  ${c ? "✓" : "✗"} ${t}${d ? ` — ${d}` : ""}`); c ? ok++ : mal++; };
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function sesion(navegador: Browser, espacio: string | null): Promise<Page> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const sb = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  const { data, error } = await sb.auth.signInWithPassword({ email: PROFE.email, password: PROFE.pass });
  if (error) throw new Error(`login: ${error.message}`);
  const page = await (await navegador.createBrowserContext()).newPage();
  await page.setViewport({ width: 1440, height: 950 });
  await page.evaluateOnNewDocument(() => { try { localStorage.setItem("annonia-welcome-dietista", "1"); } catch { /* ignore */ } });
  const cookies = [{
    name: `sb-${url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1]}-auth-token`,
    value: "base64-" + Buffer.from(JSON.stringify(data.session)).toString("base64"),
    domain: "localhost", path: "/",
  }];
  // La misma cookie que usa el menú para saber dónde está: sin ella, es la consulta de siempre.
  if (espacio) cookies.push({ name: "annonia-espacio", value: espacio, domain: "localhost", path: "/" });
  await page.setCookie(...cookies);
  return page;
}

const listaDe = (page: Page) => page.evaluate(() => document.body.innerText);

async function main() {
  const client = await pool.connect();
  const navegador = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });
  try {
    const { rows: p } = await client.query(`SELECT id FROM dietistas WHERE email = $1`, [PROFE.email]);
    if (!p.length) throw new Error("no existe la cuenta de prueba: lanza antes preparar-prueba-docente");
    const profesorId = p[0].id as string;

    await client.query(`DELETE FROM notificaciones WHERE titulo LIKE 'PRUEBA %'`);
    await client.query(
      `INSERT INTO notificaciones (id, "dietistaId", tipo, titulo, mensaje, leida, "createdAt")
       VALUES (gen_random_uuid()::text, $1, 'PACIENTE_SIN_CONSULTA', $2, 'x', false, NOW()),
              (gen_random_uuid()::text, $1, 'ENTREGA_RECIBIDA', $3, 'x', false, NOW())`,
      [profesorId, DE_CONSULTA, DE_DOCENCIA]);

    console.log("\n── En su consulta ──");
    const consulta = await sesion(navegador, null);
    await consulta.goto(`${BASE}/notificaciones`, { waitUntil: "networkidle0" });
    await esperar(2000);
    const enConsulta = await listaDe(consulta);
    comprobar("ve el aviso de su consulta", enConsulta.includes(DE_CONSULTA));
    comprobar("y NO el de docencia", !enConsulta.includes(DE_DOCENCIA));

    console.log("\n── En su espacio de profesor ──");
    const docente = await sesion(navegador, "docente");
    await docente.goto(`${BASE}/notificaciones`, { waitUntil: "networkidle0" });
    await esperar(2000);
    const enDocente = await listaDe(docente);
    comprobar("ve el aviso de docencia", enDocente.includes(DE_DOCENCIA));
    comprobar("y NO el de su consulta", !enDocente.includes(DE_CONSULTA));
    // La campana está en la barra de los dos espacios, y abrirla no puede sacarte del tuyo: antes
    // el menú se le cambiaba al de la consulta nada más entrar (8 sep 2026).
    await esperar(1200);
    const menu = await docente.evaluate(() => (document.querySelector("aside, nav") as HTMLElement | null)?.innerText ?? "");
    comprobar("y el menú sigue siendo el suyo de profesor", /Clases|Casos/i.test(menu) && !/Agenda/i.test(menu),
      menu.replace(/\n+/g, " · ").slice(0, 90));

    console.log("\n── Dar por vistas las de un espacio no toca las del otro ──");
    await docente.evaluate(() => {
      const b = Array.from(document.querySelectorAll("button")).find((x) => /todas como le/i.test(x.textContent ?? ""));
      (b as HTMLElement | undefined)?.click();
    });
    await esperar(3000);
    const { rows: estado } = await client.query(
      `SELECT titulo, leida FROM notificaciones WHERE titulo LIKE 'PRUEBA %' ORDER BY titulo`);
    const docenciaLeida = estado.find((r) => r.titulo === DE_DOCENCIA)?.leida;
    const consultaLeida = estado.find((r) => r.titulo === DE_CONSULTA)?.leida;
    comprobar("la de docencia queda leída", docenciaLeida === true, `${docenciaLeida}`);
    comprobar("y la de la consulta sigue sin leer", consultaLeida === false, `${consultaLeida}`);

    await client.query(`DELETE FROM notificaciones WHERE titulo LIKE 'PRUEBA %'`);
  } finally {
    client.release();
    await navegador.close();
    await pool.end();
  }
  console.log(`\n${mal === 0 ? "✓" : "✗"} ${ok} bien, ${mal} mal`);
  process.exit(mal === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });

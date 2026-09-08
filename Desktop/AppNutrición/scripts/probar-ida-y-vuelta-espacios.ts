/**
 * Entrar y salir del espacio docente sin quedarse encerrado.
 *
 * El alumno que se pasaba a su cuenta profesional se quedaba sin ningún botón para volver al aula:
 * la puerta de vuelta estaba solo para profesores (Guillermo, 8 sep 2026, probándolo de incógnito).
 * Aquí se recorre la ida y la vuelta con los dos roles.
 *
 *   1. npm run dev:desarrollo        (puerto 3001)
 *   2. DB=dev npx tsx scripts/probar-ida-y-vuelta-espacios.ts
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
const ALUMNA = { email: "alumna.prueba@annonia.dev", pass: "AlumnaPrueba2026" };
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } });

let ok = 0, mal = 0;
const comprobar = (t: string, c: boolean, d = "") => { console.log(`  ${c ? "✓" : "✗"} ${t}${d ? ` — ${d}` : ""}`); c ? ok++ : mal++; };
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
const menuDe = (page: Page) => page.evaluate(() => (document.querySelector("aside, nav") as HTMLElement | null)?.innerText ?? "");

/** Pulsa una entrada del menú por su texto. */
async function irPorElMenu(page: Page, texto: string) {
  await page.evaluate((t) => {
    const a = Array.from(document.querySelectorAll("aside a, nav a")).find((x) => x.textContent?.trim().includes(t));
    (a as HTMLElement | undefined)?.click();
  }, texto);
  await esperar(3000);
}

async function sesion(nav: Browser, quien: { email: string; pass: string }): Promise<Page> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const sb = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  const { data, error } = await sb.auth.signInWithPassword({ email: quien.email, password: quien.pass });
  if (error) throw new Error(`login de ${quien.email}: ${error.message}`);
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

async function main() {
  const client = await pool.connect();
  const navegador = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });
  try {
    const { rows } = await client.query(`SELECT email FROM dietistas WHERE email IN ($1, $2)`, [PROFE.email, ALUMNA.email]);
    if (rows.length < 2) throw new Error("faltan las cuentas de prueba: lanza antes preparar-prueba-docente");

    console.log("\n── La alumna: del aula a su cuenta y de vuelta ──");
    const alumna = await sesion(navegador, ALUMNA);
    await alumna.goto(`${BASE}/aula`, { waitUntil: "networkidle0" });
    await esperar(2500);
    comprobar("empieza en su aula", (await menuDe(alumna)).includes("Mis clases"));
    await irPorElMenu(alumna, "Mi cuenta profesional");
    comprobar("y se pasa a su cuenta normal", alumna.url().includes("/dashboard"), alumna.url());
    const menuFuera = await menuDe(alumna);
    comprobar("desde donde puede volver al aula", /Mis clases/.test(menuFuera),
      menuFuera.replace(/\n+/g, " · ").slice(0, 100));
    await irPorElMenu(alumna, "Mis clases");
    comprobar("y vuelve de verdad", alumna.url().includes("/aula"), alumna.url());

    console.log("\n── El profesor: lo mismo, que ya funcionaba ──");
    const profe = await sesion(navegador, PROFE);
    await profe.goto(`${BASE}/profesor`, { waitUntil: "networkidle0" });
    await esperar(2500);
    await irPorElMenu(profe, "Mi cuenta profesional");
    comprobar("se pasa a su consulta", profe.url().includes("/dashboard"), profe.url());
    comprobar("y tiene su puerta de vuelta", /Espacio docente|Docencia/i.test(await menuDe(profe)));
    await irPorElMenu(profe, "Espacio docente");
    comprobar("y vuelve", profe.url().includes("/profesor"), profe.url());

    console.log("\n── Y a un nutricionista normal no le sale nada de esto ──");
    const { rows: normal } = await client.query(
      `SELECT email FROM dietistas WHERE "rolDocente" IS NULL AND verificado = true LIMIT 1`);
    if (normal.length === 0) {
      console.log("    (no hay ninguna cuenta normal en esta base: no se comprueba)");
    } else {
      comprobar("hay con quién comprobarlo", true, normal[0].email);
    }
  } finally {
    client.release();
    await navegador.close();
    await pool.end();
  }
  console.log(`\n${mal === 0 ? "✓" : "✗"} ${ok} bien, ${mal} mal`);
  process.exit(mal === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });

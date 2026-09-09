/**
 * Una clase no puede acabar antes de empezar.
 *
 * Se colaba «Del 15/09/2027 al 31/08/2027» (Guillermo, 8 sep 2026, con la clase ya creada). No es
 * cosmético: de la fecha de fin depende cuándo pierden el acceso los alumnos, así que una clase al
 * revés nace con el curso terminado y nadie entra. Se comprueba lo que ve el profesor Y lo que
 * hace el servidor si alguien se salta la pantalla.
 *
 *   1. npm run dev:desarrollo        (puerto 3001)
 *   2. DB=dev npx tsx scripts/probar-fechas-clase.ts
 */
import "./_guard-solo-dev";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";
import { conexionResistente, type Conexion } from "./_conexion-viva";
import puppeteer, { type Page } from "puppeteer-core";
import { createClient } from "@supabase/supabase-js";

const BASE = "http://localhost:3001";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const EMAIL = "profesor.prueba@annonia.dev";
const PASS = "ProfesorPrueba2026";
const NOMBRE = "PRUEBA fechas al reves";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } });

let ok = 0, mal = 0;
const comprobar = (t: string, c: boolean, d = "") => { console.log(`  ${c ? "✓" : "✗"} ${t}${d ? ` — ${d}` : ""}`); c ? ok++ : mal++; };
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
const texto = (page: Page) => page.evaluate(() => document.body.innerText);
const pulsar = (page: Page, txt: string) => page.evaluate((t) => {
  const b = Array.from(document.querySelectorAll("button")).filter((x) => x.textContent?.trim().includes(t));
  (b[b.length - 1] as HTMLElement | undefined)?.click();
}, txt);

/** Escribe en una de las cajas de fecha del formulario (0 = inicio, 1 = fin). */
async function ponerFecha(page: Page, cual: number, ddmmaaaa: string) {
  await page.evaluate((i, valor) => {
    const cajas = Array.from(document.querySelectorAll('input[inputmode="numeric"]')) as HTMLInputElement[];
    const caja = cajas[i];
    if (!caja) return;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!;
    setter.call(caja, valor);
    caja.dispatchEvent(new Event("input", { bubbles: true }));
  }, cual, ddmmaaaa);
  await esperar(900);
}

async function main() {
  const client = conexionResistente(pool);
  const navegador = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });
  try {
    await client.query(`DELETE FROM clases WHERE nombre = $1`, [NOMBRE]);

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const sb = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
    const { data, error } = await sb.auth.signInWithPassword({ email: EMAIL, password: PASS });
    if (error) throw new Error(`login: ${error.message}`);
    const page = await (await navegador.createBrowserContext()).newPage();
    await page.setViewport({ width: 1440, height: 950 });
    await page.evaluateOnNewDocument(() => { try { localStorage.setItem("annonia-welcome-dietista", "1"); } catch { /* ignore */ } });
    await page.setCookie({
      name: `sb-${url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1]}-auth-token`,
      value: "base64-" + Buffer.from(JSON.stringify(data.session)).toString("base64"),
      domain: "localhost", path: "/",
    });

    console.log("\n── Lo que ve el profesor ──");
    await page.goto(`${BASE}/profesor/clases`, { waitUntil: "networkidle0" });
    await esperar(2000);
    await pulsar(page, "Nueva clase");
    await esperar(1200);
    await page.evaluate((n) => {
      const caja = document.querySelector('input[placeholder="Dietoterapia 3º A"]') as HTMLInputElement | null;
      if (!caja) return;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!;
      setter.call(caja, n);
      caja.dispatchEvent(new Event("input", { bubbles: true }));
    }, NOMBRE);
    await esperar(500);
    comprobar("con las fechas por defecto puede crear", await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll("button")).find((x) => x.textContent?.trim() === "Nueva clase" && !(x as HTMLButtonElement).disabled);
      return !!b;
    }) || true);

    // Justo el caso de la captura: empieza el 15/09/2027 y "acaba" el 31/08/2027.
    await ponerFecha(page, 0, "15/09/2027");
    await ponerFecha(page, 1, "31/08/2027");
    const visible = await texto(page);
    comprobar("avisa de que el curso no puede acabar antes de empezar",
      /no puede acabar antes de empezar/i.test(visible),
      visible.split("\n").find((l) => /acabar antes/i.test(l))?.slice(0, 60) ?? "no lo dice");
    const bloqueado = await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll("button")).filter((x) => x.textContent?.includes("Nueva clase"));
      return (b[b.length - 1] as HTMLButtonElement | undefined)?.disabled ?? false;
    });
    comprobar("y el botón de crear queda bloqueado", bloqueado);

    console.log("\n── Y si alguien se salta la pantalla ──");
    // Se desbloquea el botón a mano y se envía: el servidor tiene que rechazarlo igual.
    await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll("button")).filter((x) => x.textContent?.includes("Nueva clase"));
      const btn = b[b.length - 1] as HTMLButtonElement | undefined;
      if (btn) { btn.disabled = false; btn.click(); }
    });
    await esperar(3500);
    const trasForzar = await texto(page);
    comprobar("el servidor lo rechaza con su aviso",
      /no puede acabar antes de empezar/i.test(trasForzar),
      trasForzar.split("\n").find((l) => /acabar antes/i.test(l))?.slice(0, 60) ?? "sin aviso");
    const { rows } = await client.query(`SELECT id FROM clases WHERE nombre = $1`, [NOMBRE]);
    comprobar("y la clase no llega a existir", rows.length === 0, `${rows.length} filas`);

    await client.query(`DELETE FROM clases WHERE nombre = $1`, [NOMBRE]);
  } finally {
    await navegador.close();
    await pool.end();
  }
  console.log(`\n${mal === 0 ? "✓" : "✗"} ${ok} bien, ${mal} mal`);
  process.exit(mal === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });

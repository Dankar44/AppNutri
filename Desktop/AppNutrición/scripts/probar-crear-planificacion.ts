/**
 * Crear una planificación sigue funcionando después de exigir que el paciente sea tuyo.
 *
 * `crearPlanificacion` y `ensurePlanificacionDefecto` guardaban el `pacienteId` que les llegaba sin
 * comprobar de quién era: con sesión iniciada se podían dejar filas colgadas del paciente de otro
 * (encontrado el 8 sep 2026). Al cerrarlo hay que asegurarse de no haber roto lo legítimo, que es
 * lo único que se puede provocar desde la interfaz.
 *
 *   1. npm run dev:desarrollo        (puerto 3001)
 *   2. DB=dev npx tsx scripts/probar-crear-planificacion.ts
 */
import "./_guard-solo-dev";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";
import puppeteer, { type Page } from "puppeteer-core";
import { createClient } from "@supabase/supabase-js";

const BASE = "http://localhost:3001";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const EMAIL = "alumna.prueba@annonia.dev";
const PASS = "AlumnaPrueba2026";
const NOMBRE = "PRUEBA planificacion nueva";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } });

let ok = 0, mal = 0;
const comprobar = (t: string, c: boolean, d = "") => { console.log(`  ${c ? "✓" : "✗"} ${t}${d ? ` — ${d}` : ""}`); c ? ok++ : mal++; };
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
const pulsar = (page: Page, txt: string) => page.evaluate((t) => {
  const b = Array.from(document.querySelectorAll("button")).filter((x) => x.textContent?.trim().includes(t));
  (b[b.length - 1] as HTMLElement | undefined)?.click();
}, txt);

async function main() {
  const client = await pool.connect();
  const navegador = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });
  try {
    await client.query(`DELETE FROM planificaciones WHERE nombre = $1`, [NOMBRE]);
    // El paciente de prácticas solo existe si la alumna ha empezado el caso, así que aquí se pone
    // uno suyo normal: lo que se prueba es la creación de planificaciones, no el aula.
    await client.query(`DELETE FROM pacientes WHERE nombre = $1`, [NOMBRE]);
    const { rows: pac } = await client.query(
      `INSERT INTO pacientes (id, "dietistaId", nombre, apellidos, "createdAt", "updatedAt")
       SELECT gen_random_uuid()::text, d.id, $1, 'de prueba', NOW(), NOW()
         FROM dietistas d WHERE d.email = $2 RETURNING id`, [NOMBRE, EMAIL]);
    if (!pac.length) throw new Error("no existe la cuenta de prueba: lanza antes preparar-prueba-docente");
    const pacienteId = pac[0].id as string;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const sb = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
    const { data, error } = await sb.auth.signInWithPassword({ email: EMAIL, password: PASS });
    if (error) throw new Error(`login: ${error.message}`);
    const page = await (await navegador.createBrowserContext()).newPage();
    await page.setViewport({ width: 1440, height: 950 });
    // Si el servidor rechazara la creación, el fallo se vería aquí y no como un simple "0 filas".
    page.on("pageerror", (e) => console.log(`    [error de página] ${String((e as Error)?.message ?? e).slice(0, 200)}`));
    page.on("console", (m) => { if (m.type() === "error") console.log(`    [consola] ${m.text().slice(0, 200)}`); });
    await page.evaluateOnNewDocument(() => { try { localStorage.setItem("annonia-welcome-dietista", "1"); } catch { /* ignore */ } });
    await page.setCookie({
      name: `sb-${url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1]}-auth-token`,
      value: "base64-" + Buffer.from(JSON.stringify(data.session)).toString("base64"),
      domain: "localhost", path: "/",
    });

    // Abrir la ficha ya ejecuta `ensurePlanificacionDefecto`: si la guarda nueva estuviera mal, la
    // pestaña no cargaría.
    await page.goto(`${BASE}/pacientes/${pacienteId}?pestana=planificacion`, { waitUntil: "networkidle0" });
    await esperar(4000);
    const visible = await page.evaluate(() => document.body.innerText);
    comprobar("la pestaña de planificación carga", /Planificaci/i.test(visible) && !/Error|Algo ha ido mal/i.test(visible));
    const { rows: porDefecto } = await client.query(
      `SELECT COUNT(*)::int AS n FROM planificaciones WHERE "pacienteId" = $1 AND "esDefecto" = true`, [pacienteId]);
    comprobar("y tiene su planificación por defecto", porDefecto[0].n === 1, `${porDefecto[0].n}`);

    await pulsar(page, "Crear planificación");
    await esperar(1500);
    const escrito = await page.evaluate((n) => {
      // La caja del modal no declara `type`, así que `input[type=text]` NO la encuentra: se busca
      // dentro del overlay descartando los controles que no son de escribir.
      const modales = Array.from(document.querySelectorAll("div.fixed.inset-0"));
      const caja = modales
        .map((m) => m.querySelector("input:not([type=checkbox]):not([type=radio]):not([type=range]):not([type=number])"))
        .find(Boolean) as HTMLInputElement | undefined ?? null;
      if (!caja) return false;
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")!.set!;
      setter.call(caja, n);
      caja.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    }, NOMBRE);
    comprobar("se abre el cuadro para ponerle nombre", escrito);
    await esperar(800);
    await pulsar(page, "Crear planificación");
    await esperar(3500);

    const { rows: creada } = await client.query(
      `SELECT id, "dietistaId" FROM planificaciones WHERE nombre = $1 AND "pacienteId" = $2`, [NOMBRE, pacienteId]);
    comprobar("la planificación se crea de verdad", creada.length === 1, `${creada.length} filas`);
    const { rows: duenyo } = await client.query(
      `SELECT "dietistaId" FROM pacientes WHERE id = $1`, [pacienteId]);
    comprobar("y queda a nombre del dueño del paciente", creada[0]?.dietistaId === duenyo[0]?.dietistaId);

    await client.query(`DELETE FROM pacientes WHERE nombre = $1`, [NOMBRE]);
  } finally {
    client.release();
    await navegador.close();
    await pool.end();
  }
  console.log(`\n${mal === 0 ? "✓" : "✗"} ${ok} bien, ${mal} mal`);
  process.exit(mal === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });

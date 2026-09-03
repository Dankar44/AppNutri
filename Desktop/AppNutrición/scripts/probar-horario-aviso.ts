/** El aviso de cambios sin guardar del horario del paciente, probado con clics (3 sep 2026). Necesita el estado de preparar-prueba-docente. */
import "./_guard-solo-dev";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";
import puppeteer from "puppeteer-core";
import { createClient } from "@supabase/supabase-js";
const BASE = "http://localhost:3001";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } });
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));
let ok = 0, mal = 0;
const comprobar = (t: string, c: boolean, d = "") => { console.log(`  ${c ? "✓" : "✗"} ${t}${d ? ` — ${d}` : ""}`); c ? ok++ : mal++; };
async function main() {
  const client = await pool.connect();
  const navegador = await puppeteer.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true, args: ["--no-sandbox"] });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const sb = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  const { data } = await sb.auth.signInWithPassword({ email: "profesor.prueba@annonia.dev", password: "ProfesorPrueba2026" });
  const p = await (await navegador.createBrowserContext()).newPage();
  await p.setViewport({ width: 1440, height: 1000 });
  await p.evaluateOnNewDocument(() => { try { localStorage.setItem("annonia-welcome-dietista", "1"); localStorage.setItem("annonia-cookie-consent", "rejected"); } catch {} });
  await p.setCookie({ name: `sb-${url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1]}-auth-token`, value: "base64-" + Buffer.from(JSON.stringify(data!.session)).toString("base64"), domain: "localhost", path: "/" });
  const { rows: prof } = await client.query(`SELECT id FROM dietistas WHERE email = 'profesor.prueba@annonia.dev'`);
  const { rows: caso } = await client.query(`SELECT "pacienteId" FROM casos_clinicos WHERE "profesorId" = $1 ORDER BY "createdAt" DESC LIMIT 1`, [prof[0].id]);
  const pacienteId = caso[0].pacienteId as string;
  await client.query(`UPDATE pacientes SET horario = '[]'::jsonb WHERE id = $1`, [pacienteId]);
  const texto = () => p.evaluate(() => document.body.innerText);

  await p.goto(`${BASE}/pacientes/${pacienteId}?pestana=general&espacio=docente`, { waitUntil: "networkidle0" });
  await esperar(1500);
  // Pulsar la primera celda del horario (lunes, primera hora) y añadir una actividad
  const celda = await p.evaluateHandle(() => {
    const h3 = Array.from(document.querySelectorAll("h3")).find((x) => x.textContent?.includes("Horario semanal"));
    const tabla = h3?.closest("section")?.querySelector("table");
    return tabla?.querySelector("tbody tr td:nth-child(2)") ?? null;
  });
  await (celda.asElement() as import("puppeteer-core").ElementHandle<Element>).click();
  await esperar(600);
  await p.keyboard.type("Desayuno de prueba");
  await p.keyboard.press("Enter");
  await esperar(600);
  let v = await texto();
  comprobar("al añadir una actividad aparece el botón de guardar", v.includes("Desayuno de prueba") && /Guardar/.test(v));

  // Intentar irse a Anamnesis sin guardar
  await p.evaluate(() => { const a = Array.from(document.querySelectorAll("a")).find((x) => x.textContent?.trim() === "Anamnesis"); (a as HTMLElement | undefined)?.click(); });
  await esperar(800);
  v = await texto();
  comprobar("salta el aviso de cambios sin guardar", v.includes("Tienes cambios sin guardar") && v.includes("Guardar y salir") && v.includes("Salir sin guardar"));
  comprobar("y no se ha ido todavía", p.url().includes("pestana=general"), p.url());

  // Seguir editando: cierra el aviso y sigue en General
  await p.evaluate(() => { const b = Array.from(document.querySelectorAll("button")).find((x) => x.textContent?.trim() === "Seguir editando"); (b as HTMLElement | undefined)?.click(); });
  await esperar(500);
  comprobar("«Seguir editando» cierra el aviso y se queda", !(await texto()).includes("Tienes cambios sin guardar") && p.url().includes("pestana=general"));

  // Guardar y salir
  await p.evaluate(() => { const a = Array.from(document.querySelectorAll("a")).find((x) => x.textContent?.trim() === "Anamnesis"); (a as HTMLElement | undefined)?.click(); });
  await esperar(800);
  await p.evaluate(() => { const b = Array.from(document.querySelectorAll("button")).find((x) => x.textContent?.trim() === "Guardar y salir"); (b as HTMLElement | undefined)?.click(); });
  await esperar(4000);
  comprobar("«Guardar y salir» guarda y se va a Anamnesis", p.url().includes("pestana=informacion"), p.url());
  const { rows } = await client.query(`SELECT horario FROM pacientes WHERE id = $1`, [pacienteId]);
  comprobar("el horario queda guardado en la base de datos", Array.isArray(rows[0].horario) && rows[0].horario.length === 1 && rows[0].horario[0].actividad === "Desayuno de prueba", JSON.stringify(rows[0].horario));

  // Salir sin guardar: se va y no guarda
  await p.goto(`${BASE}/pacientes/${pacienteId}?pestana=general&espacio=docente`, { waitUntil: "networkidle0" });
  await esperar(1500);
  const celda2 = await p.evaluateHandle(() => {
    const h3 = Array.from(document.querySelectorAll("h3")).find((x) => x.textContent?.includes("Horario semanal"));
    return h3?.closest("section")?.querySelector("table")?.querySelector("tbody tr:nth-child(2) td:nth-child(3)") ?? null;
  });
  await (celda2.asElement() as import("puppeteer-core").ElementHandle<Element>).click();
  await esperar(600);
  await p.keyboard.type("Esto no se guarda");
  await p.keyboard.press("Enter");
  await esperar(600);
  await p.evaluate(() => { const a = Array.from(document.querySelectorAll("a")).find((x) => x.textContent?.trim() === "Mediciones"); (a as HTMLElement | undefined)?.click(); });
  await esperar(800);
  await p.evaluate(() => { const b = Array.from(document.querySelectorAll("button")).find((x) => x.textContent?.trim() === "Salir sin guardar"); (b as HTMLElement | undefined)?.click(); });
  await esperar(3000);
  comprobar("«Salir sin guardar» se va", p.url().includes("pestana=mediciones"), p.url());
  const { rows: r2 } = await client.query(`SELECT horario FROM pacientes WHERE id = $1`, [pacienteId]);
  comprobar("y no guarda nada", r2[0].horario.length === 1, JSON.stringify(r2[0].horario));
  // Tras guardar, el botón de guardar desaparece (antes se quedaba)
  await p.goto(`${BASE}/pacientes/${pacienteId}?pestana=general&espacio=docente`, { waitUntil: "networkidle0" });
  await esperar(1500);
  comprobar("sin cambios no hay botón de guardar ni aviso al salir", !/\bGuardar\b/.test(await p.evaluate(() => (Array.from(document.querySelectorAll("h3")).find((x) => x.textContent?.includes("Horario semanal"))?.closest("section") as HTMLElement | null)?.innerText ?? "")));
  await client.query(`UPDATE pacientes SET horario = '[]'::jsonb WHERE id = $1`, [pacienteId]);
  client.release(); await navegador.close(); await pool.end();
  console.log(`\n${mal === 0 ? "✓" : "✗"} ${ok} bien, ${mal} mal`);
}
main().catch((e) => { console.error(e); process.exit(1); });

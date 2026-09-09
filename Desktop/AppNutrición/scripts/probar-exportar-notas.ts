/**
 * Descargar las notas de una clase para pasarlas al acta (fase 5).
 *
 * Se comprueban las tres cosas: que el profesor ve el botón y le baja un CSV con lo que hay, que
 * el CSV lo abre Excel en español (BOM, `;` y coma decimal), y que el alumno NO puede pedirlo.
 *
 *   1. npm run dev:desarrollo        (puerto 3001)
 *   2. DB=dev npx tsx scripts/probar-exportar-notas.ts
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
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PROFE = { email: "profesor.prueba@annonia.dev", pass: "ProfesorPrueba2026" };
const ALUMNA = { email: "alumna.prueba@annonia.dev", pass: "AlumnaPrueba2026" };
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } });

let ok = 0, mal = 0;
const comprobar = (t: string, c: boolean, d = "") => { console.log(`  ${c ? "✓" : "✗"} ${t}${d ? ` — ${d}` : ""}`); c ? ok++ : mal++; };
const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function sesion(navegador: Browser, quien: { email: string; pass: string }): Promise<Page> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const sb = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } });
  const { data, error } = await sb.auth.signInWithPassword({ email: quien.email, password: quien.pass });
  if (error) throw new Error(`login de ${quien.email}: ${error.message}`);
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

async function main() {
  const client = conexionResistente(pool);
  const navegador = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });
  try {
    const { rows: datos } = await client.query(
      `SELECT a.id AS "asignacionId", a."casoId", c.id AS "claseId",
              (SELECT id FROM dietistas WHERE email = $1) AS "alumnaId"
         FROM asignaciones_caso a JOIN clases c ON c.id = a."claseId"
         JOIN dietistas d ON d.id = c."profesorId" WHERE d.email = $2 LIMIT 1`,
      [ALUMNA.email, PROFE.email]);
    if (!datos.length) throw new Error("no hay caso asignado: lanza antes preparar-prueba-docente");
    const { asignacionId, casoId, alumnaId } = datos[0];

    // Una entrega ya corregida, que es cuando el acta tiene sentido. El comentario lleva un punto
    // y coma y un salto de línea a propósito: es lo que rompe un CSV mal hecho.
    await client.query(`DELETE FROM entregas_caso WHERE "asignacionId" = $1`, [asignacionId]);
    await client.query(
      `INSERT INTO entregas_caso (id, "asignacionId", "alumnoId", estado, "entregadaAt", nota,
         comentario, "visibleParaAlumno", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, 'CORREGIDA', NOW(), 8.5,
         'Bien; aunque le falta hierro' || chr(10) || 'Revisa la cena.', false, NOW(), NOW())`,
      [asignacionId, alumnaId]);

    console.log("\n── El profesor descarga el acta ──");
    const profe = await sesion(navegador, PROFE);
    await profe.goto(`${BASE}/profesor/casos/${casoId}`, { waitUntil: "networkidle0" });
    await esperar(2500);
    const visible = await profe.evaluate(() => document.body.innerText);
    comprobar("ve el botón de descargar notas", /Descargar notas/i.test(visible));
    const enlace = await profe.evaluate(() =>
      (document.querySelector('a[href*="/notas"]') as HTMLAnchorElement | null)?.getAttribute("href") ?? "");
    comprobar("que apunta a su asignación", enlace.includes(`/api/asignaciones/`) && enlace.endsWith("/notas"), enlace);

    const csv = await profe.evaluate(async (url) => {
      const r = await fetch(url);
      // En bytes: `r.text()` decodifica UTF-8 y se come el BOM, así que por ahí no se ve.
      const bytes = new Uint8Array(await r.clone().arrayBuffer());
      return {
        estado: r.status, tipo: r.headers.get("content-type") ?? "",
        adjunto: r.headers.get("content-disposition") ?? "",
        bom: bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf,
        texto: await r.text(),
      };
    }, enlace);
    comprobar("y se descarga como fichero", csv.estado === 200 && csv.tipo.includes("csv") && csv.adjunto.includes("attachment"),
      `${csv.estado} · ${csv.tipo}`);
    comprobar("con el BOM que necesita Excel", csv.bom);
    const lineas = csv.texto.replace(/^﻿/, "").split("\r\n");
    comprobar("y la cabecera en español", lineas[0]?.startsWith("Apellidos;Nombre;Correo;Estado"), lineas[0]?.slice(0, 45) ?? "");
    comprobar("la alumna sale con su nota", /8,5/.test(lineas[1] ?? ""), lineas[1]?.slice(0, 80) ?? "");
    comprobar("la nota va con coma decimal, no con punto", !/8\.5/.test(lineas[1] ?? ""));
    comprobar("dice que aún no está publicada", /;No;/.test(lineas[1] ?? ""));
    comprobar("y el comentario con «;» no parte la fila",
      (lineas[1] ?? "").includes('"Bien; aunque le falta hierro'), `${lineas.length} líneas`);

    console.log("\n── Y el alumno no ──");
    const alumna = await sesion(navegador, ALUMNA);
    await alumna.goto(`${BASE}/aula`, { waitUntil: "networkidle0" });
    await esperar(1500);
    const intento = await alumna.evaluate(async (url) => (await fetch(url)).status, enlace);
    comprobar("le rechazan el acta de su clase", intento === 401 || intento === 404, `${intento}`);

    await client.query(`DELETE FROM entregas_caso WHERE "asignacionId" = $1`, [asignacionId]);
  } finally {
    await navegador.close();
    await pool.end();
  }
  console.log(`\n${mal === 0 ? "✓" : "✗"} ${ok} bien, ${mal} mal`);
  process.exit(mal === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });

/**
 * Pruebas del módulo docente CON UN NAVEGADOR DE VERDAD (#39 / issue #31).
 *
 * Complementa a `probar-modulo-docente.ts`, que solo lee páginas por HTTP. Aquí se rellenan los
 * formularios y se pulsan los botones, que es la única forma de ejercitar las server actions que
 * ESCRIBEN (crear licencia, editarla, asignar profesor, quitarle el rol) y el login de verdad.
 *
 * Hay dos cosas que solo se pueden comprobar así:
 *   · que el aterrizaje del profesor funciona entrando por el formulario de login;
 *   · que **ningún enlace del menú tiene efectos secundarios**. En agosto de 2026 el cambio de
 *     espacio era un GET colgado de un <Link> y el prefetch de Next lo disparaba solo, cerrando
 *     la cuenta profesional sin que nadie tocara nada. En `npm run dev` el prefetch está
 *     desactivado, así que hay que probarlo contra un build (`next start`).
 *
 * Cómo se usa:
 *   1. Compilar y levantar contra desarrollo, en el puerto 3001:
 *        set -a && . ./.env.dev.local && set +a
 *        NEXT_DIST_DIR=.next-dev npx next build && NEXT_DIST_DIR=.next-dev npx next start --port 3001
 *   2. DB=dev npx tsx scripts/probar-modulo-docente-navegador.ts
 *
 * Crea sus propios datos y los borra al terminar. NO ejecutar con DB=prod.
 * Deja capturas de pantalla en /tmp/annonia-capturas/ para revisarlas a ojo.
 */
import "./_guard";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";
import puppeteer, { type Page } from "puppeteer-core";
import { SignJWT } from "jose";
import { mkdirSync } from "node:fs";

const BASE = process.env.PRUEBAS_URL ?? "http://localhost:3001";
const EMAIL_PRUEBA = "profesor.prueba@annonia.dev";
const PASS_PRUEBA = "PruebaFase1_2026";
const CAPTURAS = "/tmp/annonia-capturas";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } });

let ok = 0;
let mal = 0;
function comprobar(titulo: string, condicion: boolean, detalle = "") {
  console.log(`  ${condicion ? "✓" : "✗"} ${titulo}${detalle ? ` — ${detalle}` : ""}`);
  condicion ? ok++ : mal++;
}

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Escribe en el campo que hay debajo de una etiqueta concreta (los inputs no tienen name). */
async function rellenar(page: Page, etiqueta: string, valor: string) {
  const encontrado = await page.evaluate(
    (texto, v) => {
      const labels = Array.from(document.querySelectorAll("label"));
      const label = labels.find((l) => l.textContent?.trim().startsWith(texto));
      const campo = label?.parentElement?.querySelector("input, textarea") as
        | HTMLInputElement
        | HTMLTextAreaElement
        | null;
      if (!campo) return false;
      const proto = campo instanceof HTMLTextAreaElement ? HTMLTextAreaElement : HTMLInputElement;
      // React ignora un value asignado a pelo: hay que usar el setter nativo y avisar del evento.
      Object.getOwnPropertyDescriptor(proto.prototype, "value")!.set!.call(campo, v);
      campo.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    },
    etiqueta,
    valor,
  );
  if (!encontrado) throw new Error(`No he encontrado el campo "${etiqueta}"`);
}

/** Escribe en un campo localizado por su texto de ayuda (los buscadores no llevan etiqueta). */
async function rellenarPorPlaceholder(page: Page, placeholder: string, valor: string) {
  const encontrado = await page.evaluate(
    (texto, v) => {
      const campo = Array.from(document.querySelectorAll("input")).find((i) =>
        i.placeholder?.startsWith(texto),
      );
      if (!campo) return false;
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(campo, v);
      campo.dispatchEvent(new Event("input", { bubbles: true }));
      return true;
    },
    placeholder,
    valor,
  );
  if (!encontrado) throw new Error(`No he encontrado el campo con ayuda "${placeholder}"`);
}

/**
 * Pulsa el primer botón o enlace cuyo texto empiece por el indicado. `dentroDe` acota la
 * búsqueda a un contenedor, que hace falta cuando el mismo texto aparece dos veces (el botón de
 * la fila y el de confirmar del aviso se llaman igual).
 */
async function pulsar(page: Page, texto: string, dentroDe?: string) {
  const pulsado = await page.evaluate(
    (t, ambito) => {
      const raiz = ambito ? document.querySelector(ambito) : document;
      if (!raiz) return false;
      const nodos = Array.from(raiz.querySelectorAll("button, a"));
      const nodo = nodos.find((n) => n.textContent?.trim().startsWith(t)) as HTMLElement | undefined;
      if (!nodo) return false;
      nodo.click();
      return true;
    },
    texto,
    dentroDe ?? null,
  );
  if (!pulsado) throw new Error(`No he encontrado el botón "${texto}"${dentroDe ? ` dentro de ${dentroDe}` : ""}`);
}

async function cookieAdmin() {
  const email = (process.env.ADMIN_EMAILS ?? "").split(",")[0].trim();
  const token = await new SignJWT({ email, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1d")
    .sign(new TextEncoder().encode(process.env.PATIENT_JWT_SECRET!));
  return { name: "annonia-admin-session", value: token, domain: "localhost", path: "/" };
}

async function crearUsuarioPrueba(client: pg.PoolClient): Promise<string> {
  await borrarUsuarioPrueba(client);
  const { rows } = await client.query(
    `INSERT INTO auth.users (
       instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
       created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous,
       confirmation_token, recovery_token, email_change_token_new, email_change,
       email_change_token_current, reauthentication_token, phone_change, phone_change_token
     ) VALUES (
       '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
       $1, crypt($2, gen_salt('bf')), NOW(), NOW(), NOW(),
       '{"provider":"email","providers":["email"]}',
       jsonb_build_object('nombre','Profesor','apellidos','Prueba','email_verified',true,'phone_verified',false),
       false, false, '', '', '', '', '', '', '', ''
     ) RETURNING id`,
    [EMAIL_PRUEBA, PASS_PRUEBA],
  );
  const authId = rows[0].id as string;
  await client.query(
    `INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
     VALUES (gen_random_uuid(), $1::uuid, $1::text, 'email',
       jsonb_build_object('sub',$1::text,'email',$2::text,'email_verified',true,'provider','email'),
       NOW(), NOW(), NOW())`,
    [authId, EMAIL_PRUEBA],
  );
  const { rows: die } = await client.query(
    `INSERT INTO dietistas (id, "authId", email, nombre, apellidos, verificado, "createdAt", "updatedAt")
     VALUES (gen_random_uuid()::text, $1, $2, 'Profesor', 'Prueba', true, NOW(), NOW()) RETURNING id`,
    [authId, EMAIL_PRUEBA],
  );
  return die[0].id as string;
}

async function borrarUsuarioPrueba(client: pg.PoolClient) {
  const { rows } = await client.query(`SELECT id FROM auth.users WHERE email = $1`, [EMAIL_PRUEBA]);
  for (const r of rows) {
    await client.query(`DELETE FROM dietistas WHERE "authId" = $1`, [r.id]);
    await client.query(`DELETE FROM auth.identities WHERE user_id = $1::uuid`, [r.id]);
    await client.query(`DELETE FROM auth.users WHERE id = $1::uuid`, [r.id]);
  }
}

async function main() {
  mkdirSync(CAPTURAS, { recursive: true });
  const client = await pool.connect();
  const navegador = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox", "--window-size=1440,900"],
  });

  try {
    const dietistaId = await crearUsuarioPrueba(client);
    await client.query(`DELETE FROM licencias_docentes WHERE institucion LIKE 'PRUEBA %'`);

    const page = await navegador.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    page.on("pageerror", (e) => console.log("    [error en la página]", String(e).slice(0, 160)));

    // ─── 1. Crear una licencia RELLENANDO EL FORMULARIO ───
    console.log("\n── Crear la licencia desde el formulario ──");
    await page.setCookie(await cookieAdmin());
    await page.goto(`${BASE}/admin/universidades/crear`, { waitUntil: "networkidle0" });

    await rellenar(page, "Institución", "PRUEBA Universidad Pablo de Olavide");
    await rellenar(page, "Dominio de correo", "@UPO.es, https://alu.upo.es/");
    await rellenar(page, "Licencias de profesor", "3");
    await rellenar(page, "Licencias de alumno", "300");
    await rellenar(page, "Notas internas", "Alta de prueba automática");
    await pulsar(page, "Crear licencia");
    await esperar(3000);

    const { rows: creada } = await client.query(
      `SELECT id, institucion, "dominioEmail", "maxProfesores", "maxAlumnos", curso, notas
       FROM licencias_docentes WHERE institucion = 'PRUEBA Universidad Pablo de Olavide'`,
    );
    comprobar("la licencia se ha guardado en la base", creada.length === 1);
    if (creada.length === 0) throw new Error("sin licencia no se puede seguir");
    const licencia = creada[0];
    comprobar("con sus cupos", licencia.maxProfesores === 3 && licencia.maxAlumnos === 300, `${licencia.maxProfesores} y ${licencia.maxAlumnos}`);
    comprobar("los dominios se normalizan", licencia.dominioEmail === "upo.es,alu.upo.es", String(licencia.dominioEmail));
    comprobar("el curso se rellena solo", !!licencia.curso, String(licencia.curso));
    comprobar("y lleva al detalle de la licencia", page.url().includes(`/admin/universidades/${licencia.id}`), page.url().replace(BASE, ""));

    // ─── 2. Asignar un profesor que ya tiene cuenta ───
    console.log("\n── Asignar un profesor con el buscador ──");
    await rellenarPorPlaceholder(page, "Buscar por nombre", "profesor.prueba");
    await esperar(2500);
    await pulsar(page, "Profesor Prueba");
    await esperar(600);
    await pulsar(page, "Asignar como profesor");
    await esperar(3000);

    const { rows: tras } = await client.query(
      `SELECT "rolDocente", "licenciaDocenteId", "fuenteContacto" FROM dietistas WHERE id = $1`,
      [dietistaId],
    );
    comprobar("el rol de profesor queda guardado", tras[0].rolDocente === "PROFESOR", String(tras[0].rolDocente));
    comprobar("y queda atado a su licencia", tras[0].licenciaDocenteId === licencia.id);

    await page.reload({ waitUntil: "networkidle0" });
    const html = await page.content();
    comprobar("la pantalla ya lo muestra (hay revalidación)", html.includes(EMAIL_PRUEBA));
    comprobar("y el contador sube a 1 / 3", /1\s*(<[^>]*>)?\s*\/\s*3/.test(html.replace(/<!--[\s\S]*?-->/g, "")));
    await page.screenshot({ path: `${CAPTURAS}/1-licencia-detalle.png`, fullPage: true });

    // ─── 3. Editar la licencia, incluido el caso que debe rechazar ───
    console.log("\n── Editar la licencia ──");
    await rellenar(page, "Licencias de alumno", "150");
    await pulsar(page, "Guardar cambios");
    await esperar(3000);
    const { rows: editada } = await client.query(`SELECT "maxAlumnos" FROM licencias_docentes WHERE id = $1`, [licencia.id]);
    comprobar("el cupo de alumnos se guarda", editada[0].maxAlumnos === 150, String(editada[0].maxAlumnos));

    await rellenar(page, "Licencias de profesor", "0");
    await pulsar(page, "Guardar cambios");
    await esperar(2500);
    const { rows: noBajada } = await client.query(`SELECT "maxProfesores" FROM licencias_docentes WHERE id = $1`, [licencia.id]);
    // El formulario tiene min=1, así que ni siquiera debería llegar a enviarse con 0.
    comprobar("no deja dejar la licencia sin profesores", noBajada[0].maxProfesores >= 1, String(noBajada[0].maxProfesores));

    // ─── 4. Login DE VERDAD y aterrizaje ───
    console.log("\n── Entrar por el formulario de login ──");
    const paginaProfesor = await navegador.newPage();
    await paginaProfesor.setViewport({ width: 1440, height: 900 });
    await paginaProfesor.goto(`${BASE}/login`, { waitUntil: "networkidle0" });
    await paginaProfesor.type('input[type="email"]', EMAIL_PRUEBA);
    await paginaProfesor.type('input[type="password"]', PASS_PRUEBA);
    await Promise.all([
      paginaProfesor.waitForNavigation({ waitUntil: "networkidle0", timeout: 30000 }).catch(() => {}),
      paginaProfesor.evaluate(() => (document.querySelector("form") as HTMLFormElement)?.requestSubmit()),
    ]);
    await esperar(4000);
    comprobar("el profesor aterriza en su espacio docente", paginaProfesor.url().endsWith("/profesor"), paginaProfesor.url().replace(BASE, ""));

    // El tour recorre la cuenta de nutricionista: en el espacio docente taparía la pantalla con
    // una guía de otro sitio (se veía así en la primera captura, 28 ago 2026).
    const tourTapando = await paginaProfesor.evaluate(() =>
      Array.from(document.querySelectorAll(".fixed.inset-0")).some((n) =>
        n.textContent?.includes("Empezar tour guiado"),
      ),
    );
    comprobar("el tour de nutricionista NO le tapa el espacio docente", !tourTapando);

    const htmlEspacio = await paginaProfesor.content();
    comprobar("ve su institución", htmlEspacio.includes("PRUEBA Universidad Pablo de Olavide"));
    comprobar("ve la bolsa de alumnos", htmlEspacio.replace(/<!--[\s\S]*?-->/g, "").includes("/ 150"));
    await paginaProfesor.screenshot({ path: `${CAPTURAS}/2-espacio-docente.png`, fullPage: true });

    // ─── 5. La prueba del prefetch: la cuenta profesional tiene que aguantar abierta ───
    console.log("\n── Ir a la cuenta profesional y quedarse ahí ──");
    const peticionesRaras: string[] = [];
    paginaProfesor.on("request", (r) => {
      if (/\/api\/(espacio|locale)/.test(r.url())) peticionesRaras.push(`${r.method()} ${r.url().replace(BASE, "")}`);
    });

    await pulsar(paginaProfesor, "Acceder a mi cuenta profesional");
    await paginaProfesor.waitForNavigation({ waitUntil: "networkidle0", timeout: 30000 }).catch(() => {});
    await esperar(1000);
    comprobar("llega a su panel de nutricionista", paginaProfesor.url().endsWith("/dashboard"), paginaProfesor.url().replace(BASE, ""));
    // Y allí sí se le ofrece, que es donde el tour tiene sentido.
    const tourEnSuSitio = await paginaProfesor.evaluate(() =>
      Array.from(document.querySelectorAll(".fixed.inset-0")).some((n) =>
        n.textContent?.includes("Empezar tour guiado"),
      ),
    );
    comprobar("y el tour sí se le ofrece en su cuenta profesional", tourEnSuSitio);

    // Cinco segundos quieto: si algún enlace del menú tuviera efectos, el prefetch ya habría actuado.
    await esperar(5000);
    await paginaProfesor.reload({ waitUntil: "networkidle0" });
    await esperar(1500);
    comprobar(
      "y sigue ahí tras recargar (no le expulsa al espacio docente)",
      paginaProfesor.url().endsWith("/dashboard"),
      paginaProfesor.url().replace(BASE, ""),
    );
    comprobar("ningún enlace del menú ha disparado una petición con efectos", peticionesRaras.length === 0, peticionesRaras.join(" · ") || "ninguna");
    await paginaProfesor.screenshot({ path: `${CAPTURAS}/3-cuenta-profesional.png`, fullPage: true });

    // ─── 6. Volver al espacio docente desde el menú ───
    console.log("\n── Volver al espacio docente ──");
    await pulsar(paginaProfesor, "Espacio docente");
    await paginaProfesor.waitForNavigation({ waitUntil: "networkidle0", timeout: 30000 }).catch(() => {});
    await esperar(1000);
    comprobar("el menú le devuelve a su espacio", paginaProfesor.url().endsWith("/profesor"), paginaProfesor.url().replace(BASE, ""));

    // ─── 7. Quitarle el rol desde administración ───
    console.log("\n── Quitar el rol ──");
    await page.goto(`${BASE}/admin/universidades/${licencia.id}`, { waitUntil: "networkidle0" });
    await pulsar(page, "Quitar rol");
    await esperar(1000);
    const hayAviso = await page.evaluate(() => !!document.querySelector(".fixed.inset-0.z-50"));
    comprobar("pide confirmación antes de quitarlo", hayAviso);
    const avisoDiceQueNoSeBorra = await page.evaluate(
      () => document.querySelector(".fixed.inset-0.z-50")?.textContent?.includes("NO se borra") ?? false,
    );
    comprobar("y deja claro que la cuenta no se borra", avisoDiceQueNoSeBorra);
    await pulsar(page, "Quitar rol", ".fixed.inset-0.z-50");
    await esperar(3000);
    const { rows: sinRol } = await client.query(
      `SELECT "rolDocente", "licenciaDocenteId" FROM dietistas WHERE id = $1`, [dietistaId],
    );
    comprobar("se le retira el rol", sinRol[0].rolDocente === null, String(sinRol[0].rolDocente));
    comprobar("y la cuenta sigue existiendo", (await client.query(`SELECT 1 FROM dietistas WHERE id = $1`, [dietistaId])).rows.length === 1);

    await paginaProfesor.goto(`${BASE}/profesor`, { waitUntil: "networkidle0" });
    await esperar(1000);
    comprobar("ya no puede entrar al espacio docente", !paginaProfesor.url().endsWith("/profesor"), paginaProfesor.url().replace(BASE, ""));

    console.log("\n── Limpieza ──");
    await borrarUsuarioPrueba(client);
    await client.query(`DELETE FROM licencias_docentes WHERE institucion LIKE 'PRUEBA %'`);
    const { rows: quedan } = await client.query(
      `SELECT (SELECT count(*)::int FROM licencias_docentes WHERE institucion LIKE 'PRUEBA %') AS lic,
              (SELECT count(*)::int FROM dietistas WHERE email = $1) AS cuentas`,
      [EMAIL_PRUEBA],
    );
    comprobar("no queda nada de la prueba", quedan[0].lic === 0 && quedan[0].cuentas === 0);

    console.log(`\n${mal === 0 ? "✓ TODO CORRECTO" : "✗ HAY FALLOS"} — ${ok} bien, ${mal} mal`);
    console.log(`Capturas en ${CAPTURAS}\n`);
    if (mal > 0) process.exitCode = 1;
  } finally {
    await navegador.close();
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
